import type { Article } from '@/lib/content';
import { articleUrl } from '@/lib/content';
import { isEditorialDate } from '@/lib/editorial';
import { absoluteSiteUrl } from '@/lib/metadata';
import { siteUrl, officialContact } from '@/lib/site';

export function JsonLd({data}:{data:Record<string,unknown>}) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(data).replace(/</g,'\\u003c')}}/>;
}

export function OrganizationSchema({description}:{description:string}) {
  return <JsonLd data={{'@context':'https://schema.org','@type':'Organization',name:'ProofWell',description,
    email:officialContact.email,contactPoint:{'@type':'ContactPoint',contactType:'editorial inquiries',email:officialContact.email},
    ...(siteUrl?{url:siteUrl,publishingPrinciples:absoluteSiteUrl(siteUrl,'/editorial-policy')}:{})}}/>;
}

export function ArticleSchema({article}:{article:Article}) {
  const url=absoluteSiteUrl(siteUrl,articleUrl(article));
  const imagePaths=article.heroImages?.map(image=>image.src)||(article.heroImage?[article.heroImage]:[]);
  return <JsonLd data={{'@context':'https://schema.org','@type':'Article',headline:article.title,description:article.description,
    author:{'@type':article.authorInfo?.kind==='person'?'Person':'Organization',name:article.author},
    publisher:{'@type':'Organization',name:'ProofWell'},
    ...(url?{mainEntityOfPage:url}:{}),
    ...(siteUrl&&imagePaths.length?{image:imagePaths.map(image=>absoluteSiteUrl(siteUrl,image))}:{}),
    ...(isEditorialDate(article.published)?{datePublished:article.published}:{}),
    ...(isEditorialDate(article.updated)?{dateModified:article.updated}:{})}}/>;
}

// These helpers remain unused until there is an actual verified product/review.
export function ProductSchema({name,url,description}:{name:string;url:string;description:string}) {
  return <JsonLd data={{'@context':'https://schema.org','@type':'Product',name,url,description}}/>;
}
export function ReviewSchema({name,product,body}:{name:string;product:string;body:string}) {
  return <JsonLd data={{'@context':'https://schema.org','@type':'Review',name,itemReviewed:{'@type':'Product',name:product},reviewBody:body,author:{'@type':'Organization',name:'ProofWell'}}}/>;
}
export function BreadcrumbSchema({items}:{items:{name:string;path:string}[]}) {
  if(!siteUrl)return null;
  return <JsonLd data={{'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:items.map((item,index)=>({'@type':'ListItem',position:index+1,name:item.name,item:absoluteSiteUrl(siteUrl,item.path)}))}}/>;
}
