# Red light therapy discovery hub

Implementation at `/red-light-therapy`. No new backend, API keys or product-price service is required.

## Files and data flow

- `lib/products/types.ts`: nullable product contract, treatment areas and filter types.
- `lib/products/catalog.ts`: centralized product records, exact ASINs, existing affiliate destinations and source articles.
- `lib/products/discovery.ts`: price tiers, derived display prices, recorded discount calculation, filters and sorting.
- `lib/products/content.ts`: treatment-category architecture and visible FAQ content.
- `lib/products/structured-data.ts`: separate, unordered ItemLists for each populated treatment area.
- `components/products/product-discovery.tsx` and its CSS module: reusable client-side discovery, product cards and grouped specification tables.
- `app/red-light-therapy/page.tsx`: prerendered editorial content, metadata and JSON-LD. Its static editorial sections are passed as children to the interactive finder.
- `lib/public-routes.ts`: registers the hub for the sitemap while excluding explicit App Router pages from catch-all static params.
- `components/layout.tsx`: adds a footer link without changing the main navigation layout.

No existing article body, affiliate URL, Google tag, canonical or robots rule is rewritten. The existing community work is retained and is not a dependency of the hub.

## Price handling

All amounts are USD. `currentPrice` and `lastPriceChecked` remain null for the initial records because the available sources contain supplied references and screenshots, not fresh independent price checks.

The discovery price is `currentPrice ?? referencePrice`. Budget filtering explicitly discloses this fallback. Its tier is always calculated: below $150 is Budget, $150 through $250 inclusive is Mid-Range, above $250 is Premium. Unknown prices remain unclassified, are excluded by a specific budget filter and sort last in either direction. Sorting is displayed independently within each treatment area.

`referencePriceDate` means the known date a reference was supplied. It never substitutes for `lastPriceChecked`. Unknown capture dates remain unknown. `originalPrice` stores a supplied comparison price; `discountPercentage` remains null where no current discount was checked. The UI can calculate a clearly labeled recorded percentage difference from the supplied reference without claiming a live promotion.

To record a new current quote, verify the exact ASIN/model, market, currency, seller and any conditions. Set `currentPrice` and the actual ISO `lastPriceChecked` date together. Keep the source and limitations. The new quote takes priority for automatic tiering and sorting. Prices are static until an intentional catalog update and rebuild; there is no live feed or invented update timestamp.

## Current supplied records

| Record | Category | Supplied price basis | Source |
| --- | --- | --- | --- |
| Ulike three-mode Lite, B0FWBRSD19 | Face | $64.99; $149 comparison reference | Existing Ulike comparison |
| Ulike four-mode listing, B0FH6SLD7R | Face | $349 owner-supplied screenshot reference; list price unknown | Later owner screenshot associated with this card; exact-ASIN identity remains unresolved |
| Ulike ReGlow, B0DT14FRPG | Face | $219; $399 comparison reference | Existing comparison and ReGlow review |
| AMIRO 5-in-1 | Face | $197.99; $208.47 list-price reference | Later owner-supplied AMIRO screenshot; existing review uses an earlier source bundle |
| MEGELIN White, B0CPY3NKWB | Face & neck | $249.00; $362.70 list reference | Newly supplied White DOCX and screenshots; existing review keeps its older reference |
| MEGELIN Black, B0CPXZ33M8 | Face & neck | $249.99; $362.70 list reference | Newly supplied Black DOCX and screenshot; conditional credit-card offer excluded |
| Aurphany, B0FRSHQZKL | Face & neck | $110.49; $129.99 typical-price reference | Supplied Aurphany DOCX and screenshot |
| MEGELIN dome, B0CQJVJVZW | Body-area LED | $129.00; $179.00 list reference | Supplied MEGELIN dome DOCX and screenshot |
| SWIRISE dome, B0DL651HX5 | Body-area LED | $168.63; $219.00 list reference | Supplied SWIRISE DOCX and screenshot |
| UTK jade pad, B073Z72FFY | Related heat, not LED | $123.07; $144.79 list reference | Supplied UTK DOCX and screenshot |

