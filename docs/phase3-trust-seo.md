# Phase 3: trust pages and SEO review

Work is isolated on `proofwell-phase3-trust-seo`, based on main commit `4efa2fda9b6ab5761a357bc6f78aa64457b154c9`. No merge or production deployment is part of this work.

## Official contact

All five trust pages and the shared footer render:

ProofWell Editorial Team<br>
[proofwelllife@gmail.com](mailto:proofwelllife@gmail.com)

The single source is `officialContact` in `lib/site.ts`. No physical address, registered company, telephone, credentials, or active affiliate program is inferred. Mailto links open a reader's email application; no validation message implies that email delivery or inbox receipt has been tested.

## Routes and content

- `/about`: mission, rationale, four pillars, approach to research, independence, attribution limits, and contact.
- `/editorial-policy`: scientific source hierarchy; stronger, moderate, preliminary, and preclinical evidence; quality/relevance caveats; uncertainty; references; attribution; corrections; updates; commercial independence.
- `/affiliate-disclosure`: potential commissions, no additional affiliate charge, editorial independence, no guaranteed favorable coverage, and no claim of current program participation.
- `/privacy-policy`: voluntary email, inactive preview forms, potential hosting data, repository analytics/cookie status, external links and future tracking, retention, rights, contact, and an explicitly labeled draft-update date.
- `/contact`: the actual email plus general, editorial, correction, product, business, and privacy inquiry guidance. The old frontend form remains in an explicitly inactive, collapsed preview.
- `/editorial-standards`: retained as a distinct overview linking to the full policy, so existing links keep working without duplicating the policy's title and description.

Scientific articles, references, images, homepage sections, logo, header navigation, and static-export settings are preserved. No studies, prices, tests, reviewer credentials, or efficacy claims were added.

## SEO behavior

`lib/metadata.ts` normalizes the optional `NEXT_PUBLIC_SITE_URL` to an HTTP(S) origin and rejects credentials, paths, query strings, and fragments. No real site URL is invented or set by this change.

Each route receives a distinct title and description, Open Graph and Twitter metadata. When the owner configures an actual site origin, canonical URLs, Open Graph URLs/images, Article page/image URLs, absolute BreadcrumbList items, and sitemap entries use that same origin. Sitemap paths are deduplicated.

Organization structured data contains the known publication name, description, and official contact email even without a domain. Article structured data uses the existing article author label and real dates only if supplied. Neither claims product ratings, professional credentials, hands-on testing, or reviews. Absolute links and publishing-policy URLs are included only when an actual origin is configured.

## Indexing remains blocked

These settings have deliberately NOT been changed:

1. `app/layout.tsx`: `robots: { index: false, follow: false }` emits global `noindex, nofollow`.
2. `app/robots.ts`: `rules: { userAgent: '*', disallow: '/' }` blocks crawling.

Only after owner review, reference checking, and resolution of the policy inputs below should the owner authorize public indexing. At that later step:

1. Set `NEXT_PUBLIC_SITE_URL` to the actual stable production HTTPS origin, with no path or trailing slash.
2. Change root robots metadata to `index: true, follow: true` (or the equivalent indexable default).
3. Change robots.txt rules to permit public routes, for example `allow: '/'`, retaining the actual sitemap URL.
4. Rebuild the static export, validate canonical/OG/JSON-LD/sitemap URLs, and approve deployment separately.
5. Check deployed HTML and response headers, including any hosting-level `X-Robots-Tag` and preview-access rules. Adjust only the intended production environment. A Pages preview may remain noindexed independently.

Noindex and robots directives are indexing controls, not access controls.

## Owner input still required

- Privacy: actual legal owner/controller identity, applicable jurisdiction and effective date. The draft update date is not an approved legal effective date.
- Hosting and any analytics outside the repository: actual provider, log categories, purposes/legal basis, cookies, consent controls, retention, access, deletion, international transfer and security arrangements.
- Applicable privacy rights, request and identity-verification process, complaint route and any legal deadlines.
- Legal review of privacy policy and existing terms; no legal-compliance guarantee is made.
- Verified author biographies/credentials if named professional attribution is desired; actual scientific review before any reviewer badge.
- Independent checking of the first article's existing scientific references and findings, and completion of remaining article drafts before indexing.
- Actual commercial relationships, destinations and tracking details before activating affiliate links. No real affiliate integration was enabled.

The email contact placeholder has been resolved; no placeholder email is required.

## Validation and screenshots

Use Node.js 24.x and the committed lockfile:

```sh
npm ci
npm run typecheck
npm run build
node scripts/check-editorial.mjs
npm start
```

With the local static preview running, in another terminal:

```sh
node scripts/check-site.mjs
node scripts/check-phase3.mjs
```

`check-site.mjs` covers routes, direct article visits/refreshes, local resources, search, navigation, forms and responsive behavior. `check-phase3.mjs` checks route-wide metadata uniqueness, noindex, real-contact signatures, structured data, all five trust pages at desktop/mobile widths, internal policy links, and source-origin/canonical guard behavior. It does not send email. The reserved `proofwell.example` hostname is used only in in-memory unit checks; it is never written to production configuration or exported pages.

Screenshots for all five pages are generated in the ignored `screenshots/phase3/` directory as `<route>-1440.png` and `<route>-390.png`. Review them locally or through the chat's file links; generated screenshots and `out/` are not committed.

## New and modified files

New files:

- `components/official-contact.tsx` — shared official signature and mailto link.
- `components/trust-page.tsx` — reusable policy/contact presentation and breadcrumbs.
- `lib/trust-pages.ts` — five trust-page content records and typed sections.
- `lib/metadata.ts` — canonical-origin validation and shared metadata construction.
- `scripts/check-phase3.mjs` — metadata, contact, schema and responsive regression checks.
- `docs/phase3-trust-seo.md` — this owner review and indexing-release guide.

Modified files:

- `app/[...slug]/page.tsx` — trust-page routing and route-specific metadata; no scientific text changes.
- `app/layout.tsx` — shared root metadata and verified Organization fields; noindex remains enabled.
- `app/sitemap.ts` — deduplicated static sitemap including the editorial-policy route.
- `app/globals.css` — scoped trust-page/contact styles using existing visual tokens.
- `components/layout.tsx` — footer policy links and official contact signature; header preserved.
- `components/seo.tsx` — Organization, Article and BreadcrumbList structured-data helpers.
- `lib/pages.ts` — connect trust content and retain legacy/legal routes.
- `lib/site.ts` — official contact, normalized optional origin and unique topic descriptions.
- `scripts/check-site.mjs` — explicitly open the inactive contact-form preview before testing it.
- `README.md` — Phase 3 workflow and review-guide link.

No scientific article, reference, homepage hero, image, dependency, lockfile, or static export configuration is changed.
