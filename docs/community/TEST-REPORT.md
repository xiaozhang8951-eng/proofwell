# Article community implementation review

Date: 2026-11-19 (Asia/Shanghai).
Worktree: `/workspace/proofwell-article-community`.
Branch: `feature/article-community`.
Baseline: `origin/main` commit `46d88f664bbb64931b552c5989f52e1737aeb79e`.

**Development code and local validation complete; real service setup and human acceptance are still required. No commit, push, merge or production deployment was performed.** Main's checkout is unchanged and clean. The final static export uses the default-off configuration, not the synthetic browser-test settings.

## Implemented behavior

- One shared module after MDX/references/author information and before related articles, with the exact requested English title/subtitle.
- Independent article polls with real DB counts/percentages, guest-account deduplication, server rate limits, total votes and immutable poll history.
- Plain-text nicknames/comments, server timestamps, 10-comment cursor pages, pending-by-default moderation and admin approve/hide/delete.
- One helpfulness response per article/verified Auth user, aggregate helpfulness percentage, no invented totals.
- Private questions/suggestions queued for staff review, never returned by the public API.
- Per-article question/options/prompts, defaults, reviewed seed registration and administrative editing without editing MDX.
- Supabase Auth anonymous guest sessions, separate single-use Auth/write CAPTCHA tokens, server-side JWT verification, IP HMAC/rate controls and strict table/RPC grants with RLS.
- A noindex static administrator shell at `/community-admin`, protected backend allowlist, summaries, poll results/history, moderation, settings and formula-safe CSV export.
- Existing GTM `dataLayer` events only after accepted writes; no nickname, text, email, user UUID or token parameters.
- Deferred service/SDK loading, error/retry and empty states; no requests or simulated counts in the default unconfigured build.

## Executed tests

| Check | Result |
| --- | --- |
| TypeScript `npm run typecheck` | Passed |
| Production `next build --webpack` / static export | Passed; final `out/` has 49 HTML files including the protected administrator shell |
| Deno `check` of Supabase Edge entrypoint | Passed using actual Deno checker |
| API security suite | 17 tests passed: origin enforcement, bounded JSON, authentication, ignored browser actor, input/honeypot validation, CAPTCHA/action/hostname enforcement, production verification guard, IP trust guard, rate errors and staff authorization |
| PostgreSQL migration and seed | Executed successfully against isolated PostgreSQL 17 with no network/host ports; no production project involved |
| Database behavior/security | Passed actual role switching and permission denial, RLS/grants, verified-identity unique votes/feedback, independent article results, pending isolation, moderator access, approval/hiding/deletion, private suggestions, pagination, poll immutability/versioning/history, stale-poll rejection, network cap across rotated guest identities and audit records; synthetic mutations rolled back |
| Browser default-off mode | All 19 article routes checked; zero service/Auth reads/writes; nine unpublished articles remain inactive |
| Browser test-enabled mode | All 19 routes and complete interaction flow passed with explicitly intercepted synthetic API/Auth/Turnstile fixtures; one-time token reset, refresh deduplication, no optimistic moderation, no event on rejection, pagination, outage/retry, staff moderation, settings, CSV and logout |
| Responsive/browser rendering | 390 / 768 / 1440 px passed, no horizontal overflow; screenshots inspected for desktop/mobile |
| Export/template test | Exactly one module per article, after references and before related; one existing GTM install; admin noindex and excluded from sitemap |
| GTM event/CSV checks | Four whitelisted event shapes passed; spreadsheet formula escaping passed |
| Sitemap HTTP/meta check | 29 entries, all local HTTP 200; canonical/robots/Open Graph/structured data checks passed; drafts/admin excluded |
| Listing regression | 49 exported HTML checked, seven unfinished entries remain hidden; homepage still four reviews and one comparison; search, collections and responsive checks passed |
| Content/global regression | All 19 MDX files byte-identical; root layout/GTM, global CSS, canonical/indexing helpers, robots/sitemap source and Next export config unchanged |
| Exported SEO regression | All 48 previous HTML metadata/canonical/JSON-LD sets preserved; sitemap.xml and robots.txt byte-identical |
| Secret/fixture scan | No service-role variable/secret or test service/site-key configuration in final exported HTML/JS |
| Dependencies | Only official Supabase client/dependencies added; all pre-existing locked package versions preserved |
| `git diff --check` | Passed |

No test here demonstrates live Supabase gateway behavior, live CAPTCHA acceptance, real anonymous Auth configuration, production moderation or GA4 receipt. Browser fixtures are **not real readers or production data**. PostgreSQL tests use a minimal test Auth schema, not a full Supabase hosted environment. Local GTM requests were stubbed to avoid sending real analytics while exercising the UI; event queue assertions are not GA4 DebugView verification.

## Required acceptance and launch gates

Follow [SETUP.md](./SETUP.md) for the complete environment-variable inventory and deployment sequence. Before enabling, the owner must provide/configure the actual Supabase project/public credentials, apply migration/seed, enable anonymous Auth and CAPTCHA, configure Turnstile/secrets, verify the trusted gateway IP contract, create/allowlist staff, approve privacy/terms/retention/moderation policy, configure existing GTM event tags/consent and complete real staging end-to-end tests. Production flags remain off until approval.

The anonymous design prevents unlimited refresh voting and limits identity rotation, but does not claim to establish one human per account or defeat VPNs/device changes. The documented IP limits can affect shared networks. No fake credentials, human identities, clinical-review records or interaction counts were introduced.

## Changed files

The following list includes every source/config/test/doc addition or change in this worktree:

- `.env.example`
- `app/[...slug]/page.tsx`
- `app/community-admin/page.tsx`
- `components/community/article-community.tsx`
- `components/community/community-admin.tsx`
- `components/community/community-panel.tsx`
- `components/community/community.module.css`
- `components/community/turnstile.tsx`
- `docs/community/SETUP.md`
- `docs/community/TEST-REPORT.md`
- `lib/community/client.ts`
- `lib/community/config.ts`
- `lib/community/types.ts`
- `package-lock.json`
- `package.json`
- `scripts/community/check-api.mjs`
- `scripts/community/check-browser.mjs`
- `scripts/community/check-client.mjs`
- `scripts/community/check-database.sql`
- `scripts/community/check-export.mjs`
- `scripts/community/generate-seed.mjs`
- `scripts/community/test-bootstrap.sql`
- `supabase/.env.example`
- `supabase/config.toml`
- `supabase/functions/community/deno.json`
- `supabase/functions/community/handler.mjs`
- `supabase/functions/community/index.ts`
- `supabase/migrations/202611190001_article_community.sql`
- `supabase/seed.sql`
- `tsconfig.json`
