# P2 — 真实 Staging 联调方案与预期结果

本文件全部为**未来获准后的计划，当前所有真实用例 NOT_RUN**。现有 localhost/fixture 脚本不能直接把 BASE_URL 换成公网运行；它们显式限制 localhost，并会拦截外部服务。以后应另审 hosted harness 的目标allowlist和密钥使用，不删除这些限制、不用fixture冒充真实服务、不改43保护文件。

## 0. 环境与执行规则

- owner先批准 [账号/配置](./P2-ACCESS-CONFIG.md)、隔离Staging项目/区域、预算、真实精确hostname、feature候选提交/部署范围、可写合成数据范围。当前分支有未提交文件，不能仅部署当前HEAD。
- 分阶段：S0只读身份核查 → S1部署获准候选但开关全false → S2仅Staging互动开启、分析仍false → S3清理/恢复与运营测试 → S4隔离分析/CMP → S5关闭/恢复验收并签字。每阶段先确认没有生产资源被选中。
- 初始三处 Community 开关（前端/Pages/Edge）和独立analytics开关全部false；S2需要额外批准，只在Staging作用域改true。当前不执行配置或部署。
- 使用访问受限的稳定Staging hostname、精确Origin/CAPTCHA hostname；若Access导致API 302/登录页，应修正获准测试访问配置，不跟随凭证到非预期位置。Pages/Edge/Supabase Auth必须都属于隔离环境。
- preview构建的 CF_PAGES=1、branch非main；canonical域保留 https://proofwelllife.com。全页输出noindex,nofollow、robots disallow、空sitemap是preview设计，不是生产sitemap回归；robots/noindex都不是访问控制。
- 只有合成QA昵称/正文/问题/账号，不复制生产DB、真实评论、医疗资料或用户数据。常规操作用浏览器实际Supabase Auth/真实Turnstile；人工完成合法challenge，不破解验证码、不以测试key取得“真实通过”。
- 测试前记录候选SHA、源/迁移/制品hash、环境/部署ID、配置版本和UTC执行窗口；展示时间另标Asia/Shanghai。证据只留必要状态、计数、脱敏截图；不保存密码、Auth/CAPTCHA token、签名、Secret、原始IP或未脱敏HAR。若安全日志不可避免含IP，必须受限并遵守≤30天等实际政策。
- 每个测试独立标PASS/FAIL/BLOCKED/NOT_RUN；包含前置、操作、预期、观察、实际行数变化和证据。发现生产资源、鉴权绕过、未审内容公开或PII分析泄漏，立即停止，不降低安全控制“继续测”。

## 1. 环境、数据库与安全

| ID | 操作（仅获准Staging） | 预期/通过标准 | 证据 |
| --- | --- | --- | --- |
| T01 | 比对project REF/URL、区域、组织/计划、Pages项目与分支、环境作用域、制品来源和候选hash | 完整隔离DB/Auth/Edge/secrets；无生产数据/秘密；43基线一致；不是仅DB分支隔离就假定Auth也隔离 | 脱敏配置清单、候选/部署ID、hash、批准记录 |
| T02 | 查看migration history；按已批准缺失项应用001/002/003，之后seed；执行只读核查 | 12张RLS表，预期索引/约束；legacy/helpers不暴露，外部RPC service-only；无匿名读pending/直接写/维护；10篇开9篇关，无伪造互动/staff | history、ACL/RLS/计数结果；本轮不执行迁移 |
| T03 | S1全false：访问文章/管理员/有效Origin的API；检查JS/config/headers | 静态文章正常、无互动Auth/API请求；配置未启用时API失败关闭，不伪装成功；公开bundle不含私钥/测试值；不触碰生产开关 | 网络/HTML扫描、HTTP状态、flags脱敏记录 |
| T04 | S2普通匿名/非staff registered分别调用管理；用公开key/读者JWT请求表、protected RPC、legacy/helper、maintenance | 私有数据/动作均拒绝；普通身份不能自授staff或approve；直接REST不泄露pending/问题/限流/审计；拒绝响应依服务实际可为401/403等，必须同时证明无数据/写入 | 权限负例与DB前后差异；有效staff正例另测 |
| T05 | 同源真实浏览器读API、创建guest并有效提交；测试一次IPv4和可用真实IPv6网络 | 通过managed Pages，正确返回；IP仅来源平台；无mock request.cf/回显endpoint。原始IP不回传浏览器/HTML/GA4，业务只存HMAC计数 | 受限operator暂存比对、仅留pass/fail和计数 |
| T06 | 同一已知测试出口，分别附伪造XFF/X-Real-IP/CF-IP/ProofWell签名头；测Worker子请求/Pseudo IPv4/必要头缺失场景 | 平台覆盖/网关重建后仍使用真实出口，或安全拒绝；不能产生攻击者选择的IP桶。Worker/synthetic/Pseudo不支持时必须拒绝，不fallback。必要变更仅限获准staging，不改生产zone | 转换/路由设置脱敏快照、API结果、私下计算预期HMAC的布尔比较；不要记录key/IP/hash |
| T07 | 从普通客户端直连Edge，附合法JWT但无/伪签名；另由受限server-side测试器对Staging envelope做method/query/body/Origin/时间/凭证篡改、过期及重复请求 | 未签/篡改在Auth/RPC前拒绝；合法控制请求可通过；同一已签POST仅一次accepted，第二次409；±60秒边界本地精确测，真实网络另选超出窗口余量；5分钟nonce足够覆盖有效窗 | 脱敏状态与业务计数、直连拒绝记录。拥有Staging HMAC的server测试器不证明CF真实IP，T05/06必须独立通过 |
| T08 | 缺JWT、过期JWT、伪actor字段、honeypot、HTML/控制字符/超长内容、无效选项；按原额度测试重复和429 | server只使用Auth验证身份，输入拒绝且不保存；重复投票/反馈不计数；限流保持，不提高额度跑happy路径；评论按plain text显示不能执行 | 实际HTTP、表计数、浏览器控制台/DOM |

