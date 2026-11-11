# Sitemap fix and production verification

Historical release record: article status, URL counts and the original branch workflow below describe that release. For the current per-URL classification, published-article inventory and 404 metadata checks, see [the indexing audit](indexing-audit.md). Use the owner-authorized workflow for the current task.

## Reproduced root cause

The former `app/sitemap.ts` returned `[]` when `NEXT_PUBLIC_SITE_URL` was missing. `lib/site.ts` supplied no default, and the earlier README explicitly instructed leaving that variable unset. Running the unchanged `main` code at `d4be6b1` with the variable unset reproduced a successful build containing an XML `<urlset>` with zero entries. Static export writes this result to `out/sitemap.xml`; there is no runtime server to fill it later. There is no `public/sitemap.xml` to override the generated route.

Route discovery itself worked: the build exported all 40 public pages. Article URLs come from MDX `section` and `slug` metadata (for example `/science/red-light-therapy-skin`), not the `content/beauty-tech` directory name. The fix shares the registered route list with `generateStaticParams`, avoiding separate discovery logic.

The actual Cloudflare environment and currently served response still require live inspection. The workspace proxy denied the production request before reaching the origin; the local reproduction establishes the faulty code path, but does not establish Cloudflare's current variable values or Googlebot's fetch result.

## Canonical origin and indexing

- The approved origin is `https://proofwelllife.com`; it is now the default when `NEXT_PUBLIC_SITE_URL` is missing or blank. Configuring a different origin fails the build rather than silently publishing wrong canonical URLs. No domain or DNS change is needed.
- `lib/public-routes.ts` supplies the same deduplicated paths to static generation and sitemap eligibility. No filesystem resource, framework error page, redirect or private route is registered as a sitemap page.
- Production metadata uses `index, follow` only for eligible routes. Excluded draft/placeholder pages use `noindex, nofollow` and remain accessible to visitors.
- All 13 existing MDX articles remain noindex, as explicitly selected by the owner. None currently has a publication date. A future approved article becomes eligible with a valid, non-future `published: YYYY-MM-DD` and neither `draft: true` nor `noindex: true`. Do not invent dates or promote drafts to fill the sitemap.
- `/terms` remains noindex because it is an explicit legal draft. Seven empty planned categories remain noindex: `/wellness`, `/supplements`, `/healthy-aging`, `/sleep`, `/recovery`, `/nutrition`, `/wellness-technology`.
- The six populated category landings and four populated topic collections remain public editorial discovery pages even while their linked article drafts are noindex. The homepage, topic hub, five requested trust pages, editorial-standards overview and health disclaimer are eligible.
- Production robots allows `/` for all user agents and declares `Sitemap: https://proofwelllife.com/sitemap.xml`. Draft URLs are crawlable so engines can read their noindex metadata.
- Cloudflare previews (`CF_PAGES=1` with a branch other than `main`, or without a branch) and local development retain global noindex/nofollow, `Disallow: /`, and intentionally empty preview sitemaps. Only production `main` should publish the nonempty sitemap. Cloudflare supplies these branch variables; do not fake a production branch value in a preview.
- No synthetic `lastmod`, publication dates, priorities or scientific facts are added.

## Expected production sitemap (19 URLs)

Every path below is prefixed by `https://proofwelllife.com`:

- `/`
- `/reviews`
- `/comparisons`
- `/buying-guides`
- `/science`
- `/beauty-tech`
- `/skincare`
- `/about`
- `/editorial-policy`
- `/affiliate-disclosure`
- `/privacy-policy`
- `/contact`
- `/editorial-standards`
- `/disclaimer`
- `/topics`
- `/topics/red-light-therapy`
- `/topics/led-masks`
- `/topics/beauty-devices`
- `/topics/skincare-science`

## Local validation

Use Node.js 24.x:

```sh
npm ci
npm run typecheck
npm run build
node scripts/check-indexing.mjs
node scripts/check-editorial.mjs
npm start
```

With the static server running, in another terminal:

```sh
npm run check:sitemap
node scripts/check-site.mjs
node scripts/check-phase3.mjs
```

`check:sitemap` parses the actual served XML using Chromium's XML parser, checks the official namespace, nonempty entries, exact canonical origin, uniqueness, HTTP 200 without redirects, HTML canonical/meta directives and HTTP `X-Robots-Tag`, robots allowing crawling, and exact agreement with all indexable exported HTML. It excludes framework error pages through their generated noindex directives. It prints `LOCAL ONLY` for a local target and `PRODUCTION VERIFIED` only after all live checks pass. It uses the installed Playwright dependency and system Chromium, without a new package. Keep a local build of the same deployed commit when running the live check.

## Deployment instructions

1. Review `fix/proofwell-sitemap` against latest `main`, confirm checks pass and that MDX, scientific references, homepage, styles and images are unchanged, and merge through a PR. Do not push directly to `main` or use the fix branch as the Pages production branch.
2. In the existing Cloudflare Pages project's production build settings, confirm source branch `main`, repository root, Node.js 24.x, `npm run build`, and output `out`. Preserve the existing `proofwelllife.com` domain and DNS.
3. Set production `NEXT_PUBLIC_SITE_URL=https://proofwelllife.com`, or remove a stale value and use the approved source default. A previously configured `pages.dev` value must be corrected before building. Use the same canonical origin in Preview build variables if present; preview indexing remains blocked by the branch guard. Changing a runtime value alone cannot repair already exported XML.
4. Trigger or await a fresh production build of the merged commit. Deploy the entire new `out/`, not just XML or an older cached artifact. Confirm successful deployment and the exact source SHA.
5. Rebuild the same commit locally and run:

```sh
BASE_URL=https://proofwelllife.com npm run check:sitemap
```

6. Confirm the live response contains the 19 expected `<url>` entries and that the script finishes with `PRODUCTION VERIFIED`. Its failures must be resolved before claiming completion. If a fresh deployment still serves older XML, inspect deployment/source/output selection and any existing cache rules; change only a demonstrated cause. If live pages have hosting-level noindex headers or crawler blocks, inspect the applicable setting rather than claiming the code overrode it.
7. After live verification, resubmit `https://proofwelllife.com/sitemap.xml` in the matching Search Console property. Google may take time to refetch; this does not guarantee discovery or indexing.

Production verification requires workspace network permission for `proofwelllife.com`. A saved environment network draft must be reviewed, saved and published before its rules apply. GitHub API and Cloudflare access are separately required to inspect PR checks or deployment settings; normal repository Git push works independently through the configured Git proxy.
