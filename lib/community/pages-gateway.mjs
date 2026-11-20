import { BodyLimitError, gatewaySecretValid, normalizeIp, readBoundedBody, signGatewayRequest } from '../../supabase/functions/_shared/community-gateway.mjs';
const workerIp = normalizeIp('2a06:98c0:3600::103');
// This function is called only by Cloudflare's Pages runtime, not by a Next API route.
export function createPagesGateway({ fetch: upstreamFetch = globalThis.fetch, now = () => new Date() } = {}) {
  return async ({ request, env }) => {
    const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow', 'X-Content-Type-Options': 'nosniff' };
    const fail = (message, status) => Response.json({ error: message }, { status, headers });
    try {
      const url = new URL(request.url);
      if (url.pathname !== '/api/community' || url.search.length > 2048) return fail('Invalid community route.', 400);
      if (!['GET', 'POST', 'OPTIONS'].includes(request.method)) return fail('Method not allowed.', 405);
      const origins = (env.COMMUNITY_ALLOWED_ORIGINS || 'https://proofwelllife.com').split(',').map(value => value.trim()).filter(Boolean);
      // Same-origin GET normally has no Origin. Derive it from the trusted request URL.
      const origin = request.headers.get('origin') || (request.method === 'GET' ? url.origin : '');
      if (!origins.includes(url.origin) || origin !== url.origin) return fail('This origin is not allowed.', 403);
      if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: { ...headers, 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'authorization, apikey, content-type', Vary: 'Origin' } });
      if (env.COMMUNITY_ENABLED !== 'true' || !gatewaySecretValid(env.COMMUNITY_GATEWAY_SECRET)) return fail('Community gateway is not configured.', 503);
      // cf is a runtime property, not an HTTP header. Cloudflare overwrites the IP
      // on direct ingress. Worker subrequests and Pseudo IPv4 are not supported.
      if (!request.cf || typeof request.cf !== 'object' || request.headers.has('cf-worker') || request.headers.has('cf-connecting-ipv6')) return fail('A direct Cloudflare client request is required.', 403);
      const ip = normalizeIp(request.headers.get('cf-connecting-ip'));
      if (!ip || ip === workerIp || (ip.includes('.') && Number(ip.split('.')[0]) >= 240)) return fail('A trusted client network identity is unavailable.', 403);
      const project = new URL(env.NEXT_PUBLIC_SUPABASE_URL || '');
      if (project.protocol !== 'https:' || project.username || project.password || project.pathname !== '/' || project.search || project.hash) return fail('Community gateway is not configured.', 503);
      const target = new URL('/functions/v1/community', project); target.search = url.search;
      const bytes = await readBoundedBody(request);
      // Allowlist, never clone incoming headers: remove every client-supplied IP,
      // forwarding and signature header. Only credentials/content type survive.
      const forwarded = new Headers({ origin });
      for (const name of ['authorization', 'content-type']) {
        const value = request.headers.get(name); if (value) forwarded.set(name, value);
      }
      if (env.NEXT_PUBLIC_SUPABASE_ANON_KEY) forwarded.set('apikey', env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
      const unsigned = new Request(target, { method: request.method, headers: forwarded });
      for (const [name, value] of Object.entries(await signGatewayRequest(unsigned, bytes, env.COMMUNITY_GATEWAY_SECRET, ip, now()))) forwarded.set(name, value);
      const upstream = await upstreamFetch(target.href, { method: request.method, headers: forwarded, body: request.method === 'POST' ? bytes : undefined, redirect: 'manual', signal: AbortSignal.timeout(30000) });
      if (upstream.status >= 300 && upstream.status < 400) return fail('Community service is temporarily unavailable.', 502);
      if (!(upstream.headers.get('content-type') || '').includes('application/json')) return fail('Community service is temporarily unavailable.', 502);
      // Never forward signed headers, cookies, provider debug headers or raw IP.
      return new Response(upstream.body, { status: upstream.status, headers });
    } catch (error) {
      return fail(error instanceof BodyLimitError ? 'Submission is too large.' : 'Community service is temporarily unavailable. No success has been confirmed.', error instanceof BodyLimitError ? 413 : 503);
    }
  };
}
