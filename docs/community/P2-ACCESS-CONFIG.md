# P2 — 所需账号、配置和人工决定

本清单是**待审批方案**；没有执行邀请、创建项目/key/widget、修改变量、Cron、GTM 或部署。请先提供脱敏项目清单/截图/配置导出，或在后续批准范围内提供最小权限访问。**不要把密码、service_role、CAPTCHA Secret、HMAC 秘密、refresh token 或数据库连接串粘贴到聊天、Git、报告或截图。** 敏感值以后由所有者在各 Staging secret manager 注入；本轮无需提供密钥值。

## A. 可先提供的非秘密信息和权限

| ID | 后台入口 | 待提供/核查项 | 当前状态 |
| --- | --- | --- | --- |
| A01 | https://supabase.com/dashboard → 实际组织/项目 Settings | 是否已有隔离 Staging；project REF、项目 HTTPS URL、区域代码/名称、计划、负责人；与生产项目对照，不能靠域名推断区域 | 待人工提供 |
| A02 | Supabase 项目 Settings / Infrastructure / Organization Legal（名称以实际UI为准） | DB/Auth/Edge 区域及处理位置、DPA/子处理者/跨境措施、区域选择审批；全球访客不等于任选地区都合规 | 待人工确认 |
| A03 | Supabase Database → Migrations、SQL Editor、Advisors | 只读查看 migration history、schema/RLS/ACL/索引；核对001/002/003历史与文件hash。真实写入/迁移权限留待另行批准 | 待权限/核查 |
| A04 | Authentication → Sign In / Providers、URL Configuration、Protection/Rate Limits、Users | 匿名登录开关、CAPTCHA provider、staging Site URL/精确redirect、限流、session/账号生命周期；staff/普通registered/anonymous测试身份是否已有 | 待配置核查 |
| A05 | Database → Backups、Logs / Logs Explorer、Edge Functions → Logs | 实际订阅的backup/PITR能力、可恢复区间、日志与备份期限/删除能力、日志是否含IP/正文、访问权限；不要假设计划包含PITR | 待核查 |
| A06 | Supabase Integrations → Cron / Database Extensions | pg_cron 是否可用、job与run history、执行身份/时区、日志保留/告警能力；可先给脱敏截图；不在本轮启用扩展/任务 | 待配置核查 |
| A07 | https://dash.cloudflare.com → Workers & Pages → 项目 → Settings/Deployments | Pages项目、生产分支、Preview作用域、构建/root/output/functions设置、实际compatibility date、稳定Staging主机名、现有Access保护 | 待人工提供 |
| A08 | Cloudflare → Turnstile | 专用Staging widget是否已有、Site key（公开值）、精确hostname白名单、模式；Secret只保管在Staging供应商后台，不提供给前端 | 待配置核查 |
| A09 | Cloudflare zone → Workers routes、Rules/Transform、Network | 同一路径是否经过Worker、额外代理、CF-IP删除/改写、Pseudo IPv4模式、Access/API重定向；只读审计不改生产zone | 待核查 |
| A10 | Cloudflare → Observability/Logs / plan设置 | Pages/Functions/Turnstile日志、Logpush等是否实际启用、接收端/保留/删除、是否保存原始IP/头/body | 待核查 |
| A11 | https://tagmanager.google.com → Account/Container User Management、Versions、Consent Overview | GTM-TK8MNNSV 的正确账号只读权限、当前published版本导出和workspace/Preview权限；确认另一历史ID GTM-PH85ZDWJ是否存在于远程注入，不能凭源码无它就断言线上无它 | 待权限/核查 |
| A12 | https://analytics.google.com → Admin → Data Streams / Data Settings / Data Filters / Product Links | G-9RENYENMPD 对应真实property/stream；自动表单、data retention、Signals/Ads关联、过滤、DebugView权限；AW-18568807997是否为现有destination | 待权限/核查 |
| A13 | 实际 CMP 后台（供应商未确认） | CMP名称/版本、地区策略、Consent Mode basic/advanced选择及legal依据、默认/update时序、持久化/撤回/SPA导航接口 | 待人工确认 |
| A14 | 现有GTM workspace + 已有隔离分析测试资源 | 是否有可用的隔离GA4测试destination/现有环境；怎样确保Preview不产生生产Analytics/Ads hits。没有则分析真实验收BLOCKED，另审方案，不创建新ID或发布生产容器 | 待人工决定 |
| A15 | GitHub repo → feature branch / Actions、Pages构建源 | 之后是否批准整理/提交/推送feature候选；review SHA、构建来源、制品校验、rollback负责人；当前未提交成果不能仅部署HEAD代替 | 待单独授权 |

后台标签随供应商版本/计划变化；应以实际界面/官方账户资料留证，不宣称上述路径已在真实账号打开。先只读，之后仅授予 Staging 所需操作权限；不要求组织全局管理员、生产数据库写权限或GTM Publish权限。CLI token若未来需要应限时限域，不把它当生产密钥使用。

## B. 未来 Staging 变量归属（当前未填真实值）

`STAGING_ORIGIN`、`STAGING_SUPABASE_URL` 等仅为文档占位符，**不是已存在URL、可部署值或新增环境变量**。先确定精确 HTTPS origin，无路径/尾斜杠；不允许通配Origin。不要把一个只有数据库隔离、仍共享生产Auth/Edge/secrets的方案当完整Staging。

