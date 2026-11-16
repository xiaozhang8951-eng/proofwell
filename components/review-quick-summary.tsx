import type { ArticlePurchaseLink, ReviewQuickSummaryData } from '@/lib/content';
import { CommercialLink } from './evidence';

export function ReviewQuickSummary({ summary }: { summary: ReviewQuickSummaryData }) {
  return <aside className="evidence-box review-quick-summary" aria-labelledby="plain-language-summary" style={{textAlign:'left',marginTop:24}}>
    <span className="eyebrow">QUICK DECISION GUIDE</span>
    <h2 id="plain-language-summary" style={{fontSize:26,lineHeight:1.3,margin:'10px 0 14px'}}>Plain-language summary</h2>
    <p>{summary.lead}</p>
    <div className="pros-cons">
      <div><h3>Why consider it</h3><ul style={{listStyle:'disc',paddingLeft:18,margin:'10px 0 20px'}}>{summary.advantages.map(item=><li key={item} style={{marginBottom:6}}>{item}</li>)}</ul></div>
      <div><h3>What to weigh up</h3><ul style={{listStyle:'disc',paddingLeft:18,margin:'10px 0 20px'}}>{summary.tradeoffs.map(item=><li key={item} style={{marginBottom:6}}>{item}</li>)}</ul></div>
    </div>
    <p className="review-safety-summary" style={{borderLeft:'3px solid var(--accent)',padding:'12px 14px',marginTop:16,background:'var(--background)'}}><strong>Safety first: </strong>{summary.safety}</p>
    <a className="text-link" href="#who-this-is-for">Check whether it fits your needs ↓</a>
  </aside>;
}

export function ArticlePurchaseAction({ link }: { link: ArticlePurchaseLink }) {
  return <div className="article-purchase-link" style={{marginTop:24}}>
    {link.priceLabel&&<p className="review-price-label" style={{fontSize:18,margin:'0 0 12px'}}><strong>{link.priceLabel}</strong></p>}
    {link.pending ? <>
      <button type="button" className="button primary" disabled style={{opacity:0.65,cursor:'not-allowed'}}>{link.label}</button>
      <p style={{fontSize:11,lineHeight:1.7,marginTop:10}}>Purchase link not active — awaiting an approved affiliate destination.</p>
    </> : <CommercialLink href={link.href} target={link.target} disclosure={link.disclosure}><span className="button primary">{link.label}</span></CommercialLink>}
    {link.priceNote&&<p style={{fontSize:11,lineHeight:1.7,marginTop:10}}>{link.priceNote}</p>}
  </div>;
}
