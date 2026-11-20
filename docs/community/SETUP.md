# ProofWell article community — setup and operations

Status: development implementation, **not pushed or deployed**. Feature flags default off. No Supabase project, production key, administrator, live CAPTCHA or GA4 event mapping has been fabricated. P0 follow-up implementation and its local verification are recorded in [P0-REMEDIATION.md](./P0-REMEDIATION.md); production activation is still not authorized.

> P1 development follow-up: see [P1-IMPLEMENTATION.md](./P1-IMPLEMENTATION.md) and [P1-OPERATIONS.md](./P1-OPERATIONS.md). New installations apply **001 → 002 → 003 → seed**; existing installations apply only missing migrations. A separate `NEXT_PUBLIC_COMMUNITY_ANALYTICS_ENABLED=false` gate requires a real CMP and existing GTM mapping. Privacy/Terms now include Community preparation text but remain owner-review drafts. Retention jobs and real environment acceptance have not been configured.

## Architecture and placement

The existing Next.js App Router site is a static export on Cloudflare Pages. Inspection found no existing authentication, moderation dashboard, database or Pages Functions to reuse. The new module is inserted once by `app/[...slug]/page.tsx`, after the complete MDX/references and author information, before related articles. All 19 MDX files remain untouched. Draft pages display an inactive explanation and never initiate requests.

Static HTML contains the article and module heading; approved comments and aggregate results load client-side only when the reader approaches the module (300 px). The Supabase SDK and interactive panel are split into a deferred client chunk. There are no Next.js API routes. The static article export is preserved, with one separate Cloudflare Pages Function at `/api/community` as the authenticated server gateway. `public/_routes.json` limits Functions invocation to that path. `npm start` alone previews static files; it does not run the gateway.

Community reads/writes go browser → same-origin Pages gateway → Supabase Edge Function. Auth sign-up/password sign-in still go directly to Supabase Auth with separate CAPTCHA tokens. The Pages runtime IP is normalized and bound by HMAC to method, logical function target/query, body and credential digests, origin, timestamp and nonce. Supabase rejects unsigned requests and ignores all raw IP/forwarding headers. POST nonces are consumed through a private DB RPC before business mutations; replayed writes are rejected. The Edge Function uses native fetch. All tables have RLS enabled and deny direct `anon`/`authenticated` privileges. Narrow SECURITY DEFINER RPCs fix `search_path` and grant access only to `service_role`. Readers cannot bypass CAPTCHA, rate limits or moderation by calling PostgREST directly. The service key exists only in the Edge Runtime. Authentication is independently checked with Supabase Auth `/user`; browser actor IDs are ignored.

## Required owner configuration (before enabling)

1. Create/select a Supabase project and choose an appropriate region and data-processing terms. No project has been accessed by this work.
2. Apply `supabase/migrations/202611190001_article_community.sql`, `202611190002_community_gateway_nonces.sql`, then `202611190003_community_retention.sql`, once each through migration history. Existing projects apply only missing migrations. Apply `supabase/seed.sql` afterward. The second migration adds one private RLS table and a service-only nonce RPC; the third adds RLS aggregate tables, retention classification/maintenance and count adapters while preserving P0 function bodies; it does not weaken the original tables or limits. Seed registers the actual 19 routes and their polls; it contains **no reader interactions**. Nine drafts are closed and ten currently published articles are eligible. The Edge and frontend flags still default off.
3. Enable **anonymous sign-ins** under Supabase Auth. Readers need neither an email nor a GitHub account. Configure Auth request/anonymous-signup limits and monitoring.
4. Create a Cloudflare Turnstile widget for approved production hostnames. Configure **Supabase Auth CAPTCHA** with Turnstile and its secret, and supply the same public site key to the frontend. Auth CAPTCHA and interaction CAPTCHA each consume their own token. The UI first starts a guest session, resets verification, then uses a fresh token for each write. Do not reuse a token. Administrator password sign-in also requires a fresh token (`admin_login` action). Every attempted sign-in clears the token, including failure; expired/error callbacks disable login. CAPTCHA verification cannot be disabled in the backend, including development configuration. Isolated tests simulate verifier success/failure rather than bypassing it.
5. Configure Edge secrets below. After separate approval, use distinct high-entropy secrets with at least 32 characters for the IP hash and gateway authentication. Only the gateway secret is shared between Pages and Supabase; it is not a service-role key. Use different values per environment. Never reuse an anon/publishable key, service-role key or database password as either secret; isolated test literals are public fixtures and must never become deployed secrets. Do not put server secrets in `.env.example`, `NEXT_PUBLIC_` variables, logs, commits or browser bundles.
6. Use the managed Cloudflare Pages ingress only. Validate direct visitor `request.cf` and Cloudflare-controlled `CF-Connecting-IP` in staging; audit zone Worker routes and header transforms. Worker subrequests (`CF-Worker` / cross-zone synthetic IP), missing IPs and Pseudo IPv4 overwrite inputs are rejected, with no forwarded-header fallback. Disable Pseudo IPv4 overwrite for the approved API route and confirm visitor-IP removal transforms do not strip the required header. Supabase must reject direct requests, even if an attacker supplies CF/forwarding/signature-looking headers. **`COMMUNITY_TRUST_PROXY_IP` is removed and has no effect**; no boolean can convert unsigned IPs to trusted ones. Actual managed ingress/binding validation remains an owner acceptance gate; local runtime fixtures cannot prove the live provider settings.
7. Create a normal, non-anonymous editorial staff user in Supabase Auth, then grant it explicitly using the SQL editor:

   ```sql
   -- Replace the placeholder with the actual authenticated staff email.
   insert into public.community_admins(user_id)
   select id from auth.users
   where email = 'YOUR_STAFF_EMAIL' and not coalesce(is_anonymous, false)
   on conflict do nothing;
   ```

   No self-registration, role grant or account creation exists in the admin UI. Revocation: delete its row from `community_admins`, then revoke sessions in Auth. Use strong credentials, Auth account protection and MFA where available. This implementation does not claim to enforce MFA/AAL2.
