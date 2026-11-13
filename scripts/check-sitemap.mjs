import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { chromium } from '@playwright/test';
import { resolveSiteOrigin, productionSiteUrl } from '../lib/metadata.ts';
import { isPreviewBuild, pageRobots } from '../lib/indexing.ts';
import { getArticles, articleUrl } from '../lib/content.ts';

assert.equal(resolveSiteOrigin(), productionSiteUrl);
assert.equal(resolveSiteOrigin(''), productionSiteUrl);
assert.equal(resolveSiteOrigin(productionSiteUrl + '/'), productionSiteUrl);
assert.throws(() => resolveSiteOrigin('https://proofwell-9qh.pages.dev'));
assert.throws(() => resolveSiteOrigin(productionSiteUrl + '/path'));
assert.equal(isPreviewBuild({ CF_PAGES: '1', CF_PAGES_BRANCH: 'main' }), false);
assert.equal(isPreviewBuild({ CF_PAGES: '1', CF_PAGES_BRANCH: 'fix/sitemap' }), true);
assert.equal(isPreviewBuild({ CF_PAGES: '1' }), true);
assert.equal(isPreviewBuild({ NODE_ENV: 'development' }), true);
assert.deepEqual(pageRobots(false), { index: false, follow: false });
const articles = getArticles();
const releasedSlugs = ['how-led-masks-work', '633-vs-830-nm', 'irradiance-vs-fluence', 'red-vs-near-infrared', 'megelin-white-led-face-neck-mask', 'megelin-led-face-neck-mask'];
const releasedArticles = articles.filter(article => releasedSlugs.includes(article.slug));
assert.deepEqual(releasedArticles.map(article => article.slug).sort(), [...releasedSlugs].sort());
const protectedArticles = articles.filter(article => !releasedSlugs.includes(article.slug));

const base = new URL(process.env.BASE_URL || 'http://127.0.0.1:4173');
assert.ok(base.origin === productionSiteUrl || ['127.0.0.1', 'localhost'].includes(base.hostname), 'Use the canonical production origin or a local static server');
assert.equal(base.pathname, '/');
const live = base.origin === productionSiteUrl;
const run = promisify(execFile);
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'proofwell-sitemap-'));
const headersFile = path.join(directory, 'headers.txt');
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || (fs.existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined),
  headless: true, args: ['--no-sandbox'],
});
const page = await browser.newPage();

// curl preserves the managed environment's proxy, credentials and CA trust.
// Do not follow redirects: a sitemap entry must be a canonical HTTP 200 page.
async function request(route) {
  const { stdout } = await run('curl', ['--silent', '--show-error', '--max-time', '30',
    '--dump-header', headersFile, '--write-out', '\n%{http_code}', new URL(route, base).href], { maxBuffer: 8 * 1024 * 1024 });
  const split = stdout.lastIndexOf('\n');
  assert.equal(Number(stdout.slice(split + 1)), 200, `${route}: expected HTTP 200`);
  const headers = fs.readFileSync(headersFile, 'utf8');
  return { body: stdout.slice(0, split), headers };
}

async function sitemapUrls(xml) {
  assert.ok(!/<!DOCTYPE|<!ENTITY/i.test(xml), 'Sitemap must not declare external entities');
  const parsed = await page.evaluate(source => {
    const document = new DOMParser().parseFromString(source, 'application/xml');
    return {
      parseError: Boolean(document.querySelector('parsererror')),
      root: document.documentElement.localName,
      namespace: document.documentElement.namespaceURI,
      entries: [...document.documentElement.children].map(entry => ({
        name: entry.localName,
        namespace: entry.namespaceURI,
        locations: [...entry.children].filter(child => child.localName === 'loc').map(child => child.textContent),
      })),
    };
  }, xml);
  assert.equal(parsed.parseError, false, 'XML must parse successfully');
  assert.equal(parsed.root, 'urlset');
  assert.equal(parsed.namespace, 'http://www.sitemaps.org/schemas/sitemap/0.9');
  return parsed.entries.map(entry => {
    assert.equal(entry.name, 'url');
    assert.equal(entry.namespace, parsed.namespace);
    assert.equal(entry.locations.length, 1);
    return entry.locations[0];
  });
}

async function htmlMetadata(html) {
  return page.evaluate(source => {
    const document = new DOMParser().parseFromString(source, 'text/html');
    return {
      canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href'),
      canonicalCount: document.querySelectorAll('link[rel="canonical"]').length,
      robots: [...document.querySelectorAll('meta[name="robots"],meta[name="googlebot"]')].map(meta => meta.content),
      ogUrl: document.querySelector('meta[property="og:url"]')?.content,
      ogType: document.querySelector('meta[property="og:type"]')?.content,
      ogImage: document.querySelector('meta[property="og:image"]')?.content,
      jsonld: [...document.querySelectorAll('script[type="application/ld+json"]')].map(script => JSON.parse(script.textContent)),
    };
  }, html);
}

function htmlFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? htmlFiles(file) : file.endsWith('.html') ? [file] : [];
  });
}

