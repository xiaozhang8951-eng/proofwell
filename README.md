# ProofWell

An independent English-language editorial website for evidence-led beauty, wellness, and healthy living. Built with Next.js App Router, TypeScript, Tailwind CSS, and local MDX. No database is required.

## Local preview

Use Node.js 24.x, matching `package.json` and `.nvmrc`.

```sh
npm ci
npm run dev
```

Open http://localhost:3000 on the same computer that runs the server. A server started in the cloud workspace does not make your own computer’s localhost point to that workspace. For a production preview, run `npm run build` followed by `npm start`. Run `npm run typecheck` to check TypeScript.

## Structure

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

### Reviews and comparisons

For a product review use `category: "Reviews"`, `section: "reviews"`, and `kind: "review"`; copy the framework in `lib/templates.ts`. Use `visual: "mask-0"` through `mask-3` for conceptual illustrations. For a comparison use `category: "Comparisons"`, `section: "comparisons"`, and `kind: "comparison"`. `SpecificationTable` takes `rows` and `ComparisonTable` takes `headers` and `rows`; both have accessible, horizontally scrollable containers for small screens. Do not fill them with guessed data.

### Supplements and future categories

For supplements use `section: "supplements"`, `kind: "supplement"`, and copy `templates/supplement-review.mdx` into `content/supplements/` (section lists also live in `lib/templates.ts`). `SupplementEvidence`, `IngredientEvidence`, `SafetyNote`, and `MechanismSummary` are available in MDX. Include educational-not-medical-advice language and references. Never imply disease treatment.

Supplements, Sleep, Recovery, Nutrition, Healthy Aging, and Wellness Technology already have landing pages. Add articles with matching `section` values to activate their collections. Use `planned` in `lib/pages.ts` to manage future coverage. Add a category to that file to generate another landing page. Add a topic in `lib/site.ts` and attach its slug to article `topics` arrays to create a topic cluster. Footer links are in `components/layout.tsx`.

## Design and navigation

Edit `navigation` in `lib/site.ts` for desktop and mobile navigation. Search automatically includes all MDX articles. Colors and typography tokens are at the top of `app/globals.css`; responsive styles are in the same file. SVG and CSS illustrations are original, conceptual placeholders, not representations of product specifications. Replace them only with licensed/manufacturer-approved images using `heroImage` and appropriate alt text. Next Image is already supported by the article template.

## Forms

Newsletter and contact forms are frontend previews. They validate input, explain that no submission has been sent or stored, and make no external requests. Connect a provider before opening subscriptions or contact delivery. Update the privacy notice to match the actual service and handling of personal information.

## Affiliate links

No active affiliate relationships or links are included. Future links can be placed inside a review's Alternatives or Price and Value section using a clear editorial label such as “View product details” or “Check current price”. Use `rel="sponsored nofollow noopener"` on commercial external links. Keep the disclosure near the beginning. Do not change verdicts to suit commercial relationships. ProductSchema and ReviewSchema helpers in `components/seo.tsx` are intentionally unused until actual verified review content is ready; no ratings are emitted.

## Before public launch

All article pages are unpublished editorial drafts. Product names and interrogative draft titles reflect the brief, not independently verified claims. All of the following still require owner review:

- Scientific mechanisms, clinical findings, efficacy, safety, and realistic expectations.
- Real references (all sample citations say `[Verified reference required]`).
- Device specifications, doses, usage protocols, warnings, regulatory status, current region-specific prices, and source/access dates.
- Verdicts, pros/cons, product suitability, recommendations, and any future ratings.
- Founder credentials, author biography, any hands-on testing claims, and actual publication/update dates.
- Licensed product imagery, actual affiliate relationships, and appropriate disclosures.
- Legal owner/contact details, privacy retention/service details, jurisdiction-specific terms, and effective dates.

`robots.ts` disallows crawling and root metadata emits `noindex, nofollow` while this is a draft. This reduces accidental indexing; it is not access control. Once facts and legal content are reviewed, deliberately revise both settings for launch.

## Canonical URLs and Vercel

Copy `.env.example` to `.env.local`, and set `NEXT_PUBLIC_SITE_URL` to the real production origin, e.g. your owned HTTPS domain. Without a real origin, no invented canonical domain, absolute JSON-LD, or sitemap URLs are emitted. With the origin set, Article, Organization, and Breadcrumb structured data and the XML sitemap are generated. No fabricated publication dates or ratings are included.

The GitHub repository contains `package.json` at its root; Vercel's Root Directory must be `.` (repository root), not `proofwell`.

| Setting | Value |
| --- | --- |
| Framework Preset | Next.js |
| Root Directory | `.` |
| Node.js Version | `24.x` |
| Install Command | `npm ci` |
| Build Command | `npm run build` |
| Output Directory | Leave at the Next.js default (`.next`) |
| Environment Variables | None are required for a draft preview. |

`NEXT_PUBLIC_SITE_URL` is optional for previews. Set it to the final stable HTTPS origin, without a trailing slash, when canonical URLs and the sitemap are needed. Because it is used at build time, rebuild after changing it. No database URL, API key, or custom domain is required for this version.

The development snapshot is pushed to `proofwell-draft`, leaving `main` unchanged. Only a Preview deployment should be created during draft review; do not merge or promote it to Production. If the repository already has a Vercel integration, check its production branch configuration before changing branches. A first-time Vercel project import may create a production deployment automatically, so do not import/deploy until that action is authorized. No Vercel deployment or domain purchase has been performed.

## Browser verification

With the site running locally, run `node scripts/check-site.mjs`. It uses `/usr/bin/chromium` when available; otherwise install a Playwright browser with `npx playwright install chromium`. Set `CHROMIUM_EXECUTABLE_PATH` to use another installed browser. It checks internal routes, search, mobile navigation, form feedback, 404 behavior, and horizontal overflow at four viewport widths. Screenshots are saved in the ignored `screenshots/` folder.
