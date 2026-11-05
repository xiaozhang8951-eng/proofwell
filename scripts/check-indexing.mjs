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
  runInNewContext(compiled, { module, exports: module.exports, process,
    require: name => name.startsWith('.') ? load(path.resolve(path.dirname(file), name + '.ts')) : require(name) });
  return module.exports;
}
const { getPublicPaths, getIndexablePaths, isPublishedArticle } = load('lib/public-routes.ts');
const { getArticles, articleUrl } = load('lib/content.ts');
const { resolveSiteOrigin } = load('lib/metadata.ts');
const articles = getArticles();
assert.equal(articles.length, 13);
assert.equal(getPublicPaths().length, 40);
assert.equal(new Set(getPublicPaths([...articles, articles[0]])).size, 40);
assert.equal(getIndexablePaths().length, 19);
for (const article of articles) {
  assert.equal(isPublishedArticle(article), false, 'Existing article drafts require publication approval');
  assert.ok(!getIndexablePaths().includes(articleUrl(article)));
}
for (const route of ['/terms', '/sleep', '/nutrition', '/recovery', '/healthy-aging', '/supplements', '/wellness', '/wellness-technology']) {
  assert.ok(!getIndexablePaths().includes(route), `Draft/placeholder indexed: ${route}`);
}
for (const route of ['/', '/about', '/editorial-policy', '/affiliate-disclosure', '/privacy-policy', '/contact', '/science', '/topics']) {
  assert.ok(getIndexablePaths().includes(route), `Public page missing: ${route}`);
}
const fixture = { ...articles[0], published: '2020-01-01' };
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
console.log('Indexing checks passed: canonical fallback, 40 routes, 19 eligible pages, 13 protected drafts, publication/noindex guards and preview protection.');
