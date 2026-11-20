# Community P2 — Staging 准备审计与风险报告

日期：2026-11-19（Asia/Shanghai）。仓库 `xiaozhang8951-eng/proofwell`，当前分支 `feature/article-community`，HEAD `46d88f664bbb64931b552c5989f52e1737aeb79e`。本轮先只读审计，再只新增 P2 文档。**未修改 main、P0 的 43 个保护文件、应用、SQL migration、配置或文章；未 commit/push/merge/deploy；未创建密钥、项目、作业或 Google 配置；未启用生产互动/分析。**

**结论：可提交本方案供人工审核；尚不具备真实 Staging 验收完成或生产放行资格。** 没有可用的 Supabase/Cloudflare/Google 账号连接或实际项目信息；实际区域、远程开关、配额、服务商日志和已发布 GTM 配置均未知，不能由本地模板或历史测试推断。用户本轮只授权准备；批准本报告也不自动授权生产操作。

## 交付导航

- [完整验收清单](./P2-ACCEPTANCE-CHECKLIST.md)：逐项预期、证据、状态和签字。
- [账号权限与配置清单](./P2-ACCESS-CONFIG.md)：后台入口、所需信息、秘密归属和未来操作闸门。
- [真实 Staging 测试方案](./P2-STAGING-TEST-PLAN.md)：身份/IP/CAPTCHA、调度/备份、同意与分析、管理员/举报/导出，以及 19 篇文章矩阵。
- [只读数据库核查 SQL](./P2-READONLY-QUERIES.sql)：仅供获准项目核查，不是 migration、seed、初始化或清理脚本；本轮未连接远程执行。

## 状态定义与证据等级

| 状态 | 含义 |
| --- | --- |
| 已验证·本轮本地 | 当前源文件/已有 export 的只读核查或本轮无网络单元测试；不等于托管环境通过 |
| 已验证·历史隔离 | 已复核 P0/P1 留存日志，结果仍明确是本地 PostgreSQL / fixture / workerd；本轮未重跑这些测试 |
| 待配置/核查 | 有实现/配置方案，但没有读取实际远程值，可能已有配置也可能没有；不能断言后台一定为空 |
| 待人工确认 | 主体、区域、法律/运营决定、权限及操作批准不能从源码获得 |
| NOT_RUN / BLOCKED | 真实 Staging 测试未运行，或有前置门槛；不能填 PASS |

真实测试以后采用 PASS / FAIL / BLOCKED / NOT_RUN，另附环境、候选 SHA、执行人、实际时间、证据路径。历史测试不能直接复制成真实 PASS。

## 审计范围与结果

先读取 AGENTS、P0/P1/readiness/SETUP、源代码、三个 migration、seed、模板变量、根布局/索引逻辑与历史日志。对现有 162 个文件以及已有 out 建立只读 hash 快照，保存在 `/workspace/proofwell-community-p2-qa/`；原始工作未丢失。当前候选由 HEAD **加未提交文件**构成，不能仅用 HEAD 表示部署内容。

