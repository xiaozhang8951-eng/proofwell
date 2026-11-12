# ProofWell

An independent English-language editorial website for evidence-led beauty, wellness, and healthy living. Built with Next.js App Router, TypeScript, Tailwind CSS, and local MDX. No database is required.

## Local preview

Use Node.js 24.x, matching `package.json` and `.nvmrc`.

```sh
npm ci
npm run dev
```

Open http://localhost:3000 on the same computer that runs the server. A server started in the cloud workspace does not make your own computer’s localhost point to that workspace. For an exported-site preview, run `npm run build` followed by `npm start`, then open http://localhost:4173. This serves only `out/` with clean URLs and a real 404; it does not start a Next.js server. Use `PORT` to choose another preview port. Cloudflare Pages serves these files directly and does not run `npm start`. Run `npm run typecheck` to check TypeScript.

## Structure

- `next.config.mjs`: static export and unoptimized image configuration; `npm run build` generates `out/`.
- `scripts/serve-static.mjs`: dependency-free local preview of the exported files.
- `app/`: homepage, shared layout, catch-all statically generated editorial routes, metadata, sitemap, robots, and global design tokens.
- `components/`: shared navigation, article cards, scientific illustrations, forms, SEO helpers, and evidence components.
- `lib/content.ts`: recursive MDX reader and article types.
- `lib/templates.ts`: review, comparison, and supplement review section frameworks.
- `lib/site.ts`: navigation, active topics, canonical origin, and medical disclaimer.
- `lib/pages.ts`: category and informational page content.
- `content/`: beauty-tech, skincare, wellness, supplements, healthy-aging, buying-guides, comparisons, and reviews. Empty collections are intentionally reserved for expansion.

## Add an article

Create an `.mdx` file in the appropriate content subdirectory. Local MDX is trusted code: do not accept user-submitted MDX or compile untrusted remote content. Each file needs this frontmatter:

```yaml
---
title: "Your full editorial headline"
shortTitle: "Short card title"
description: "A concise editorial deck."
category: "Science Explained"
section: "science"
slug: "your-article-slug"
kind: "science"
visual: "wave"
topics: ["skincare-science"]
author: "ProofWell Editorial"
# published: "YYYY-MM-DD"  # Add only on actual publication.
# updated: "YYYY-MM-DD"    # Add only when actually updated.
# heroImage: "/images/your-licensed-image.webp"
# heroAlt: "Descriptive alternative text"
---
```

Write article text below the frontmatter. `##` headings automatically form the table of contents. Routes and related articles are generated from metadata. Reading time is calculated from content. Every file must have a unique `section` + `slug` pair. Available evidence components are in `components/evidence.tsx` and can be used directly inside MDX, without imports. `EvidenceLevel` accepts the five requested labels but is never assigned automatically.

### Editorial metadata and article structure

The four long-term pillars are **Skin Science & Beauty**, **Nutrition & Supplements**, **Healthy Aging**, and **Wellness Technology**, configured once in `lib/site.ts`. Their existing routes are preserved. LED light therapy remains series 01; no additional article placeholders are needed to activate the broader positioning.

All new article fields are optional. Existing MDX files still work. The red-light pillar article demonstrates an introduction, key takeaways, evidence snapshot, existing background/mechanism and human-evidence sections, technical table, safety, consumer guidance, FAQ, and references. Its content is still explicitly unverified; no findings have been invented.

| Frontmatter field | Purpose |
| --- | --- |
| `author` | Existing author or editorial organization name; never infer credentials. |
| `authorInfo` | Optional `kind` (`person` or `organization`), `bio`, and verified `credentials`. |
| `published`, `updated` | Actual ISO calendar dates (`YYYY-MM-DD`); invalid or absent dates are not displayed or included in Article JSON-LD. |
| `scientificReview` | `status`, optional `reviewer` (`name`, `credentials`, `bio`), and `reviewedOn`. Display requires `status: completed`, a nonblank name, and a valid date. Only enter completed after a real review has occurred. Omit the field or use `status: pending` otherwise. |
| `introduction` | Optional introductory paragraph. |
| `keyTakeaways` | A list of sourced takeaways, or clearly worded notes about incomplete verification. |
| `evidenceSnapshot` | `researchTopic`, `verified`, optional `status`, `mainFindings`, and `limitations`. With `verified: false`, findings and status remain verification placeholders. |
| `evidenceAssessment` | Optional `verified`, `level`, `summary`, and `limitations`. A grade displays only with explicit verification, a supported level, a nonempty summary, and limitations. No existing article has a grade. |
| `limitations` | Optional article-level uncertainty notes. |
| `faq` | List of `question` and `answer` pairs, rendered at an MDX `<FAQ />` location. |
| `references` | List of actual source records: `title`, `authors` (list), `journal`, `year`, `doi`, `pubmedUrl`, or `url`. Legacy `citation` text is also supported. |

