import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { chromium, expect } from '@playwright/test';
import { therapyProducts } from '../lib/products/catalog.ts';
import { hubFaqs, treatmentCategories } from '../lib/products/content.ts';

const base = new URL(process.env.BASE_URL || 'http://127.0.0.1:4482');
assert.ok(['localhost', '127.0.0.1'].includes(base.hostname), 'This test only runs against a local static export.');
const artifacts = process.env.PRODUCT_HUB_QA_DIR || fs.mkdtempSync(path.join(os.tmpdir(), 'proofwell-device-hub-'));
fs.mkdirSync(artifacts, { recursive: true });
const route = '/red-light-therapy';
const canonical = 'https://proofwelllife.com' + route;
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
const context = await browser.newContext();
await context.route('**/*', request => request.request().url().startsWith(base.origin) ? request.continue() : request.fulfill({ status: 200, contentType: 'application/javascript', body: '/* External services disabled during local QA. */' }));
const page = await context.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const rows = [];
const ids = async expected => assert.deepEqual(await page.locator('[data-product-id]').evaluateAll(nodes => nodes.map(node => node.dataset.productId)), expected);
const area = () => page.getByLabel('Treatment area', { exact: true });
const budget = () => page.getByLabel('Budget · USD', { exact: true });
const brand = () => page.getByLabel('Brand', { exact: true });
const power = () => page.getByLabel('Power arrangement', { exact: true });
const modes = () => page.getByLabel('Treatment modes', { exact: true });
const sort = () => page.getByLabel('Sort within each area', { exact: true });
const reset = async () => page.getByRole('button', { name: 'Clear filters', exact: true }).click();