真实IP验证可由授权operator在服务器内存中使用同周 `floor(epoch_ms/604800000)`、normalize后的已知测试出口和Staging秘密计算预期HMAC，仅比对所需桶是否一致；不将秘密或HMAC发给浏览器。没有安全观测条件则T05/06为BLOCKED，不能新增生产echo/debug接口或把全部headers写日志。

## 2. 真实 CAPTCHA 与 Auth

| ID | 操作 | 预期/通过标准 |
| --- | --- | --- |
| T09 | 正确widget/hostname；guest建立会话后，再以fresh token提交一次互动；管理员以独立admin_login验证登录 | 实际Auth接收其token；每次成功/失败后重置，业务token不可复用；后端Siteverify success/action=community_submit/精确hostname。记录Auth和业务两条验证链，不混用 |
| T10 | 缺失、无效、已过期、重复使用token、其他已获准hostname或action的业务token；管理员密码错误后重复/迟到callback | 缺失/过期登录先在UI阻断；绕UI时实际Auth拒绝坏token；错误/重放业务不能落库。token用于Auth后不能再用于互动。admin_login只标识前端请求，Auth是否校验action按实际服务记录，不能据前端标签宣称服务端有该保证 |
| T11 | 浏览器阻断验证码脚本、网络断开/恢复、widget错误、服务不可用；手机/桌面重复一次 | 没token不能登录/提交；清晰错误与retry，重试须新challenge；不配置false、不用假success或特殊测试key代替真实provider验收 |
| T12 | staff登录/退出/会话恢复、普通registered、临时撤allowlist后继续旧session | 非staff/匿名管理拒绝；撤权后下一管理请求失败，即使UI仍显示会话；logout无残留私有列表。若要求AAL2需另审实现，当前不宣称已强制 |

所有token仅在必要内存中使用，截图/HAR删掉值。若实际provider不支持某种可控故障注入，标该子项BLOCKED并安排获准隔离故障测试，不在真实服务旁放“成功fixture”。

## 3. 90天调度、执行日志及恢复

前置：独立Staging，关闭并发业务写入干扰，owner批准operator合成fixtures/清理和恢复；保存已有基线。使用已存在的合法测试Auth身份及文章/poll，维护已知测试ID清单，只操作这些fixtures；不禁用trigger/RLS/约束，不批量删除实际Auth用户。不要直接在Supabase执行现有test-bootstrap或整份本地SQL测试。

