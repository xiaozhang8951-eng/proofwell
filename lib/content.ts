import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import type { AuthorInfo, ScientificReview, EvidenceAssessment, Reference, EvidenceSnapshotData, FaqItem } from './editorial';
export type ArticleHeroImage = { src: string; alt: string };
export type ArticlePurchaseLink = { href: string; label: string; image?: ArticleHeroImage & { width: number; height: number; caption?: string }; pending?: boolean; priceNote?: string; priceLabel?: string; placement?: 'header' | 'after-title'; target?: '_blank'; disclosure?: string };
export type ReviewQuickSummaryData = { lead: string; advantages: string[]; tradeoffs: string[]; safety: string };
export type Article = { title:string; seoTitle?:string; shortTitle:string; description:string; category:string; section:string; slug:string; kind:string; visual:string; topics:string[]; author:string; authorInfo?:AuthorInfo; scientificReview?:ScientificReview; evidenceAssessment?:EvidenceAssessment; references?:Reference[]; introduction?:string; keyTakeaways?:string[]; evidenceSnapshot?:EvidenceSnapshotData; faq?:FaqItem[]; limitations?:string[]; published?:string; updated?:string; draft?:boolean; noindex?:boolean; heroImages?:[ArticleHeroImage,ArticleHeroImage]; heroImage?:string; heroAlt?:string; heroCaption?:string; heroWidth?:number; heroHeight?:number; purchaseLink?:ArticlePurchaseLink; purchaseLinks?:ArticlePurchaseLink[]; affiliateDisclosure?:string; quickSummary?:ReviewQuickSummaryData; editorialStatusNote?:string; body:string; readingTime:number };
function contentFiles(dir:string):string[] { return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?contentFiles(path.join(dir,e.name)):e.name.endsWith('.mdx')?[path.join(dir,e.name)]:[]); }
export function getArticles():Article[] {
 return contentFiles(path.join(process.cwd(),'content')).map(f=>{
 const {data,content}=matter(fs.readFileSync(f,'utf8'));
 const text=[content,data.introduction,...(data.keyTakeaways||[]),...(data.faq||[]).flatMap((item:{question:string;answer:string})=>[item.question,item.answer])].filter(Boolean).join(' ');
 return {...data,body:content,readingTime:Math.max(1,Math.ceil(text.split(/\s+/).length/200))} as Article;
 });
}
export const articleUrl=(a:Article)=>`/${a.section}/${a.slug}`;
// Hide these unfinished entries from discovery while retaining their MDX,
// direct draft routes and existing indexing protection for editorial work.
const unlistedArticleSlugs = new Set([
 'omnilux-contour-face',
 'currentbody-series-2',
 'solawave-wrinkle-retreat-pro',
 'shark-cryoglow',
 'omnilux-vs-currentbody',
 'omnilux-vs-solawave',
 'omnilux-vs-solawave-vs-shark',
]);
export const isArticleListed=(article:Pick<Article,'slug'>)=>!unlistedArticleSlugs.has(article.slug);
export const headingId=(s:string)=>s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/-$/,'');
