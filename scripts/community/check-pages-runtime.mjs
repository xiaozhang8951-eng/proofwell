// Run only with a locally compiled Pages Worker and an isolated Miniflare tool install.
// All Auth, CAPTCHA and RPC replies are in-process fixtures; no external requests.
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { createHandler } from '../../supabase/functions/community/handler.mjs';
const modulePath=process.env.MINIFLARE_MODULE;const scriptPath=process.env.PAGES_WORKER_BUNDLE;
assert.ok(modulePath&&scriptPath,'Set MINIFLARE_MODULE and PAGES_WORKER_BUNDLE to isolated local tool/bundle paths.');
const {Miniflare,convertV4MiniflareOptions}=await import(pathToFileURL(modulePath));
const secret='isolated-p0-gateway-key-not-for-production';const seen=new Set();const mutations=[];const captchaIps=[];const relayed=[];const bridgeErrors=[];let outboundCalls=0;
const env={COMMUNITY_ENABLED:'true',COMMUNITY_ALLOWED_ORIGINS:'https://proofwelllife.com',COMMUNITY_GATEWAY_SECRET:secret,SUPABASE_URL:'https://project.test.invalid',SUPABASE_SERVICE_ROLE_KEY:'isolated-server-key',TURNSTILE_SECRET_KEY:'isolated-captcha-key',COMMUNITY_IP_HASH_SECRET:'0123456789abcdef0123456789abcdef'};
const backend=createHandler({env:key=>env[key],fetch:async(url,init)=>{
 if(url.endsWith('/auth/v1/user'))return Response.json({id:'11111111-1111-4111-8111-111111111111',is_anonymous:true});
 if(url.includes('/siteverify')){captchaIps.push(init.body.get('remoteip'));return Response.json({success:true,action:'community_submit',hostname:'proofwelllife.com'});}
 const body=JSON.parse(init.body);
 if(url.endsWith('/community_consume_gateway_nonce')){const accepted=!seen.has(body.p_nonce);seen.add(body.p_nonce);return Response.json({accepted});}
 if(url.endsWith('/community_submit'))mutations.push(body);
 return Response.json({accepted:true});
}});
const options={rootPath:path.dirname(scriptPath),modules:true,scriptPath,compatibilityDate:'2026-11-19',cf:{colo:'LOCAL-FIXTURE',asn:64500},bindings:{...env,NEXT_PUBLIC_SUPABASE_URL:env.SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY:'isolated-public-key'},serviceBindings:{ASSETS:()=>new Response('Not found',{status:404})},outboundService:async request=>{
 outboundCalls++;try {
 assert.equal(new URL(request.url).origin,'https://project.test.invalid','Unexpected external request');
 const bytes=await request.arrayBuffer();const req=new Request(request.url,{method:request.method,headers:Object.fromEntries(request.headers),body:request.method==='POST'?bytes:undefined});relayed.push(req.clone());
 const response=await backend(req);return new Response(await response.arrayBuffer(),{status:response.status,headers:Object.fromEntries(response.headers)});
 }catch(error){bridgeErrors.push(error.message);throw error;}
}};
const mf=new Miniflare(convertV4MiniflareOptions ? convertV4MiniflareOptions(options) : options);
try {
 await mf.ready;
 const payload=JSON.stringify({article:'/science/how-led-masks-work',action:'feedback',payload:{helpful:true},acknowledged:true,turnstileToken:'isolated-challenge'});
 const headers={origin:'https://proofwelllife.com','content-type':'application/json',authorization:'Bearer isolated-test-jwt','cf-connecting-ip':'198.51.100.30','x-forwarded-for':'203.0.113.99','x-real-ip':'203.0.113.98','x-proofwell-gateway-ip':'203.0.113.97','x-proofwell-gateway-signature':'forged'};
 const response=await mf.dispatchFetch('https://proofwelllife.com/api/community',{method:'POST',headers,body:payload});
 assert.equal(response.status,200,JSON.stringify({body:await response.text(),outboundCalls,relayed:relayed.length,mutations:mutations.length,bridgeErrors}));assert.equal(mutations.length,1);assert.equal(captchaIps[0],'198.51.100.30');assert.equal(relayed[0].headers.has('x-forwarded-for'),false);assert.equal(relayed[0].headers.has('x-real-ip'),false);
 assert.equal((await backend(relayed[0].clone())).status,409,'Captured server request cannot be replayed');assert.equal(mutations.length,1);
 const direct=new Request('https://project.test.invalid/functions/v1/community',{method:'POST',headers,body:payload});assert.equal((await backend(direct)).status,403,'Raw user headers cannot bypass gateway');
 const before=relayed.length;const blocked=await mf.dispatchFetch('https://proofwelllife.com/api/community',{method:'POST',headers:{...headers,'cf-worker':'untrusted-worker.invalid'},body:payload});assert.equal(blocked.status,403);assert.equal(relayed.length,before);
 console.log(JSON.stringify({runtime:'Cloudflare Pages compiled bundle in local workerd/Miniflare',crossRuntimeHmac:true,platformFixtureIpUsed:true,userForwardedHeadersStripped:true,directBackendBlocked:true,durableNonceBoundaryExercisedWithFixture:true,replayRejected:true,workerSubrequestRejected:true,externalNetwork:false,productionVerification:false},null,2));
} finally {await mf.dispose();}
