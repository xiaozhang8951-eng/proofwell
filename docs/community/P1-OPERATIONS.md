# Community P1 — 人工配置及运营验收手册

**本轮未执行下列任何远程操作。** 所有真实项目、密钥、job、Google 变更和生产启用均需单独批准。不要把测试 `.invalid` URL、合成密码/token 或 QA 文件用于部署。

## 数据库顺序及检查

1. Supabase Dashboard → 项目 → SQL Editor / migration history：空项目按 `202611190001` → `202611190002` → `202611190003` → `seed.sql`；已有 001/002 的项目只补 003。不重放初始化、不 reset、不覆盖既有用户/文章/投票。由 Supabase migration history 管理一次执行；003 再执行会失败并回滚，不设计为重复初始化脚本。
2. `seed.sql` 不重置现有 article/poll，不插入管理员或虚假互动；重复执行不是升级已配置文章的方式。`test-bootstrap.sql` 及 `check-*-database.sql` 只用于隔离库，绝不能复制到正式 Supabase。
3. 运行 SELECT-only `P1-PREFLIGHT.sql`；应有 12 张 Community RLS 表；anon/authenticated 无表权限及受保护 RPC 权限，service_role 只执行外部边界函数。legacy/helper 仅 owner 可调用。不关闭 RLS 解决错误。
4. 先运行 `select public.community_maintenance();` 默认 dry-run，核对清理范围。批准后才能使用 `select public.community_maintenance(false);`，先在 staging 验证真实计数和备份恢复。此入口没有浏览器 action，不要加到公共 API。
5. Supabase → Integrations → Cron（或实际 Dashboard 的 Database/Extensions）：确认项目支持调度后，**拟**设置 `proofwell_community_retention`，SQL 为上述显式 false 调用。频率、时区、提前清理/容忍窗口和报错告警必须人工批准；不要把运行间隔误认为无延迟的硬到期删除。上线验收应以最老记录实际年龄和任务失败监控证明不违反最长保留政策。不要在未知项目直接运行 schedule 命令。
6. 所有分类的 questions 都适用 90 天，不因 reviewed/hidden 延长；approved/normal hidden comments 不自动删除。历史 hidden 的 normal 分类需要审核，不自动当垃圾。确认垃圾优先用现有管理 Delete；需要隔离保存的 spam 由授权 operator 在核实 ID 后显式分类（不得仅按 hidden 状态批量分类）。
7. 控制 `community_audit_log` 180 天，rate buckets 两天到期、nonce 五分钟到期；仅清理已到期项。Provider 的 raw IP、Auth/Edge/Pages/Turnstile 日志、备份和导出文件须单独核对最长 30 天等适用限制，不能靠应用表没有 IP 字段就勾选。

## 人工后台配置表

| 验收项 | 后台入口 / 操作 | 待填写内容与证据 |
| --- | --- | --- |
| 个人运营者 | Privacy/Terms 审核记录 | 实际法律身份及依法需披露的信息，品牌 ProofWell；官方邮箱 proofwelllife@gmail.com；不虚构公司/地址/电话 |
| 市场与权利 | 政策审核 | 美国/英国/加拿大/澳大利亚及其他访客适用规则、法律依据、必要通知、年龄政策、投诉/申诉与权利处理时限；不能宣称统一司法辖区 |
| Supabase 区域 | https://supabase.com/dashboard → 实际项目 Settings / Infrastructure（按 UI 核实） | 真实 REF、区域、合同/DPA、子处理者、国际传输与备份配置，均待确认 |
| Auth 与 staff | Dashboard → Authentication；`SETUP.md` 管理员授权 SQL | 保留匿名 Auth CAPTCHA，真实非匿名 staff 账号+allowlist；强密码/可用 MFA；管理员撤权删 allowlist 并撤销会话，不删除 Auth 用户代替撤权 |
| CAPTCHA/IP | https://dash.cloudflare.com → Turnstile / Pages settings | 保留 P0 的 hostname/action、两段服务器秘密、Pages 可信 ingress 与签名/nonce；真实 staging 验收仍待做，不能信任客户端头或关闭 CAPTCHA |
| 审核覆盖 | 内部运营记录 | 主要/备份审核人、值班时段、响应目标、垃圾/健康隐私/争议升级规则，不编造已有人值班 |
| 删除与导出 | 授权管理界面、受限内部存储 | 请求核实规则、负责人、导出存放与删除期限、备份恢复后重删流程；禁止 CSV 放入公共仓库或分析工具 |
| 保留任务 | Supabase Cron / job history | 执行频率、时区、最长记录年龄、失败告警与恢复证据；未配置不能上线 |
| Google | https://tagmanager.google.com / https://analytics.google.com | 实际容器权限/现有 base tag 与 destination、CMP、自动采集、DebugView；不得创建第二套 Google 标签 |

## 删除与申诉流程

