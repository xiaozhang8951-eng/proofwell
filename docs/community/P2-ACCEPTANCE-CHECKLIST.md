# P2 — 可逐项签字的完整验收清单

日期：2026-11-19（Asia/Shanghai）。**当前只完成本地审计与方案，不代表已配置或通过真实Staging。** 参见 [审计/风险](./P2-READINESS.md)、[权限/配置](./P2-ACCESS-CONFIG.md)、[测试步骤](./P2-STAGING-TEST-PLAN.md)。所有实际测试的观察、证据、执行人和复核人必须后续填写；不能复制本地PASS。

## 本轮已核查（当前本地）

| 编号 | 本轮实际结论 | 状态/证据 |
| --- | --- | --- |
| L01 | feature/article-community；HEAD 46d88f664bbb64931b552c5989f52e1737aeb79e；main干净；原未提交工作保留 | 已验证·本轮本地 / git只读结果及before manifest |
| L02 | 43个P0/编辑/Google/配置保护文件匹配 | 已验证·本轮本地 / check-p0-baseline |
| L03 | 22 API + 11 gateway；同意/CSV/删除链接单元通过 | 已验证·本轮本地 / P2 QA日志，无外部调用 |
| L04 | 已有49 HTML，19篇组件、29 production-mode sitemap、9篇保护；编辑守卫及无增量文件的TS通过 | 已验证·本轮本地 / export/indexing/editorial/typecheck日志；未重build |
| L05 | P1真实PostgreSQL/并发、390/768/1440浏览器、CAPTCHA/runtime验证日志存在且明确为隔离fixture | 已验证·历史隔离 / P1 QA及P1-VALIDATION；本轮未重跑，不等于真实托管通过 |
| L06 | Supabase实际REF/region、Cloudflare项目、Google配置、生产远程开关未读取 | 待配置/核查；不得写成“已确认线上关闭/已配置” |

## 权限、决定和审批（未填不实施）

| 编号 | 验收问题 | 所需完成条件 | 当前状态 |
| --- | --- | --- | --- |
| G01 | 隔离资源身份 | A01–A10的实际项目/区域/计划、host、Preview作用域和production对照已获只读证据 | 待人工提供/核查 |
| G02 | 主体及供应商 | D01/D02/D06/D08：个人身份、地区/年龄/法律依据、生效日、DPA、日志/备份、聚合风险完成审核 | 待人工确认 |
| G03 | 运营与举报 | D03/D04：审核及备援、删除核实/申诉/工单、邮箱举报或额外功能范围明确 | 待人工确认 |
| G04 | 保留期限执行 | D05：清理频率/时区/排队/故障处理满足最长90/30/180要求，未擅自放宽或提前再投 | 待人工确认 |
| G05 | 分析隔离/同意 | A11–A14/D07：实际CMP、existing GTM权限、隔离测试destination及无生产hits方案 | 待权限/人工决定 |
| G06 | Staging实施授权 | D09/A15：feature候选整理/提交/推送、部署、允许的Staging配置/合成写入/恢复及预算逐项批准 | 待人工批准；本轮不执行 |

## 真实 Staging 执行清单

“所需证据”填写前均NOT_RUN；BLOCKED应用于前置不满足，不能以“本地曾通过”覆盖。

