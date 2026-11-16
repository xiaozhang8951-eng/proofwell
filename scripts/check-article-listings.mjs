import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { chromium, expect } from '@playwright/test';
import { getArticles, articleUrl } from '../lib/content.ts';

const hiddenPaths = new Set([
  '/reviews/omnilux-contour-face',
  '/reviews/currentbody-series-2',
  '/reviews/solawave-wrinkle-retreat-pro',
  '/reviews/shark-cryoglow',
  '/comparisons/omnilux-vs-currentbody',
  '/comparisons/omnilux-vs-solawave',
  '/comparisons/omnilux-vs-solawave-vs-shark',
]);
const base = new URL(process.env.BASE_URL || 'http://127.0.0.1:4173');
assert.ok(['127.0.0.1', 'localhost'].includes(base.hostname), 'Use a local static export for browser checks');
const files = directory => fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry =>
  entry.isDirectory() ? files(path.join(directory, entry.name)) : [path.join(directory, entry.name)]);
const articles = getArticles();
for (const route of hiddenPaths) {
  assert.ok(articles.some(article => articleUrl(article) === route), `Original MDX missing: ${route}`);
  assert.ok(fs.existsSync(`out${route}.html`), `Original draft export missing: ${route}`);
}

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || (fs.existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined),
  headless: true, args: ['--no-sandbox'],
});
const page = await browser.newPage();
const failures = [];
page.on('pageerror', error => failures.push(error.message));
page.on('response', response => {
  if (response.url().startsWith(base.origin) && response.status() >= 400) failures.push(response.url());
});
await page.route('https://www.googletagmanager.com/**', route => route.fulfill({
  status: 200, contentType: 'application/javascript', body: '/* Local QA: no live tracking execution. */',
}));

try {
  const htmlFiles = files('out').filter(file => file.endsWith('.html'));
  // Check actual exported anchors, including all collection and recommendation cards.
  for (const file of htmlFiles) {
    const result = await page.evaluate(html => {
      const document = new DOMParser().parseFromString(html, 'text/html');
      return [...document.querySelectorAll('a[href]')].map(link => new URL(link.getAttribute('href'), 'https://proofwelllife.com').pathname);
    }, fs.readFileSync(file, 'utf8'));
    assert.ok(!result.some(route => hiddenPaths.has(route)), `Hidden entry still linked from ${file}`);
  }
  const sitemap = fs.readFileSync('out/sitemap.xml', 'utf8');
  for (const route of hiddenPaths) {
    assert.ok(!sitemap.includes(`https://proofwelllife.com${route}<`), `Draft entered sitemap: ${route}`);
    const response = await page.goto(new URL(route, base).href, { waitUntil: 'networkidle' });
    assert.equal(response.status(), 200);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
  }

  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(base.href, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    const reviews = page.locator('section').filter({ has: page.getByRole('heading', { name: 'Device Reviews', exact: true }) });
    const comparisons = page.locator('section').filter({ has: page.getByRole('heading', { name: 'Compare Before You Buy', exact: true }) });
    await expect(reviews.locator('.article-card')).toHaveCount(3);
    await expect(comparisons.locator('.article-card')).toHaveCount(1);
    const reviewLinks = await reviews.locator('.article-card').evaluateAll(cards => cards.map(card => card.getAttribute('href')).sort());
    assert.deepEqual(reviewLinks, [
      '/reviews/megelin-led-face-neck-mask', '/reviews/megelin-white-led-face-neck-mask', '/reviews/ulike-reglow-led-face-mask',
    ]);
    await expect(comparisons.locator('.article-card')).toHaveAttribute('href', '/comparisons/ulike-reglow-vs-megelin-white-led-mask');
    for (const image of await reviews.locator('img').all()) {
      await image.scrollIntoViewIfNeeded();
      await expect.poll(() => image.evaluate(element => element.complete && element.naturalWidth > 0)).toBe(true);
    }
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `Homepage overflow at ${width}`);

    await page.getByRole('button', { name: 'Search ProofWell' }).click();
    const input = page.getByRole('textbox', { name: 'Search articles' });
    for (const query of ['Omnilux', 'CurrentBody', 'Solawave', 'Shark']) {
      await input.fill(query);
      await expect(page.getByRole('dialog').getByRole('link')).toHaveCount(0);
    }
    await input.fill('Ulike');
    await expect(page.getByRole('dialog').getByRole('link')).toHaveCount(2);
    await input.fill('MEGELIN');
    await expect(page.getByRole('dialog').getByRole('link')).toHaveCount(3);
    await page.getByRole('button', { name: 'Close search' }).click();

    for (const [route, count] of [['/reviews', 3], ['/comparisons', 1]]) {
      await page.goto(new URL(route, base).href, { waitUntil: 'networkidle' });
      await expect(page.locator('.landing-page .article-card')).toHaveCount(count);
      await expect(page.locator('.collection-label')).toContainText(`${count} ${count === 1 ? 'article' : 'articles'}`);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${route} overflow at ${width}`);
    }
  }
  assert.deepEqual(failures, []);
  console.log(JSON.stringify({
    exportedHtmlChecked: htmlFiles.length, hiddenEntries: hiddenPaths.size,
    homepageReviews: 3, homepageComparisons: 1, searchAndCollections: 'passed',
    draftRoutesPreservedAndNoindex: true, hiddenEntriesAbsentFromSitemap: true,
    viewports: [390, 768, 1440], failures,
  }, null, 2));
} finally {
  await browser.close();
}