8. Review/update the site's Privacy Policy and Terms before launch: Supabase processing, persistent anonymous Auth sessions, public moderated nicknames/comments, private suggestions, abuse-protection hashes, Turnstile, deletion/contact process and actual retention. Privacy/Terms now include the owner-supplied Community preparation policy, distinguish form previews from saved interactions, and mark unresolved controller/region/effective-date matters. They remain **unapproved legal drafts**, not proof of compliance or launch authorization. The module adds a clear in-context notice and acknowledgement, but owner legal review remains required. Readers are told not to submit health records or contact details.
9. Confirm moderation staffing and implement the owner-approved retention policy and monitoring in P1-OPERATIONS.md. Approve only appropriate consumer discussion; user experiences are not verified clinical evidence. Do not allow individualized diagnosis, medical records, spam, undisclosed advertising or abuse. Moderator approval is not a scientific endorsement.
10. Configure the existing GTM container event mappings and consent handling (see Analytics below); do not install another Google tag.
11. After separate authorization, deploy both the Edge Function and Pages Function to explicitly approved staging origins with matching Turnstile hostname. Apply the nonce and retention migrations and configure the matching private gateway secret first; missing configuration fails closed. Only after human review enable both backend and frontend flags. **No production deployment is authorized by this development task.**

Example CLI sequence (commands require your real project and authorization):

```sh
supabase link --project-ref YOUR_REAL_PROJECT_REF
supabase db push
# Review/run supabase/seed.sql in that project's SQL editor.
# Set Edge secrets through Supabase's secret manager or a non-committed env file.
supabase functions deploy community --no-verify-jwt
```

`verify_jwt=false` is deliberate: public GET needs no reader login but still requires a server-authenticated gateway envelope; every mutation additionally verifies its bearer token against Auth explicitly. Do not remove handler authentication. Do not change the function to accept a user ID from the browser.

## Environment variables

Cloudflare Pages **build variables**, safe to expose (rebuild after changes):

| Variable | Value / purpose |
| --- | --- |
| `NEXT_PUBLIC_COMMUNITY_ENABLED` | `false` until approved; `true` enables the panel when other config is present |
| `NEXT_PUBLIC_SUPABASE_URL` | Actual project HTTPS origin |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Actual public anon/publishable key, never service role |
| `NEXT_PUBLIC_COMMUNITY_TURNSTILE_SITE_KEY` | Public Turnstile site key |
| `NEXT_PUBLIC_COMMUNITY_AUTH_CAPTCHA` | `true` for production; must match Auth CAPTCHA configuration |
| `NEXT_PUBLIC_COMMUNITY_ANALYTICS_ENABLED` | `false` until actual CMP and existing GTM mapping are approved; explicit analytics consent is additionally required |

Cloudflare Pages **server bindings**, not `NEXT_PUBLIC_` secrets (see `.dev.vars.example`; do not create actual production values without approval):

| Variable | Purpose |
| --- | --- |
| `COMMUNITY_ENABLED` | Default false; gateway refuses requests unless true |
| `COMMUNITY_ALLOWED_ORIGINS` | Exact approved same-origin hosts only |
| `COMMUNITY_GATEWAY_SECRET` | Private HMAC secret shared with the matching Supabase project; no database privileges |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Matching public project settings, used for the fixed upstream URL/public API key |

