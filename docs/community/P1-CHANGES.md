# P1 本轮文件增量

下表相对于 P1 开始时的未提交工作快照；不是相对于 main 的全部 Community 差异。此前 P0/Community 文件继续保留，未暂存或提交。

| 状态 | 文件 |
| --- | --- |
| 修改 | `.env.example` |
| 修改 | `app/community-admin/page.tsx` |
| 修改 | `components/community/article-community.tsx` |
| 修改 | `components/community/community-panel.tsx` |
| 修改 | `docs/community/LAUNCH-READINESS.md` |
| 新增 | `docs/community/P1-CHANGES.md` |
| 新增 | `docs/community/P1-IMPLEMENTATION.md` |
| 新增 | `docs/community/P1-OPERATIONS.md` |
| 新增 | `docs/community/P1-PREFLIGHT.sql` |
| 新增 | `docs/community/P1-VALIDATION.md` |
| 修改 | `docs/community/SETUP.md` |
| 新增 | `lib/community/analytics.ts` |
| 新增 | `lib/community/privacy.ts` |
| 修改 | `lib/pages.ts` |
| 修改 | `lib/trust-pages.ts` |
| 修改 | `scripts/community/check-browser.mjs` |
| 新增 | `scripts/community/check-p0-baseline.mjs` |
| 新增 | `scripts/community/check-p1-client.mjs` |
| 新增 | `scripts/community/check-p1-database.sql` |
| 新增 | `scripts/community/check-p1-policy-browser.mjs` |
| 新增 | `scripts/community/check-retention-concurrency.mjs` |
| 新增 | `scripts/community/p0-baseline.json` |
| 新增 | `supabase/migrations/202611190003_community_retention.sql` |

本轮共 23 个文件。完整本轮 unified diff 位于 `/workspace/proofwell-community-p1-qa/P1-complete.diff`。P0 保护清单为 `scripts/community/p0-baseline.json`；验证结果见 P1-VALIDATION.md。
