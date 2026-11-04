import {siteUrl} from '@/lib/site';
export function JsonLd({data}:{data:Record<string,unknown>}) {return <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(data).replace(/</g,'\\u003c')}}/>}
export function ProductSchema({name,url,description}:{name:string;url:string;description:string}) {return <JsonLd data={{'@context':'https://schema.org','@type':'Product',name,url,description}}/>}
// Use only when a real review and any attached ratings have been verified.
export function ReviewSchema({name,product,body}:{name:string;product:string;body:string}) {return <JsonLd data={{'@context':'https://schema.org','@type':'Review',name,itemReviewed:{'@type':'Product',name:product},reviewBody:body,author:{'@type':'Organization',name:'ProofWell'}}}/>}
export function BreadcrumbSchema({items}:{items:{name:string;path:string}[]}){if(!siteUrl)return null;return <JsonLd data={{'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:items.map((i,index)=>({'@type':'ListItem',position:index+1,name:i.name,item:`${siteUrl}${i.path}`}))}}/>}
