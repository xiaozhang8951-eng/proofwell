'use client';
import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type { CommunityConfig } from '@/lib/community/config';
import type { CommunityState, SubmitAction } from '@/lib/community/types';
import { hasCommunitySession, startGuestSession, readCommunity, submitCommunity } from '@/lib/community/client';
import { trackCommunityInteraction } from '@/lib/community/analytics';
import { commentRemovalLink } from '@/lib/community/privacy';
import { Turnstile } from './turnstile';
import styles from './community.module.css';
const events = { poll: 'poll_vote', comment: 'comment_submit', feedback: 'article_feedback', question: 'question_submit' } as const;
const message = (error: unknown) => error instanceof Error ? error.message : 'Unable to connect. Please try again.';
export default function CommunityPanel({ article, fallback }: { article: string; fallback: CommunityConfig }) {
  const [data, setData] = useState<CommunityState | null>(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [consent, setConsent] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [token, setToken] = useState('');
  const [reset, setReset] = useState(0);
  const [trap, setTrap] = useState('');
  const [choice, setChoice] = useState('');
  const [nickname, setNickname] = useState('');
  const [comment, setComment] = useState('');
  const [question, setQuestion] = useState('');
  const load = useCallback(async () => {
    setError(''); setLoading(true); setToken(''); setReset(value => value + 1);
    try { setSessionReady(await hasCommunitySession()); const state = await readCommunity(article); setData(state); setChoice(state.poll?.selected || ''); }
    catch (error) { setError(message(error)); }
    finally { setLoading(false); }
  }, [article]);
  useEffect(() => { void load(); }, [load]);
  const onToken = useCallback((value: string) => setToken(value), []);
  const config = data?.config || fallback;
  const ready = Boolean(data?.enabled && sessionReady && consent && !busy && (!data.requireTurnstile || token));
  async function start() {
    setBusy(true); setError(''); setStatus('');
    try { await startGuestSession(token); setSessionReady(true); setStatus('Your guest session is ready. Complete a fresh verification before submitting; each token is single-use.'); }
    catch (error) { setError(message(error)); }
    finally { setBusy(false); setToken(''); setReset(value => value + 1); }
  }
  async function submit(action: SubmitAction, payload: Record<string, unknown>) {
    if (!ready) return;
    setBusy(true); setError(''); setStatus('');
    try {
      const result = await submitCommunity(article, action, { ...payload, website: trap }, token);
      if (result.accepted) {
        trackCommunityInteraction(events[action], article);
        setStatus(action === 'comment' ? 'Thank you. Your comment is pending moderation and is not public yet.' : action === 'question' ? 'Thank you. Your suggestion has been sent privately to the editorial queue.' : 'Thank you. Your response has been saved.');
        if (action === 'comment') { setComment(''); setNickname(''); }
        if (action === 'question') setQuestion('');
      } else setStatus('A response has already been recorded for this guest account.');
      try { setSessionReady(await hasCommunitySession()); const state = await readCommunity(article); setData(state); setChoice(state.poll?.selected || ''); }
      catch { setError('Your submission was processed, but the latest results could not load. Retry loading before submitting again.'); }
    } catch (error) { setError(message(error)); }
    finally { setBusy(false); setToken(''); setReset(value => value + 1); }
  }
  async function more() {
    if (!data?.nextCursor) return;
    setBusy(true); setError('');
    try { const next = await readCommunity(article, data.nextCursor); setData({ ...next, comments: [...data.comments, ...next.comments.filter(item => !data.comments.some(old => old.id === item.id))] }); }
    catch (error) { setError(message(error)); }
    finally { setBusy(false); }
  }
  function form(event: FormEvent, action: SubmitAction, payload: Record<string, unknown>) { event.preventDefault(); void submit(action, payload); }
  if (loading && !data) return <p role="status">Loading conversation…</p>;
  if (!data || !data.enabled) return <div><p className={styles.notice}>{error || 'Discussion is not open for this article. No submissions are being collected.'}</p><button className={styles.secondary} onClick={() => void load()} disabled={loading}>Retry loading</button></div>;
  return <>
    <p className={styles.privacy}>Comments are public only after moderation. Questions are private to the editorial team. Raw votes and helpfulness responses are kept for up to 90 days; after expiry you may respond again. Aggregate counts can include repeat participants across retention periods. Guest sessions help prevent repeat responses; they do not establish a unique person. Votes are informal reader feedback, not clinical evidence. <a href="/privacy-policy">Privacy Policy</a> · <a href="/terms">Terms</a> · <a href="/contact">Contact</a></p>
    <label className={styles.consent}><input type="checkbox" checked={consent} onChange={event => setConsent(event.target.checked)}/><span>I understand that my nickname and comment may be published after moderation. I will not submit personal medical information, contact details, advertising or abusive content.</span></label>
    <div className={styles.trap} aria-hidden="true"><label>Leave this field empty<input name="website" autoComplete="off" tabIndex={-1} value={trap} onChange={event => setTrap(event.target.value)}/></label></div>
    {(data.requireTurnstile || (!sessionReady && process.env.NEXT_PUBLIC_COMMUNITY_AUTH_CAPTCHA !== 'false')) && <Turnstile reset={reset} onToken={onToken}/>}
    {!sessionReady && <p><button disabled={!consent || busy || ((data.requireTurnstile || process.env.NEXT_PUBLIC_COMMUNITY_AUTH_CAPTCHA !== 'false') && !token)} onClick={() => void start()}>Start a secure guest session</button> No email or account registration needed.</p>}
    <div className={styles.status} role="status" aria-live="polite">{status}</div>
    {error && <div role="alert"><p className={styles.error}>{error}</p><button className={styles.secondary} onClick={() => void load()} disabled={busy}>Retry loading</button></div>}
    <div className={styles.grid}>
      <section className={styles.card} aria-labelledby="consumer-poll-title"><h3 id="consumer-poll-title">Consumer Poll</h3>{data.poll ? <>
        <form onSubmit={event => form(event, 'poll', { pollId: data.poll!.id, option: choice })}><fieldset disabled={!ready || Boolean(data.poll.selected)}><legend>{config.question}</legend>{data.poll.options.map(option => <label className={styles.option} key={option.id}><input type="radio" name="consumer-poll" value={option.id} checked={choice === option.id} onChange={event => setChoice(event.target.value)}/>{option.label}</label>)}</fieldset><button type="submit" disabled={!ready || !choice || Boolean(data.poll.selected)}>{data.poll.selected ? 'Vote recorded' : 'Submit vote'}</button></form>
        <p>{data.poll.total} total {data.poll.total === 1 ? 'vote' : 'votes'}</p>
        <ul className={styles.results} aria-label="Poll results">{data.poll.options.map(option => { const percent = data.poll!.total ? Math.round(option.count / data.poll!.total * 100) : 0; return <li key={option.id}>{option.label}: {option.count} ({percent}%)<span className={styles.bar} aria-hidden="true"><span style={{width:`${percent}%`}}/></span></li>; })}</ul>
        {!data.poll.total && <p className={styles.empty}>No votes have been recorded for this poll.</p>}<p>One response per guest account for this poll within the 90-day retention period. Totals count responses, not unique people. Clearing your session or changing devices is not a reliable way to establish a different person; server limits also apply.</p>
      </> : <p>No poll is currently open for this article.</p>}</section>
      <section className={styles.card} aria-labelledby="article-feedback-title"><h3 id="article-feedback-title">Was This Article Helpful?</h3><div className={styles.feedback}><button disabled={!ready || data.feedback.selected !== null} onClick={() => void submit('feedback', { helpful: true })}>Yes, helpful</button><button className={styles.secondary} disabled={!ready || data.feedback.selected !== null} onClick={() => void submit('feedback', { helpful: false })}>Needs improvement</button></div>{data.feedback.total ? <p>{Math.round(data.feedback.helpful / data.feedback.total * 100)}% found this helpful · {data.feedback.total} {data.feedback.total === 1 ? 'response' : 'responses'}</p> : <p>No helpfulness feedback yet.</p>}{data.feedback.selected !== null && <p>Your feedback is recorded. Thank you.</p>}</section>
      <section className={`${styles.card} ${styles.wide}`} aria-labelledby="share-experience-title"><h3 id="share-experience-title">Share Your Experience</h3><p>{config.discussionPrompt}</p><form onSubmit={event => form(event, 'comment', { nickname, body: comment })}><label htmlFor="community-nickname">Nickname (public after approval)</label><input id="community-nickname" name="nickname" value={nickname} onChange={event => setNickname(event.target.value)} minLength={2} maxLength={40} required autoComplete="off" disabled={busy}/><label htmlFor="community-comment">Your experience or question</label><textarea id="community-comment" name="comment" value={comment} onChange={event => setComment(event.target.value)} minLength={10} maxLength={3000} required disabled={busy}/><button disabled={!ready} type="submit">Submit for moderation</button></form><p>Plain text only. No HTML, scripts, advertising or medical advice. For pending-comment or personal-data deletion requests, contact proofwelllife@gmail.com; do not send passwords or session tokens. Moderators may decline, hide or remove submissions.</p><h3>Reader comments</h3>{data.comments.length ? data.comments.map(item => <article className={styles.comment} key={item.id}><strong>{item.nickname}</strong><time dateTime={item.created_at}>{new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(item.created_at))} (UTC)</time><p>{item.body}</p><a href={commentRemovalLink(article, item.id)}>Request removal of this comment</a></article>) : <p className={styles.empty}>No approved comments yet.</p>}{data.nextCursor && <button className={styles.secondary} disabled={busy} onClick={() => void more()}>Load more comments</button>}</section>
      <section className={`${styles.card} ${styles.wide}`} aria-labelledby="next-topic-title"><h3 id="next-topic-title">{config.nextQuestion}</h3><p>Send a question or a topic you would like us to research. Suggestions go to the editorial team for review and are not published automatically.</p><form onSubmit={event => form(event, 'question', { body: question })}><label htmlFor="community-question">Your question or suggestion</label><textarea id="community-question" value={question} onChange={event => setQuestion(event.target.value)} minLength={10} maxLength={1000} required disabled={busy}/><button disabled={!ready} type="submit">Send suggestion privately</button></form></section>
    </div>
  </>;
}
