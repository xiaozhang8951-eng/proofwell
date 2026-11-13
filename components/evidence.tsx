import type { ReactNode } from 'react';
import type { EvidenceLevelName, Reference, EvidenceSnapshotData, FaqItem } from '@/lib/editorial';
import { doiUrl, sourceUrl } from '@/lib/editorial';
export function EvidenceLevel({level}:{level:EvidenceLevelName}) {return <span className="evidence-level">{level}</span>}
export function EvidenceBox({title='Evidence in context',children}:{title?:string;children:ReactNode}) {return <aside className="evidence-box"><span className="eyebrow">PROOFWELL NOTES</span><h3>{title}</h3>{children}</aside>}
export function StudySummary({children}:{children:ReactNode}) {return <EvidenceBox title="Study summary">{children}</EvidenceBox>}
export function ClaimCheck({claim,children}:{claim:string;children:ReactNode}) {return <EvidenceBox title={claim}>{children}</EvidenceBox>}
export function SpecificationTable({rows}:{rows:string[][]}) {return <div className="table-scroll" tabIndex={0} role="region" aria-label="Product specifications"><table><thead><tr><th>Specification</th><th>Details</th></tr></thead><tbody>{rows.map((r,i)=><tr key={i}>{r.map((v,j)=>j===0?<th scope="row" key={j}>{v}</th>:<td key={j}>{v}</td>)}</tr>)}</tbody></table></div>}
export function ComparisonTable({headers,rows}:{headers:string[];rows:string[][]}) {return <div className="table-scroll" tabIndex={0} role="region" aria-label="Product comparison"><table><thead><tr>{headers.map(h=><th key={h} scope="col">{h}</th>)}</tr></thead><tbody>{rows.map((r,i)=><tr key={i}>{r.map((v,j)=>j===0?<th scope="row" key={j}>{v}</th>:<td key={j}>{v}</td>)}</tr>)}</tbody></table></div>}
export function ProductVerdict({children}:{children:ReactNode}) {return <EvidenceBox title="The ProofWell verdict">{children}</EvidenceBox>}
export function ProsCons({pros,cons}:{pros:string[];cons:string[]}) {return <div className="pros-cons"><div><h3>What we like</h3><ul>{pros.map(p=><li key={p}>{p}</li>)}</ul></div><div><h3>What we would change</h3><ul>{cons.map(p=><li key={p}>{p}</li>)}</ul></div></div>}
export function ReferenceList({items=['[Verified reference required]']}:{items?:(string|Reference)[]}) {
 return <ol className="references">{items.map((item,i)=>{
  if(typeof item==='string')return <li key={i}>{item}</li>;
  const doi=doiUrl(item.doi);const url=sourceUrl(item.url);const pubmed=sourceUrl(item.pubmedUrl);const pubmedUrl=pubmed&&new URL(pubmed).hostname==='pubmed.ncbi.nlm.nih.gov'?pubmed:undefined;
  return <li key={i} id={`reference-${i+1}`}><span>{item.authors?.length ? `${item.authors.join(', ')}. ` : ''}{item.title || item.citation || '[Verified reference required]'}{item.journal ? ` ${item.journal}.` : ''}{item.year ? ` ${item.year}.` : ''}</span>{doi&&<> <a href={doi}>DOI: {item.doi?.replace(/^https?:\/\/(?:dx\.)?doi\.org\//i,'')}</a></>}{pubmedUrl&&<> <a href={pubmedUrl}>PubMed</a></>}{url&&<> <a href={url}>View source</a></>}</li>;
 })}</ol>;
}
export function AffiliateDisclosure({compact=false}:{compact?:boolean}) {return <aside className={`disclosure${compact?' disclosure-compact':''}`}><strong>Disclosure:</strong> ProofWell may earn a commission when readers purchase through certain links. This does not affect our editorial conclusions. <a href="/affiliate-disclosure">Read our affiliate disclosure.</a></aside>}
// Use only after the owner supplies a real, approved commercial destination.
export function CommercialLink({href,children,target,disclosure}:{href?:string;children:ReactNode;target?:'_blank';disclosure?:string}) {
 const url=sourceUrl(href);if(!url)return null;
 return <div className="commercial-reference">{disclosure?<aside className="disclosure disclosure-compact">{disclosure} <a href="/affiliate-disclosure">Read our affiliate disclosure.</a></aside>:<AffiliateDisclosure compact/>}<a href={url} rel="sponsored nofollow noopener" target={target}>{children}</a></div>;
}
export function Limitations({items}:{items:string[]}) {return <EvidenceBox title="Limitations & uncertainty"><ul>{items.map(item=><li key={item}>{item}</li>)}</ul></EvidenceBox>}
export function EvidenceSeparation({claims,evidence}:{claims?:string[];evidence?:string[]}) {return <div className="pros-cons evidence-separation"><section><h3>Manufacturer claims</h3>{claims?.length?<ul>{claims.map(c=><li key={c}>{c}</li>)}</ul>:<p>Claims have not yet been documented and verified.</p>}</section><section><h3>Scientific evidence</h3>{evidence?.length?<ul>{evidence.map(c=><li key={c}>{c}</li>)}</ul>:<p>Supporting research has not yet been assessed.</p>}</section></div>}

export function KeyTakeaways({items}:{items:string[]}) {return <EvidenceBox title="Key takeaways"><ul>{items.map(i=><li key={i}>{i}</li>)}</ul></EvidenceBox>}
export function IngredientEvidence({children}:{children:ReactNode}) {return <EvidenceBox title="Ingredient evidence">{children}</EvidenceBox>}
export function SupplementEvidence({children}:{children:ReactNode}) {return <EvidenceBox title="Supplement evidence">{children}</EvidenceBox>}
export function MechanismSummary({children}:{children:ReactNode}) {return <EvidenceBox title="Proposed mechanism">{children}</EvidenceBox>}
export function SafetyNote({children}:{children:ReactNode}) {return <EvidenceBox title="Safety considerations">{children}</EvidenceBox>}
export function Formula() {return <div className="formula"><span className="eyebrow">THE DOSE EQUATION</span><p>Fluence = Irradiance × Time</p><small>J/cm² = (mW/cm² ÷ 1,000) × seconds</small></div>}

export function Citation({number,references}:{number:number;references?:Reference[]}) {
 const reference=references?.[number-1];
 if(!Number.isInteger(number)||number<1||!reference||!(reference.title||reference.citation))return <span className="citation-pending"> [Verified reference required]</span>;
 return <sup className="citation"><a href={`#reference-${number}`} aria-label={`Reference ${number}`}>[{number}]</a></sup>;
}
export function EvidenceSnapshot({data}:{data:EvidenceSnapshotData & {visible?:boolean}}) {
 if(data.visible===false)return null;
 const verified=data.verified===true;
 const findings=verified&&data.mainFindings?.length?data.mainFindings:['[VERIFY BEFORE PUBLICATION] — No verified findings or clinical conclusions have been added.'];
 const limitations=data.limitations?.length?data.limitations:['[VERIFY BEFORE PUBLICATION] — Study quality, device differences, funding, follow-up, and applicability still need assessment.'];
 return <aside className="evidence-snapshot" aria-label="Evidence Snapshot"><span className="eyebrow">EVIDENCE SNAPSHOT</span><dl>
 <div><dt>Research topic</dt><dd>{data.researchTopic}</dd></div>
 <div><dt>Evidence status</dt><dd>{verified&&data.status?data.status:'Verification pending — evidence not yet assessed'}</dd></div>
 <div><dt>Main findings</dt><dd><ul>{findings.map(f=><li key={f}>{f}</li>)}</ul></dd></div>
 <div><dt>Key limitations</dt><dd><ul>{limitations.map(f=><li key={f}>{f}</li>)}</ul></dd></div>
 </dl><p>Established findings, emerging evidence, uncertain findings, and manufacturer claims must be distinguished when the research review is complete.</p></aside>;
}
export function FAQ({items}:{items:FaqItem[]}) {return <div className="article-faq">{items.map(item=><details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</div>}