try {
  const response = await request('/sitemap.xml');
  assert.match(response.headers, /content-type:\s*(?:application|text)\/xml/i);
  const urls = await sitemapUrls(response.body);
  assert.ok(urls.length > 0, 'Production sitemap is empty');
  assert.equal(new Set(urls).size, urls.length, 'Duplicate sitemap URLs');
  for (const article of releasedArticles) {
    const url = new URL(articleUrl(article), productionSiteUrl).href;
    assert.equal(urls.filter(entry => entry === url).length, 1, `${article.slug} must appear exactly once`);
  }
  for (const article of protectedArticles) {
    assert.ok(!urls.includes(new URL(articleUrl(article), productionSiteUrl).href), `Draft in sitemap: ${articleUrl(article)}`);
  }
  const expected = await sitemapUrls(fs.readFileSync('out/sitemap.xml', 'utf8'));
  assert.deepEqual([...urls].sort(), [...expected].sort(), 'Served sitemap differs from this export; deployment may be stale');
  const robots = (await request('/robots.txt')).body;
  assert.match(robots, /^Allow: \/$/m);
  assert.doesNotMatch(robots, /^Disallow: \/\s*$/m);
  assert.match(robots, /^Sitemap: https:\/\/proofwelllife\.com\/sitemap\.xml$/m);
  for (const url of urls) {
    const parsed = new URL(url);
    assert.equal(parsed.origin, productionSiteUrl);
    assert.equal(parsed.search + parsed.hash, '');
    assert.ok(!/\.(?:xml|txt|css|js|svg|webp|png|jpg|woff2?)$/.test(parsed.pathname), `Resource in sitemap: ${url}`);
    assert.ok(!['/404', '/_not-found'].includes(parsed.pathname));
    const { body, headers } = await request(parsed.pathname);
    assert.match(headers, /content-type:\s*text\/html/i);
    assert.doesNotMatch(headers, /^x-robots-tag:.*\b(?:noindex|none)\b/im);
    const metadata = await htmlMetadata(body);
    assert.ok(!metadata.robots.some(value => /\b(?:noindex|none)\b/i.test(value)), `${url}: page is noindex`);
    assert.equal(new URL(metadata.canonical).href, parsed.href, `${url}: canonical mismatch`);
    assert.equal(metadata.canonicalCount, 1, `${url}: duplicate canonical`);
    const releasedArticle = releasedArticles.find(article => new URL(articleUrl(article), productionSiteUrl).href === url);
    if (releasedArticle) {
      assert.ok(metadata.robots.length > 0, `${releasedArticle.slug} robots metadata missing`);
      assert.ok(metadata.robots.every(value => !/\b(?:noindex|nofollow|none)\b/i.test(value)));
      assert.equal(metadata.ogUrl, url);
      assert.equal(metadata.ogType, 'article');
      assert.equal(metadata.ogImage, new URL(releasedArticle.heroImage, productionSiteUrl).href);
      const structuredArticles = metadata.jsonld.filter(item => item['@type'] === 'Article');
      assert.equal(structuredArticles.length, 1);
      const structured = structuredArticles[0];
      assert.equal(structured.mainEntityOfPage, url);
      assert.equal(structured.headline, releasedArticle.title);
      assert.equal(structured.datePublished, releasedArticle.published);
      assert.equal(structured.author.name, releasedArticle.author);
      assert.equal(structured.author['@type'], 'Organization');
      assert.deepEqual(structured.image, [new URL(releasedArticle.heroImage, productionSiteUrl).href]);
      assert.equal(structured.dateModified, releasedArticle.updated);
      assert.equal(structured.reviewedBy, undefined, 'Do not invent scientific review');
      assert.equal(structured.reviewRating, undefined, 'Do not invent a scientific or product rating');
    }
  }
  // Independent check of the artifact: every indexable exported page must be listed.
  const indexableExport = [];
  const noindexExport = [];
  for (const file of htmlFiles('out')) {
    const route = '/' + path.relative('out', file).replace(/index\.html$/, '').replace(/\.html$/, '');
    const metadata = await htmlMetadata(fs.readFileSync(file, 'utf8'));
    const directives = new Set(metadata.robots.flatMap(value => value.toLowerCase().split(/[\s,]+/)));
    assert.ok(metadata.robots.length > 0, `${file}: robots metadata is missing`);
    assert.ok(!(directives.has('index') && (directives.has('noindex') || directives.has('none'))), `${file}: conflicting index/noindex directives`);
    assert.ok(!(directives.has('follow') && (directives.has('nofollow') || directives.has('none'))), `${file}: conflicting follow/nofollow directives`);
    if (['/404', '/_not-found'].includes(route)) {
      assert.ok(directives.has('noindex'), `${file}: error pages must remain noindex`);
      assert.equal(metadata.canonicalCount, 0, `${file}: error pages must not inherit the homepage canonical`);
    } else {
      assert.equal(metadata.canonicalCount, 1, `${file}: expected exactly one canonical`);
      assert.equal(new URL(metadata.canonical).href, new URL(route, productionSiteUrl).href, `${file}: expected a self-canonical`);
    }
    if (metadata.robots.some(value => /\b(?:noindex|none)\b/i.test(value))) {
      noindexExport.push(route);
    } else {
      assert.ok(metadata.canonical, `${file}: canonical is missing`);
      indexableExport.push(new URL(metadata.canonical).href);
    }
  }
  assert.deepEqual([...indexableExport].sort(), [...urls].sort(), 'Sitemap does not match indexable exported HTML');
  for (const article of protectedArticles) {
    assert.ok(noindexExport.includes(articleUrl(article)), `Draft HTML lost noindex: ${articleUrl(article)}`);
  }
  console.log(JSON.stringify({ mode: live ? 'PRODUCTION VERIFIED' : 'LOCAL ONLY — production verification still required',
    baseUrl: base.origin, sitemapUrls: urls.length, listedPagesHttp200: urls.length,
    excludedNoindexPages: noindexExport, canonicalOrigin: productionSiteUrl,
    xmlParsed: true, duplicates: 0, releasedArticles: releasedSlugs, eachReleasedArticleOccursOnce: true,
    protectedArticleDrafts: protectedArticles.length, canonicalOpenGraphAndJsonld: true, urls }, null, 2));
} finally {
  await browser.close();
  fs.rmSync(directory, { recursive: true, force: true });
}
