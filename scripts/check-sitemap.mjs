import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { chromium } from '@playwright/test';
import { resolveSiteOrigin, productionSiteUrl } from '../lib/metadata.ts';
import { isPreviewBuild, pageRobots } from '../lib/indexing.ts';

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
      robots: [...document.querySelectorAll('meta[name="robots"],meta[name="googlebot"]')].map(meta => meta.content),
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
  }
  // Independent check of the artifact: every indexable exported page must be listed.
  const indexableExport = [];
  const noindexExport = [];
  for (const file of htmlFiles('out')) {
    const route = '/' + path.relative('out', file).replace(/index\.html$/, '').replace(/\.html$/, '');
    const metadata = await htmlMetadata(fs.readFileSync(file, 'utf8'));
    if (metadata.robots.some(value => /\b(?:noindex|none)\b/i.test(value))) {
      noindexExport.push(route);
    } else {
      assert.ok(metadata.canonical, `${file}: canonical is missing`);
      indexableExport.push(new URL(metadata.canonical).href);
    }
  }
  assert.deepEqual([...indexableExport].sort(), [...urls].sort(), 'Sitemap does not match indexable exported HTML');
  console.log(JSON.stringify({ mode: live ? 'PRODUCTION VERIFIED' : 'LOCAL ONLY — production verification still required',
    baseUrl: base.origin, sitemapUrls: urls.length, listedPagesHttp200: urls.length,
    excludedNoindexPages: noindexExport, canonicalOrigin: productionSiteUrl,
    xmlParsed: true, duplicates: 0, urls }, null, 2));
} finally {
  await browser.close();
  fs.rmSync(directory, { recursive: true, force: true });
}