| 存放位置 | 变量/配置项 | 未来获准值与核对要求 |
| --- | --- | --- |
| Pages **Preview构建** | NEXT_PUBLIC_SITE_URL | 保留 `https://proofwelllife.com`，它是canonical域；不是API origin。现有元数据不接受任意Staging域替换 |
| Preview构建环境 | CF_PAGES / CF_PAGES_BRANCH | 托管实际值应为 `1` / `feature/article-community`（或另经批准的非main候选分支）；不要伪装main以绕开preview保护；记录实际构建日志 |
| Pages Preview构建 | NEXT_PUBLIC_COMMUNITY_ENABLED | 初始 false；完成身份/配置前置验收并单独批准后才在Staging true；不改Production作用域 |
| Pages Preview构建 | NEXT_PUBLIC_COMMUNITY_ANALYTICS_ENABLED | 初始 false；仅在隔离destination、真实CMP、Preview映射方案批准后可在Staging true；不能借此启用生产分析 |
| Pages Preview构建与Function绑定 | NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY | 同一个已确认Staging项目的HTTPS origin/公开anon或publishable key；不是service_role。Function绑定必须实际可见，不能假设构建变量自动注入运行时 |
| Pages Preview构建 | NEXT_PUBLIC_COMMUNITY_TURNSTILE_SITE_KEY | 专用Staging widget公开Site key；与Auth和业务Siteverify使用的widget配对 |
| Pages Preview构建 | NEXT_PUBLIC_COMMUNITY_AUTH_CAPTCHA | true；不得用false绕过Auth CAPTCHA |
| Pages Preview Function **秘密** | COMMUNITY_GATEWAY_SECRET | 独立Staging高熵秘密，与Staging Edge完全一致；不复用Production或测试文字，至少32字符，未来由owner生成并注入 |
| Pages Preview Function | COMMUNITY_ENABLED | 初始 false；只在Staging前置验收后获准 true；与前端开关分开 |
| Pages Preview Function | COMMUNITY_ALLOWED_ORIGINS | 仅精确已批准 `STAGING_ORIGIN`；模板中的生产origin不能直接照抄。新增预览部署hostname需要显式重新核查，不开 `*` |
| Staging Edge Secrets | COMMUNITY_ENABLED / COMMUNITY_ALLOWED_ORIGINS | false起步 / 同一精确Staging origin；不能继承生产项目秘密 |
| Staging Edge Secrets | COMMUNITY_REQUIRE_TURNSTILE | true；设置false会按现有代码拒绝，不以关闭控制联调 |
| Staging Edge **秘密** | COMMUNITY_GATEWAY_SECRET / COMMUNITY_IP_HASH_SECRET / TURNSTILE_SECRET_KEY | 分别为匹配Pages的HMAC、独立IP派生秘密、匹配Staging widget的Secret；全部服务端、不同用途不复用 |
| Staging Edge runtime | SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY | 供应商runtime对应Staging项目；service_role仅Edge，不放Pages/browser/NEXT_PUBLIC。以实际运行时核查，不在报告输出值 |
| Supabase Authentication后台 | Site URL / Redirect URLs | 使用实际Staging origin及确需的精确redirect。此处与网站的canonical构建域是两类设置，不能混淆 |

后续授权时的迁移顺序：空隔离项目 `001 → 002 → 003 → seed`；已初始化只补缺失migration，核对历史与内容后执行；禁止 reset/replay 001、禁止把 test-bootstrap.sql 跑在 Supabase。003非可重复初始化脚本；seed的重复执行不能代替管理员设置升级。现有seed注册19篇，10开/9关，不创建staff、读者或伪造互动。即便DB某篇 enabled，三个总开关仍应起步关闭。

## C. 人工决定登记（无答案不代填）

| ID | 需决定/提供 | 已知与待确认 |
| --- | --- | --- |
| D01 | 个人运营者法律身份、适用通知/年龄/生效日 | 个人模式、品牌ProofWell、邮箱proofwelllife@gmail.com已确认；具体身份、年龄和法律审查未确认 |
| D02 | 数据地区与跨境处理 | 市场US/UK/CA/AU、全球可访问已确认；实际区域/传输/合同待确认，不擅自选一个地区 |
| D03 | 审核/删除/举报负责人及覆盖 | 姓名/角色、备援、响应目标、争议升级、身份核实与工单期限待确认；不虚构人员 |
| D04 | 举报功能验收口径 | 当前只有Contact/removal渠道；是否接受人工邮箱举报+工单，或要求另开发按钮/队列，须明确 |
| D05 | 清理硬上限与任务方案 | 90/30/180天政策已确认；频率/排队/故障的时间余量尚未定。不能自行把“最长90天”改成90天加一天 |
| D06 | 供应商与备份期限/删除例外 | 实际日志、备份、导出、隐私工单、Auth生命周期的保留与恢复后重删方案待确认；不能自动批删Auth导致cascade |
| D07 | 分析同意与隔离资源 | 选定真实CMP、Consent Mode模式、Google必要地区信号、测试destination/防污染方式；不创建第二套生产标签 |
| D08 | 聚合的长期保留 | 原始记录到期后可再投已确认；匿名化/稀疏组/小样本公开风险的验收口径待确认 |
| D09 | 审核前置/操作范围 | 下一轮是否授权Staging资源配置、feature提交/推送、部署及哪些测试写入；本轮均未授权实施 |

生产不属于上述下一轮Staging授权。未知远程状态必须先只读核查；“本轮未启用”不等于已经从后台证明“生产当前关闭”。
