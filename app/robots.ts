import type { MetadataRoute } from 'next';
import {siteUrl} from '@/lib/site';
// Keep research drafts out of search indexes; review this policy before launch.
export default function robots():MetadataRoute.Robots {return {rules:{userAgent:'*',disallow:'/'},...(siteUrl?{sitemap:`${siteUrl}/sitemap.xml`}:{})};}
