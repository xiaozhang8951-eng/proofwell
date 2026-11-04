import type { ReactNode } from 'react';
export function EvidenceLevel({level}:{level:'Strong Evidence'|'Moderate Evidence'|'Emerging Evidence'|'Limited Evidence'|'Unsupported Claim'}) {return <span className="evidence-level">{level}</span>}
export function EvidenceBox({title='Evidence in context',children}:{title?:string;children:ReactNode}) {return <aside className="evidence-box"><span className="eyebrow">PROOFWELL NOTES</span><h3>{title}</h3>{children}</aside>}
export function StudySummary({children}:{children:ReactNode}) {return <EvidenceBox title="Study summary">{children}</EvidenceBox>}
export function ClaimCheck({claim,children}:{claim:string;children:ReactNode}) {return <EvidenceBox title={claim}>{children}</EvidenceBox>}
export function SpecificationTable({rows}:{rows:string[][]}) {return <div className="table-scroll" tabIndex={0} role="region" aria-label="Product specifications"><table><thead><tr><th>Specification</th><th>Details</th></tr></thead><tbody>{rows.map((r,i)=><tr key={i}>{r.map((v,j)=>j===0?<th scope="row" key={j}>{v}</th>:<td key={j}>{v}</td>)}</tr>)}</tbody></table></div>}
export function ComparisonTable({headers,rows}:{headers:string[];rows:string[][]}) {return <div className="table-scroll" tabIndex={0} role="region" aria-label="Product comparison"><table><thead><tr>{headers.map(h=><th key={h} scope="col">{h}</th>)}</tr></thead><tbody>{rows.map((r,i)=><tr key={i}>{r.map((v,j)=>j===0?<th scope="row" key={j}>{v}</th>:<td key={j}>{v}</td>)}</tr>)}</tbody></table></div>}
export function ProductVerdict({children}:{children:ReactNode}) {return <EvidenceBox title="The ProofWell verdict">{children}</EvidenceBox>}
export function ProsCons({pros,cons}:{pros:string[];cons:string[]}) {return <div className="pros-cons"><div><h3>What we like</h3><ul>{pros.map(p=><li key={p}>{p}</li>)}</ul></div><div><h3>What we would change</h3><ul>{cons.map(p=><li key={p}>{p}</li>)}</ul></div></div>}
export function ReferenceList({items=['[Verified reference required]']}:{items?:string[]}) {return <ol className="references">{items.map((v,i)=><li key={i}>{v}</li>)}</ol>}
export function AffiliateDisclosure() {return <aside className="disclosure"><strong>Disclosure:</strong> ProofWell may earn a commission when readers purchase through certain links. This does not affect our editorial conclusions.</aside>}
export function KeyTakeaways({items}:{items:string[]}) {return <EvidenceBox title="Key takeaways"><ul>{items.map(i=><li key={i}>{i}</li>)}</ul></EvidenceBox>}
export function IngredientEvidence({children}:{children:ReactNode}) {return <EvidenceBox title="Ingredient evidence">{children}</EvidenceBox>}
export function SupplementEvidence({children}:{children:ReactNode}) {return <EvidenceBox title="Supplement evidence">{children}</EvidenceBox>}
export function MechanismSummary({children}:{children:ReactNode}) {return <EvidenceBox title="Proposed mechanism">{children}</EvidenceBox>}
export function SafetyNote({children}:{children:ReactNode}) {return <EvidenceBox title="Safety considerations">{children}</EvidenceBox>}
export function Formula() {return <div className="formula"><span className="eyebrow">THE DOSE EQUATION</span><p>Fluence = Irradiance × Time</p><small>J/cm² = (mW/cm² ÷ 1,000) × seconds</small></div>}
