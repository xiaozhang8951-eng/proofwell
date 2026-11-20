# Community P1 — 非生产实施与验收报告

日期：2026-11-19（Asia/Shanghai）。分支 `feature/article-community`；基准 `46d88f664bbb64931b552c5989f52e1737aeb79e`。本报告只描述本轮增量，不把此前未提交的 Community/P0 文件算作本轮新增成果。

**生产互动继续关闭。未提交、推送、合并、部署，未修改 main，未创建或配置生产密钥、数据库、Cron、Google 容器或账号。** 隔离测试不是实际 Supabase、Turnstile、Cloudflare 入站或 GA4 验收。

## 实施前审计与方案

先读取 `SETUP.md`、`LAUNCH-READINESS.md`、P0 报告、两份 migration、seed、前后端/管理组件和 Privacy/Terms；保留全部既有工作，并把 148 个源文件与原静态输出备份到 `/workspace/proofwell-community-p1-qa/`。对 43 个 P0/文章/Google/配置文件生成只读 SHA-256 基线，由 `check-p0-baseline.mjs` 检查；没有更新原 P0 代码来让新测试通过。

| 审计发现 | P1 方案 |
| --- | --- |
| Privacy 只描述预览表单；Terms 不覆盖真实互动 | 根据所有者提供的个人运营者、市场、目的、期限补充政策草稿；保留未知主体、区域、生效日等上线门槛 |
| 计数与防重依赖 raw votes/feedback；直接删会丢总数 | 新增 003：真实 DELETE RETURNING 汇总、90 天窗口防重、兼容读取与管理员导出；不改 001/002 或原 P0 函数体 |
| 隐藏评论不等于垃圾 | 记录 retention_category；正常已审核评论即使隐藏也不按年龄删；未分类历史 hidden 保守按正常保留，待人工判断 |
| 没有独立、可执行的维护入口 | 私有 operator-only RPC，默认 dry-run，不创建任务；不触碰仍有效的限流/nonce，不批量删除 Auth 用户 |
| 四类成功事件直接 push，无社区级同意门槛 | 新增独立开关和默认拒绝的 CMP 桥接；不改 Google 安装或 P0 client；失败/重复不报成功，不回放过去事件 |
| 删除请求和运营流程不够明确 | approved comment 的固定 mailto 入口、既有管理员页操作指引、人工请求/审核/清理 runbook；不新建收集身份信息的表单 |

## 所有者确认的政策

- ProofWell 是个人运营者的品牌，不虚构公司；联系 ProofWell Editorial Team — proofwelllife@gmail.com。
- 面向美国、英国、加拿大、澳大利亚，允许全球访问；按实际适用法律评估，不能宣称一套地区法律涵盖所有人。
- Community 仅为讨论、反馈、选题、审核和安全目的，不出售 Community 数据或用于广告画像；不得据此宣称现有 Google Ads/GA4 配置已经合规。
- 正常评论不自动到龄删除，处理有效删除请求；pending/明确 spam 最长 90 天；raw votes、helpfulness、questions 90 天；IP/安全日志最长 30 天；管理员操作日志 180 天。
- 投票持续开放；raw record 到期移除后同账号可再次提交。**总数是响应次数，不是独立人数**；反馈同样按 90 天原始记录窗口处理。
- 没有用户 ID/IP/时间/文本的真实累计值可拟长期保留，但真正匿名化、稀疏分组的再识别风险仍须评估，不能把所有聚合直接保证为匿名。

## 数据库变化与 P0 保护

新 migration `202611190003_community_retention.sql` 顺序在 001、002 后。新建两张 RLS 汇总表，新增保留索引和评论分类列/触发器；没有公开表策略或浏览器授权。原 001/002、seed、Auth/CAPTCHA、网关、签名、重放代码字节不变。

原 `community_read`、`community_submit`、`community_admin` 以 ALTER FUNCTION 重命名为 `*_p0`，**函数体不变**；撤销 service_role 对 legacy 入口的直接执行权，仅由 owner-context 包装函数调用。同名同参数 RPC 增加计数和到期适配，外部 Edge 接口不变。包装入口仍 service-only。`community_expire_responses` 和 options helper 仅 owner 可调用，不能通过公开 anon key 单独清理/读取。

`community_maintenance()` 默认 dry-run，仅给出计数；显式 false 才在单事务中清理。过期 raw responses 通过 DELETE RETURNING 生成计数，不保存 Auth UUID、IP/hash、raw timestamp 或文本。删除请求对尚存 raw rows 直接 scoped-delete，不走归档 helper。已经不可关联的汇总无法再按个人定位。

读使用共享事务 advisory lock，提交/维护/管理员修改使用同一排他锁，保证 raw+archive 两次读取间不会发生迁移而重复计数。此为低流量阶段的明确取舍：**写事务全局串行**，上线前需要真实负载和超时验收；不得通过删掉 P0 限流或鉴权来加速。失败抛异常会回滚归档和写入。

评论 retention_category：pending / normal / spam。新 pending 为 pending；审核 approved 后改 normal；hide 保留该分类。历史 hidden 无可靠审核历史时按 normal；不能未经判断批量当 spam。确认垃圾可用现有 Delete，需隔离保留时由授权 operator 明确标 spam。批准普通评论不会被 90 天清理误删。

**调度未创建。** 90 天/180 天是 SQL cutoff，不是已证明的线上删除时限。若 Cron 延迟，物理记录可能超期；所有者必须批准执行频率、提前量/容忍窗口、故障告警和整改方案并验证期限上限，之后才能启用。实际 provider IP/日志/备份保留、Auth 生命周期和数据区域都不能由本地 SQL 保证。

## Analytics 设计

`NEXT_PUBLIC_COMMUNITY_ANALYTICS_ENABLED=false` 为新独立公开构建开关。生产 Community 总开关也保持 false。新 `analytics.ts` 替代 panel 对原 raw helper 的调用；受保护的 P0 `client.ts` 保持不变，其旧 helper 不再由生产组件调用。

批准的 CMP 应在 `proofwell:community-analytics-ready` 和每次选择变化时调用 `window.ProofWellCommunityAnalytics.setConsent('granted' | 'denied')`。首次 unknown，其他值严格视为 denied；桥接不写 Cookie/存储、不猜测地域、不发 Consent Mode 命令、不强设 granted、不安装脚本，不记录/重放同意前事件。CMP 在每次刷新/导航的当前选择必须重新同步。未接 CMP 时不发四类事件。

事件仅 `poll_vote`、`comment_submit`、`article_feedback`、`question_submit`；参数仅 `article_slug`、`interaction_type`。没有昵称、正文、问题、邮箱、选项文本、用户/评论 ID、IP 或 token。内容公开 acknowledgement 不是分析同意。此门槛只控制 Community 事件，不控制根布局已经存在的所有 Google tags；全站 CMP、自动表单采集和 Ads destination 仍须账户审计。

映射和后台验收见 [P1-OPERATIONS.md](./P1-OPERATIONS.md)。没有实际 GTM workspace/export 权限，不能宣称 Google 已接收或 Consent Mode 已验证。

## 验证与剩余门槛

本轮最终结果与精确文件增量见 [P1-VALIDATION.md](./P1-VALIDATION.md)。生产放行仍要求：实际项目/区域/DPA、合法主体细节/生效日/年龄政策、审核值班和删除流程、清理与备份期限、真实 CAPTCHA/可信 IP/P0 验收、实际 CMP 和单一 GTM 映射、owner 书面批准。