| 领域 | 已验证内容 | 实际远程状态 |
| --- | --- | --- |
| Git/保护 | feature 分支、HEAD 未变；独立 main 干净；43 个保护文件 SHA-256 匹配 | 没有 fetch 或声明拿到最新远端；没有创建候选提交 |
| Supabase | `config.toml` 的 project_id 是本地标签；公开 URL/key 模板空；12 张 RLS 表由 001/002/003 定义；service-only RPC + owner-only legacy/helper | 未知实际 Staging project REF、区域、计划、DPA、Auth、schema、RLS、staff |
| 网关 | `functions/api/community.js` → `lib/community/pages-gateway.mjs`；同源 allowlist，managed request.cf，规范化 CF IP，拒绝 Worker/Pseudo IPv4；HMAC 包含 method/query/Origin/IP/time/nonce/body/凭证摘要；±60 秒签名、5 分钟 nonce；无裸 XFF fallback | 托管 runtime、兼容日期、部署构建、绑定、Transform/Worker 链和真实 IP 未验证 |
| CAPTCHA | 管理员 SDK 传 captchaToken；访客 Auth 和每次业务写使用独立 fresh token；业务 Siteverify 检查 success、community_submit action、精确 origin hostname | 实际 widget、密钥配对、Auth provider、真实过期/重放/故障均未验证；admin_login 是前端 action 标签，不代表本应用自行验证了 Auth 的 action |
| 保留 | 003 从实际 DELETE RETURNING 汇总 votes/feedback；90 天 raw/问题/pending/spam，180 天 admin audit；正常 approved/hidden 不自动删；默认 dry-run | Cron、实际执行/失败日志、调度延迟、供应商/备份期限、Auth 生命周期未知 |
| 分析 | 根布局仅安装 GTM-TK8MNNSV 一套 script + noscript；没有发现源码中的第二容器、独立 GA4/Ads 脚本或全站 CMP；社区四事件有独立 false 开关和 unknown 默认同意 | G-9RENYENMPD / AW-18568807997 为用户提供标识，不是后台已读结果；GTM 动态载入、远程注入、GA4 收集/重复与 Consent Mode 均未知 |
| 管理/删除 | 非匿名 staff + allowlist；approve/hide/delete、分页/CSV；评论删除请求为 mailto；普通身份不是本地浏览器 ID 鉴权 | 真实账号、审核值班、删除核实/申诉与导出操作未验收；无专门举报 UI/队列 |
| 文章/SEO | 19 篇组件各一次、references 后/related 前；10 篇内容满足发布判定，9 篇未发布；已有 production-mode export 29 sitemap 条目，admin noindex | 19 篇真实 Staging 回归未跑；preview 应全部 noindex、robots disallow、sitemap 为空，canonical 保留生产域；不是要修改生产 sitemap |

### 本轮实际执行（不写源文件/构建物）

- `check-p0-baseline.mjs`：43 文件一致。
- `check-api.mjs`：22/22；`check-gateway.mjs`：11/11；fetch 均为内存 fixture，无真实服务请求。
- `check-p1-client.mjs`、`check-client.mjs`：同意门槛、事件白名单、删除 mailto、CSV 转义通过，无 Google 请求。
- `check-export.mjs`、`check-indexing.mjs`、`check-editorial.mjs`：已有 export/源码检查通过，19 篇、29 条 production-mode sitemap、9 篇保护。
- `tsc --noEmit --incremental false`：通过；避免写 tsbuildinfo。本轮没有执行 build、数据库迁移、容器、浏览器交互或远程 SQL。
- 复核 P1 的 19 篇 390/768/1440 浏览器日志、49 HTML metadata 比较、24 路 retention 并发、16 路 nonce、CAPTCHA 和数据库日志；全部属于**历史隔离**。

本轮日志在 `/workspace/proofwell-community-p2-qa/`；历史日志在 `/workspace/proofwell-community-p1-qa/`，可结合 [P1-VALIDATION](./P1-VALIDATION.md) 审查。已有 Node MODULE_TYPELESS_PACKAGE_JSON 警告不是失败，本轮未改依赖压制它。

## 风险分级

等级描述当前已知风险及放行条件，不表示已证实漏洞被利用。Critical：可导致严重环境串用/权限绕过，出现即停止；High：真实联调或数据处理前须处理；Medium：专项上线决定/验收项。没有发现可据本轮证据宣称“已被利用”的安全问题。