| ID | 操作 | 预期/通过标准 |
| --- | --- | --- |
| T13 | 分别准备边界前/等于/超过90天的vote/feedback/question/pending/spam，以及正常approved/normal hidden；准备180天audit、过期和仍有效counter/nonce | 明确SQL cutoff的事务时间基准；真实服务器时间不修改。刚过/未过边界按函数实际now判断，不能因测试网络时间漂移误判。正常评论不因hide变spam；历史未知hidden按normal保留 |
| T14 | 调用默认maintenance() dry-run；保存计数；获准后显式false；再次执行 | dry-run无写入（包括无清理audit）；真清理只处理到期类，真实DELETE产生汇总、raw删除、总数/比率不丢；二次不加票。成功维护本身会新增一条audit，不要求整库audit数量绝对不变；仍有效nonce/限流不删 |
| T15 | raw记录到期后同guest再投/feedback；再次刷新重复；创建新poll版本；并行清理与读/投 | 新raw记录一次可接受，近期重复拒绝；累计为响应数而非人数；新poll零起步，旧结果不转移；并发归档不双计，失败事务回滚。保留shared/exclusive锁及原配额 |
| T16 | 核实pg_cron/执行身份/UTC时区后，未来获准安装唯一Staging任务，执行maintenance(false)；让合成记录自然跨过下个调度周期 | job确实自动执行，不是手工SQL伪装；保存jobid/runid/开始结束/status/command/候选版本，前后到期数+汇总+cleanup audit对应唯一运行窗口。不能假设cron.return_message保存返回JSON；当前audit只含通用成功marker |
| T17 | 在批准窗口暂停/失败一次Staging任务并恢复；核查告警、重试、延迟与日志保留 | 有真实失败/遗漏告警及负责人，恢复后不漏删/重复归档；不得靠丢弃数据或删活跃nonce“恢复”。日志/监控保留按数据分类且无秘密/正文 |
| T18 | 审核最长年龄、计划可用backup/PITR、provider日志/CSV/QA证据期限；仅将合成备份恢复到另一个获准隔离目标 | 提供供应商实际保留/删除能力与区域证据；恢复后RLS/allowlist/开关关闭并重新清理/处理已删除内容，不能把恢复指向生产或自动公开旧评论；列出实际RPO/RTO与owner接受值 |

**硬期限决策门槛**：当前函数删 `created_at <= now()-90 days`。即使每小时运行（`0 * * * *` 仅是待审示例），最大年龄仍可超过90天并叠加排队/故障；不得在报告说“已保证最长90天”。提前清理可能使同账号在90天前再投，与用户决定存在关联，不能擅自改cutoff。先由owner确认满足政策的方案；若要私有调度包装/记录实际数量/告警或改变保留实现，另行提出最小代码/SQL范围，当前不实施。Cron验证可在synthetic-only环境先测功能，但不代表硬期限已验收。

供应商清单至少含：Supabase DB/Auth/Edge、Cloudflare Pages/Functions/Turnstile及实际Logpush接收端、Google/CMP、备份/PITR/WAL、受限CSV和隐私工单。DB选区不能证明Edge/日志/Google都驻留同区。无实际计划/日志配置不能填“30天内删除”。恢复后处理删除请求的受限登记/备份限制由owner确认，不伪造自动删除能力。

## 4. 管理、删除、举报、CSV

| ID | 操作 | 预期/通过标准 |
| --- | --- | --- |
| T19 | 按文章/status查询pending，approve→hide→pending→delete；私密问题review/hide/delete；分页>25 | pending/hidden/问题不被公开read返回；approved只公开nickname/body/time/comment ID；彻底删除不能再读；正常/待审分类随状态合理，配置/审核有对应audit |
| T20 | 用合成评论打开removal mailto、模拟错误身份/仅public ID请求、再走已核实删除；检查导出与备份处置 | mailto不自动发送、不含Auth token/评论正文。公开ID/昵称不能独自证明所有权；owner人工核实和处理，不索取password/token。当前模板文章域固定生产canonical，Staging测试只检查不发送，不能将QA ID当生产请求 |
| T21 | 核查举报入口；owner决定人工Contact/email工单后，自行用合成案例验证收件、分派、hide、处理/申诉与最小留存 | **当前无专门Report按钮/举报队列**。若要求专门功能则BLOCKED待另开发；接受人工渠道须明确签字和真实运营演练，不能把removal mailto通过等同举报系统通过；本助手不代发邮件 |
| T22 | 过滤导出三份CSV，测试>1000分页、特殊引号/换行/公式前缀、失败中断/浏览器多下载；核查scope/权限 | 与同一静默窗口的真实过滤数据匹配，无Auth UUID/IP/hash/token/密码；仍含nickname/正文的文件按个人数据保护。公式前缀被中和，按文本检查不执行；逐页非快照须说明。大样本只用获准operator fixtures/预算，不能灌真实公共API绕过配额 |
| T23 | 对照audit/运营记录：审核、配置、导出、登录/撤权与删除请求 | 原应用有moderate/config audit，没等同的export/login audit；按实际写入核对，缺口不能记为全覆盖。owner接受受限人工导出登记或另审私有审计，不偷偷新增表/权限 |

