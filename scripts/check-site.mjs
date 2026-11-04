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
  return { title: data.title, url: `/${data.section}/${data.slug}` };
});
const links = new Set(['/robots.txt', '/sitemap.xml', '/icon.svg']);
for (const file of htmlFiles) {
  const html = fs.readFileSync(file, 'utf8');
  if (!html.includes('<meta name="robots" content="noindex, nofollow"')) {
    failures.push(`${file}: missing noindex/nofollow`);
  }
  if (html.includes('/_next/image?')) failures.push(`${file}: requires image optimization server`);
  if (file !== 'out/404.html') {
    links.add('/' + path.relative('out', file).replace(/index\.html$/, '').replace(/\.html$/, ''));
  }
  for (const match of html.matchAll(/(?:href|src)="(\/[^"#]*)"/g)) {
    links.add(match[1].replaceAll('&amp;', '&'));
  }
}
if (!fs.readFileSync('out/robots.txt', 'utf8').includes('Disallow: /')) failures.push('robots.txt: crawling allowed');
const sitemap = fs.readFileSync('out/sitemap.xml', 'utf8');
if (!sitemap.includes('<urlset')) failures.push('sitemap.xml: invalid XML root');
if (!process.env.NEXT_PUBLIC_SITE_URL && sitemap.includes('<loc>')) failures.push('sitemap.xml: invented domain');
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
    const reloaded = await page.reload({ waitUntil: 'networkidle' });
    if (reloaded.status() !== 200) failures.push(`${article.url}: refresh failed`);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(article.title);
  }
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  fs.mkdirSync(new URL('../screenshots/', import.meta.url), { recursive: true });
  await page.screenshot({ path: 'screenshots/home-desktop.png', fullPage: true });
  await page.getByRole('button', { name: 'Search ProofWell' }).click();
  await page.getByRole('textbox', { name: 'Search articles' }).fill('irradiance');
  await page.getByRole('dialog').getByRole('link', { name: /Irradiance vs Fluence/ }).click();
  await page.waitForURL('**/science/irradiance-vs-fluence');
  await expect(page.getByText('Fluence = Irradiance × Time', { exact: true })).toBeVisible();
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await page.getByLabel('A little more evidence in your inbox.').fill('reader@example.com');
  await page.getByRole('button', { name: 'Subscribe', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'not been saved' })).toBeVisible();

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
  await page.getByLabel('Name', { exact: true }).fill('Draft Reader');
  await page.getByLabel('Email', { exact: true }).fill('reader@example.com');
  await page.getByLabel('Subject', { exact: true }).fill('Editorial question');
  await page.getByLabel('Message', { exact: true }).fill('Static preview form validation.');
  await page.getByRole('button', { name: 'Preview message' }).click();
  await expect(page.getByRole('status')).toBeVisible();
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
