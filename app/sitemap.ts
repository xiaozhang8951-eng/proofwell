import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/site';
import { getIndexablePaths } from '@/lib/public-routes';
import { isPreviewBuild } from '@/lib/indexing';
export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  if (isPreviewBuild()) return [];
  return getIndexablePaths().map(path => ({ url: new URL(path, siteUrl).href }));
}