## 5. CMP、Consent Mode、GTM/GA4

先只读审计当前published container、全部base/destination/regex triggers、GA4自动表单/Enhanced Measurement、Signals/Ads links和CMP；源码只有一个GTM不证明容器没有重复GA4。根布局目前总是加载GTM，包括admin和noscript iframe；Community开关不控制这些。

| ID | 操作 | 预期/通过标准 |
| --- | --- | --- |
| T24 | 确认隔离测试destination/现有容器未发布workspace/Tag Assistant模式及真实CMP，先证明请求不会流入生产Analytics/Ads | 不新增第二套Google安装，不发布生产容器，不创建虚假conversion/ID。若无法在43保护文件不变下隔离，BLOCKED并申请明确新范围，不能直接发测试hits到生产。必要时互动功能测试浏览器阻断Google仅属隔离保护，不算GA4真实通过 |
| T25 | 首次未知/拒绝/撤回、grant、refresh/SPA导航/恢复同意；对四类动作实际后端accepted | 未知/拒绝/撤回时四类Community push/tag/collect为0；grant后每次新accepted对应1条、仅article_slug/interaction_type；失败/重复/429/CAPTCHA/仅Auth/管理动作不报成功；恢复grant不回放历史 |
| T26 | 读取Consent Mode时序：analytics_storage、ad_storage、ad_user_data、ad_personalization；对照CMP真实选择和GTM consent checks | 不强制granted；内容公开checkbox不是分析许可。Basic/Advanced由owner按适用要求确认；Advanced可能有cookieless ping，不能据denied就宣称全站零Google请求。桥接不代发Consent Mode default/update；实际缺失则BLOCKED |
| T27 | Tag Assistant/DebugView/Network检查实际容器/事件/destination/次数；检查admin登录、评论/问题输入与失败 | 参数无昵称/正文/邮箱/Auth或comment ID/IP/token，不从URL/form DOM自动泄漏；无重复base/page_view/事件；admin全局tag自动采集同样验收。保存脱敏证据，不保存未删凭证的HAR |

未来生产目标是沿用GTM-TK8MNNSV及已核实对应GA4，而本轮不得在生产配置四事件。`G-9RENYENMPD`和`AW-18568807997`仅是owner给定值；未获得后台证据前不确认用途/实际收集。Staging测试destination若不存在，需要单独批准隔离方案，不能“临时”发布生产Google变更。

## 6. 19篇文章逐页矩阵

下表根据当前源码实际路由和元数据，未修改文章。P=published有有效日期且draft/noindex均非true；D=没有published，依靠统一发布判定fail-closed（不能谎称其MDX都显式draft:true）。每行真实Staging结果均NOT_RUN。

