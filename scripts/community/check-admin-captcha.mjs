// Explicit local Auth/CAPTCHA verifier fixtures. Never use production credentials.
import assert from 'node:assert/strict';
import { chromium, expect } from '@playwright/test';
import fs from 'node:fs';
const base=process.env.BASE_URL||'http://127.0.0.1:4481';
assert.ok(['127.0.0.1','localhost'].includes(new URL(base).hostname));
const legacy=process.env.EXPECT_ADMIN_CAPTCHA_MISSING==='1';
const shots=process.env.COMMUNITY_SCREENSHOTS||'/tmp/proofwell-p0-captcha';fs.mkdirSync(shots,{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const context=await browser.newContext();const page=await context.newPage();
const errors=[];page.on('pageerror',error=>errors.push(error.message));
const issued=new Set();const consumed=new Set();const authRequests=[];let scriptFails=false;let adminCalls=0;
await context.route('https://www.googletagmanager.com/**',r=>r.fulfill({status:200,contentType:'application/javascript',body:'/* No live analytics in local security test. */'}));
await context.route('https://challenges.cloudflare.com/**',r=>scriptFails?r.abort():r.fulfill({status:200,contentType:'application/javascript',body:`window.__p0captcha={widgets:[],render:function(node,options){const id='synthetic-'+crypto.randomUUID();const box=document.createElement('p');box.id=id;box.textContent='Isolated CAPTCHA verifier fixture';node.append(box);this.widgets.push({id,options});return id;},remove:function(id){document.getElementById(id)?.remove();}};window.turnstile=window.__p0captcha;`}));
function session() {const user={id:'22222222-2222-4222-8222-222222222222',is_anonymous:false,aud:'authenticated',role:'authenticated',app_metadata:{},user_metadata:{},created_at:'2026-11-19T00:00:00Z'};const exp=Math.floor(Date.now()/1000)+3600;const access=[{alg:'HS256'},{sub:user.id,exp},'test-only'].map(x=>Buffer.from(typeof x==='string'?x:JSON.stringify(x)).toString('base64url')).join('.');return {access_token:access,refresh_token:'isolated-test-refresh',expires_in:3600,expires_at:exp,token_type:'bearer',user};}
await context.route('https://community-test.invalid/auth/**',async r=>{
 const req=r.request();const headers={'access-control-allow-origin':base,'access-control-allow-headers':'*'};const send=(value,status=200)=>r.fulfill({status,headers,contentType:'application/json',body:JSON.stringify(value)});
 if(req.method()==='OPTIONS')return r.fulfill({status:204,headers});
 if(req.url().includes('/token')) {
   const body=req.postDataJSON();const token=body.gotrue_meta_security?.captcha_token;authRequests.push({tokenPresent:Boolean(token),token,passwordCorrect:body.password==='correct-test-password'});
   if(!token||!issued.has(token)||consumed.has(token))return send({error_code:'captcha_failed',msg:'Isolated verifier: missing, invalid or replayed CAPTCHA.'},400);
   consumed.add(token);
   if(body.password!=='correct-test-password')return send({error_code:'invalid_credentials',msg:'Invalid credentials.'},400);
   return send(session());
 }
 if(req.url().includes('/logout'))return send({});
 return send(session().user);
});
await context.route(base+'/api/community',r=>{adminCalls++;return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({articles:[],comments:[],questions:[],nextOffset:null})});});
async function credentials(password='correct-test-password') {await page.getByLabel('Email',{exact:true}).fill('isolated-staff@example.invalid');await page.getByLabel('Password',{exact:true}).fill(password);}
async function widgetCount() {await page.waitForFunction(()=>window.__p0captcha?.widgets?.length);return page.evaluate(()=>window.__p0captcha.widgets.length);}
async function issue(value='test-'+crypto.randomUUID(),valid=true) {if(valid)issued.add(value);await page.evaluate(token=>window.__p0captcha.widgets.at(-1).options.callback(token),value);await expect(page.getByRole('button',{name:'Sign in',exact:true})).toBeEnabled();return value;}
try {
 await page.goto(base+'/community-admin');await credentials();
 if(legacy) {
  await expect(page.getByRole('button',{name:'Sign in',exact:true})).toBeEnabled();
  assert.equal(await page.locator('script[src*="turnstile"]').count(),0);
  await page.getByRole('button',{name:'Sign in',exact:true}).click();await expect(page.getByRole('status')).toContainText('Sign-in failed');
  assert.equal(authRequests.length,1);assert.equal(authRequests[0].tokenPresent,false);
  console.log(JSON.stringify({mode:'pre-fix archived export with isolated verifier',missingCaptchaReproduced:true,passwordAttemptWithoutToken:true,authRejectedMissingToken:true},null,2));
 } else {
  await widgetCount();await expect(page.getByRole('button',{name:'Sign in',exact:true})).toBeDisabled();
  await page.locator('form').evaluate(form=>form.requestSubmit());await expect(page.getByRole('status')).toContainText('Complete human verification');assert.equal(authRequests.length,0);
  await issue();await page.evaluate(()=>window.__p0captcha.widgets.at(-1).options['expired-callback']());await expect(page.getByRole('button',{name:'Sign in',exact:true})).toBeDisabled();await page.locator('form').evaluate(form=>form.requestSubmit());assert.equal(authRequests.length,0);
  await issue('synthetic-invalid',false);await page.getByRole('button',{name:'Sign in',exact:true}).click();await expect(page.getByRole('status')).toContainText('Sign-in or verification failed');await expect(page.getByRole('button',{name:'Sign in',exact:true})).toBeDisabled();assert.equal(authRequests.length,1);assert.equal(adminCalls,0);
  await credentials('wrong-test-password');const oldIndex=(await widgetCount())-1;const oneTime=await issue();await page.getByRole('button',{name:'Sign in',exact:true}).click();await expect(page.getByRole('button',{name:'Sign in',exact:true})).toBeDisabled();await expect(page.getByLabel('Password',{exact:true})).toHaveValue('');assert.ok(consumed.has(oneTime));
  await page.evaluate(({index,token})=>window.__p0captcha.widgets[index].options.callback(token),{index:oldIndex,token:oneTime});await expect(page.getByRole('button',{name:'Sign in',exact:true})).toBeDisabled();
  await page.evaluate(()=>window.__p0captcha.widgets.at(-1).options['error-callback']());await expect(page.getByRole('button',{name:'Retry verification'})).toBeVisible();await expect(page.getByRole('button',{name:'Sign in',exact:true})).toBeDisabled();const before=await widgetCount();await page.getByRole('button',{name:'Retry verification'}).click();await page.waitForFunction(count=>window.__p0captcha.widgets.length>count,before);
  for(const width of [390,1440]) {await page.setViewportSize({width,height:950});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.screenshot({path:`${shots}/admin-captcha-${width}.png`,fullPage:true});}
  await credentials();const fresh=await issue();await page.getByRole('button',{name:'Sign in',exact:true}).click();await expect(page.getByRole('heading',{name:'Article totals and polls'})).toBeVisible();assert.equal(authRequests.at(-1).token,fresh);assert.ok(adminCalls>0);
  await page.getByRole('button',{name:'Sign out',exact:true}).click();await expect(page.getByRole('button',{name:'Sign in',exact:true})).toBeDisabled();await widgetCount();await credentials();await issue(fresh);await page.getByRole('button',{name:'Sign in',exact:true}).click();await expect(page.getByRole('status')).toContainText('Sign-in or verification failed');await expect(page.getByRole('button',{name:'Sign in',exact:true})).toBeDisabled();
  // A failed script cannot enable a password attempt; explicit retry reloads safely.
  scriptFails=true;await page.reload();await expect(page.getByRole('button',{name:'Retry verification'})).toBeVisible();await credentials();await expect(page.getByRole('button',{name:'Sign in',exact:true})).toBeDisabled();const attempts=authRequests.length;await page.locator('form').evaluate(form=>form.requestSubmit());assert.equal(authRequests.length,attempts);scriptFails=false;await page.getByRole('button',{name:'Retry verification'}).click();await widgetCount();await expect(page.getByRole('button',{name:'Sign in',exact:true})).toBeDisabled();
  assert.deepEqual(errors,[]);assert.ok(authRequests.every(item=>item.tokenPresent));
  console.log(JSON.stringify({mode:'post-fix isolated browser/Auth/CAPTCHA verifier',missingAndExpiredBlockedBeforeAuth:true,invalidAndReplayedRejectedByVerifier:true,tokenForwardedByRealSdk:true,failedAttemptResetsToken:true,lateCallbacksIgnored:true,widgetAndScriptErrorRetry:true,staffFlowPasses:true,viewports:[390,1440],authAttempts:authRequests.length,failures:errors},null,2));
 }
} finally {await browser.close();}
