'use client';
import Script from 'next/script';
import { useEffect, useRef, useState } from 'react';
import styles from './community.module.css';
type TurnstileApi = { render: (element: HTMLElement, options: Record<string, unknown>) => string; remove: (id: string) => void };
declare global { interface Window { turnstile?: TurnstileApi } }
export function Turnstile({ reset, onToken, action = 'community_submit' }: { reset: number; onToken: (token: string) => void; action?: 'community_submit' | 'admin_login' }) {
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const key = process.env.NEXT_PUBLIC_COMMUNITY_TURNSTILE_SITE_KEY;
  useEffect(() => {
    if (!ready || !root.current || !window.turnstile || !key) return;
    const api = window.turnstile; let active = true;
    const publish = (token: string) => { if(active) onToken(token); };
    const id = api.render(root.current, { sitekey: key, action, size: 'flexible', callback: (token: string) => { if(!active)return; setFailed(false); publish(token); }, 'expired-callback': () => publish(''), 'error-callback': () => { if(!active)return; publish(''); setFailed(true); } });
    return () => { active = false; api.remove(id); onToken(''); };
  }, [ready, key, reset, onToken, action, retry]);
  if (!key) return <p className={styles.error}>Human verification is not configured. Submissions are unavailable.</p>;
  return <><Script id="proofwell-turnstile" src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="lazyOnload" onReady={() => setReady(true)} onError={() => setFailed(true)}/><div className={styles.turnstile} ref={root} aria-label="Human verification"/>{failed && <div><p className={styles.error}>Verification could not load. Check your connection and retry.</p><button type="button" className={styles.secondary} onClick={() => { onToken(''); if(!ready){window.location.reload();return;} setFailed(false);setRetry(value=>value+1); }}>Retry verification</button></div>}</>;
}