| ID / 等级 | 事实与影响 | 处理/通过条件 |
| --- | --- | --- |
| R01 Critical 条件门槛 | 实际 Staging 身份、区域、绑定未知；若误用生产 Supabase/key/数据将造成环境串用 | 对照项目 REF、URL、公钥来源、所有秘密存储位置；新建还是复用由 owner 确认。发现指向生产立即停止，无 reset/迁移/测试写入 |
| R02 High | P0/P1 仍未提交；当前 HEAD 不包含完整候选 | 先审查全部未提交文件及43基线，后续另获授权才 commit/push feature；固定候选 SHA、源码/迁移/构建哈希，再部署获准 Staging；本轮不做这些 |
| R03 High | 本地不能证明 CF 入站头/Worker/Transform 真值，也不能证明真实 CAPTCHA | 必须按 G/C 测试拿到真实 hosted 证据；失败不放宽 IP fallback、不关闭 CAPTCHA/RLS/nonce |
| R04 High | 90 天 cutoff + 周期任务有延迟，不能自动保证“最长90天” | 数学上最坏期限=90天+调度间隔+执行/排队延迟（故障时更长）；owner 决定可执行的硬上限方案/提前量与再投窗口一致性。未解决不承诺硬上限，不擅自放宽政策 |
| R05 High | maintenance 仅写 retention_cleanup/community 成功标记，未持久化每类数量/失败；Cron 未核对 | 真实 job history + 前后计数 + 唯一执行关联/受限监控。不能假设 cron.return_message 存了返回 JSON；需持久明细/告警时后续授权私有观测方案，不能改 P0 来绕过 |
| R06 High | Supabase/Cloudflare/Google 日志、备份、导出、Auth 用户生命周期不能被应用清理控制 | 核对实际计划/DPA/日志与备份期限、恢复后重删、用户请求；不满足30/90/180政策时阻断，不以“应用没有raw IP”代替 |
| R07 High | 社区 consent gate 不是 CMP/Consent Mode；根 GTM 仍全局加载，admin 也包含它 | 读取真实容器/Consent Overview/GA4自动表单与 Ads destinations；先保证 Staging 测试不会流入生产分析/广告。若必须改保护布局，先提出新范围申请，当前不修改43文件 |
| R08 High | 当前无独立举报 UI、后台举报记录/队列；removal mailto 不等于举报系统 | owner 明确是否接受联系邮箱的人工举报与工单流程并演练；若要求按钮/队列，单独授权开发后验收，不能将不存在功能标PASS |
| R09 Medium | admin_moderate/config 有应用 audit；登录/读取/CSV export 没有同等应用审计；维护日志也有限 | 补充人工受限导出登记并确认覆盖要求，或后续授权私有审计实现；供应商日志不能未经检查视为替代；保留策略按实际数据分类 |
| R10 Medium | P1 全局写锁串行、导出逐页非整体快照；链路 timeout 可能先于最终落库 | 受控负载/慢请求/重试测试；导出用静默窗口或获准 operator 快照。记录数据库真实结果，不把超时当未保存；不能删安全控制提速 |
| R11 Medium | Auth UUID 是假名，不是唯一人；90天后可再次投；聚合稀疏组未评估 | UI与政策明确响应次数，匿名化/稀疏组长期保留决定由owner审查；不保留新永久身份哈希规避期限 |
| R12 Medium | 个人主体实际身份、区域/年龄/法律依据/生效日和审核人员未知；未实现强制 AAL2 | 完成政策与运营确认；若要求应用强制MFA须另审实现，不能把Supabase控制台MFA说成网站staff已强制MFA |
| R13 Medium | 9 篇缺 publication date 的保护依赖发布判定和 DB enabled=false；staff 可以单独改DB开关 | 19篇矩阵 + seed/DB状态核对；不得为了联调打开草稿或改变文章日期/索引。后台打开互动不等于文章发布，也不应作为发布授权 |
| R14 Medium | 常规浏览器重试会得到新签名/nonce；只有投票/反馈及同文评论/问题的既有去重规则 | 验证实际 timeout 后最终只保存预期记录；新 nonce 不等于业务幂等键。异常记录必须作为FAIL分析，不报告Exactly-once全局保证 |

## 放行分段

1. **当前**：只读审计/文档已准备，可人工审查。全部真实 Staging 测试仍 NOT_RUN。
2. **下一次授权**：确认隔离资源/权限/候选提交/预算/数据区域及测试数据，才可实施 Staging 配置和部署；不涉及 main 或生产。
3. **Staging 验收**：按测试计划留证；任何身份串用、鉴权绕过、数据公开错误、真实 CAPTCHA/IP失败或PII分析泄露立即停止，保持关闭并上报，不自行改保护代码。
4. **生产**：本报告不授权；须另有代码、政策、配置、合并/部署及启用审批。模板默认关闭已验证，远程生产状态未读取，不能宣称远程已确认关闭。
