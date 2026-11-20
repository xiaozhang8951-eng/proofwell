import { BodyLimitError, gatewayHeaders, gatewaySecretValid, readBoundedBody, verifyGatewayRequest } from '../_shared/community-gateway.mjs';
const articlePattern = /^\/[a-z0-9-]+\/[a-z0-9-]+$/;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const actions = new Set(['poll','comment','feedback','question']);
const adminActions = new Set(['admin_list','admin_export','admin_moderate','admin_config']);
class HttpError extends Error { constructor(status,message) { super(message); this.status=status; } }
export function validateSubmission(action,payload) {
  if (!payload || typeof payload!=='object' || Array.isArray(payload) || payload.website) throw new HttpError(400,'Please check your submission.');
  const text=(key,min,max)=>typeof payload[key]==='string' && payload[key].trim().length>=min && payload[key].trim().length<=max && !/[<>\x00-\x08\x0b\x0c\x0e-\x1f]/.test(payload[key]);
  if (action==='poll' && (!uuidPattern.test(payload.pollId) || !/^[a-z0-9_-]{1,40}$/.test(payload.option))) throw new HttpError(400,'Select a valid poll option.');
  if (action==='feedback' && typeof payload.helpful!=='boolean') throw new HttpError(400,'Select a feedback response.');
  if (action==='comment' && (!text('nickname',2,40) || !text('body',10,3000))) throw new HttpError(400,'Use a 2–40 character nickname and 10–3000 character plain-text comment. HTML is not allowed.');
  if (action==='question' && !text('body',10,1000)) throw new HttpError(400,'Use a 10–1000 character plain-text question. HTML is not allowed.');
  if (typeof payload.body==='string' && (payload.body.match(/https?:\/\//gi)||[]).length>1) throw new HttpError(400,'Please do not submit multiple links or advertising.');
}
async function smallJson(request,buffer) {
  if (!request.headers.get('content-type')?.startsWith('application/json')) throw new HttpError(415,'Use JSON.');
  try { const body=JSON.parse(new TextDecoder().decode(buffer)); if (!body || typeof body!=='object' || Array.isArray(body)) throw new Error(); return body; } catch {throw new HttpError(400,'Invalid JSON.');}
}
export function createHandler({env,fetch:fetcher,now=()=>new Date()}) {
  return async request=> {
    const origin=request.headers.get('origin');
    const origins=(env('COMMUNITY_ALLOWED_ORIGINS')||'https://proofwelllife.com').split(',').map(x=>x.trim()).filter(Boolean);
    const headers={'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex, nofollow'};
    if (origin && origins.includes(origin)) headers['Access-Control-Allow-Origin']=origin;
    const response=(body,status=200)=>new Response(JSON.stringify(body),{status,headers});
    try {
      if (!origin || !origins.includes(origin)) throw new HttpError(403,'This origin is not allowed.');
      if (request.method==='OPTIONS') return new Response(null,{status:204,headers:{...headers,'Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'authorization, apikey, content-type','Access-Control-Max-Age':'600'}});
      if (!['GET','POST'].includes(request.method)) throw new HttpError(405,'Method not allowed.');
      const url=env('SUPABASE_URL');const service=env('SUPABASE_SERVICE_ROLE_KEY');
      if (env('COMMUNITY_ENABLED')!=='true' || !url || !service) throw new HttpError(503,'Community service is not enabled. No submission was saved.');
      const gatewaySecret=env('COMMUNITY_GATEWAY_SECRET');
      if(!gatewaySecretValid(gatewaySecret))throw new HttpError(503,'Community gateway is not configured.');
      if(!request.headers.has(gatewayHeaders.signature))throw new HttpError(403,'A verified community gateway request is required.');
      const raw=await readBoundedBody(request);
      const gateway=await verifyGatewayRequest(request,raw,gatewaySecret,now());
      if(!gateway)throw new HttpError(403,'Community gateway verification failed.');
      async function rpc(name,body) {
        const r=await fetcher(`${url}/rest/v1/rpc/${name}`,{method:'POST',headers:{apikey:service,Authorization:`Bearer ${service}`,'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(10000)});
        const value=await r.json();
        if (!r.ok) {
          const errors={RATE_LIMITED:[429,'Too many submissions. Please try again later.'],FORBIDDEN:[403,'Administrator access is required.'],ARTICLE_CLOSED:[409,'Discussion is not open for this article.'],POLL_CHANGED:[409,'This poll changed. Reload the conversation before voting.'],INVALID_INPUT:[400,'Please check your submission.'],NOT_FOUND:[404,'The requested item was not found.']};
          const mapped=errors[value.message];throw new HttpError(...(mapped||[503,'Community service is temporarily unavailable.']));
        }return value;
      }
      async function actor(required) {
        const authorization=request.headers.get('authorization');
        if (!authorization) {if(required)throw new HttpError(401,'A secure guest session is required.');return null;}
        if (!/^Bearer [\w.-]+$/.test(authorization)) throw new HttpError(401,'Your session could not be verified.');
        const r=await fetcher(`${url}/auth/v1/user`,{headers:{apikey:service,Authorization:authorization},signal:AbortSignal.timeout(10000)});
        if(!r.ok)throw new HttpError(401,'Your session expired or could not be verified. Please retry.');
        const user=await r.json();if(!uuidPattern.test(user.id))throw new HttpError(401,'Invalid session.');return user;
      }
      const requireTurnstile=env('COMMUNITY_REQUIRE_TURNSTILE')!=='false';
      if (!requireTurnstile) throw new HttpError(503,'Human verification must be enabled before launch.');
      if(request.method==='GET') {
        const query=new URL(request.url).searchParams;const article=query.get('article');const before=query.get('before');const beforeId=query.get('before_id');
        if(!articlePattern.test(article||'') || (before && (Number.isNaN(Date.parse(before)) || !uuidPattern.test(beforeId||''))) || (!before && beforeId))throw new HttpError(400,'Invalid article or comment cursor.');
        const user=await actor(false);
        return response({...await rpc('community_read',{p_article:article,p_actor:user?.id||null,p_before:before,p_before_id:beforeId}),requireTurnstile});
      }
      const body=await smallJson(request,raw);
      if (!actions.has(body.action) && !adminActions.has(body.action)) throw new HttpError(400,'Unknown interaction.');
      const user=await actor(true);
      if(adminActions.has(body.action)&&user.is_anonymous!==false)throw new HttpError(403,'Administrator access is required.');
      if(!adminActions.has(body.action)) {
        if(!articlePattern.test(body.article||'') || body.acknowledged!==true)throw new HttpError(400,'Check the article and submission notice.');
        validateSubmission(body.action,body.payload);
      }
      const consumed=await rpc('community_consume_gateway_nonce',{p_nonce:gateway.nonce});
      if(consumed.accepted!==true)throw new HttpError(409,'This gateway request has already been processed. Retry with a fresh request.');
      if(adminActions.has(body.action)) {
        return response(await rpc('community_admin',{p_actor:user.id,p_action:body.action,p_payload:body.payload||{}}));
      }
      // Only the IP authenticated by our Pages gateway is used. Raw forwarded
      // headers and the removed COMMUNITY_TRUST_PROXY_IP flag are never consulted.
      const ip=gateway.ip;
      if(requireTurnstile) {
        const secret=env('TURNSTILE_SECRET_KEY');if(!secret)throw new HttpError(503,'Human verification is not configured.');
        if(typeof body.turnstileToken!=='string' || body.turnstileToken.length<1 || body.turnstileToken.length>2048)throw new HttpError(400,'Complete human verification.');
        const check=await fetcher('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',body:new URLSearchParams({secret,response:body.turnstileToken,remoteip:ip}),signal:AbortSignal.timeout(10000)});
        const value=await check.json();if(!check.ok || !value.success || value.action!=='community_submit' || value.hostname!==new URL(origin).hostname)throw new HttpError(403,'Human verification failed or expired. Please retry.');
      }
      const key=env('COMMUNITY_IP_HASH_SECRET');if(!key || key.length<32)throw new HttpError(503,'Network abuse protection is not configured.');
      // Weekly rotating HMAC: cannot recover the IP with a public dictionary.
      const date=now();const week=Math.floor(date.getTime()/604800000);
      const cryptoKey=await crypto.subtle.importKey('raw',new TextEncoder().encode(key),{name:'HMAC',hash:'SHA-256'},false,['sign']);
      const hash=Array.from(new Uint8Array(await crypto.subtle.sign('HMAC',cryptoKey,new TextEncoder().encode(`${week}:${ip}`)))).map(x=>x.toString(16).padStart(2,'0')).join('');
      return response(await rpc('community_submit',{p_article:body.article,p_actor:user.id,p_ip_hash:hash,p_action:body.action,p_payload:body.payload}));
    }catch(error) {
      return response({error:error instanceof BodyLimitError?'Submission is too large.':error instanceof HttpError?error.message:'Community service is temporarily unavailable. No success has been confirmed.'},error instanceof BodyLimitError?413:error instanceof HttpError?error.status:503);
    }
  };
}
