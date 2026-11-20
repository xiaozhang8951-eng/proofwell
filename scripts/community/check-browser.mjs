// Local static export only. Fixture mode is explicit, synthetic and never production data.
import { chromium, expect } from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { getArticles, articleUrl } from '../../lib/content.ts';
import { isEditorialDate } from '../../lib/editorial.ts';
import { communityConfig } from '../../lib/community/config.ts';
const base=process.env.BASE_URL||'http://127.0.0.1:4471';
assert.ok(['127.0.0.1','localhost'].includes(new URL(base).hostname),'Never run fixture automation against production');
const fixtures=process.env.COMMUNITY_BROWSER_FIXTURES==='1';
const screenshots=process.env.COMMUNITY_SCREENSHOTS||'/tmp/proofwell-community-screenshots';fs.mkdirSync(screenshots,{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const context=await browser.newContext();
const failures=[];const reads=[];const writes=[];const authRequests=[];let turnstileUses=new Set();let available=true;let rateLimited=false;
const approved=[{id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',nickname:'Synthetic QA reader',body:'This approved comment is a synthetic browser-test fixture.',created_at:'2026-11-19T00:00:00Z'}];
const pending=[];const questions=[];const votes=new Map();const feedback=new Map();let adminMode=false;
const articles=getArticles();const picked=articles.find(article=>article.slug==='does-red-light-therapy-work');const path=articleUrl(picked);
function state(article,authenticated,before) {
  const meta=articles.find(a=>articleUrl(a)===article);const config=communityConfig(meta);const selected=authenticated?votes.get(article)||null:null;const response=feedback.get(article);
  return {enabled:true,requireTurnstile:true,config,poll:{id:'33333333-3333-4333-8333-333333333333',total:votes.has(article)?1:0,selected,options:config.options.map(option=>({...option,count:votes.get(article)===option.id?1:0}))},feedback:{total:feedback.has(article)?1:0,helpful:response===true?1:0,selected:authenticated&&feedback.has(article)?response:null},comments:before?[{...approved[0],id:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',nickname:'Synthetic second reader'}]:approved,nextCursor:before?null:{created_at:approved[0].created_at,id:approved[0].id}};
}
const authUser=anon=>({id:anon?'11111111-1111-4111-8111-111111111111':'22222222-2222-4222-8222-222222222222',aud:'authenticated',role:'authenticated',is_anonymous:anon,app_metadata:{},user_metadata:{},identities:[],created_at:'2026-11-19T00:00:00Z'});
function session(anon) {const user=authUser(anon);const exp=Math.floor(Date.now()/1000)+3600;const token=[{alg:'HS256',typ:'JWT'},{sub:user.id,exp,aud:'authenticated'},'synthetic'].map(part=>Buffer.from(typeof part==='string'?part:JSON.stringify(part)).toString('base64url')).join('.');return {access_token:token,refresh_token:'synthetic-refresh-token',expires_in:3600,expires_at:exp,token_type:'bearer',user};}
await context.route('https://www.googletagmanager.com/**',route=>route.fulfill({status:200,contentType:'application/javascript',body:'/* Local QA: no actual Google requests or tracking. */'}));
await context.route('https://challenges.cloudflare.com/**',route=>route.fulfill({status:200,contentType:'application/javascript',body:`window.__qaTokens=0;window.turnstile={render:function(node,o){const id='qa-'+crypto.randomUUID();const el=document.createElement('p');el.textContent='Synthetic CAPTCHA fixture (not a real challenge)';el.id=id;node.appendChild(el);setTimeout(()=>o.callback('synthetic-token-'+id),20);return id},remove:function(id){document.getElementById(id)?.remove()}};`}));
const serviceFixture = async route=>{
  const req=route.request();const url=new URL(req.url());const headers={'access-control-allow-origin':base,'access-control-allow-headers':'authorization, apikey, content-type','access-control-allow-methods':'GET, POST, OPTIONS'};
  const fulfill=(json,status=200)=>route.fulfill({status,headers,contentType:'application/json',body:JSON.stringify(json)});
  if(req.method()==='OPTIONS')return route.fulfill({status:204,headers});
  if(url.pathname.startsWith('/auth/')) {
    authRequests.push({path:url.pathname,method:req.method()});
    if(url.pathname.endsWith('/signup')) {const body=req.postDataJSON();assert.ok(body.gotrue_meta_security?.captcha_token);return fulfill(session(true));}
    if(url.pathname.endsWith('/token')){const body=req.postDataJSON();assert.ok(body.gotrue_meta_security?.captcha_token,'Administrator must send CAPTCHA');adminMode=true;return fulfill(session(false));}
    if(url.pathname.endsWith('/logout'))return fulfill({});
    if(url.pathname.endsWith('/user'))return fulfill(authUser(!adminMode));
  }
  if(url.pathname!=='/api/community')return fulfill({error:'Unexpected fixture URL'},404);
  if(!available)return fulfill({error:'Synthetic service outage; no data saved.'},503);
  if(req.method()==='GET') {reads.push(url.searchParams.get('article'));return fulfill(state(url.searchParams.get('article'),Boolean(req.headers().authorization),url.searchParams.get('before')));}
  const body=req.postDataJSON();writes.push(body);
  if(body.action.startsWith('admin_')) {
    if(!adminMode)return fulfill({error:'Administrator access is required.'},403);
    if(body.action==='admin_list'||body.action==='admin_export')return fulfill({articles:[{article_key:path,title:picked.title,enabled:true,discussion_prompt:communityConfig(picked).discussionPrompt,next_question:communityConfig(picked).nextQuestion,poll:{id:'33333333-3333-4333-8333-333333333333',question:communityConfig(picked).question,options:communityConfig(picked).options},votes:1,feedback_total:1,helpful:1,pending_comments:pending.length,pending_questions:questions.length,poll_results:[],poll_history:[]}],comments:pending.map((item,index)=>({...item,id:'cccccccc-cccc-4ccc-8ccc-cccccccccccc',status:'pending',article_key:path,created_at:'2026-11-19T00:00:00Z'})),questions:questions.map(item=>({...item,id:'dddddddd-dddd-4ddd-8ddd-dddddddddddd',article_key:path,status:'pending',created_at:'2026-11-19T00:00:00Z'})),nextOffset:null});
    if(body.action==='admin_moderate'&&body.payload.kind==='comment'&&body.payload.status==='approved')pending.length=0;
    return fulfill({accepted:true});
  }
  if(rateLimited)return fulfill({error:'Too many submissions. Please try again later.'},429);
  assert.ok(body.turnstileToken);assert.ok(!turnstileUses.has(body.turnstileToken),'One-time token reused');turnstileUses.add(body.turnstileToken);
  if(body.action==='poll'){if(votes.has(body.article))return fulfill({accepted:false,duplicate:true});votes.set(body.article,body.payload.option);}
  if(body.action==='feedback'){if(feedback.has(body.article))return fulfill({accepted:false,duplicate:true});feedback.set(body.article,body.payload.helpful);}
  if(body.action==='comment')pending.push(body.payload);
  if(body.action==='question')questions.push(body.payload);
  return fulfill({accepted:true});
};
await context.route('https://community-test.invalid/**',serviceFixture);
await context.route(base+'/api/community**',serviceFixture);
const page=await context.newPage();page.on('pageerror',error=>failures.push(error.message));
async function module() {await page.locator('#article-community').scrollIntoViewIfNeeded();await expect(page.getByRole('heading',{name:'What Do You Think?',exact:true})).toBeVisible();}
async function analyticsConsent() { await page.evaluate(() => { if (!window.ProofWellCommunityAnalytics) throw new Error('Consent bridge missing'); window.ProofWellCommunityAnalytics.setConsent('granted'); }); }
async function consent() {await page.locator('#article-community input[type=checkbox]').check();}
async function eventCount(name){return page.evaluate(name=>(window.dataLayer||[]).filter(item=>item.event===name).length,name);}
try {
  for(const article of articles) {
    await page.goto(base+articleUrl(article));await expect(page.getByRole('heading',{level:1})).toHaveText(article.title);await module();
    assert.equal(await page.locator('#article-community').count(),1);
    if(article.draft===true||article.noindex===true||!isEditorialDate(article.published)||article.published>new Date().toISOString().slice(0,10))await expect(page.getByText('Discussion opens when this article is published.',{exact:false})).toBeVisible();
    else if(!fixtures)await expect(page.getByText('Reader interactions are not available yet.',{exact:false})).toBeVisible();
    else await expect(page.getByRole('heading',{name:'Consumer Poll',exact:true})).toBeVisible();
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  }
  await page.goto(base+path);
  const oldReads=reads.length;await page.waitForTimeout(150);assert.equal(reads.length,oldReads,'No API fetch before reaching article bottom');await module();
  if(fixtures) {
    await expect(page.getByText('No votes have been recorded for this poll.')).toBeVisible();await consent();await analyticsConsent();
    await page.getByRole('button',{name:'Start a secure guest session'}).click();await expect(page.getByText('Your guest session is ready.',{exact:false})).toBeVisible();
    await expect(page.getByRole('radio').first()).toBeEnabled();await page.getByRole('radio').first().check();await page.getByRole('button',{name:'Submit vote',exact:true}).click();
    await expect(page.getByRole('button',{name:'Vote recorded'})).toBeDisabled();await expect(page.getByText('1 total vote',{exact:true})).toBeVisible();assert.equal(await eventCount('poll_vote'),1);
    await page.reload();await module();await expect(page.getByRole('button',{name:'Vote recorded'})).toBeDisabled();await consent();await analyticsConsent();
    await page.getByRole('button',{name:'Yes, helpful',exact:true}).click();await expect(page.getByText('100% found this helpful · 1 response')).toBeVisible();assert.equal(await eventCount('article_feedback'),1);
    await page.getByLabel('Nickname (public after approval)',{exact:true}).fill('Synthetic pending reader');await page.getByLabel('Your experience or question',{exact:true}).fill('This synthetic comment must remain private until approval.');await page.getByRole('button',{name:'Submit for moderation'}).click();await expect(page.getByText('Thank you. Your comment is pending moderation and is not public yet.',{exact:true})).toBeVisible();assert.equal(pending.length,1);await expect(page.getByText('Synthetic pending reader',{exact:true})).toHaveCount(0);assert.equal(await eventCount('comment_submit'),1);
    await page.getByLabel('Your question or suggestion').fill('Synthetic private question: please explain exposure measurement.');await page.getByRole('button',{name:'Send suggestion privately'}).click();await expect(page.getByText('Thank you. Your suggestion has been sent privately to the editorial queue.',{exact:true})).toBeVisible();assert.equal(questions.length,1);assert.equal(await eventCount('question_submit'),1);
    const events=await page.evaluate(()=>(window.dataLayer||[]).filter(item=>['poll_vote','comment_submit','article_feedback','question_submit'].includes(item.event)));for(const event of events)assert.deepEqual(Object.keys(event).sort(),['article_slug','event','interaction_type']);
    assert.ok((await page.getByRole('link',{name:'Request removal of this comment',exact:true}).first().getAttribute('href')).startsWith('mailto:proofwelllife@gmail.com?'));
    await page.evaluate(()=>window.ProofWellCommunityAnalytics.setConsent('denied'));
    const questionsBeforeWithdrawal=await eventCount('question_submit');
    await page.getByLabel('Your question or suggestion').fill('A second synthetic private suggestion after analytics withdrawal.');
    await page.getByRole('button',{name:'Send suggestion privately'}).click();
    await expect(page.getByText('Thank you. Your suggestion has been sent privately to the editorial queue.',{exact:true})).toBeVisible();
    assert.equal(questions.length,2);assert.equal(await eventCount('question_submit'),questionsBeforeWithdrawal,'Successful submissions still work after analytics withdrawal, with no event');
    await page.getByRole('button',{name:'Load more comments'}).click();await expect(page.getByText('Synthetic second reader',{exact:true})).toBeVisible();
    // Error response must not emit a success event or insert an optimistic comment.
    rateLimited=true;await page.getByLabel('Nickname (public after approval)',{exact:true}).fill('Synthetic rate test');await page.getByLabel('Your experience or question',{exact:true}).fill('This rate-limited synthetic comment must not be saved.');const before=await eventCount('comment_submit');await page.getByRole('button',{name:'Submit for moderation'}).click();await expect(page.locator('#article-community').getByRole('alert')).toContainText('Too many submissions.');assert.equal(await eventCount('comment_submit'),before);assert.equal(pending.length,1);rateLimited=false;await page.getByRole('button',{name:'Retry loading',exact:true}).click();await expect(page.locator('#article-community').getByRole('alert')).toHaveCount(0);
    for(const width of [390,768,1440]) {await page.setViewportSize({width,height:950});await module();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.locator('#article-community').screenshot({path:`${screenshots}/community-${width}.png`});}
    available=false;await page.reload();await module();await expect(page.getByText('Synthetic service outage; no data saved.',{exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Submit vote',exact:true})).toHaveCount(0);available=true;await page.getByRole('button',{name:'Retry loading',exact:true}).click();await expect(page.getByRole('button',{name:'Vote recorded'})).toBeVisible();
    // Static admin shell: authenticated access and moderation/export controls.
    await page.goto(base+'/community-admin');await page.getByLabel('Email',{exact:true}).fill('synthetic-staff@example.invalid');await page.getByLabel('Password',{exact:true}).fill('synthetic-password-not-real');await page.getByRole('button',{name:'Sign in',exact:true}).click();await expect(page.getByRole('heading',{name:'Article totals and polls',exact:true})).toBeVisible();await page.getByRole('button',{name:'Approve',exact:true}).click();assert.ok(writes.some(item=>item.action==='admin_moderate'&&item.payload.status==='approved'));await page.getByText('Edit discussion and poll settings',{exact:true}).click();await expect(page.getByRole('textbox',{name:'Options: one id | label per line',exact:true})).toBeVisible();
    await page.getByRole('textbox',{name:'Poll question',exact:true}).fill('Which synthetic research topic should we explain next?');page.once('dialog',dialog=>dialog.accept());await page.getByRole('button',{name:'Save settings',exact:true}).click();await expect(page.getByRole('button',{name:'Save settings',exact:true})).toBeEnabled();assert.ok(writes.some(item=>item.action==='admin_config'&&item.payload.question==='Which synthetic research topic should we explain next?'));
    const download=page.waitForEvent('download');await page.getByRole('button',{name:'Export filtered data (CSV)'}).click();assert.match((await download).suggestedFilename(),/proofwell-(articles|comments|questions)-/);await expect(page.getByRole('status').filter({hasText:'Exported 1 article summaries'})).toBeVisible();
    await page.setViewportSize({width:390,height:950});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.screenshot({path:`${screenshots}/admin-390.png`,fullPage:true});await page.getByRole('button',{name:'Sign out',exact:true}).click();await expect(page.getByRole('button',{name:'Sign in',exact:true})).toBeVisible();
  } else {
    for(const width of [390,768,1440]){await page.setViewportSize({width,height:950});await module();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.locator('#article-community').screenshot({path:`${screenshots}/disabled-${width}.png`});}
    assert.equal(reads.length,0);assert.equal(authRequests.length,0);await page.goto(base+'/community-admin');await expect(page.getByText('Community service is not configured. No data is available.')).toBeVisible();
  }
  assert.deepEqual(failures,[]);
  console.log(JSON.stringify({mode:fixtures?'explicit synthetic API/Auth/CAPTCHA fixtures':'default unconfigured / no requests',articles:articles.length,viewports:[390,768,1440],apiReads:reads.length,mutations:writes.length,authRequests:authRequests.length,failures},null,2));
}finally{await browser.close();}
