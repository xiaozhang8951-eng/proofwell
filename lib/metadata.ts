import type { Metadata } from 'next';

export const productionSiteUrl = 'https://proofwelllife.com';

// Static export cannot recover missing build-time configuration at request time.
export function resolveSiteOrigin(value?: string): string {
  const configured = normalizeSiteOrigin(value);
  if (configured && configured !== productionSiteUrl) {
    throw new Error(`NEXT_PUBLIC_SITE_URL must be ${productionSiteUrl}; remove any stale preview origin before building.`);
  }
  return productionSiteUrl;
}

export function normalizeSiteOrigin(value?: string): string | undefined {
  if (!value?.trim()) return undefined;
  const url = new URL(value.trim());
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('NEXT_PUBLIC_SITE_URL must be an HTTP(S) origin without a path, credentials, query, or fragment.');
  }
  return url.origin;
}

export function absoluteSiteUrl(origin: string | undefined, path: string) {
  if (!origin) return undefined;
  if (!path.startsWith('/') || path.startsWith('//')) throw new Error('Expected a local absolute path.');
  return new URL(path, origin).href;
}

export function pageMetadata({ title, description, path, origin, article = false, imagePath = '/images/proofwell-home-hero-visual.webp' }: {
  title: string; description: string; path: string; origin?: string; article?: boolean; imagePath?: string;
}): Metadata {
  const url = absoluteSiteUrl(origin, path);
  const image = absoluteSiteUrl(origin, imagePath);
  return {
    title,
    description,
    ...(url ? { alternates: { canonical: url } } : {}),
    openGraph: { title, description, type: article ? 'article' : 'website', siteName: 'ProofWell', ...(url ? { url } : {}), ...(image ? { images: [{ url: image }] } : {}) },
    twitter: { card: image ? 'summary_large_image' : 'summary', title, description, ...(image ? { images: [image] } : {}) },
  };
}
