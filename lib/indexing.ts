import type { Metadata } from 'next';

export function isPreviewBuild(environment: Record<string, string | undefined> = process.env) {
  return environment.NODE_ENV === 'development' ||
    (environment.CF_PAGES === '1' && environment.CF_PAGES_BRANCH !== 'main');
}

export function pageRobots(eligible: boolean, environment: Record<string, string | undefined> = process.env): Metadata['robots'] {
  const index = eligible && !isPreviewBuild(environment);
  return { index, follow: index };
}
