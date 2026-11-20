# Community P1 — 验收结果

验收日期：2026-11-19（Asia/Shanghai）。当前仍为 `feature/article-community`，HEAD `46d88f664bbb64931b552c5989f52e1737aeb79e`；没有 Git 写入操作。本轮修改未提交，前一轮的未提交成果仍保留。独立 main 工作区干净，HEAD 未变。

**结论：本轮 P1 非生产实现及下列本地检查通过，可提交人工代码/政策审查；不可据此启用生产互动。** 实际项目、地区/法律审核、Cron/供应商保留、CMP/GTM、P0 真实托管联调与生产批准仍未完成。

## 本地验收

| ID | 检查 | 实际结果 |
| --- | --- | --- |
| L01 | 实施前审计/不覆盖既有工作 | 读取现有文档/源码后实施；148 个源文件及原 export 已备份。43 个 P0/文章/Google/配置文件 SHA-256 一致 |
| L02 | MDX/YAML/编辑保护 | 19 篇 MDX 字节不变；生产构建编译全部文章，`check-editorial.mjs` 通过 |
| L03 | TypeScript | `npm run typecheck` 通过 |
| L04 | 静态生产构建 | `npm run build` 通过；最终 `out/` 存在、49 HTML；Community 与 Community analytics 显式 false，无测试项目/公钥/sitekey 残留 |
| L05 | P0 API/网关 | 22 个 API + 11 个网关测试通过；管理员/Turnstile、handler、签名/nonce 核心源文件不变 |
| L06 | P0 CAPTCHA 浏览器回归 | 缺失/过期/错误/重放、密码失败重置、迟到 callback、widget/script retry、成功 staff 路径通过；390/1440 无溢出。真实 SDK + 明确合成的验证器，不是真实 Auth 登录 |
| L07 | P0 原生 runtime | Wrangler 本地编译 + workerd/Miniflare 测试通过，签名互通、剥离伪造头、直连拒绝、replay/Worker 子请求拒绝；外部服务和平台 metadata 为 fixture |
| L08 | 隔离 PostgreSQL | 无网络、无映射端口的 PostgreSQL 17；001→002→003→seed 成功；原业务数据库、gateway、P1 SQL 测试通过，测试事务回滚 |
| L09 | P0 SQL 函数体保护 | 三个重命名的 stored function body 与原 001 逐一 MD5 相等；legacy/helper 不再是 service-role 可调用的绕行入口；外部 RPC 参数不变 |
| L10 | 维护与保留 | 默认 dry-run 无修改；显式清理的 90/180 天边界、真实归档、重复清理不重复计数、原始记录删除、正常 approved/hidden 不误删、pending/spam 清理、fresh counter/nonce 保留通过 |
| L11 | 投票/反馈再参与 | 90 天后同账号能再次响应；新的 raw record 仍防重；失败写入回滚过期归档；公开/管理员导出/历史 poll 统计一致，新版本不挪用旧票 |
| L12 | 并发 | 24 路 cleanup/read/re-vote：一次归档、一个新票 accepted、7 个 duplicate，读只见一致总数，无死锁；16 路 P0 nonce：1 accepted、15 rejected |
| L13 | 权限 | 12 张 Community 表保持 RLS；anon/authenticated 无汇总读取、维护/写入 RPC 权限；staff allowlist/非匿名条件及原安全测试保留 |
| L14 | 重复初始化 | 003 再执行以 already exists 拒绝并回滚；不会重置/重建已有内容。必须使用 migration history，不反复初始化 |
| L15 | Analytics 单元与浏览器 | unknown/denied/错误值/开关 false 不发；明确 grant 后四事件仅 slug/type；撤回后成功保存 suggestion 仍不报事件；无历史回放；损坏 dataLayer/Google push 抛错不使保存操作失败 |
| L16 | 已启用 fixture 浏览器 | 19 篇文章，390/768/1440；独立投票、pending 私有、suggestion 私有、分页、失败/限流、管理员审核/配置/导出通过；12 次明确合成 mutation，无异常 |
| L17 | 删除请求入口/政策 | 固定 mailto 的参数验证通过，不含表单正文/Auth token；Privacy/Terms 与展开的管理员指引本地 HTTP 200，390/768/1440 无溢出 |
| L18 | 最终关闭状态浏览器 | 19 篇文章检查中 API reads=0、mutations=0、Auth requests=0；没有把 fixture 数据写入最终静态输出 |
| L19 | SEO 回归 | 49 个 HTML 的 metadata、canonical、JSON-LD 与 P1 前一致；robots.txt/sitemap.xml 字节一致；29 sitemap 条目，本地全部 HTTP 200；9 草稿仍保护，admin 不入 sitemap 且 noindex |
| L20 | 全局/其他页面保护 | 19 篇文章、全局 CSS/Google 安装/依赖/Next 配置未变；除 Privacy/Terms 外其他 trust/info page 定义不变；`git diff --check` 通过 |