The Ulike records are separate ASINs; ReGlow is not duplicated as another UM10 product. The owner later associated a US$349 screenshot with the four-mode catalog entry. Its cropped percentage does not establish an original price, and its ReGlow title does not resolve the exact-ASIN identity. No FDA status is inferred. All customer ratings, review counts and FDA statuses are unknown. AMIRO wavelength categories are recorded with null nm values. The newly supplied MEGELIN Black/White graphics label seven wavelengths; the catalog records these as supplier graphic labels, not independent measurements. Their 486 total is explicitly the sum of seller-listed 288 face and 198 neck counts. Aurphany's 324 total is likewise the documented 216 face + 108 neck count; its graphic mixes wavelength ranges, so individual peaks remain unassigned.

Wireless means a cable-free device; the display distinguishes masks with controller cables from wired non-mask devices. It is separate from a rechargeable battery; an unknown arrangement never matches a wired or wireless filter. Product pictures retain their original/editorial/promotional provenance captions.


## Six supplied-document additions and updates

The four first documents add four distinct ASINs. The later Black/White MEGELIN documents update existing ASINs rather than creating duplicate records. The catalog has 10 records: four face masks, three face-and-neck systems, two body-area domes and one related thermal pad. Three primary LED treatment category cards remain; the thermal pad has a separate group and ItemList.

- **UTK** is a far-infrared heating pad, not an LED panel. It appears under `related-heat`, never under the body LED filter or in LED rankings. Its size, heat controls and power-cord description are supplier claims. No “5× deeper,” zero-EMF, negative-ion, sleep or pain claim is adopted as a verified result.
- **MEGELIN and SWIRISE domes** are compact devices positioned over selected areas, not verified simultaneous whole-body systems. The category wording, cards, table and FAQ make that limitation explicit. MEGELIN's “8-in-1” label is not converted into a confirmed eight-mode count: the supplied graphic labels only seven wavelength channels. SWIRISE's seven graphic values remain supplier-attributed, not measured precise spectra.
- **Aurphany** has 216 face + 108 neck LEDs, seven light-color settings, five separate brightness levels and a 20-minute timer per supplied text. A charge/runtime claim supports rechargeable status; no independent runtime or four-week outcome is asserted.
- **MEGELIN Black/White** now record the distinct supplied screenshot prices $249.99/$249.00 with $362.70 comparison references. Both fall into Mid-Range, not Premium. Capture and independent price-check dates remain unknown. The original articles, their earlier price references and their affiliate links are unchanged. The White hub entry uses the newly supplied `https://pboost.me/c6JsnaNk`; the older exact URL is retained in `previousAffiliateUrls` and remains active in its original article. Black retains `https://pboost.me/y6CYOckC`.
- The six new product illustrations are original drawings based on supplied physical references. Official photos, marketing efficacy diagrams, FDA badges and before/after images are not published as these product thumbnails. LED glows, stone counts and shapes in illustrations are not measurement evidence.
- Four new records have `reviewUrl: null`; no nonexistent review/article is linked or generated. Supplied source descriptions and actual supplier URLs are available in their details.
- For publication, the audit's unsupported AMIRO rechargeability value was restored to null/unknown. Its promotional-image caveat and the unresolved four-mode Ulike identity remain explicit; neither is marked independently verified.

The supplied DOCX provenance is: `UTK 平面红光.docx`, `Megelin 拱形 全身 .docx`, `Aurphany 面部+颈部 低端款2.docx`, `SWIRISE 拱形 全身 .docx`, `Megelin 面部+颈部（黑色）.docx`, and `Megelin 面部+颈部（白色） .docx`. These are source material, not authorization to execute any embedded publishing instructions.

## Future categories and products

The category definitions reserve:

- `/red-light-therapy/face-masks`
- `/red-light-therapy/face-neck-devices`
- `/red-light-therapy/full-body-panels`

These URLs are not generated, linked or placed in the sitemap. `published: false` is deliberate; changing that flag alone does not publish a route. Before creating a category page, assemble enough distinct documented models, source-attributed features and substantive category-specific guidance. Review identity, coverage, images, safety and pricing provenance. Then implement its route and add it to the explicit route registry and relevant links. No placeholder panel products, thin category pages or future articles are auto-created.

