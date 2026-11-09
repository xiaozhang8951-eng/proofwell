import { chromium, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

const baseUrl = (process.env.BASE_URL || 'http://localhost:4173').replace(/\/$/, '');
const failures = [];
function filesIn(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? filesIn(file) : [file];
  });
}
const exportedFiles = filesIn('out');
const htmlFiles = exportedFiles.filter(file => file.endsWith('.html'));
const articles = filesIn('content').filter(file => file.endsWith('.mdx')).map(file => {
  const { data } = matter(fs.readFileSync(file, 'utf8'));
  return { title: data.title, url: `/${data.section}/${data.slug}`, snapshotVisible: data.evidenceSnapshot?.visible !== false };
});
const links = new Set(['/robots.txt', '/sitemap.xml', '/icon.svg']);
const sitemap = fs.readFileSync('out/sitemap.xml', 'utf8');
const sitemapPaths = new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, url]) => new URL(url).pathname));
const robots = fs.readFileSync('out/robots.txt', 'utf8');
for (const file of htmlFiles) {
  const html = fs.readFileSync(file, 'utf8');
  const route = '/' + path.relative('out', file).replace(/index\.html$/, '').replace(/\.html$/, '');
  const expectedRobots = sitemapPaths.has(route) ? 'index, follow' : 'noindex, nofollow';
  const errorPage = ['404.html', '_not-found.html'].includes(path.basename(file));
  if (errorPage ? !/<meta name="robots" content="noindex/.test(html) : !html.includes(`<meta name="robots" content="${expectedRobots}"`)) {
    failures.push(`${file}: missing ${expectedRobots}`);
  }
  if (html.includes('/_next/image?')) failures.push(`${file}: requires image optimization server`);
  if (file !== 'out/404.html') {
    links.add('/' + path.relative('out', file).replace(/index\.html$/, '').replace(/\.html$/, ''));
  }
  for (const match of html.matchAll(/(?:href|src)="(\/[^"#]*)"/g)) {
    links.add(match[1].replaceAll('&amp;', '&'));
  }
}
if (!sitemap.includes('<urlset')) failures.push('sitemap.xml: invalid XML root');
if (!robots.includes('Sitemap: https://proofwelllife.com/sitemap.xml')) failures.push('robots.txt: incorrect sitemap URL');
if (/^Allow: \/$/m.test(robots) && !sitemapPaths.size) failures.push('Production sitemap is empty');
if (!fs.existsSync('out/404.html')) failures.push('404.html missing');
for (const article of articles) {
  if (!fs.existsSync(`out${article.url}.html`)) failures.push(`${article.url}: exported article missing`);
}

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || (fs.existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined),
  headless: true,
  args: ['--no-sandbox'],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
page.on('pageerror', error => failures.push(error.message));
page.on('requestfailed', request => {
  if (!request.failure()?.errorText.includes('ERR_ABORTED')) failures.push(`Failed request: ${request.url()}`);
});
page.on('response', response => {
  if (response.status() >= 400) failures.push(`Browser resource ${response.status()}: ${response.url()}`);
});

try {
  // Verify every exported page and every local asset referenced by the HTML.
  for (const url of links) {
    const response = await page.request.get(baseUrl + url);
    if (response.status() !== 200) failures.push(`${url}: HTTP ${response.status()}`);
    if (/\.css(?:\?|$)/.test(url) && !response.headers()['content-type']?.includes('text/css')) failures.push(`${url}: incorrect CSS type`);
    if (/\.js(?:\?|$)/.test(url) && !response.headers()['content-type']?.includes('javascript')) failures.push(`${url}: incorrect JavaScript type`);
  }
  // A fresh navigation and a reload must both work without a Next.js server.
  for (const article of articles) {
    const response = await page.goto(baseUrl + article.url, { waitUntil: 'networkidle' });
    if (response.status() !== 200) failures.push(`${article.url}: direct visit failed`);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(article.title);
    const snapshot = page.getByRole('complementary', { name: 'Evidence Snapshot', exact: true });
    if (article.snapshotVisible) await expect(snapshot).toBeVisible();
    else await expect(snapshot).toHaveCount(0);
    if (await page.getByText('Scientifically reviewed by', { exact: false }).count()) failures.push(`${article.url}: unearned reviewer attribution`);
    if (await page.locator('.evidence-level').count()) failures.push(`${article.url}: unverified evidence grade`);
    const reloaded = await page.reload({ waitUntil: 'networkidle' });
    if (reloaded.status() !== 200) failures.push(`${article.url}: refresh failed`);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(article.title);
  }
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  for (const name of ['Skin Science & Beauty', 'Nutrition & Supplements', 'Healthy Aging', 'Wellness Technology']) await expect(page.locator('.focus-section').getByRole('link').filter({ hasText: name })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  fs.mkdirSync(new URL('../screenshots/', import.meta.url), { recursive: true });
  await page.screenshot({ path: 'screenshots/home-desktop.png', fullPage: true });
  await page.locator('.focus-section').screenshot({ path: 'screenshots/pillars-desktop.png' });
  await page.getByRole('button', { name: 'Search ProofWell' }).click();
  await page.getByRole('textbox', { name: 'Search articles' }).fill('irradiance');
  await page.getByRole('dialog').getByRole('link', { name: /Irradiance vs Fluence/ }).click();
  await page.waitForURL('**/science/irradiance-vs-fluence');
  await expect(page.getByText('Radiant exposure (J/cm²) = Irradiance (W/cm²) × Time (seconds)', { exact: true })).toBeVisible();
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await page.getByLabel('Newsletter preview — subscriptions are not active.').fill('reader@example.com');
  let formRequests = 0;
  const recordSubmission = request => { if (!['GET', 'HEAD'].includes(request.method()) || /reader(?:%40|@)example\.com/i.test(request.url())) formRequests++; };
  page.on('request', recordSubmission);
  await page.getByRole('button', { name: 'Preview only', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'not been sent or saved' })).toBeVisible();

  for (const width of [390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) failures.push(`Homepage overflow at ${width}px`);
    if (width === 390) {
      await page.screenshot({ path: 'screenshots/home-mobile.png', fullPage: true });
      await page.getByRole('button', { name: 'Open navigation' }).click();
      await page.getByRole('navigation', { name: 'Mobile navigation' }).getByRole('link', { name: 'Reviews', exact: true }).click();
      await page.waitForURL('**/reviews');
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(baseUrl + '/science/red-light-therapy-skin', { waitUntil: 'networkidle' });
  await expect(page.getByRole('navigation', { name: 'Mobile article contents' })).toBeHidden();
  const contentsButton = page.getByRole('button', { name: 'In this article' });
  await contentsButton.click();
  await expect(contentsButton).toHaveAttribute('aria-expanded', 'true');
  await page.getByRole('navigation', { name: 'Mobile article contents' }).getByRole('link', { name: 'Frequently Asked Questions', exact: true }).click();
  await expect(contentsButton).toHaveAttribute('aria-expanded', 'false');
  await expect(page).toHaveURL(/#frequently-asked-questions$/);
  await page.locator('.article-faq summary').first().click();
  await expect(page.locator('.article-faq details').first()).toHaveAttribute('open', '');
  await page.screenshot({ path: 'screenshots/article-mobile.png', fullPage: true });
  if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) failures.push('Reference article mobile overflow');
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(baseUrl + '/science/red-light-therapy-skin', { waitUntil: 'networkidle' });
  await expect(page.getByRole('navigation', { name: 'Table of contents', exact: true })).toBeVisible();
  for (const link of await page.getByRole('navigation', { name: 'Table of contents', exact: true }).getByRole('link').all()) {
    const href = await link.getAttribute('href');
    if (!await page.locator(href).count()) failures.push(`Missing contents anchor: ${href}`);
  }
  if (await page.locator('.references').evaluate(element => getComputedStyle(element).listStyleType) !== 'decimal') failures.push('References must display numbered list markers');
  await page.screenshot({ path: 'screenshots/article-desktop.png', fullPage: true });
  await page.locator('#evidence-snapshot').screenshot({ path: 'screenshots/snapshot-desktop.png' });
  await page.goto(baseUrl + '/reviews/omnilux-contour-face', { waitUntil: 'networkidle' });
  await page.getByText('Our product evaluation framework', { exact: true }).click();
  if (await page.locator('.review-framework dt').count() !== 9) failures.push('Review framework must have nine criteria');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(baseUrl + '/comparisons/omnilux-vs-solawave-vs-shark', { waitUntil: 'networkidle' });
  await page.screenshot({ path: 'screenshots/comparison-mobile.png', fullPage: true });
  if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) failures.push('Comparison mobile overflow');
  const table = page.getByRole('region', { name: 'Product comparison' });
  const scrolls = await table.evaluate(element => {
    element.scrollLeft = element.scrollWidth;
    return element.scrollLeft > 0;
  });
  if (!scrolls) failures.push('Mobile comparison table cannot scroll');
  await page.goto(baseUrl + '/contact', { waitUntil: 'networkidle' });
  await page.getByText('Optional form preview — sending is not connected', { exact: true }).click();
  await page.getByLabel('Name', { exact: true }).fill('Draft Reader');
  await page.getByLabel('Email', { exact: true }).fill('reader@example.com');
  await page.getByLabel('Subject', { exact: true }).fill('Editorial question');
  await page.getByLabel('Message', { exact: true }).fill('Static preview form validation.');
  await page.getByRole('button', { name: 'Preview message' }).click();
  await expect(page.getByRole('status')).toBeVisible();
  await expect(page.getByRole('status')).toContainText('not been sent, received, or saved');
  if (formRequests) failures.push('Preview form made a submission request');
  page.off('request', recordSubmission);
  const notFound = await page.request.get(baseUrl + '/does-not-exist');
  if (notFound.status() !== 404) failures.push('Unknown URL did not return HTTP 404');
} finally {
  await browser.close();
}

console.log(JSON.stringify({
  baseUrl,
  exportedFiles: exportedFiles.length,
  htmlFiles: htmlFiles.length,
  checkedPagesAndAssets: links.size,
  articlesDirectlyVisitedAndRefreshed: articles.length,
  viewports: [390, 768, 1024, 1440],
  failures,
}, null, 2));
if (failures.length) process.exitCode = 1;