SQL harness 首次重建容器时误碰 PostgreSQL 初始化临时服务关闭窗口，尚未创建 schema 即连接失败；待数据库正式启动后重跑全套通过。它不是 CAPTCHA/权限失败，也没有通过放宽安全控制“修复”。Node 的既有 MODULE_TYPELESS_PACKAGE_JSON 警告不影响通过；未为此修改依赖或 package type。

浏览器测试服务只绑定 localhost；Google、Supabase、CAPTCHA 外部访问被明确 fixture 截获。没有访问真实项目或 Google 控制台，没有声称线上 GA4 收到事件或真实平台 IP 已验证。QA 目录 `/workspace/proofwell-community-p1-qa/` 保存构建、数据库、并发、浏览器/runtime 日志、截图、基线和本轮 diff；容器测试后移除。

## 手工验收（全部仍待完成）

- [ ] H01：个人运营者实际身份、实际法律要求、生效日和年龄规则；不虚构公司/地址/电话。
- [ ] H02：Supabase 实际区域、合同、跨境处理、Auth 生命周期、备份和供应商日志期限；应用没存原始 IP 不等于供应商没存。
- [ ] H03：实际项目 migration history、RLS 和私有 RPC；按 SETUP/P1-OPERATIONS 逐项核对，不能把本地结果打勾成生产。
- [ ] H04：真实 hosted Auth CAPTCHA、Pages ingress 可信 IP、gateway secret/bindings、nonce 与绕过负例验收；保持 P0 控制。
- [ ] H05：审核主要/备份人员、工作覆盖、删除请求身份核实、申诉和安全导出流程演练。
- [ ] H06：维护调度/告警/最长记录年龄/备份删除；确认调度延迟或提前量不违反最长保留要求；真实负载下全局写事务锁/超时验收。
- [ ] H07：真实匿名化与稀疏分组评估后决定汇总长期保留；不把累计响应数当独立消费者人数。
- [ ] H08：实际 CMP、现有 GTM-TK8MNNSV 权限/唯一映射、GA4 destination G-9RENYENMPD 和 DebugView；自动表单采集/Ads profiling 审查，不重复安装 Google 标签。
- [ ] H09：隐私、Terms 和所有上线阻断经 owner 审核，代码/配置/合并/部署/启用分别批准。

所有者验收人：________；范围：________；日期：________；证据：________。未完成前生产互动和社区分析继续关闭。

## 复现入口

```sh
node scripts/community/check-p0-baseline.mjs
node scripts/community/check-p1-client.mjs
node scripts/community/check-api.mjs
node scripts/community/check-gateway.mjs
node scripts/community/check-client.mjs
node scripts/check-editorial.mjs
npm run typecheck
# local static export only; not a deployment
NEXT_PUBLIC_COMMUNITY_ENABLED=false NEXT_PUBLIC_COMMUNITY_ANALYTICS_ENABLED=false \
  CF_PAGES=1 CF_PAGES_BRANCH=main NEXT_PUBLIC_SITE_URL=https://proofwelllife.com npm run build
node scripts/community/check-export.mjs
node scripts/check-indexing.mjs
```

数据库、浏览器和原生 Pages runtime 的隔离条件见各测试脚本及 P0 报告。`test-bootstrap.sql` 不能用于真实 Supabase。不要直接把 fake service env、QA secrets 或本地 fixture build 部署。
