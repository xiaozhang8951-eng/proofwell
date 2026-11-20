import assert from 'node:assert/strict';
import { chromium, expect } from '@playwright/test';
import fs from 'node:fs';
const base=process.env.BASE_URL||'http://127.0.0.1:4491';assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));
const shots=process.env.COMMUNITY_SCREENSHOTS||'/tmp/proofwell-p1-policies';fs.mkdirSync(shots,{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
try {
 const context=await browser.newContext();const page=await context.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await context.route('https://**',route=>route.fulfill({status:200,contentType:'application/javascript',body:'/* Isolated policy rendering check; no external service or tracking. */'}));
 for(const width of [390,768,1440]) {
  await page.setViewportSize({width,height:950});
  for(const path of ['/privacy-policy','/terms','/community-admin']) {
   const response=await page.goto(base+path);assert.equal(response.status(),200);
   await expect(page.locator('main h1')).toBeVisible();
   if(path==='/privacy-policy') {
    await expect(page.getByRole('heading',{name:'Retention and deletion',exact:true})).toBeVisible();
    await expect(page.getByText('The draft update date records this document revision, not a legal effective date, completed legal review or launch authorization.',{exact:false})).toBeVisible();
   }
   if(path==='/community-admin') {
    await page.getByText('Moderation, privacy and export checklist',{exact:true}).click();
    await expect(page.getByText('A public comment reference alone is not proof.',{exact:false})).toBeVisible();
    assert.equal(await page.locator('meta[name=robots]').getAttribute('content'),'noindex, nofollow');
   }
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${width}: ${path}`);
   await page.screenshot({path:`${shots}/${path.slice(1)}-${width}.png`,fullPage:true});
  }
 }
 assert.deepEqual(errors,[]);console.log('Privacy/Terms/expanded admin operations guide: 200, readable at 390/768/1440, no overflow, admin noindex retained. External services intercepted.');
} finally {await browser.close();}