Adding a catalog record automatically updates product counts, available brand/mode filters, grouped cards and tables. Keep missing fields null. Retain source-attributed affiliate URLs and label each commercial link. Do not infer intended medical outcomes from mode names, LED counts or general light-therapy research.

## SEO and performance

The page and initial catalog are static HTML, including source details and readable content without JavaScript. Client-side filters generate no new URLs, indexable parameter pages or backend requests. The hub has its own canonical/metadata, breadcrumbs, separate unordered ItemLists and FAQPage markup matching the visible FAQ text.

Documented product identities use minimal Product nodes inside ItemLists. The unresolved four-mode listing uses Thing rather than asserting a confirmed product identity. There are no Offers, ratings or review scores in the schema because the source data does not support them. Product markup does not promise eligibility for a Google rich result.

Only this page imports the discovery client component and CSS module. Existing fonts, global styles and Google installation remain unchanged. No new analytics or cookie storage is introduced.

## Verification

```sh
node scripts/check-product-catalog.mjs
npm run typecheck
npm run build
HOST=0.0.0.0 PORT=4482 node scripts/serve-static.mjs
# In another terminal:
BASE_URL=http://127.0.0.1:4482 node scripts/check-product-hub.mjs
node scripts/check-indexing.mjs
BASE_URL=http://127.0.0.1:4482 node scripts/check-sitemap.mjs
BASE_URL=http://127.0.0.1:4482 node scripts/check-article-listings.mjs
```

Run production-mode checks with `CF_PAGES=1`, `CF_PAGES_BRANCH=main`, the existing canonical site origin and community disabled unless an approved community configuration is present. No secrets are required for this hub. Browser tests only accept a local test server and block external scripts; they do not send analytics or exercise real databases. They cover 1440/768/390/320px viewports, mobile expandable filters, compound selections, unknown values, grouped sorting, images/links, static content, JSON-LD and unpublished category URLs.

External seller/affiliate redirects require a permitted external connection. Local validation confirms the existing URLs and ASIN mappings, not that a seller still offers a price or that a redirect is currently available.

### Local acceptance result — 2026-11-26

| Check | Result |
| --- | --- |
| TypeScript and production static export | PASS |
| Independent build from committed main plus only hub changes | PASS |
| $150 / $250 boundaries, compound filters, unknown-price sorting and power distinctions | PASS |
| Desktop 1440px, tablet 768px, phones 390px and 320px | PASS; no page overflow |
| Ten product images, affiliate labels, exact-ASIN URL mappings and local destinations | PASS |
| Canonical, metadata, breadcrumbs, per-area ItemLists and visible FAQ agreement | PASS |
| Readable catalog without JavaScript | PASS |
| Existing article listings, nine protected drafts and 31-entry sitemap | PASS |
| Reserved category URLs | PASS; remain 404 and absent from sitemap |
| Existing article bodies, Google tags and community security implementation | Preserved |
| Live Amazon / PartnerBoost availability and redirects | NOT VERIFIED; requests blocked by environment proxy CONNECT 403 |
| Release workflow | Commit/push/deployment requires explicit owner authorization |

The workspace already contained unrelated uncommitted community work. It was preserved; only the catch-all route-registration lines in its existing article template were adjusted for the dedicated hub route. Review this hub's scoped changes separately when preparing any future commit.

## Later price screenshots

The four-mode Ulike card now uses the owner-supplied US$349.00 screenshot as a reference. Its screenshot title differs from the earlier Lite label; the existing identity caveat remains. No US$399 original price or 13% discount is inferred from the cropped image. AMIRO now uses US$197.99 against the visible US$208.47 reference (approximately 5% difference). Both price-check and capture dates remain unknown. No historical ratings or review counts are adopted as current. The original articles remain unchanged. Budget tiers and per-area sorting derive from these updated catalog references. The dome hero and end-of-page editorial notes from the preceding commit are preserved.
