import type { MetadataRoute } from 'next';
import {siteUrl} from '@/lib/site';
import {isPreviewBuild} from '@/lib/indexing';
export const dynamic = 'force-static';
export default function robots():MetadataRoute.Robots {
  return {
    rules: isPreviewBuild() ? {userAgent:'*',disallow:'/'} : {userAgent:'*',allow:'/'},
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
