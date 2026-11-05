import { chromium, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { normalizeSiteOrigin, absoluteSiteUrl, pageMetadata, productionSiteUrl } from '../lib/metadata.ts';
import assert from 'node:assert/strict';

// Reserved domain is a test fixture only; it is never configured for deployment.
const fixtureOrigin=normalizeSiteOrigin('https://proofwell.example/');
assert.equal(fixtureOrigin,'https://proofwell.example');
assert.equal(normalizeSiteOrigin(''),undefined);
for(const value of ['https://proofwell.example/path','https://user:secret@proofwell.example','javascript:alert(1)'])assert.throws(()=>normalizeSiteOrigin(value));
assert.equal(absoluteSiteUrl(fixtureOrigin,'/editorial-policy'),'https://proofwell.example/editorial-policy');
assert.throws(()=>absoluteSiteUrl(fixtureOrigin,'//external.example'));
assert.equal(pageMetadata({title:'QA fixture',description:'Metadata fixture only',path:'/about'}).alternates,undefined);
assert.equal(pageMetadata({title:'QA fixture',description:'Metadata fixture only',path:'/about',origin:fixtureOrigin}).alternates.canonical,'https://proofwell.example/about');

// Verify absolute structured-data URLs in memory without exporting a fake domain.
const {default:ts}=await import('typescript');
const {createRequire}=await import('node:module');
const {runInNewContext}=await import('node:vm');
const {createElement}=await import('react');
const {renderToStaticMarkup}=await import('react-dom/server');
const {default:matter}=await import('gray-matter');
const metadataHelpers=await import('../lib/metadata.ts');
const editorialHelpers=await import('../lib/editorial.ts');
const require=createRequire(import.meta.url);
const schemaExports={};
const compiled=ts.transpileModule(fs.readFileSync('components/seo.tsx','utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS}}).outputText;
runInNewContext(compiled,{exports:schemaExports,require:id=>id==='@/lib/site'?{siteUrl:fixtureOrigin,officialContact:{name:'ProofWell Editorial Team',email:'proofwelllife@gmail.com'}}:id==='@/lib/metadata'?metadataHelpers:id==='@/lib/editorial'?editorialHelpers:id==='@/lib/content'?{articleUrl:article=>`/${article.section}/${article.slug}`}:require(id)});
function schemaData(component,props){return JSON.parse(renderToStaticMarkup(createElement(component,props)).replace(/^<script[^>]*>/,'').replace(/<\/script>$/,''));}
const org=schemaData(schemaExports.OrganizationSchema,{description:'ProofWell editorial publication'});
assert.equal(org.email,'proofwelllife@gmail.com');assert.equal(org.publishingPrinciples,fixtureOrigin+'/editorial-policy');assert.ok(!org.address&&!org.telephone&&!org.legalName);
const breadcrumb=schemaData(schemaExports.BreadcrumbSchema,{items:[{name:'Home',path:'/'},{name:'Editorial Policy',path:'/editorial-policy'}]});
assert.equal(breadcrumb.itemListElement[1].item,fixtureOrigin+'/editorial-policy');assert.equal(breadcrumb.itemListElement[1].position,2);
const article=matter(fs.readFileSync('content/beauty-tech/red-light-therapy-skin.mdx','utf8')).data;
const articleSchema=schemaData(schemaExports.ArticleSchema,{article});
assert.equal(articleSchema.headline,article.title);assert.equal(articleSchema.mainEntityOfPage,fixtureOrigin+'/science/red-light-therapy-skin');assert.equal(articleSchema.author.name,article.author);assert.ok(!articleSchema.aggregateRating&&!articleSchema.review);

const baseUrl=(process.env.BASE_URL||'http://localhost:4173').replace(/\/$/,'');
const pages=['about','editorial-policy','affiliate-disclosure','privacy-policy','contact'];
function filesIn(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?filesIn(path.join(dir,e.name)):[path.join(dir,e.name)]);}
const htmlFiles=filesIn('out').filter(f=>f.endsWith('.html'));
const sitemap=fs.readFileSync('out/sitemap.xml','utf8');
const sitemapPaths=new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([,url])=>new URL(url).pathname));
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),headless:true,args:['--no-sandbox']});
const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()}: ${r.url()}`)});
const titles=new Map(),descriptions=new Map();
try{
  for(const file of htmlFiles){
    if(['out/404.html','out/_not-found.html'].includes(file))continue;
    const url='/'+path.relative('out',file).replace(/index\.html$/,'').replace(/\.html$/,'');
    await page.goto(baseUrl+url,{waitUntil:'load'});
    const title=await page.title();const description=await page.locator('meta[name="description"]').getAttribute('content');
    if(titles.has(title))errors.push(`Duplicate title: ${url} and ${titles.get(title)}`);titles.set(title,url);
    if(descriptions.has(description))errors.push(`Duplicate description: ${url} and ${descriptions.get(description)}`);descriptions.set(description,url);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('img:not([alt])')).toHaveCount(0);
    if(await page.locator('img').evaluateAll(images=>images.some(image=>!image.alt.trim())))errors.push(`${url}: missing descriptive image alt text`);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content',sitemapPaths.has(url)?'index, follow':'noindex, nofollow');
    for(const selector of ['meta[property="og:title"]','meta[property="og:description"]','meta[name="twitter:title"]','meta[name="twitter:description"]'])await expect(page.locator(selector)).toHaveCount(1);
    const canonical=await page.locator('link[rel="canonical"]').getAttribute('href');
    assert.equal(new URL(canonical).href,new URL(url,productionSiteUrl).href);
    for(const node of await page.locator('script[type="application/ld+json"]').all()){
      const data=JSON.parse(await node.textContent());
      assert.equal(data['@context'],'https://schema.org');
      assert.ok(!['Product','Review','AggregateRating'].includes(data['@type']));
      if(data['@type']==='Organization'){assert.equal(data.email,'proofwelllife@gmail.com');assert.ok(!data.address&&!data.telephone&&!data.legalName);}
    }
    if(url.startsWith('/science/')||url.startsWith('/reviews/')||url.startsWith('/comparisons/')||url.startsWith('/buying-guides/'))assert.match(await page.locator('script[type="application/ld+json"]').allTextContents().then(v=>v.join(' ')),/"@type":"Article"/);
  }
  fs.mkdirSync('screenshots/phase3',{recursive:true});
  for(const width of [1440,390]){
    await page.setViewportSize({width,height:1000});
    for(const slug of pages){
      await page.goto(`${baseUrl}/${slug}`,{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);
      const main=page.locator('main');const contact=main.locator('.official-contact');
      await expect(contact).toHaveCount(1);await expect(contact).toContainText('ProofWell Editorial Team');
      const email=contact.getByRole('link',{name:'proofwelllife@gmail.com',exact:true});await expect(email).toBeVisible();await expect(email).toHaveAttribute('href','mailto:proofwelllife@gmail.com');
      await expect(page.locator('footer').getByRole('link',{name:'Editorial Policy',exact:true})).toHaveAttribute('href','/editorial-policy');
      for(const item of await main.locator('.info-links a').all())assert.equal((await page.request.get(baseUrl+await item.getAttribute('href'))).status(),200);
      if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))errors.push(`${slug}: overflow at ${width}`);
      await page.screenshot({path:`screenshots/phase3/${slug}-${width}.png`,fullPage:true});
    }
  }
  await page.goto(`${baseUrl}/editorial-policy`,{waitUntil:'networkidle'});
  for(const phrase of ['Stronger evidence','Moderate evidence','Preliminary evidence','Preclinical evidence'])await expect(page.locator('.trust-list')).toContainText(phrase);
  await page.goto(`${baseUrl}/contact`,{waitUntil:'networkidle'});await expect(page.getByText('Optional form preview — sending is not connected',{exact:true})).toBeVisible();await expect(page.getByLabel('Name',{exact:true})).toBeHidden();
  const robots=fs.readFileSync('out/robots.txt','utf8');assert.match(robots,/Sitemap: https:\/\/proofwelllife\.com\/sitemap\.xml/);
  assert.match(sitemap,/<urlset/);
  if(/^Allow: \/$/m.test(robots))assert.ok(sitemapPaths.size>0,'Production sitemap must not be empty');
}finally{await browser.close();}
console.log(JSON.stringify({trustPages:pages,validatedPageMetadata:titles.size,contactViewports:[1440,390],screenshots:'screenshots/phase3/',errors},null,2));
if(errors.length)process.exitCode=1;
