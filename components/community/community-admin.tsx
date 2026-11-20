'use client';
import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { communityRequest, configured, csv, supabaseClient } from '@/lib/community/client';
import type { AdminData } from '@/lib/community/types';
import styles from './community.module.css';
import { Turnstile } from './turnstile';
const errorText = (error: unknown) => error instanceof Error ? error.message : 'Request failed.';
const string = (value: unknown) => String(value ?? '');
function ConfigEditor({ article, onSaved }: { article: Record<string, unknown>; onSaved: () => Promise<void> }) {
  const poll = article.poll as { question?: string; options?: {id:string;label:string}[] } | null;
  const [question, setQuestion] = useState(poll?.question || 'What matters most to you about this topic?');
  const [options, setOptions] = useState(poll?.options?.map(item => `${item.id} | ${item.label}`).join('\n') || 'learning | Learning the basics\nexperience | Sharing experience');
  const [discussion, setDiscussion] = useState(string(article.discussion_prompt));
  const [next, setNext] = useState(string(article.next_question));
  const [enabled, setEnabled] = useState(Boolean(article.enabled));
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  async function save(event: FormEvent) {
    event.preventDefault(); setBusy(true); setStatus('');
    try {
      const parsed = options.split('\n').filter(line => line.trim()).map(line => { const separator = line.indexOf('|'); if(separator<1) throw new Error('Use id | label on each option line.'); return {id:line.slice(0,separator).trim(),label:line.slice(separator+1).trim()}; });
      if (parsed.length<2 || parsed.length>6 || new Set(parsed.map(option=>option.id)).size!==parsed.length) throw new Error('Use 2–6 options with distinct IDs.');
      const changed = question !== poll?.question || JSON.stringify(parsed)!==JSON.stringify(poll?.options);
      if (changed && !window.confirm('This creates a new poll version with zero votes. Existing votes remain in poll history. Continue?')) return;
      await communityRequest({action:'admin_config',payload:{article:article.article_key,enabled,question,options:parsed,discussionPrompt:discussion,nextQuestion:next}});
      setStatus('Settings saved.'); await onSaved();
    } catch(error) {setStatus(errorText(error));} finally {setBusy(false);}
  }
  return <details><summary>Edit discussion and poll settings</summary><p>Changing poll wording or options creates a new version. Previous votes are retained in history, never relabeled or transferred. Opening a draft here does not publish its article.</p><form onSubmit={event=>void save(event)}><label><input type="checkbox" checked={enabled} onChange={event=>setEnabled(event.target.checked)} style={{width:20}}/> Accept interactions for this article</label><label>Poll question<input value={question} onChange={event=>setQuestion(event.target.value)} minLength={10} maxLength={250} required/></label><label>Options: one id | label per line<textarea value={options} onChange={event=>setOptions(event.target.value)} required/></label><label>Discussion prompt<textarea value={discussion} onChange={event=>setDiscussion(event.target.value)} minLength={10} maxLength={1000} required/></label><label>Next-topic prompt<input value={next} onChange={event=>setNext(event.target.value)} minLength={10} maxLength={250} required/></label><button disabled={busy}>Save settings</button><p role="status">{status}</p></form></details>;
}
export default function CommunityAdmin() {
  const [email,setEmail]=useState('');const [password,setPassword]=useState('');const [signedIn,setSignedIn]=useState(false);
  const [data,setData]=useState<AdminData|null>(null);const [article,setArticle]=useState('');const [statusFilter,setStatusFilter]=useState('');const [offset,setOffset]=useState(0);
  const [message,setMessage]=useState('');const [busy,setBusy]=useState(false);
  const [captchaToken,setCaptchaToken]=useState('');const [captchaReset,setCaptchaReset]=useState(0);
  const onCaptchaToken=useCallback((value:string)=>setCaptchaToken(value),[]);
  useEffect(()=>{if(!configured())return;const client=supabaseClient();void client.auth.getSession().then(({data})=>setSignedIn(Boolean(data.session && !data.session.user.is_anonymous)));const {data:{subscription}}=client.auth.onAuthStateChange((_event,session)=>{setSignedIn(Boolean(session && !session.user.is_anonymous));if(!session)setData(null);});return()=>subscription.unsubscribe();},[]);
  async function load(page=0) {
    setBusy(true);setMessage('');
    try {setData(await communityRequest({action:'admin_list',payload:{article,status:statusFilter,offset:page}}));setOffset(page);}
    catch(error){setData(null);setMessage(errorText(error));}finally{setBusy(false);}
  }
  async function login(event:FormEvent) {
    event.preventDefault();if(!captchaToken||busy){setMessage('Complete human verification before signing in.');return;}setBusy(true);setMessage('');
    try {const {error}=await supabaseClient().auth.signInWithPassword({email,password,options:{captchaToken}});setPassword('');if(error)throw new Error('Sign-in or verification failed. Complete a new verification and check your credentials.');setSignedIn(true);await load();}
    catch(error){setMessage(errorText(error));}finally{setBusy(false);setCaptchaToken('');setCaptchaReset(value=>value+1);}
  }
  async function moderate(kind:string,id:unknown,status:string) {
    if(status==='delete'&&!window.confirm('Permanently delete this submission? This cannot be undone.'))return;
    setBusy(true);setMessage('');
    try {await communityRequest({action:'admin_moderate',payload:{kind,id,status}});await load(offset);}
    catch(error){setMessage(errorText(error));}finally{setBusy(false);}
  }
  async function exportData() {
    setBusy(true);setMessage('Preparing an authenticated export…');
    try {
      const comments:Record<string,unknown>[]=[];const questions:Record<string,unknown>[]=[];let articles:Record<string,unknown>[]=[];let next:number|null=0;
      while(next!==null) {if(next>=100000)throw new Error('Export exceeds 100,000 records. Use an operator SQL export instead.');const page:AdminData=await communityRequest({action:'admin_export',payload:{article,status:statusFilter,offset:next}});articles=page.articles;comments.push(...page.comments);questions.push(...page.questions);next=page.nextOffset;}
      for(const [name,rows] of [['articles',articles],['comments',comments],['questions',questions]] as const) {
        const url=URL.createObjectURL(new Blob(['\uFEFF'+csv(rows)],{type:'text/csv;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download=`proofwell-${name}-${new Date().toISOString().slice(0,10)}.csv`;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
      }
      setMessage(`Exported ${articles.length} article summaries, ${comments.length} comments and ${questions.length} private suggestions. Handle these files as personal data.`);
    }catch(error){setMessage(errorText(error));}finally{setBusy(false);}
  }
  return <div className={styles.admin}><h1>Community administration</h1><p>Authorized editorial staff only. Access is enforced by the backend allowlist, not by hiding this page. No service-role key is used in this interface.</p>
    {!configured()?<p role="status">Community service is not configured. No data is available.</p>:!signedIn?<form onSubmit={event=>void login(event)}><label>Email<input type="email" value={email} onChange={event=>setEmail(event.target.value)} required autoComplete="username"/></label><label>Password<input type="password" value={password} onChange={event=>setPassword(event.target.value)} required autoComplete="current-password"/></label><Turnstile action="admin_login" reset={captchaReset} onToken={onCaptchaToken}/><button disabled={busy||!captchaToken}>Sign in</button></form>:<><nav aria-label="Administration actions"><button className={styles.secondary} disabled={busy} onClick={()=>void supabaseClient().auth.signOut().then(()=>{setData(null);setSignedIn(false);})}>Sign out</button><button disabled={busy} onClick={()=>void exportData()}>Export filtered data (CSV)</button></nav><form className={styles.toolbar} onSubmit={event=>{event.preventDefault();void load();}}><label>Article path (blank for all)<input value={article} onChange={event=>setArticle(event.target.value)} placeholder="/science/how-led-masks-work"/></label><label>Moderation status<select value={statusFilter} onChange={event=>setStatusFilter(event.target.value)}><option value="">All statuses</option>{['pending','approved','reviewed','hidden'].map(value=><option key={value}>{value}</option>)}</select></label><button disabled={busy}>Load records</button></form>
      {data&&<><h2>Article totals and polls</h2>{data.articles.map(item=><section key={string(item.article_key)}><h3>{string(item.title)}</h3><p>{string(item.article_key)} · {item.enabled?'Open':'Closed'}</p><p>{string(item.votes)} current-poll votes · {string(item.feedback_total)} helpfulness responses · {Number(item.feedback_total)?Math.round(Number(item.helpful)/Number(item.feedback_total)*100)+'% helpful':'No helpfulness data'}</p><p>{string(item.pending_comments)} pending comments · {string(item.pending_questions)} pending suggestions</p><pre>{JSON.stringify(item.poll_results,null,2)}</pre><details><summary>Poll history</summary><pre>{JSON.stringify(item.poll_history,null,2)}</pre></details><ConfigEditor key={`${item.article_key}-${(item.poll as {id?:string}|null)?.id}`} article={item} onSaved={()=>load(offset)}/></section>)}
      <h2>Comments</h2>{!data.comments.length&&<p>No matching comments.</p>}{data.comments.map(item=><section key={string(item.id)}><p><strong>{string(item.nickname)}</strong> · {string(item.status)} · <time>{string(item.created_at)}</time></p><p>{string(item.article_key)}</p><p style={{whiteSpace:'pre-wrap'}}>{string(item.body)}</p>{['approved','hidden','pending','delete'].map(value=><button disabled={busy} className={value==='delete'?styles.secondary:undefined} onClick={()=>void moderate('comment',item.id,value)} key={value}>{value==='approved'?'Approve':value==='hidden'?'Hide':value==='pending'?'Return to pending':'Delete'}</button>)}</section>)}
      <h2>Private questions and suggestions</h2>{!data.questions.length&&<p>No matching suggestions.</p>}{data.questions.map(item=><section key={string(item.id)}><p>{string(item.article_key)} · {string(item.status)} · {string(item.created_at)}</p><p style={{whiteSpace:'pre-wrap'}}>{string(item.body)}</p>{['reviewed','hidden','pending','delete'].map(value=><button disabled={busy} onClick={()=>void moderate('question',item.id,value)} key={value}>{value==='reviewed'?'Mark reviewed':value==='hidden'?'Hide':value==='pending'?'Return to pending':'Delete'}</button>)}</section>)}<nav aria-label="Moderation pagination"><button className={styles.secondary} disabled={busy||offset===0} onClick={()=>void load(Math.max(0,offset-25))}>Previous page</button><span>Page {Math.floor(offset/25)+1}</span><button className={styles.secondary} disabled={busy||data.nextOffset===null} onClick={()=>void load(data.nextOffset!)}>Next page</button></nav></>}
    </>}<p role="status" className={styles.status}>{message}</p></div>;
}
