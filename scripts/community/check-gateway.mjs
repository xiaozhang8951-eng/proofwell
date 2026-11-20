import test from 'node:test';
import assert from 'node:assert/strict';
import { createPagesGateway } from '../../lib/community/pages-gateway.mjs';
import { normalizeIp, readBoundedBody, signGatewayRequest, verifyGatewayRequest } from '../../supabase/functions/_shared/community-gateway.mjs';
const secret='isolated-p0-gateway-key-not-for-production';
const date=new Date('2026-11-19T00:00:00Z');
const env={COMMUNITY_ENABLED:'true',COMMUNITY_GATEWAY_SECRET:secret,NEXT_PUBLIC_SUPABASE_URL:'https://project.test.invalid',NEXT_PUBLIC_SUPABASE_ANON_KEY:'isolated-public-key',COMMUNITY_ALLOWED_ORIGINS:'https://proofwelllife.com'};
function ingress({ip='198.51.100.30',runtime=true,headers={},method='POST',body='{"action":"feedback"}',query=''}={}) {
  const request=new Request('https://proofwelllife.com/api/community'+query,{method,headers:{origin:'https://proofwelllife.com','content-type':'application/json','cf-connecting-ip':ip,...headers},body:method==='POST'?body:undefined});
  if(runtime)Object.defineProperty(request,'cf',{value:{colo:'LOCAL-TEST',asn:64500}});
  return request;
}
function fixture(overrides={}) {
  const calls=[];const proxy=createPagesGateway({now:()=>date,fetch:async(url,init)=>{calls.push({url,init});return Response.json({accepted:true},{headers:{'set-cookie':'never-forward','x-proofwell-gateway-signature':'never-forward','cf-connecting-ip':'never-forward'}});}});
  return {calls,proxy,run:request=>proxy({request,env:{...env,...overrides}})};
}
test('Plain HTTP client cannot manufacture the runtime cf property with headers/body',async()=>{const s=fixture();assert.equal((await s.run(ingress({runtime:false,headers:{cf:'{"colo":"fake"}','x-forwarded-for':'1.1.1.1'}}))).status,403);assert.equal(s.calls.length,0);});
test('Gateway discards untrusted forwarding and signature headers and signs only platform IP',async()=>{
  const s=fixture();const response=await s.run(ingress({headers:{'x-forwarded-for':'203.0.113.99','x-real-ip':'203.0.113.98','true-client-ip':'203.0.113.97','x-proofwell-gateway-ip':'203.0.113.96','x-proofwell-gateway-signature':'forged',authorization:'Bearer verified-in-backend'}}));assert.equal(response.status,200);
  const {url,init}=s.calls[0];const forwarded=new Request(url,init);const bytes=await readBoundedBody(forwarded);
  const verified=await verifyGatewayRequest(forwarded,bytes,secret,date);assert.equal(verified.ip,'198.51.100.30');
  for(const name of ['x-forwarded-for','x-real-ip','true-client-ip','cf-connecting-ip'])assert.equal(forwarded.headers.has(name),false);
  assert.equal(forwarded.headers.get('authorization'),'Bearer verified-in-backend');assert.equal(init.redirect,'manual');
  for(const name of ['set-cookie','x-proofwell-gateway-signature','cf-connecting-ip'])assert.equal(response.headers.has(name),false);
  assert.ok(!(await response.text()).includes('198.51.100.30'));
});
test('GET can derive same-origin identity without trusting Origin from another site',async()=>{let s=fixture();const req=ingress({method:'GET',query:'?article=/science/how-led-masks-work'});req.headers.delete('origin');assert.equal((await s.run(req)).status,200);assert.equal(new Headers(s.calls[0].init.headers).get('origin'),'https://proofwelllife.com');s=fixture();assert.equal((await s.run(ingress({headers:{origin:'https://evil.invalid'}}))).status,403);assert.equal(s.calls.length,0);});
test('Missing IP never falls back to a user-supplied forwarded header',async()=>{const s=fixture();const req=ingress({headers:{'x-forwarded-for':'198.51.100.30'}});req.headers.delete('cf-connecting-ip');assert.equal((await s.run(req)).status,403);assert.equal(s.calls.length,0);});
test('Worker, synthetic Worker IP and Pseudo IPv4 inputs are rejected',async()=>{for(const options of [{headers:{'cf-worker':'attacker.invalid'}},{ip:'2a06:98c0:3600::103'},{ip:'2A06:98C0:3600:0000:0000:0000:0000:0103'},{ip:'240.1.2.3'},{headers:{'cf-connecting-ipv6':'2001:db8::1'}}]){const s=fixture();assert.equal((await s.run(ingress(options))).status,403);assert.equal(s.calls.length,0);}});
test('IPv4 and IPv6 are strictly validated and equivalent spellings normalize',()=>{for(const value of ['198.51.100.300','01.2.3.4','198.51.100.1, 203.0.113.1','1.2.3.4:80',':::',':1:2:3:4:5:6:7','2001:db8::1%eth0','[2001:db8::1]','2001:db8::1::2'])assert.equal(normalizeIp(value),null,value);assert.equal(normalizeIp('2001:DB8::1'),normalizeIp('2001:0db8:0000:0000:0000:0000:0000:0001'));assert.equal(normalizeIp('::ffff:198.51.100.30'),'198.51.100.30');});
test('Real-shaped IPv6 platform input is normalized before it is signed',async()=>{const s=fixture();assert.equal((await s.run(ingress({ip:'2001:DB8::1234'}))).status,200);const req=new Request(s.calls[0].url,s.calls[0].init);assert.equal((await verifyGatewayRequest(req,await readBoundedBody(req),secret,date)).ip,'2001:0db8:0000:0000:0000:0000:0000:1234');});
test('Disabled/missing secret and malformed project config fail closed',async()=>{for(const override of [{COMMUNITY_ENABLED:'false'},{COMMUNITY_GATEWAY_SECRET:''},{NEXT_PUBLIC_SUPABASE_URL:'http://project.test.invalid'},{NEXT_PUBLIC_SUPABASE_URL:'https://project.test.invalid/other-path'}]){const s=fixture(override);assert.equal((await s.run(ingress())).status,503);assert.equal(s.calls.length,0);}});
test('Request body bound and allowed route/methods apply before forwarding',async()=>{const s=fixture();assert.equal((await s.run(ingress({body:'x'.repeat(10001)}))).status,413);assert.equal((await s.run(new Request('https://proofwelllife.com/api/other',{headers:{origin:'https://proofwelllife.com'}}))).status,400);assert.equal((await s.run(new Request('https://proofwelllife.com/api/community',{method:'PUT',headers:{origin:'https://proofwelllife.com'}}))).status,405);assert.equal(s.calls.length,0);});
test('Protocol binds body, token, origin, query, IP and method; native HMAC verification rejects tampering',async()=>{
 const raw=new TextEncoder().encode('{"action":"feedback"}');const original=new Request('https://project.test.invalid/functions/v1/community?article=a',{method:'POST',headers:{origin:'https://proofwelllife.com',authorization:'Bearer first','content-type':'application/json'}});const signed=await signGatewayRequest(original,raw,secret,'198.51.100.30',date);
 const headers=new Headers(original.headers);for(const [name,value]of Object.entries(signed))headers.set(name,value);
 const request=new Request(original.url,{method:'POST',headers});assert.ok(await verifyGatewayRequest(request,raw,secret,date));
 for(const [key,value] of [['origin','https://evil.invalid'],['authorization','Bearer second'],['content-type','text/plain'],['x-proofwell-gateway-ip','203.0.113.99'],['x-proofwell-gateway-time','1795046300'],['x-proofwell-gateway-nonce',crypto.randomUUID()],['x-proofwell-gateway-signature','0'.repeat(64)]]){const copy=new Headers(headers);copy.set(key,value);assert.equal(await verifyGatewayRequest(new Request(original.url,{method:'POST',headers:copy}),raw,secret,date),null,key);}
 assert.equal(await verifyGatewayRequest(request,new TextEncoder().encode('{}'),secret,date),null);
 assert.equal(await verifyGatewayRequest(new Request(original.url.replace('article=a','article=b'),{method:'POST',headers}),raw,secret,date),null);
 assert.equal(await verifyGatewayRequest(new Request(original.url,{method:'GET',headers}),raw,secret,date),null);
 assert.equal(await verifyGatewayRequest(request,raw,secret,new Date(date.getTime()+61000)),null);
 assert.equal(await verifyGatewayRequest(request,raw,secret,new Date(date.getTime()-61000)),null);
 assert.equal(await verifyGatewayRequest(request,raw,secret+'wrong',date),null);
 assert.ok(await verifyGatewayRequest(new Request(original.url.replace('/functions/v1/community','/community'),{method:'POST',headers}),raw,secret,date),'Explicit Supabase ingress prefix stripping alias');
 assert.equal(await verifyGatewayRequest(new Request(original.url.replace('/community','/other'),{method:'POST',headers}),raw,secret,date),null);
});

test('Upstream redirects are rejected without forwarding a Location or following credentials',async()=>{let calls=0;const proxy=createPagesGateway({now:()=>date,fetch:async(_url,init)=>{calls++;assert.equal(init.redirect,'manual');return new Response('redirect',{status:302,headers:{location:'https://untrusted.invalid','content-type':'application/json'}});}});const response=await proxy({request:ingress(),env});assert.equal(response.status,502);assert.equal(calls,1);assert.equal(response.headers.has('location'),false);});
