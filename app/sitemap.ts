import type { MetadataRoute } from 'next';
import { siteUrl, topics } from '@/lib/site';
import { categories, information } from '@/lib/pages';
import { getArticles, articleUrl } from '@/lib/content';
import { absoluteSiteUrl } from '@/lib/metadata';
export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  if (!siteUrl) return [];
  const paths = new Set(['/', ...Object.keys(categories).map(path=>'/'+path),
    ...Object.keys(information).map(path=>'/'+path), '/topics',
    ...topics.map(([,slug])=>'/topics/'+slug), ...getArticles().map(articleUrl)]);
  return [...paths].map(path=>({url:absoluteSiteUrl(siteUrl,path)!}));
}
