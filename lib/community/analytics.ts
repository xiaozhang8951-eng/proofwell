'use client';
// This bridge controls ONLY the four Community events. It is not a site-wide CMP.
const events = new Set(['poll_vote', 'comment_submit', 'article_feedback', 'question_submit']);
export type CommunityEvent = 'poll_vote' | 'comment_submit' | 'article_feedback' | 'question_submit';
type Consent = 'unknown' | 'granted' | 'denied';
type Bridge = { version: 1; setConsent(value: unknown): void; getConsent(): Consent };
declare global { interface Window { ProofWellCommunityAnalytics?: Bridge } }
let consent: Consent = 'unknown';
let bridge: Bridge | undefined;
export function installCommunityAnalyticsBridge() {
  if (typeof window === 'undefined') return;
  if (!bridge) bridge = Object.freeze({
    version: 1 as const,
    setConsent(value: unknown) { consent = value === 'granted' ? 'granted' : 'denied'; },
    getConsent() { return consent; },
  });
  if (window.ProofWellCommunityAnalytics !== bridge) {
    window.ProofWellCommunityAnalytics = bridge;
    // The approved CMP must synchronize its current choice on this event AND on changes.
    window.dispatchEvent(new Event('proofwell:community-analytics-ready'));
  }
}
export function trackCommunityInteraction(event: CommunityEvent, article: string): boolean {
  if (typeof window === 'undefined' || process.env.NEXT_PUBLIC_COMMUNITY_ANALYTICS_ENABLED !== 'true' || consent !== 'granted') return false;
  if (!events.has(event) || !/^\/[a-z0-9-]+\/[a-z0-9-]+$/.test(article) || article.length > 250) return false;
  const target = window as unknown as { dataLayer?: Record<string, unknown>[] };
  // Do not queue denied events, replay past actions, read form fields or install Google tags.
  try {
    if (target.dataLayer !== undefined && !Array.isArray(target.dataLayer)) return false;
    (target.dataLayer ??= []).push({ event, article_slug: article.split('/').at(-1), interaction_type: event });
    return true;
  } catch { return false; } // Optional analytics must not make a saved submission appear to fail.
}