Use `<Citation number={1} />` in MDX only after supplying the corresponding real record in `references`. It links to `reference-1` in `<ReferenceList />`, which reads article references automatically. Missing citations display `[Verified reference required]` rather than linking to a nonexistent source. Plain-string MDX reference lists still work. DOI syntax is checked and links use `https://doi.org/`; syntax validation is not scientific verification. Never enter illustrative DOI numbers or pretend references. Only actual PubMed-hosted URLs are labeled PubMed.

`EvidenceSnapshot`, `Limitations`, and `EvidenceSeparation` can also be used directly in MDX. Keep established findings, emerging evidence, uncertain findings, proposed mechanisms, and manufacturer claims distinct. A reviewer badge does not substitute for a documented reference list or uncertainty assessment.

Desktop article contents remain sticky; on mobile/tablet, the “In this article” button expands the anchor list. Related articles remain at the end. All features are built into the static export.

### Reviews and comparisons

For a product review use `category: "Reviews"`, `section: "reviews"`, and `kind: "review"`; follow the framework in `lib/templates.ts`. Existing reviews retain all of their detailed sections; an expandable nine-part evaluation framework links specifications, ingredients/technology, scientific evidence, safety, usability, price/value, advantages/limitations, intended users, and verdict to the relevant sections. Use `visual: "mask-0"` through `mask-3` for conceptual illustrations. For a comparison use `category: "Comparisons"`, `section: "comparisons"`, and `kind: "comparison"`. `SpecificationTable` takes `rows` and `ComparisonTable` takes `headers` and `rows`; both have accessible, horizontally scrollable containers for small screens. Do not fill them with guessed data.

### Supplements and future categories

For supplements use `section: "supplements"`, `kind: "supplement"`, and copy `templates/supplement-review.mdx` into `content/supplements/` (section lists also live in `lib/templates.ts`). `SupplementEvidence`, `IngredientEvidence`, `SafetyNote`, and `MechanismSummary` are available in MDX. Include educational-not-medical-advice language and references. Never imply disease treatment.

Supplements, Sleep, Recovery, Nutrition, Healthy Aging, and Wellness Technology already have landing pages. Add articles with matching `section` values to activate their collections. Use `planned` in `lib/pages.ts` to manage future coverage. Add a category to that file to generate another landing page. Add a topic in `lib/site.ts` and attach its slug to article `topics` arrays to create a topic cluster. Footer links are in `components/layout.tsx`.

## Design and navigation

Edit `navigation` in `lib/site.ts` for desktop and mobile navigation. Search automatically includes all MDX articles. Colors and typography tokens are at the top of `app/globals.css`; responsive styles are in the same file. SVG and CSS illustrations are original, conceptual placeholders, not representations of product specifications. Replace them only with licensed/manufacturer-approved images using `heroImage` and appropriate alt text. Next Image is supported by the article template with `images.unoptimized: true`, so no `/_next/image` service is needed. Prepare appropriately sized WebP/AVIF images before adding them. Existing SVG and CSS diagrams are preserved.

## Forms

Newsletter and contact forms are frontend previews. They visibly state their inactive status before any interaction, validate input, explain that no submission has been sent, received, or saved, and make no external requests. The newsletter button says “Preview only”, and neither form shows a success indicator. Connect a provider before opening subscriptions or contact delivery. Update the privacy notice to match the actual service and handling of personal information.

## Affiliate links

The MEGELIN review includes the owner-authorized PartnerBoost link. Its tracking URL is preserved exactly; product documentation, live seller terms, the referral destination and program compensation remain subject to verification. The reusable `CommercialLink` MDX component accepts an actual owner-approved `href` and link text; it renders a disclosure immediately beside the link and applies `rel="sponsored nofollow noopener"`. With no valid HTTP(S) destination it renders nothing. `AffiliateDisclosure` also accepts `compact` for manual placement near commercial links. Future links can be placed inside a review's Alternatives or Price and Value section using a clear editorial label such as “View product details” or “Check current price”. Use `rel="sponsored nofollow noopener"` on commercial external links. Keep the disclosure near the beginning. Do not change verdicts to suit commercial relationships. ProductSchema and ReviewSchema helpers in `components/seo.tsx` are intentionally unused until actual verified review content is ready; no ratings are emitted.

## Before public launch

Publication status is set per article. Approved science explainers may be published; unfinished articles and product-review frameworks retain their draft protections. A publication date does not establish scientific review or independently verified claims. The following still require appropriate editorial review:

- Scientific mechanisms, clinical findings, efficacy, safety, and realistic expectations.
- Bibliographic identity, DOI/PMID correspondence, source access and claim relevance; a displayed reference is not automatically verified.
- Device specifications, doses, usage protocols, warnings, regulatory status, current region-specific prices, and source/access dates.
- Verdicts, pros/cons, product suitability, recommendations, and any future ratings.
- Founder credentials, author biography, any hands-on testing claims, and actual publication/update dates.
- Licensed product imagery, actual affiliate relationships, and appropriate disclosures.
- Legal owner/contact details, privacy retention/service details, jurisdiction-specific terms, and effective dates.

