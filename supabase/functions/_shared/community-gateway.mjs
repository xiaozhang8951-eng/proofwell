// Shared server-only protocol. No Node APIs; runs in Cloudflare and Deno.
export const gatewayHeaders = {
  ip: 'x-proofwell-gateway-ip', time: 'x-proofwell-gateway-time',
  nonce: 'x-proofwell-gateway-nonce', signature: 'x-proofwell-gateway-signature',
};
export class BodyLimitError extends Error {}
export async function readBoundedBody(request, max = 10000) {
  if (Number(request.headers.get('content-length') || 0) > max) throw new BodyLimitError('Submission is too large.');
  if (!request.body) return new Uint8Array();
  const reader = request.body.getReader(); const chunks = []; let size = 0;
  for (;;) {
    const { value, done } = await reader.read(); if (done) break;
    size += value.length;
    if (size > max) { void reader.cancel(); throw new BodyLimitError('Submission is too large.'); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const value of chunks) { bytes.set(value, offset); offset += value.length; }
  return bytes;
}
function ipv4(value) {
  const parts = value.split('.');
  if (parts.length !== 4 || parts.some(part => !/^(0|[1-9][0-9]{0,2})$/.test(part) || Number(part) > 255)) return null;
  return parts.map(Number).join('.');
}
export function normalizeIp(input) {
  if (typeof input !== 'string' || !input || input.length > 64 || input !== input.trim()) return null;
  if (!input.includes(':')) return ipv4(input);
  if (!/^[0-9a-f:.]+$/i.test(input)) return null;
  let value = input.toLowerCase();
  if (value.includes('.')) {
    const end = value.lastIndexOf(':'); const v4 = ipv4(value.slice(end + 1));
    if (!v4) return null;
    const parts = v4.split('.').map(Number);
    value = value.slice(0, end + 1) + ((parts[0] << 8) | parts[1]).toString(16) + ':' + ((parts[2] << 8) | parts[3]).toString(16);
  }
  const sides = value.split('::'); if (sides.length > 2) return null;
  const left = sides[0] ? sides[0].split(':') : [];
  const right = sides.length === 2 && sides[1] ? sides[1].split(':') : [];
  if ([...left, ...right].some(part => !/^[a-f0-9]{1,4}$/.test(part))) return null;
  if (sides.length === 1 && left.length !== 8) return null;
  if (sides.length === 2 && left.length + right.length >= 8) return null;
  const words = [...left, ...Array(sides.length === 2 ? 8 - left.length - right.length : 0).fill('0'), ...right].map(part => parseInt(part, 16));
  if (words.length !== 8) return null;
  // IPv4-mapped IPv6 must use the same rate bucket as that IPv4 address.
  if (words.slice(0, 5).every(word => word === 0) && words[5] === 0xffff)
    return `${words[6] >> 8}.${words[6] & 255}.${words[7] >> 8}.${words[7] & 255}`;
  return words.map(word => word.toString(16).padStart(4, '0')).join(':');
}
export function gatewaySecretValid(secret) { return typeof secret === 'string' && secret.length >= 32; }
const encoder = new TextEncoder();
const hex = bytes => Array.from(new Uint8Array(bytes), value => value.toString(16).padStart(2, '0')).join('');
async function frame(request, bytes, ip, time, nonce) {
  const url = new URL(request.url);
  return encoder.encode(JSON.stringify([
    'proofwell-community-gateway-v1', request.method, '/functions/v1/community' + url.search,
    request.headers.get('origin') || '', ip, time, nonce,
    hex(await crypto.subtle.digest('SHA-256', encoder.encode(request.headers.get('authorization') || ''))),
    hex(await crypto.subtle.digest('SHA-256', encoder.encode(request.headers.get('content-type') || ''))),
    hex(await crypto.subtle.digest('SHA-256', bytes)),
  ]));
}
async function key(secret, use) {
  return crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [use]);
}
export async function signGatewayRequest(request, bytes, secret, ip, date = new Date()) {
  if (!gatewaySecretValid(secret) || normalizeIp(ip) !== ip) throw new Error('Invalid server gateway configuration.');
  const time = String(Math.floor(date.getTime() / 1000)); const nonce = crypto.randomUUID();
  const signature = hex(await crypto.subtle.sign('HMAC', await key(secret, 'sign'), await frame(request, bytes, ip, time, nonce)));
  return { [gatewayHeaders.ip]: ip, [gatewayHeaders.time]: time, [gatewayHeaders.nonce]: nonce, [gatewayHeaders.signature]: signature };
}
export async function verifyGatewayRequest(request, bytes, secret, date = new Date()) {
  if (!gatewaySecretValid(secret)) return null;
  const ip = request.headers.get(gatewayHeaders.ip); const time = request.headers.get(gatewayHeaders.time);
  const nonce = request.headers.get(gatewayHeaders.nonce); const signature = request.headers.get(gatewayHeaders.signature);
  if (!ip || normalizeIp(ip) !== ip || !/^\d{10,12}$/.test(time || '') || !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(nonce || '') || !/^[a-f0-9]{64}$/.test(signature || '')) return null;
  if (Math.abs(Math.floor(date.getTime() / 1000) - Number(time)) > 60) return null;
  // Supabase's ingress may strip the /functions/v1 prefix. Both aliases name
  // this single function; the signed logical target and query remain fixed.
  if (!['/functions/v1/community', '/community'].includes(new URL(request.url).pathname)) return null;
  const valid = await crypto.subtle.verify('HMAC', await key(secret, 'verify'), new Uint8Array(signature.match(/../g).map(pair => parseInt(pair, 16))), await frame(request, bytes, ip, time, nonce));
  return valid ? { ip, nonce } : null;
}