- 邮箱入口 ProofWell Editorial Team — [proofwelllife@gmail.com](mailto:proofwelllife@gmail.com)。批准评论下方链接只打开邮件客户端；不会自动发送。其模板仅含公开文章和 comment reference，不填昵称/评论文本/Auth ID/token。
- 给请求建受限工单，记录最少信息；核对文章、时间和其他适度上下文。**公开 ID/昵称不是身份凭证**；不要承诺仅凭 ID 删除，不索取密码/token/医疗记录，也不要请求读者清空存储以“验证身份”。无法核实时交负责人按适用法律和风险处理，不能自动公开内容。
- 对已核实评论/问题，用既有 staff moderation 的 Delete。该管理请求仍需非匿名 Auth、allowlist、签名、nonce；不开放用户任意 delete API。涉及投票/反馈时，授权 operator 在服务器端定位实际 Auth user，按明确文章/用户 scope 审查并删除尚存 raw rows；不要为删除方便把 service_role 发到前端或先删 Auth 用户造成 cascade。
- 正常删除请求不调用过期归档 helper；真正不可关联的旧汇总已无法按个人反查。检查受限 CSV/导出、工单、第三方供应商及备份；必要例外、备份到期和公开副本限制应向用户准确说明，不保证互联网所有副本都能移除。
- 本轮没有新增保存隐私请求的表单/数据库，也没有发送邮件。实际请求处理与回复时限由所有者审核，不能凭前端链接宣称权利已自动实现。

## GTM / GA4 映射（准备，未配置）

现有容器源码为 `GTM-TK8MNNSV`；所有者提供 GA4 `G-9RENYENMPD`。这不是后台访问/数据流验证。不要重装 `gtag/js`、第二容器或基础 Google Tag，不添加 Ads `AW-18568807997` 的转化，也不把四事件标 key event。先恢复正确账号权限并检查当前 tag/trigger，尤其 catch-all Custom Event 或正则 trigger，避免每次成功发两条。

| dataLayer event | Custom Event trigger 名称建议 | GA4 Event tag 名称建议 |
| --- | --- | --- |
| poll_vote | CE - poll_vote | GA4 - Community - poll_vote |
| comment_submit | CE - comment_submit | GA4 - Community - comment_submit |
| article_feedback | CE - article_feedback | GA4 - Community - article_feedback |
| question_submit | CE - question_submit | GA4 - Community - question_submit |

仅使用现有 GA4 destination；两个 Data Layer Variable v2：`DLV - article_slug`、`DLV - interaction_type`。每 tag 仅对应同名事件和两个参数。禁止 Form Element/Text、昵称、正文、邮箱、用户/评论 ID、IP/hash、token 或整份 dataLayer。管理员页面的 GA4 Enhanced Measurement/Form interactions 及 GTM 自动表单采集必须审查，避免自动采集登录信息；不能仅靠四事件的白名单保证整个容器没有 PII。

批准的 CMP 在初始化和变化时同步 `analytics_storage` 的实际许可；先监听 ready，再检查已经存在的桥接（如下示意，不是默认授予同意）：

```js
// Place only inside the approved CMP integration, never paste a hard-coded grant.
function syncCommunityAnalytics() {
  const choice = readActualApprovedCmpAnalyticsChoice(); // implement using the actual CMP
  window.ProofWellCommunityAnalytics?.setConsent(choice === true ? 'granted' : 'denied');
}
window.addEventListener('proofwell:community-analytics-ready', syncCommunityAnalytics);
syncCommunityAnalytics();
// Also call syncCommunityAnalytics on every actual CMP consent change/withdrawal.
```

尚无实际 CMP，函数名只是明确的集成占位，不是可部署代码；不要创建假 CMP。单独的 `NEXT_PUBLIC_COMMUNITY_ANALYTICS_ENABLED` 继续 false，实际 CMP/地区要求、Google additional consent checks、广告个性化/Signals/destinations 审核通过后才考虑打开。桥接不替代全站 Consent Mode；no-sale/no-profiling 的 Community 政策不能靠客户端 flag 保证第三方配置。

真实 staging 验收：拒绝/未选择/撤回 → 无这四个 push/tag/collect；同意且后端首次 accepted → 一个对应事件；重复/429/CAPTCHA失败/仅建会话/管理操作 → 无成功事件；恢复同意不回放历史操作。Tag Assistant 和 GA4 DebugView 记录实际 destination/数量及参数，遮蔽凭证；没有真实证据不得标记“GA4 已通过”。

## 放行清单

- [ ] 个人主体、区域、年龄政策、生效日、合法依据和跨境处理获审；Privacy/Terms 仍保留 draft/原索引策略直到单独批准。
- [ ] 001/002/003 的实际 migration history、12 张 RLS 表及私有权限获验。
- [ ] P0 托管 Auth CAPTCHA、可信 IP、签名和 replay 均真实 staging 验收。
- [ ] 审核值班、删除/申诉/导出操作执行演练；原始数据/备份/provider 日志期限满足政策。
- [ ] 清理调度、负载/全局写锁延迟、告警/失败恢复证据齐全。
- [ ] 实际 CMP、现有单 GTM/GA4 映射和无 PII/不做广告画像验收。
- [ ] owner 对代码、政策、真实配置、合并/部署及生产互动启用分别书面批准。

未全部通过继续 `NEXT_PUBLIC_COMMUNITY_ENABLED=false`、Pages/Edge `COMMUNITY_ENABLED=false`、`NEXT_PUBLIC_COMMUNITY_ANALYTICS_ENABLED=false`。本轮没有改变远程开关。