Keep service-role credentials only in Supabase. Never make the gateway secret `NEXT_PUBLIC_`. `.dev.vars` and `.wrangler/` are ignored. Production Git builds must retain root `functions/`; uploading only HTML to a generic static host will not provide `/api/community`.

Supabase Edge secrets (see `supabase/.env.example`):

| Variable | Purpose |
| --- | --- |
| `SUPABASE_URL` | Runtime-provided project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Runtime-provided server credential, never exposed to frontend |
| `COMMUNITY_ENABLED` | Default false; separately enable backend only after setup |
| `COMMUNITY_ALLOWED_ORIGINS` | Exact comma-separated origins, default `https://proofwelllife.com`; no wildcard |
| `COMMUNITY_REQUIRE_TURNSTILE` | `true`; false is rejected in all configurations |
| `TURNSTILE_SECRET_KEY` | Private verification key |
| `COMMUNITY_IP_HASH_SECRET` | Private random HMAC secret, minimum 32 characters |
| `COMMUNITY_GATEWAY_SECRET` | Same private server HMAC key as the matching Pages gateway; absent/wrong key blocks access |

Preview domains are not automatically allowed. Explicitly review/allow a staging origin and Turnstile hostname. Existing preview `noindex` logic remains unchanged. Do not enable public writes from every `*.pages.dev` origin.

## Identity, duplicates and spam

An anonymous Supabase Auth user has a server-verified UUID. The database enforces one vote per poll version and one helpfulness response per article/user. Refreshing preserves the SDK session; server checks remain authoritative. Clearing storage, another browser or another device can create another Auth user, so **one anonymous account is not one person**. This system makes no claim of human-unique voting.

Layered protection: Auth CAPTCHA and Auth signup limits, one-time Turnstile challenge for each interaction (hostname and action checked), honeypot, plain-text/length/link validation, database uniqueness, transaction locks and server-side rate buckets. A keyed weekly rotating HMAC represents the trusted network IP; no raw IP is stored in application tables. Infrastructure vendors may have their own request logs. Proxies/VPNs and shared networks remain limitations; a stricter identity requirement would be a separate product decision.

Current write budgets (shared across articles, enforced atomically):

- Network: 30 interactions/hour, 100/day.
- Auth user: 10 interactions/hour.
- Comments/suggestions: 3/hour per user and 10/hour per network for each type.
- Votes/feedback: 5/hour and 20/day per network for each type.
- Repeated identical comments/questions by one user/article are rejected for 24 hours.

Normal text is rendered through React, never `dangerouslySetInnerHTML`. HTML/script markup is rejected by the API and DB constraints. A comment may contain at most one URL and remains text, not a clickable HTML link. A comment is inserted as `pending` regardless of client fields. Public reads return only approved comments and omit user UUIDs and moderation metadata. Suggestions never appear in public reads.

Rate counters expire after two days and are purged on writes. Gateway replay nonces contain no IP/actor/body/token and expire after five minutes, longer than the complete accepted signature freshness window (±60 seconds); their private RPC prunes expired rows. Both tables need scheduled cleanup during inactivity. After separate approval, schedule the reviewed P1 maintenance RPC to purge expired responses, unapproved/spam comments, questions, audits and technical rows even during inactivity (default below is dry-run):

```sql
select public.community_maintenance(); -- review counts; no deletion
-- Only after explicit approval: select public.community_maintenance(false);
```

Owner-approved limits are now implemented: raw votes/feedback/questions and pending/explicit spam comments 90 days; administrator audit 180 days. Normal approved/hidden comments are not age-deleted. Auth lifecycle, actual provider logs/backups, job frequency/lag and monitoring remain owner acceptance items. A SQL cutoff alone is not a physical deletion SLA. The audit log stores action/target/time, not copies of deleted comments. Deleting an Auth user cascades its live interactions; already archived non-identifying totals cannot be linked back to that user; plan that behavior before any bulk cleanup.

## Administration and exports

`/community-admin` is a static login shell with `noindex, nofollow`, not in the sitemap. Hiding the URL is not the security control. The Edge API rejects anonymous admin access; SQL checks the staff allowlist on every operation. Non-staff registered users cannot list, export, moderate or configure.

Staff can load all articles or filter an article/status, review totals and per-option results, inspect poll history, approve/hide/delete comments, review/hide/delete questions, change per-article prompts and open/close submissions. Comments and suggestions paginate 25 records per queue. Public comments use a timestamp+UUID cursor (10 per page); no crawlable pagination URLs are generated.

Changing the question or options creates a fresh poll version and starts its displayed totals at zero. Old question/options remain immutable and results visible to staff in poll history; raw votes expire under P1 retention and their genuine counts remain in aggregate form. A stale open browser is rejected until reloaded. Counts are never transferred to new choices.

