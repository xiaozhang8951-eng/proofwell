import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
export type Article = { title:string; shortTitle:string; description:string; category:string; section:string; slug:string; kind:string; visual:string; topics:string[]; author:string; published?:string; updated?:string; heroImage?:string; heroAlt?:string; body:string; readingTime:number };
function contentFiles(dir:string):string[] { return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?contentFiles(path.join(dir,e.name)):e.name.endsWith('.mdx')?[path.join(dir,e.name)]:[]); }
export function getArticles():Article[] {
 return contentFiles(path.join(process.cwd(),'content')).map(f=>{
 const {data,content}=matter(fs.readFileSync(f,'utf8'));
 return {...data,body:content,readingTime:Math.max(1,Math.ceil(content.split(/\s+/).length/200))} as Article;
 });
}
export const articleUrl=(a:Article)=>`/${a.section}/${a.slug}`;
export const headingId=(s:string)=>s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/-$/,'');