Production permits indexing for published articles and eligible public landing/trust pages. Unfinished articles, the draft terms page and empty planned collections retain `noindex, nofollow`. Cloudflare branch previews block all crawling and indexing. These directives are not access controls. The current per-URL classification is recorded in [the indexing audit](docs/indexing-audit.md).

## Canonical URLs and static hosting

The owner-approved production origin is `https://proofwelllife.com`. It is the build-time default even when `NEXT_PUBLIC_SITE_URL` is unset, so missing configuration cannot silently produce an empty production sitemap. If this optional variable is configured, it must normalize to exactly that HTTPS origin. A stale `pages.dev` origin or a different domain fails the build with a clear error.

Canonical, Open Graph, structured-data and sitemap URLs all use the same production origin. The sitemap is generated dynamically from `getIndexablePaths()`; do not hard-code a URL count. Articles enter it after editorial approval and a valid, non-future `published: YYYY-MM-DD` date, provided neither `draft: true` nor `noindex: true` is set. The [indexing audit](docs/indexing-audit.md) records the current inventory and validation results. Error pages remain noindex and do not inherit the homepage canonical.

## Cloudflare Pages Free

The repository root contains `package.json`. The production project should build `main`; use the Git workflow explicitly authorized by the owner for the current change. Preserve the existing `proofwelllife.com` domain and DNS. Cloudflare's supplied `CF_PAGES=1` and `CF_PAGES_BRANCH` distinguish production `main` from protected branch previews; a missing branch value under Cloudflare also keeps indexing blocked.

| Setting | Value |
| --- | --- |
| Project type | Pages static site, not Workers/OpenNext |
| Framework Preset | Next.js (Static HTML Export), or None with these manual settings |
| Root Directory | Repository root (`.`; leave blank if the UI uses blank for root) |
| Node.js Version | `24.x`, selected using the existing `.nvmrc` |
| Build Command | `npm run build` |
| Build Output Directory | `out` |
| Database / application secrets | None |
| `NEXT_PUBLIC_SITE_URL` | `https://proofwelllife.com`, or unset to use the approved default |

Pages installs dependencies before building by default. To enforce exactly `npm ci`, set the **build-only** variable `SKIP_DEPENDENCY_INSTALL=1` and use `npm ci && npm run build` as the build command. This does not introduce a runtime environment dependency. Do not use `next export`, `next start`, `.next`, an OpenNext adapter, or Wrangler to serve this static site. No new package is required.

Deploy the entire `out/` directory, including `_next/` and Next.js navigation payload files. Retain `404.html` and Pages' clean-URL behavior; do not add a catch-all SPA rewrite to `index.html`. Direct visits and refreshes must resolve each article's own exported HTML. New content requires a rebuild and deployment.

The generated `out/`, `.next/`, local screenshots, and local `.env*` files are excluded from Git; Pages generates the deployable artifact from the committed source and lockfile. Static export has no runtime sitemap regeneration: changing build variables requires a fresh build and deployment. Vercel Pro is not required.

## Browser verification

Run `npm run build`, then `npm start`. In another terminal run `node scripts/check-site.mjs`; it uses http://localhost:4173 by default. Set `BASE_URL` to check a different local static preview. It uses `/usr/bin/chromium` when available; otherwise install a Playwright browser with `npx playwright install chromium`. Set `CHROMIUM_EXECUTABLE_PATH` to use another installed browser. It checks internal routes, direct article visits and refreshes, search, mobile navigation, form feedback, 404 behavior, static resource loading, noindex metadata, and horizontal overflow at four viewport widths. Screenshots are saved in the ignored `screenshots/` folder.

Editorial metadata guard checks can be run with `node scripts/check-editorial.mjs` on Node 24. They test review/date/evidence gating and missing/unsafe source handling without adding published sample sources or credentials.

Run `node scripts/check-indexing.mjs` for publication, canonical-origin and preview guards. With the static server running, `npm run check:sitemap` parses the actual served XML and verifies every listed page's HTTP status, canonical and indexing directives, plus exact agreement with the exported HTML. For the required final live check, run `BASE_URL=https://proofwelllife.com npm run check:sitemap` against the same built commit after deployment; local-only success is not production verification.

## Phase 3 trust and SEO

The current contact is **ProofWell Editorial Team — proofwelllife@gmail.com**. Edit `officialContact` in `lib/site.ts` to change it consistently across trust pages, the footer, and Organization structured data. Trust-page content is in `lib/trust-pages.ts`; `/editorial-policy` is the full policy and the existing `/editorial-standards` route remains available as an overview.

See [the Phase 3 review guide](docs/phase3-trust-seo.md) for remaining owner content inputs and the historical preview policy. The current policy permits indexing eligible production public pages and published articles while protecting unfinished content; [the indexing audit](docs/indexing-audit.md) supersedes historical fixed URL counts and blanket draft descriptions. [The sitemap release guide](docs/sitemap-fix.md) records the earlier empty-sitemap fix.