CSV export retrieves all filtered pages (1,000 rows per request, up to 100,000 per queue); it includes summary/poll history, comments and private questions, not voter UUIDs, network hashes, passwords or auth tokens. CSV formula prefixes are neutralized. Exports contain nicknames/text and must be handled as personal data. Export during a quiet moderation window: pagination is not a transaction snapshot; use an operator database export if a point-in-time snapshot or more than 100,000 records is needed. Browser multiple-download permission may be required for the three CSV files.

Future articles: `lib/community/config.ts` provides defaults and overrides. Run `node scripts/community/generate-seed.mjs`, review its SQL, then apply registrations. Existing article settings are preserved with `ON CONFLICT DO NOTHING`; administrators edit registered settings in the dashboard. Do not let arbitrary browser slugs auto-create rows.

## Analytics — existing GTM only

No changes to `app/layout.tsx`, `GTM-TK8MNNSV`, GA4 Measurement ID or Google scripts. Only when `NEXT_PUBLIC_COMMUNITY_ANALYTICS_ENABLED=true` AND the approved CMP has explicitly granted analytics permission, successful **accepted** interactions push exactly one of `poll_vote`, `comment_submit`, `article_feedback`, `question_submit` to the existing `dataLayer`, with only `article_slug` and `interaction_type`. Default/unknown/denied permission emits nothing, withdrawal blocks future events, and past events are not queued. See P1-OPERATIONS.md for the strict bridge contract. Pending comments are measured as **submissions**, not public approvals. Duplicate/rejected submissions, page loads and CAPTCHA/session creation do not emit these events.

Configure four Custom Event triggers and corresponding GA4 Event tags in the existing owned GTM container, forwarding only the two whitelisted non-personal parameters to the existing GA4 property (`G-9RENYENMPD` as supplied by owner). Respect existing consent policies; do not bypass them. Do not forward form elements, nicknames, free text, emails, user UUIDs or tokens, and do not mark these events as advertising conversions without a separate decision. Check Enhanced Measurement/third-party form listeners for PII as part of the container review. `dataLayer` tests prove event emission, **not** live GA4 receipt or consent behavior; use GTM Preview and GA4 DebugView after configuration.

## Verification commands

```sh
npm ci
npm run typecheck
CF_PAGES=1 CF_PAGES_BRANCH=main NEXT_PUBLIC_SITE_URL=https://proofwelllife.com npm run build
node scripts/community/check-api.mjs
node scripts/community/check-client.mjs
node scripts/community/check-gateway.mjs
node scripts/community/check-export.mjs
node scripts/check-indexing.mjs
node scripts/check-editorial.mjs
# Start exported-site preview before HTTP/browser checks:
PORT=4471 npm start
BASE_URL=http://127.0.0.1:4471 node scripts/check-sitemap.mjs
BASE_URL=http://127.0.0.1:4471 node scripts/community/check-browser.mjs
```

Database verification uses an **isolated blank PostgreSQL** instance: apply `scripts/community/test-bootstrap.sql` there only, then all three migrations in order, seed, `scripts/community/check-database.sql`, `scripts/community/check-gateway-database.sql` and `scripts/community/check-p1-database.sql`. Separate isolated Docker concurrency checks are available in `scripts/community/check-gateway-concurrency.mjs` and `scripts/community/check-retention-concurrency.mjs`. The bootstrap substitutes a minimal Auth schema for constraint tests; it is not a Supabase project emulator and must never run on a real Supabase project. Synthetic mutations roll back. Gateway/Auth/Turnstile production end-to-end testing still requires actual owner configuration.

The browser check supports the default disabled build and a separately built test-enabled mode (`COMMUNITY_BROWSER_FIXTURES=1`), with explicit `.invalid` service URLs and intercepted synthetic responses. Those test values are never production configuration. Test results distinguish fixture checks, real PostgreSQL checks and unavailable live-service checks.

## P0 acceptance still required before enabling

Use the real provider in authorized staging to verify administrator CAPTCHA, expiry/retry and sign-out; Cloudflare overwrites malicious incoming IP headers; Worker/Pseudo IPv4 cases fail closed; private bindings match; direct Supabase calls and signed request replays fail; the actual Pages Function is invoked only for `/api/community`; and signatures survive Supabase ingress prefix stripping (`/functions/v1/community` → `/community`). Both aliases bind the same logical target/query, never a different function.

Wrangler's local `pages functions build` and `check-pages-runtime.mjs` execute the compiled Worker in local workerd with all external calls intercepted. `check-admin-captcha.mjs` uses the real browser/Supabase SDK against an isolated CAPTCHA-enforcing Auth fixture. These prove code behavior, not production deployment or real CAPTCHA validation. Original privacy, GTM ownership/mapping, data retention and moderation launch gates remain pending. No Google tags or article content are changed by P0 remediation.
