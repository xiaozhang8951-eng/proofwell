import type { MetadataRoute } from 'next';
import {siteUrl,topics} from '@/lib/site';
import {categories,information} from '@/lib/pages';
import {getArticles,articleUrl} from '@/lib/content';
export const dynamic = 'force-static';
export default function sitemap():MetadataRoute.Sitemap {if(!siteUrl)return [];return ['/',...Object.keys(categories).map(s=>'/'+s),...Object.keys(information).map(s=>'/'+s),'/contact','/topics',...topics.map(([,s])=>'/topics/'+s),...getArticles().map(articleUrl)].map(path=>({url:siteUrl+path}));}