| # | 实际路由 | 内容状态/日期 | S2预期 | 真实结果 |
| --- | --- | --- | --- | --- |
| 01 | /science/633-vs-830-nm | P · 2026-11-09 | 独立互动配置/数据 | NOT_RUN |
| 02 | /science/does-red-light-therapy-work | P · 2026-11-19 | 独立互动配置/数据 | NOT_RUN |
| 03 | /science/how-led-masks-work | P · 2026-11-06 | 独立互动配置/数据 | NOT_RUN |
| 04 | /science/irradiance-vs-fluence | P · 2026-11-09 | 独立互动配置/数据 | NOT_RUN |
| 05 | /science/red-light-therapy-skin | D · 未填写 | 无互动请求，DB关闭 | NOT_RUN |
| 06 | /science/red-vs-near-infrared | P · 2026-11-09 | 独立互动配置/数据 | NOT_RUN |
| 07 | /buying-guides/how-to-choose-led-mask | D · 未填写 | 无互动请求，DB关闭 | NOT_RUN |
| 08 | /comparisons/omnilux-vs-currentbody | D · 未填写 | 无互动请求，DB关闭 | NOT_RUN |
| 09 | /comparisons/omnilux-vs-solawave-vs-shark | D · 未填写 | 无互动请求，DB关闭 | NOT_RUN |
| 10 | /comparisons/omnilux-vs-solawave | D · 未填写 | 无互动请求，DB关闭 | NOT_RUN |
| 11 | /comparisons/ulike-reglow-vs-megelin-white-led-mask | P · 2026-11-16 | 独立互动配置/数据 | NOT_RUN |
| 12 | /reviews/amiro-5-in-1-light-therapy-mask | P · 2026-11-16 | 独立互动配置/数据 | NOT_RUN |
| 13 | /reviews/currentbody-series-2 | D · 未填写 | 无互动请求，DB关闭 | NOT_RUN |
| 14 | /reviews/megelin-led-face-neck-mask | P · 2026-11-13 | 独立互动配置/数据 | NOT_RUN |
| 15 | /reviews/megelin-white-led-face-neck-mask | P · 2026-11-12 | 独立互动配置/数据 | NOT_RUN |
| 16 | /reviews/omnilux-contour-face | D · 未填写 | 无互动请求，DB关闭 | NOT_RUN |
| 17 | /reviews/shark-cryoglow | D · 未填写 | 无互动请求，DB关闭 | NOT_RUN |
| 18 | /reviews/solawave-wrinkle-retreat-pro | D · 未填写 | 无互动请求，DB关闭 | NOT_RUN |
| 19 | /reviews/ulike-reglow-led-face-mask | P · 2026-11-16 | 独立互动配置/数据 | NOT_RUN |

| ID | 所有行的操作 | 预期 |
| --- | --- | --- |
| T28 | 每行390/768/1440宽度，直接访问/refresh/前进后退、图片/表格/FAQ/refs/内部链接、滚动到底部 | 单一模块在refs后/related前，英文文案，键盘可用、按钮/输入方便、无横向overflow；正文/图片/metadata未变，不因社区故障阻断正文 |
| T29 | S1关闭与S2开启各跑19行；10篇P各验证配置/独立poll、comment、feedback、question；9篇D核DB状态和无请求 | S1皆0互动/Auth请求；S2草稿仍0，P按本篇读写不串页；无假计数；session恢复不无限刷新投；不能为测试改草稿发布日期/索引。happy写入分自然限流窗口执行，不上调/关闭配额 |
| T30 | 读取全部preview HTML/robots/sitemap/canonical/JSON-LD与API/admin headers；对照候选源hash和独立production基线 | preview全页noindex,nofollow、robots Disallow:/、sitemap为空；canonical仍生产规范URL，API/admin不入sitemap；生产29条及原索引策略不变。不要把preview空sitemap当生产修复回退 |
| T31 | 控制并发清理/读/投，故障/慢请求/超时后刷新再试、持续点按钮、短暂断网；另审低流量负载计划 | 全局锁无双计/死锁/长时间饥饿，延迟满足owner预先接受预算；client40s、Pages上游30s、后端单步10s可能导致超时不等于未写。确认最终DB结果和原重复规则，新网关nonce不是全局业务幂等保证 |
| T32 | 结束时关闭Staging前端/Pages/Edge/analytics、撤测试staff、回收获准Staging秘密/会话、按QA清单清理或保留受限证据 | 不改Production、不bulk删真实Auth、不reset schema、不删有效nonce。保存回退演练与资源/费用清单，owner决定是否保留Staging；真正生产发布仍需新批准 |

S2完整交互需要多个身份/时段配合现有限流：同user每小时10总提交，评论/问题每类每user每小时3，同IP每类评论/问题每小时10，poll/feedback另有每小时/日限制。只换账号不能绕过IP配额；测试者按窗口排期，超出时预期429，不能为让测试变绿关控制。

## 7. 执行记录模板与停止条件

每个T编号记录：候选SHA/制品hash、project REF/region、Pages/Edge版本、开关状态（无秘密值）、测试身份类别（非实际凭证）、数据集编号、UTC开始/结束、操作次数、预期/实际HTTP与行数差异、PASS/FAIL/BLOCKED、证据链接、执行人/复核人。数据里若含可关联ID/用户内容不得作为长期公开报告。

立即停止：环境串用、生产配置变化、原文/43基线变化、私钥/PII出浏览器或分析、鉴权/验证码/签名可绕过、pending/问题公开、清理误删normal或有效nonce。只关闭获准Staging开关并保全最少证据，提交问题和最小修复提案，不强推/合并、不改生产、不放宽安全控制。所有High门槛与owner决定未解决时，不签真实验收完成。
