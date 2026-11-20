'use client';
import { createClient } from '@supabase/supabase-js';
import type { CommunityState, SubmitAction } from './types';
export const configured = () => process.env.NEXT_PUBLIC_COMMUNITY_ENABLED === 'true' && Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
let client: ReturnType<typeof createClient> | undefined;
export function supabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Community service is not configured.');
  // Session persistence is convenience, not authentication: the server verifies every JWT.
  return client ??= createClient(url, key, { auth: { storageKey: 'proofwell-community-session', detectSessionInUrl: false } });
}
export async function hasCommunitySession() {
  const { data: { session }, error } = await supabaseClient().auth.getSession();
  if (error) throw new Error('Your session could not be restored. Please try again.');
  return Boolean(session);
}
export async function startGuestSession(captchaToken?: string) {
  if (await hasCommunitySession()) return;
  const captchaRequired = process.env.NEXT_PUBLIC_COMMUNITY_AUTH_CAPTCHA !== 'false';
  if (captchaRequired && !captchaToken) throw new Error('Complete human verification to start a guest session.');
  const result = await supabaseClient().auth.signInAnonymously({ options: { captchaToken: captchaRequired ? captchaToken : undefined } });
  if (result.error || !result.data.session) throw new Error('A secure guest session could not be created. Check verification or try again later.');
}
async function token() {
  const { data: { session }, error } = await supabaseClient().auth.getSession();
  if (error) throw new Error('Your session could not be restored. Please try again.');
  return session?.access_token || null;
}
export async function communityRequest(body?: Record<string, unknown>, query?: URLSearchParams) {
  const access = await token();
  const response = await fetch(`/api/community${query ? `?${query}` : ''}`, {
    method: body ? 'POST' : 'GET', headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, ...(access ? { Authorization: `Bearer ${access}` } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined, cache: 'no-store', signal: AbortSignal.timeout(40000),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Community service is unavailable. Please try again later.');
  return result;
}
export async function readCommunity(article: string, cursor?: { created_at: string; id: string }): Promise<CommunityState> {
  return communityRequest(undefined, new URLSearchParams({ article, ...(cursor ? { before: cursor.created_at, before_id: cursor.id } : {}) }));
}
export async function submitCommunity(article: string, action: SubmitAction, payload: Record<string, unknown>, turnstileToken?: string) {
  if (!await hasCommunitySession()) throw new Error('Start a secure guest session before submitting.');
  return communityRequest({ article, action, payload, turnstileToken, acknowledged: true });
}
// GTM remains the sole Google installation. No form values, user IDs or option text.
export function interactionEvent(event: 'poll_vote' | 'comment_submit' | 'article_feedback' | 'question_submit', article: string) {
  const w = window as unknown as { dataLayer?: Record<string, unknown>[] };
  (w.dataLayer ??= []).push({ event, article_slug: article.split('/').at(-1), interaction_type: event });
}
export function csv(rows: Record<string, unknown>[]) {
  const fields = [...new Set(rows.flatMap(row => Object.keys(row)))];
  const cell = (value: unknown) => {
    let text = typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value ?? '');
    if (/^[\s]*[=+\-@\t\r]/.test(text)) text = `'${text}`; // spreadsheet formula injection
    return `"${text.replaceAll('"', '""')}"`;
  };
  return [fields.map(cell).join(','), ...rows.map(row => fields.map(key => cell(row[key])).join(','))].join('\r\n');
}