try {
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    assert.equal((await page.goto(new URL(route, base).href, { waitUntil: 'networkidle' })).status(), 200);
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('head link[rel="canonical"]')).toHaveAttribute('href', canonical);
    await expect(page.locator('head meta[property="og:url"]')).toHaveAttribute('content', canonical);
    await expect(page.locator('head meta[name="robots"]')).toHaveAttribute('content', 'index, follow');
    await expect(page.locator('head meta[name="verify-yeahpromos"]')).toHaveCount(1);
    await expect(page.locator('head meta[name="partnerboostverifycode"]')).toHaveCount(1);
    await expect(page.locator('#google-tag-manager')).toHaveCount(1);
    await expect(page.locator('footer a[href="/red-light-therapy"]')).toHaveCount(1);
    const jsonld = (await page.locator('script[type="application/ld+json"]').allTextContents()).map(JSON.parse);
    const lists = jsonld.filter(item => item['@type'] === 'ItemList');
    assert.equal(lists.length, 4); assert.deepEqual(lists.map(list => list.numberOfItems), [4, 3, 2, 1]);
    assert.ok(lists.every(list => list.itemListOrder.endsWith('ItemListUnordered')));
    assert.equal(lists.flatMap(list => list.itemListElement).filter(entry => entry.item['@type'] === 'Product').length, 9);
    assert.equal(lists.flatMap(list => list.itemListElement).filter(entry => entry.item['@type'] === 'Thing').length, 1);
    assert.ok(!JSON.stringify(lists).match(/"(?:offers|aggregateRating|review)"\s*:/));
    const faq = jsonld.find(item => item['@type'] === 'FAQPage');
    assert.deepEqual(faq.mainEntity.map(item => ({ question: item.name, answer: item.acceptedAnswer.text })), hubFaqs);
    for (const item of hubFaqs) { const question = page.getByText(item.question, { exact: true }); await expect(question).toHaveCount(1); await question.click(); await expect(page.getByText(item.answer, { exact: true })).toBeVisible(); }
    const breadcrumb = jsonld.find(item => item['@type'] === 'BreadcrumbList');
    assert.equal(breadcrumb.itemListElement.at(-1).item, canonical);
    await ids(therapyProducts.map(product => product.id));
    const images = page.locator('[data-product-id] figure img');
    await expect(images).toHaveCount(10);
    for (let index = 0; index < therapyProducts.length; index++) {
      const product = therapyProducts[index]; const card = page.locator(`[data-product-id="${product.id}"]`);
      await card.scrollIntoViewIfNeeded();
      const image = card.locator('figure img');
      await expect.poll(() => image.evaluate(node => node.complete && node.naturalWidth > 0)).toBe(true);
      await expect(image).toHaveAttribute('alt', product.productImage.alt);
      assert.deepEqual(await image.evaluate(node => [node.naturalWidth, node.naturalHeight]), [product.productImage.width, product.productImage.height]);
      await expect(card.getByText('Price last checked: Not independently checked', { exact: true })).toBeVisible();
      const commercial = card.locator(`a[href="${product.affiliateUrl}"]`);
      await expect(commercial).toHaveCount(1); await expect(commercial).toHaveAttribute('target', '_blank');
      const rel = await commercial.getAttribute('rel'); for (const token of ['sponsored', 'nofollow', 'noopener', 'noreferrer']) assert.ok(rel.split(' ').includes(token));
      if (product.amazonUrl) await expect(card.getByRole('link', { name: /^Exact Amazon listing/ })).toHaveAttribute('href', product.amazonUrl);
    }
    if (width <= 700) {
      const toggle = page.getByRole('button', { name: /^Filters/ });
      await expect(toggle).toHaveAttribute('aria-expanded', 'false');
      await expect(area()).not.toBeVisible(); await toggle.click();
      await expect(toggle).toHaveAttribute('aria-expanded', 'true'); await expect(area()).toBeVisible();
    } else await expect(area()).toBeVisible();
    await budget().selectOption('budget'); await ids(['ulike-lite-3-mode', 'aurphany-face-neck', 'megelin-8-in-1-dome', 'utk-jade-far-infrared-pad']);
    await budget().selectOption('mid-range'); await ids(['ulike-reglow-360', 'amiro-5-in-1', 'megelin-white-face-neck', 'megelin-black-face-neck', 'swirise-7-in-1-dome']);
    await budget().selectOption('premium'); await ids(['ulike-lite-4-mode']);
    await budget().selectOption('all'); await brand().selectOption('Ulike'); await modes().selectOption('4');
    await ids(['ulike-lite-4-mode', 'ulike-reglow-360']);
    await power().selectOption('wired'); await ids(['ulike-reglow-360']);
    await reset(); await power().selectOption('wireless'); await ids(['ulike-lite-3-mode']);
    await power().selectOption('unknown'); await ids(['ulike-lite-4-mode', 'amiro-5-in-1', 'megelin-white-face-neck', 'megelin-black-face-neck', 'aurphany-face-neck', 'megelin-8-in-1-dome', 'swirise-7-in-1-dome']);
    await reset(); await area().selectOption('face-neck'); await brand().selectOption('Ulike'); await ids([]);
    await expect(page.getByText('No listings match this combination.', { exact: true })).toBeVisible();
    await reset(); await sort().selectOption('price-asc'); await ids(['ulike-lite-3-mode', 'amiro-5-in-1', 'ulike-reglow-360', 'ulike-lite-4-mode', 'aurphany-face-neck', 'megelin-white-face-neck', 'megelin-black-face-neck', 'megelin-8-in-1-dome', 'swirise-7-in-1-dome', 'utk-jade-far-infrared-pad']);
    await sort().selectOption('price-desc'); await ids(['ulike-lite-4-mode', 'ulike-reglow-360', 'amiro-5-in-1', 'ulike-lite-3-mode', 'megelin-black-face-neck', 'megelin-white-face-neck', 'aurphany-face-neck', 'swirise-7-in-1-dome', 'megelin-8-in-1-dome', 'utk-jade-far-infrared-pad']);
    await reset(); await area().selectOption('full-body'); await ids(['megelin-8-in-1-dome', 'swirise-7-in-1-dome']);
    await expect(page.getByText('These compact domes are shown over selected face or body areas. Their records do not establish simultaneous whole-body coverage.', { exact: true })).toBeVisible();
    await expect(page.getByRole('table')).toHaveCount(1);
    await brand().selectOption('UTK'); await ids([]);
    await reset(); await brand().selectOption('UTK'); await ids(['utk-jade-far-infrared-pad']);
    await expect(page.locator('#group-related-heat')).toBeVisible();
    await expect(page.locator('#product-utk-jade-far-infrared-pad')).toContainText('THERMAL PAD · NOT LED');
    await reset();
    await page.getByRole('button', { name: /^Budget Under \$150/ }).click(); await ids(['ulike-lite-3-mode', 'aurphany-face-neck', 'megelin-8-in-1-dome', 'utk-jade-far-infrared-pad']);
    await page.getByRole('button', { name: /^Budget Under \$150/ }).click(); await ids(therapyProducts.map(product => product.id));
    await page.getByRole('link', { name: 'Explore this format', exact: true }).nth(1).click(); await ids(['megelin-white-face-neck', 'megelin-black-face-neck', 'aurphany-face-neck']);
    await reset();
    const tables = page.getByRole('region', { name: /specification comparison/ }); await expect(tables).toHaveCount(4);
    for (const table of await tables.all()) {
      assert.ok(await table.evaluate(node => node.scrollWidth >= node.clientWidth));
      if (width < 1100) { await table.evaluate(node => node.scrollLeft = node.scrollWidth); assert.ok(await table.evaluate(node => node.scrollLeft) > 0); }
    }
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `No page overflow at ${width}px`);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: path.join(artifacts, `hub-${width}.png`), fullPage: true });
    rows.push({ width, filters: 'PASS', groupedSorting: 'PASS', imagesAndLinks: 'PASS', overflow: false });
  }
  const local = await page.locator('a[href^="/"],img[src^="/"]').evaluateAll(nodes => [...new Set(nodes.map(node => node.getAttribute('href') || node.getAttribute('src')))]);
  for (const href of local) assert.equal((await page.request.get(new URL(href, base).href)).status(), 200, href);
  for (const category of treatmentCategories) {
    assert.equal(await page.locator(`a[href="${category.path}"]`).count(), 0, 'Do not link to unpublished category pages');
    assert.equal((await page.request.get(new URL(category.path, base).href)).status(), 404, 'Do not generate thin category pages');
  }
  const sitemap = await (await page.request.get(new URL('/sitemap.xml', base).href)).text();
  assert.equal([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].filter(match => match[1] === canonical).length, 1);
  assert.ok(!treatmentCategories.some(category => sitemap.includes(`>${'https://proofwelllife.com' + category.path}<`)));
  const noScript = await browser.newContext({ javaScriptEnabled: false }); await noScript.route('**/*', request => request.request().url().startsWith(base.origin) ? request.continue() : request.fulfill({ status: 200, body: '' })); const staticPage = await noScript.newPage();
  await staticPage.goto(new URL(route, base).href); await expect(staticPage.locator('[data-product-id]')).toHaveCount(10);
  await expect(staticPage.locator('noscript p')).toBeVisible();
  await expect(staticPage.locator('noscript p')).toContainText('Enable JavaScript to filter.');
  await noScript.close();
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ status: 'PASS', viewports: rows, localLinksChecked: local.length, faqAndCatalogSchema: 'PASS', staticContentWithoutJavaScript: 'PASS', noThinCategoryPages: true, artifacts, externalRedirects: 'NOT VERIFIED: external services intentionally disabled during browser QA' }, null, 2));
} finally { await browser.close(); }