| 测试 | 验收要点 | 所需证据 | 当前状态 |
| --- | --- | --- | --- |
| T01 | 候选与完整隔离、实际区域/部署 | SHA/制品hash、REF/区域、版本/权限脱敏记录 | NOT_RUN |
| T02 | migration顺序、12 RLS表、ACL/索引/seed | history、只读SQL、10开9关/无假互动 | NOT_RUN |
| T03 | 全关时失败关闭、无秘密/fixture值 | 静态页面与网络/headers/变量作用域 | NOT_RUN |
| T04 | anon/普通用户/REST/protected RPC负例 | 拒绝状态与无泄漏/无写入对照 | NOT_RUN |
| T05 | managed Pages真实IPv4/IPv6请求 | 已知出口的私下校验与仅布尔/计数结果 | NOT_RUN |
| T06 | 自报IP/签名头、Worker/Pseudo/Transform | 实际平台覆盖或安全拒绝、IP桶不可自选 | NOT_RUN |
| T07 | 直连拒绝、HMAC绑定/时间/nonce replay | 受限server-side signer结果和1次真实落库 | NOT_RUN |
| T08 | 输入/身份/原额度限流/重复 | HTTP与DB差异，HTML不执行 | NOT_RUN |
| T09 | 真实guest/Auth/业务/管理员CAPTCHA正例 | 两条验证链、独立fresh token、Auth与业务成功 | NOT_RUN |
| T10 | 错/过期/重放/异hostname/action | UI/实际provider/DB拒绝，无绕过 | NOT_RUN |
| T11 | CAPTCHA脚本/widget/网络故障恢复 | 重试要求新token，移动/桌面证据 | NOT_RUN |
| T12 | staff/普通身份、退出/撤权/恢复 | 后端allowlist即时生效，私有数据无残留 | NOT_RUN |
| T13 | 90/180天与技术TTL边界fixtures | 获准合成数据清单、基线和server时间 | NOT_RUN |
| T14 | dry-run/真实清理/再次运行 | 无写dry-run、准确汇总/删除、不误删normal/有效nonce | NOT_RUN |
| T15 | 到期再参与与并发/版本 | 一次归档、新raw防重、公开/管理历史一致 | NOT_RUN |
| T16 | 真实Cron自动运行与执行关联 | jobid/runid/开始结束/结果、前后计数/audit对应 | NOT_RUN |
| T17 | 调度失败/漏跑/恢复与告警 | 告警实际到达负责人、重试无双计，期限未违规 | NOT_RUN |
| T18 | 备份/供应商日志/导出/恢复 | 实际配置、受限合成恢复、RPO/RTO、恢复后重删 | NOT_RUN |
| T19 | 审核/隐藏/删除/问题/分页 | pending/private不公开，实际CRUD/状态和audit | NOT_RUN |
| T20 | 删除请求与身份核实 | mailto无自动发送、适度核实、删除及备份/CSV处置 | NOT_RUN |
| T21 | 举报能力/人工流程 | 当前专门功能缺失；须owner接受人工渠道并演练，或另开发 | BLOCKED：待人工确认范围 |
| T22 | CSV过滤/分页/注入/中断/权限 | 三份文件数量与字段、受限存放/清理登记 | NOT_RUN |
| T23 | 管理审计覆盖 | 现有moderate/config与export/login缺口处置 | NOT_RUN |
| T24 | GTM/GA4隔离和CMP前置 | existing workspace/测试destination/实际无生产hits证明 | BLOCKED：权限与隔离方案待确认 |
| T25 | 未知/拒绝/同意/撤回/SPA | 四事件有/无的实际push/tag/collect次数与两参数 | NOT_RUN |
| T26 | Consent Mode默认/update与广告同意 | actual CMP及Basic/Advanced、consent checks证据 | NOT_RUN |
| T27 | Google唯一目标/无重复/无PII | 脱敏Tag Assistant/DebugView/Network，含admin自动采集 | NOT_RUN |
| T28 | 19行 × 390/768/1440页面与组件 | 每行布局/导航/refs/图片/链接/console实际记录 | NOT_RUN |
| T29 | 19行关闭/启用与10开9关数据独立 | 每行API/Auth次数和正确article数据、限流分批安排 | NOT_RUN |
| T30 | preview与production SEO保护 | preview全页noindex/空sitemap、production基线不变/43hash | NOT_RUN |
| T31 | 全局锁/timeout/重试与延迟 | 受控并发/最终落库/原去重、owner接受的性能预算 | NOT_RUN |
| T32 | 结束关闭/回退/QA数据与费用 | Staging关停/受限证据、生产未触碰、资源/角色回收记录 | NOT_RUN |

19行的实际结果另填测试计划矩阵；T28/T29任意一行缺证据时不能签“全19篇通过”。真实CAPTCHA不能用自动化fixture替代；Google dataLayer成功不等于GA4收到；任务安装不等于期限已获证明。

## 验收留证与批准

每项记录：候选SHA/制品hash、Staging REF/区域/部署ID、配置版本、UTC时段（另附Asia/Shanghai）、测试ID/数据集、预期/实际状态和计数、脱敏证据、执行/复核人、问题/重测链接。不得存password/token/secret/原始IP/未脱敏HAR或真实健康内容。

- [ ] 全部G01–G06完成，Staging实施另有明确授权。
- [ ] 全部安全/数据/同意关键测试真实通过；BLOCKED/FAIL不得当PASS，剩余风险须明确接受并符合原限制。
- [ ] 19篇逐页矩阵完整；43保护文件未被覆盖，main/文章/设计/SEO未误改。
- [ ] 真实清理、供应商/备份/删除/举报流程及分析隔离有证据；未知配置不靠假值填补。
- [ ] 再次关闭/恢复Staging，确认没有生产操作；生产授权另行申请，不包含在本轮或本表签字内。

**本轮审计/方案审核**：审核人________ 日期________ 意见________。

**未来仅Staging实施授权**：实际资源/权限/预算/允许操作________；批准人________；时间________；不含生产。

**未来真实Staging验收**：候选SHA________；REF/region________；Pages/Edge版本________；证据包________；未解决项________；执行人/复核人________。

当前不代填以上任何姓名、审核日期、账号权限、区域或真实PASS。
