import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { isPreviewBuild, pageRobots } from '../lib/indexing.ts';

// Load the actual server-only route helpers without requiring a Next.js server.
const require = createRequire(import.meta.url);
const cache = new Map();
function load(file) {
  file = path.resolve(file);
  if (cache.has(file)) return cache.get(file).exports;
  const module = { exports: {} };
  cache.set(file, module);
  const compiled = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  runInNewContext(compiled, { module, exports: module.exports, URL,
    process: { ...process, env: { ...process.env, NODE_ENV: 'production', CF_PAGES: '1', CF_PAGES_BRANCH: 'main' } },
    require: name => name.startsWith('@/') ? load(path.resolve(name.slice(2) + '.ts')) :
      name.startsWith('.') ? load(path.resolve(path.dirname(file), name + '.ts')) : require(name) });
  return module.exports;
}
const { getPublicPaths, getIndexablePaths, isPublishedArticle } = load('lib/public-routes.ts');
const { getArticles, articleUrl } = load('lib/content.ts');
const { resolveSiteOrigin } = load('lib/metadata.ts');
const { default: sitemap } = load('app/sitemap.ts');
const articles = getArticles();
const publicPaths = [...getPublicPaths()];
const indexablePaths = [...getIndexablePaths()];
assert.equal(new Set(publicPaths).size, publicPaths.length, 'Duplicate public routes');
assert.equal(new Set(indexablePaths).size, indexablePaths.length, 'Duplicate indexable routes');
assert.equal(new Set(getPublicPaths([...articles, articles[0]])).size, publicPaths.length);
assert.ok(indexablePaths.every(route => publicPaths.includes(route)), 'Sitemap includes an unregistered route');
const article2 = articles.find(article => article.slug === 'how-led-masks-work');
assert.ok(article2, 'Article 2 must exist');
const releasedSlugs = ['how-led-masks-work', '633-vs-830-nm', 'irradiance-vs-fluence', 'red-vs-near-infrared', 'megelin-white-led-face-neck-mask'];
const releasedArticles = [...articles].filter(article => releasedSlugs.includes(article.slug));
assert.deepEqual(releasedArticles.map(article => article.slug).sort(), [...releasedSlugs].sort());
for (const article of releasedArticles) {
  assert.equal(isPublishedArticle(article), true, `${article.slug} requires a valid publication date and released metadata`);
  assert.equal(indexablePaths.filter(route => route === articleUrl(article)).length, 1);
}
const otherArticles = articles.filter(article => !releasedSlugs.includes(article.slug));
for (const article of otherArticles) {
  assert.equal(isPublishedArticle(article), false, `Unexpected article publication: ${articleUrl(article)}`);
  assert.ok(!indexablePaths.includes(articleUrl(article)));
}
for (const route of ['/terms', '/sleep', '/nutrition', '/recovery', '/healthy-aging', '/supplements', '/wellness', '/wellness-technology']) {
  assert.ok(!indexablePaths.includes(route), `Draft/placeholder indexed: ${route}`);
}
for (const route of ['/', '/about', '/editorial-policy', '/affiliate-disclosure', '/privacy-policy', '/contact', '/science', '/topics']) {
  assert.ok(indexablePaths.includes(route), `Public page missing: ${route}`);
}
const fixture = { ...article2, published: '2020-01-01', draft: false, noindex: false };
assert.equal(isPublishedArticle(fixture, '2026-01-01'), true);
assert.equal(isPublishedArticle({ ...fixture, published: '2999-01-01' }, '2026-01-01'), false);
assert.equal(isPublishedArticle({ ...fixture, published: '2025-02-30' }), false);
assert.equal(isPublishedArticle({ ...fixture, noindex: true }), false);
assert.equal(isPublishedArticle({ ...fixture, draft: true }), false);
assert.ok(getIndexablePaths([fixture]).includes(articleUrl(fixture)), 'Published articles must enter the sitemap automatically');
assert.ok(!getIndexablePaths([{ ...fixture, noindex: true }]).includes(articleUrl(fixture)));
assert.equal(resolveSiteOrigin(undefined), 'https://proofwelllife.com');
assert.throws(() => resolveSiteOrigin('https://proofwell-9qh.pages.dev'));
assert.equal(isPreviewBuild({ CF_PAGES: '1' }), true);
assert.equal(isPreviewBuild({ CF_PAGES: '1', CF_PAGES_BRANCH: 'main' }), false);
assert.equal(isPreviewBuild({ CF_PAGES: '1', CF_PAGES_BRANCH: 'fix/sitemap' }), true);
assert.equal(pageRobots(true, { CF_PAGES: '1', CF_PAGES_BRANCH: 'main' }).index, true);
assert.equal(pageRobots(true, { CF_PAGES: '1', CF_PAGES_BRANCH: 'fix/sitemap' }).index, false);
assert.equal(pageRobots(false, { CF_PAGES: '1', CF_PAGES_BRANCH: 'main' }).index, false);

// Compare actual route registration, the sitemap generator and the built artifact.
// XML parsing and page metadata are independently checked by check-sitemap.mjs.
const origin = resolveSiteOrigin(process.env.NEXT_PUBLIC_SITE_URL);
const expectedUrls = indexablePaths.map(route => new URL(route, origin).href).sort();
const generatedUrls = [...sitemap()].map(entry => entry.url).sort();
assert.deepEqual(generatedUrls, expectedUrls, 'Sitemap generator differs from eligible public routes');
assert.ok(fs.existsSync('out/sitemap.xml'), 'Run the production build before the indexing regression check');
const xml = fs.readFileSync('out/sitemap.xml', 'utf8');
assert.ok(!/<!DOCTYPE|<!ENTITY/i.test(xml), 'Unexpected XML entities');
const exportedUrls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]).sort();
assert.deepEqual(exportedUrls, expectedUrls, 'Exported sitemap is stale or differs from eligible public routes');
for (const article of releasedArticles) {
  assert.equal(exportedUrls.filter(url => url === new URL(articleUrl(article), origin).href).length, 1);
}
console.log(JSON.stringify({ publicRoutes: publicPaths.length, indexableRoutes: indexablePaths.length,
  exportedSitemapUrls: exportedUrls.length, releasedArticles: releasedArticles.map(article => article.slug),
  eachReleasedArticleOccursOnce: true, protectedDrafts: otherArticles.length,
  publicationDateAndNoindexGuards: true, previewProtection: true }, null, 2));
