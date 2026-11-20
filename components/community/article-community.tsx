'use client';
import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import type { CommunityConfig } from '@/lib/community/config';
import { installCommunityAnalyticsBridge } from '@/lib/community/analytics';
import styles from './community.module.css';
const Panel = dynamic(() => import('./community-panel'), { loading: () => <p role="status">Loading conversation…</p> });
export function ArticleCommunity({ article, config, published }: { article: string; config: CommunityConfig; published: boolean }) {
  const root = useRef<HTMLElement>(null);
  const [near, setNear] = useState(false);
  const enabled = process.env.NEXT_PUBLIC_COMMUNITY_ENABLED === 'true' && Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  useEffect(() => {
    if (enabled && published) installCommunityAnalyticsBridge();
    if (!root.current || !enabled || !published) return;
    const observer = new IntersectionObserver(entries => { if (entries.some(entry => entry.isIntersecting)) { setNear(true); observer.disconnect(); } }, { rootMargin: '300px' });
    observer.observe(root.current); return () => observer.disconnect();
  }, [enabled, published]);
  return <section ref={root} id="article-community" className={styles.community} aria-labelledby="community-title">
    <header><span className={styles.eyebrow}>THE READER CONVERSATION</span><h2 id="community-title">What Do You Think?</h2><p>We&apos;d love to hear your thoughts and experiences. Join the conversation!</p></header>
    {!published ? <p className={styles.notice}>Discussion opens when this article is published. This draft does not accept submissions.</p> : !enabled ? <p className={styles.notice}>Reader interactions are not available yet. No votes, comments or feedback are being collected here.</p> : near ? <Panel article={article} fallback={config}/> : <p role="status">The conversation loads as you approach this section.</p>}
    <noscript><p>JavaScript is needed to load and submit reader interactions. The article and references remain available without it.</p></noscript>
  </section>;
}
