# ProofWell Community P0 修复与验收报告

日期：2026-11-19（Asia/Shanghai）。工作分支：`feature/article-community`；基准提交：`46d88f664bbb64931b552c5989f52e1737aeb79e`。本轮仅处理管理员 CAPTCHA 与可信客户端 IP 两项 P0，不执行 P1 的政策、运营或 Google 后台配置。

**结论：代码层两项 P0 已修复，且本地/隔离自动化验收通过，可以进入 P1 的非生产开发与配置准备；不能启用生产互动或宣称真实托管环境已验收。** 实际 Supabase Auth/Turnstile、Cloudflare 入站头覆盖、生产 compatibility date、绑定和端到端验证仍需所有者批准后完成。首次审计的 A04/A06 不得凭隔离测试勾选为真实环境通过。

没有修改 main、commit、push、merge、deploy，也没有创建或修改生产密钥、账号、变量、数据库、widget 或 Google 配置。前一轮未提交成果保留。所有交付开关默认关闭；测试中的 key/token/password/IP 均为明确的合成值，不得复制到部署配置。

## 1. 根因与实施前方案

### P0-1 管理员 CAPTCHA

原 `components/community/community-admin.tsx` 在密码表单调用 `signInWithPassword({email,password})`，没有验证码组件或 `options.captchaToken`。启用项目 Auth CAPTCHA 后，该请求缺少 Supabase SDK 所需的 `gotrue_meta_security.captcha_token`。之前的浏览器 fixture 无条件返回密码登录成功，掩盖了这一配置下的失败。

实施前已说明的方案：复用现有 Turnstile 组件，在密码登录使用 `admin_login` action；没有有效 token 时禁用按钮，同时在 submit handler 再次阻断；把 token 传入官方 SDK；每次成功或失败尝试后清空 token，并重建验证；过期、服务错误和旧 widget 延迟回调不能重新启用登录。**不关闭 Supabase Auth CAPTCHA，也不在浏览器存放 Secret。**

### P0-2 客户端 IP

原 `supabase/functions/community/handler.mjs` 在 `COMMUNITY_TRUST_PROXY_IP=true` 时读取右端 X-Forwarded-For。这个 boolean 只表示操作者选择相信它，没有认证头的来源。浏览器原先直接请求 Supabase，Cloudflare Pages 无法给这条直连提供自己的可信 IP 证明。默认 false 原本会关闭写入；本轮不声称生产已开启或已遭利用。

实施前已说明的方案：新增同源 Pages Function 作为服务器信任边界，Supabase 仅接受该网关签名，不再凭裸转发头信任 IP。保留静态文章和原有 Auth、CAPTCHA、RLS、业务限流，并以私有 nonce 存储拒绝写请求重放。

## 2. 已实施的行为

### 管理员登录

- 登录表单渲染共享 Turnstile；`signInWithPassword` 接收 `options:{captchaToken}`。管理员验证始终必需，不受公开匿名 Auth 的开发配置开关绕过。
- 缺失/过期 token：按钮 disabled，程序触发表单也不会请求 Auth。
- 服务端拒绝验证码或密码：显示通用失败信息，清空密码及旧 token，重新验证后才能再试；不枚举账号或把凭证写入日志/GA4。
- 验证码脚本/组件失败：登录保持不可用，提供 Retry verification；脚本未加载时通过明确重载恢复，不放行。旧 widget 的迟到 callback 被忽略。
- 正常 staff 登录后仍必须通过后端非匿名检查和 `community_admins` 白名单；没有绕过 RLS、赋予前端 service_role 或虚构管理员身份。

### Cloudflare Pages → Supabase 网关

1. 浏览器的互动读写改为同源 `/api/community`；Supabase Auth 登录/匿名 signup 仍用官方 SDK 直连 Auth 并提交各自 CAPTCHA，不伪造 Auth 的 IP 头。
2. `functions/api/community.js` 调用服务器网关。只在托管 Pages runtime 的 `request.cf` 存在且入站方式符合要求时读取 Cloudflare 提供的 `CF-Connecting-IP`。普通 HTTP 客户端不能通过 JSON/HTTP 头制造这个 runtime 属性。
3. 依据已读取的 Cloudflare 官方 HTTP headers 文档，直接入站与 Worker 子请求有不同语义。拒绝 `CF-Worker`、跨 zone Worker 固定 IP、缺失/非法 IP，以及 Pseudo IPv4 overwrite 相关输入；不回退到 X-Forwarded-For、X-Real-IP、True-Client-IP 或用户自填 IPv6。支持并统一合法 IPv4/IPv6 表记，包括 IPv4-mapped IPv6，避免等价地址分散限流桶。
4. 重新构造下游 header allowlist，丢弃所有来访转发/IP/签名头。仅转发业务所需 Authorization/Content-Type，并由配置提供公钥；目标固定为批准的 Supabase project `/functions/v1/community`，不能由用户指定代理目的地。
5. 网关使用服务器 HMAC-SHA256 签名绑定：协议版本、方法、逻辑 function/query、Origin、规范化 IP、服务器时间、随机 nonce、Authorization/Content-Type 摘要与原始 body 摘要。私密签名信息和 IP 不回传浏览器。
6. Supabase 用 WebCrypto 验签，接受时间偏差最多 ±60 秒。任何时间/IP/body/凭证/Origin/query 等篡改都被拒；没有正确服务器签名的直连请求在访问 Auth/RPC 前即被拒。`COMMUNITY_TRUST_PROXY_IP` 已移除，设置为 true 也不能恢复旧路径。
7. 支持 Supabase ingress 保留或剥离 `/functions/v1` 前缀的两个明确 URL 形态（`/functions/v1/community`、`/community`），签名绑定同一个逻辑服务和 query；其他 function/path 不接受。
8. 所有经 Auth 验证且通过基础输入检查的 POST（包括管理动作）先调用私有 nonce RPC；honeypot/非法正文在分配 nonce 记录前被拒。新迁移 `202611190002_community_gateway_nonces.sql` 增加 RLS 表和 service-only RPC，用唯一主键原子消费 nonce；5 分钟 TTL 覆盖完整签名有效窗口。数据库不保存 IP、actor、token、签名或 body，只保存随机 nonce 和过期时间。重放在第二次 CAPTCHA/业务写入之前被拒。
9. 原有业务数据库函数、唯一约束、RLS、评论审核与限流原封保留。后端 CAPTCHA=false 在所有环境均拒绝；隔离测试通过模拟验证器成功/失败测试控制，而非关闭控制。
10. Cloudflare 原生 fetch 不支持 `redirect:"error"`；原生 workerd 测试发现后，改用 `manual` 并明确拒绝全部 3xx，防止认证/签名跟随到别处。代理响应只保留 JSON 状态和安全 header，不转发上游 cookie、Location 或调试头。
11. `public/_routes.json` 只对 `/api/community` 调用 Function；其他页面仍按 Next.js `output:'export'` 静态输出。网站设计、文章、Google 标签、canonical、robots、sitemap 与依赖均未调整。

源码中读取 CF-Connecting-IP 的安全前提是**实际托管 Cloudflare 直接入站**及官方头语义，不是“任何服务器看见这个名字就可信”。Cloudflare Workers、头改写规则、Pseudo IPv4、特殊 CDN 链必须在真实 staging 复核；不能把 Node 模拟 metadata 当成真实平台证明。签名 key 也不是公开 anon key 或 service-role key，而是后续单独批准的服务器间随机秘密。

## 3. 修复前后验证结果

| 验证 | 修复前 | 修复后 |
| --- | --- | --- |
| CAPTCHA-aware 管理员登录 | 归档的旧静态导出会在缺 token 时发送密码请求，隔离 Auth 验证器拒绝 | 缺失/过期不发起 Auth；SDK 确实携带 token；错误、重放、密码失败、组件错误、脚本错误和迟到 callback 均按预期处理；新 token 的 staff 流程成功 |
| 直连与 IP 自报 | 旧 handler 在 trust flag=true 的隔离验证中，接受无网关签名的请求，并将自填 XFF 送作 remoteip | 即使提供 Auth 测试身份与各种伪造 IP/签名头，仍 403，且不访问数据服务；只使用签名中的 IP |
| 转发头篡改 | 旧头来源未经认证 | Pages 丢弃来访头，重建签名；后端不使用任何裸 IP/转发头；任意签名字段变动失败 |
| 重放和并发 | 没有服务器网关 nonce 机制 | 同一已签写请求重放 409；真实 PostgreSQL 16 路并发只有 1 次 accepted、15 次 rejected |
| Cloudflare 原生执行 | 原方案没有 Pages 信任边界 | Wrangler 编译成功；编译后的真实 Worker 在本地 workerd/Miniflare 与后端完成跨 runtime 验签，拒绝转发头伪造、直连、重放、Worker 子请求 |

本轮实际执行并通过：

- `check-gateway.mjs`：**11 项**，含规范化、头白名单、runtime 条件、同源策略、拒绝 Worker/Pseudo IPv4、body 大小、错误配置、签名所有绑定项与有效期、拒绝重定向。
- `check-api.mjs`：**22 项**，保留原安全/角色/输入/限流错误检查并新增直连、旧 flag 无效、签名 IP、重放、开发配置不绕过 CAPTCHA。
- `check-admin-captcha.mjs`：修复前归档复现 + 修复后真实浏览器和 Supabase SDK 对接隔离验证器，覆盖缺失、过期、无效、重放、失败重置、迟到 callback、脚本/组件失败恢复；390/1440 px 无横向溢出。
- 两个 migration + seed 在 `--network none`、无端口映射的本地 PostgreSQL 17 执行成功；`check-gateway-database.sql` 的实际角色切换/RLS/RPC 权限、nonce 拒绝与过期清理通过；`check-gateway-concurrency.mjs` 16 并发通过。
- 原 `check-database.sql` 再次通过：业务去重、独立文章数据、pending 隔离、审核/隐藏/删除、分页、投票版本及网络限流均保留。
- Cloudflare Wrangler **4.165.0** 的 `pages functions build` 通过；本地 workerd/Miniflare **5.20261118.0-beta** 执行通过。测试 compatibility date=`2026-11-19`，**没有修改现有生产 compatibility date**。
- Deno 入口检查、TypeScript、生产静态构建通过；交付 `out/` 使用默认关闭配置，不包含假项目/验证码配置或服务器密钥。
- 原完整互动浏览器回归（19 篇文章，390/768/1440 px）通过，管理员 fixture 现要求 CAPTCHA，API fixture 现使用同源路由；默认关闭构建的 19 篇检查中 API/Auth 请求均为 0。
- 四个 dataLayer 事件形状、CSV、防未核验证据渲染、导出与索引回归通过；sitemap 仍为 29 条且本地全部 HTTP 200。
- 49 个原导出 HTML 的 metadata/canonical/JSON-LD 与 P0 前一致；robots.txt、sitemap.xml 字节一致。19 篇 MDX、全局设计、Google 标签、原迁移/seed、依赖和 Next.js 配置未改。

这些是**本地/隔离验收**。没有向真实 Supabase/Turnstile 发登录或验证码请求，没有读取 Cloudflare/GTM 账号配置，没有验证真实访客 IP，也不证明线上 Google 数据收集。原生 runtime 测试的入站 metadata 和外部 Auth/CAPTCHA/RPC 是明确的 fixture；数据库测试才使用真实 PostgreSQL。测试 nonce 和合成记录仅存在于临时测试库，测试后移除该容器。

## 4. 仍需人工配置和真实环境验收

全部均为**后续获准后**的步骤，不是本轮已执行操作：

| 项目 | 位置和需要完成的内容 | 当前状态 |
| --- | --- | --- |
| Auth CAPTCHA | Supabase Authentication → Bot/Abuse Protection，核对 Turnstile provider/Secret；Cloudflare widget hostname 与前端 Site key 匹配；在真实 staging 验证管理员/匿名 Auth | 待人工配置和验收，禁止关闭 CAPTCHA 解决失败 |
| 数据库 | Supabase migrations 按 `001 → 002 → seed`；已安装 001 的项目仅补 002，不能重跑/重置 001。运行更新后的 `PREFLIGHT-QUERIES.sql`，应有 10 张 RLS 表、4 个私有边界 RPC | 未操作实际数据库 |
| Gateway key | 批准后生成独立高熵至少 32 字符秘密，同环境 Cloudflare Pages Function 与 Supabase Secrets 均命名 `COMMUNITY_GATEWAY_SECRET`；staging/production 使用不同值。不要复用公钥、service_role、数据库密码或测试文字 | 仅空模板 `.dev.vars.example` / `supabase/.env.example`，未生成生产值 |
| Pages server bindings | Cloudflare Pages → Settings → Variables and Secrets；服务器端 `COMMUNITY_ENABLED=false`、精确 `COMMUNITY_ALLOWED_ORIGINS`、正确 public project URL/key、私密 gateway secret；service_role 只留 Supabase | 未修改线上变量 |
| Functions 打包与路由 | 未来批准的 Pages 构建须包含根目录 `functions/` 和 `out/_routes.json`，不是仅把 HTML 放普通静态主机。核对实际 compatibility date 支持所用 API；仅 `/api/community` 进入 Function | 本地编译/runtime 通过，托管部署待授权 |
| 真实 CF 入站 IP | 在 staging 用已知出口 IP 验证；从普通网络发送自造 XFF/CF-IP/签名头应不改变平台 IP；Worker/Pseudo IPv4 和缺失头应失败。核对 Worker routes、IP 相关 Transform、Pseudo IPv4 overwrite；不得靠宽松 fallback 放行 | 官方文档与隔离验证通过，真实入站验收未做 |
| Supabase 防绕过 | 对托管 Edge 直连发伪造 IP、缺失/错误/过期签名；应拒绝且不写业务数据。正常签名经网关通过；确认部署的 ingress 路径/原始 body、Origin、凭证在传输中保持协议一致 | 隔离通过，托管联调待授权 |
| 维护 | 将新 nonce 表纳入获准的过期清理作业；保持已有 rate buckets 清理。5 分钟仅为 nonce 到期，低流量时仍需要计划清理保证实际删除 | 作业尚未创建，属后续运营配置 |
| 生产开关 | `NEXT_PUBLIC_COMMUNITY_ENABLED` 和 backend/Pages 的 `COMMUNITY_ENABLED` 均保持 false，直至所有原上线清单和本报告接受；旧 trust flag 永久无效 | 模板/交付构建关闭，未读取或改变远程实际状态 |

无真实项目/绑定/批准时，默认失败关闭是正确行为，不可用假数据伪装已连接。`npm start` 只提供静态预览；启用模式需实际 Pages runtime 或明确的隔离 API fixture。

## 5. P1 阶段结论与范围

**可以进入 P1 的非生产开发/配置准备。** 两项 P0 的代码路径和隔离验证已完成，不再依赖“相信任意转发头”的 boolean，也没有通过跳过 CAPTCHA 获得测试成功。

**不可以进入生产启用/发布。** 真实 Auth/CAPTCHA、托管 Pages ingress、绑定和端到端验收仍是生产放行前置条件；原隐私条款、管理员/审核值班、数据保留、GTM/GA4 映射与同意控制等 P1 工作仍未执行。本轮没有修改这些页面或后台设置。若 P1 被定义为“生产配置变更/部署”，则本轮并未授权或批准该阶段，需要所有者另外确认。

## 6. 复现与审查材料

自动化脚本位于 `scripts/community/`；独立工具使用临时 npm 工具缓存，项目 package.json/package-lock.json 无本轮变更。

```sh
node scripts/community/check-gateway.mjs
node scripts/community/check-api.mjs
npm run typecheck
# 仅本地编译，不是 deploy；需隔离安装的 Wrangler。
WRANGLER_SEND_METRICS=false wrangler pages functions build functions \
  --outdir /tmp/proofwell-p0-worker --compatibility-date 2026-11-19
# MINIFLARE_MODULE 指向隔离工具安装的 miniflare/dist/src/index.js。
MINIFLARE_MODULE=YOUR_ISOLATED_MINIFLARE_MODULE \
PAGES_WORKER_BUNDLE=/tmp/proofwell-p0-worker/index.js \
node scripts/community/check-pages-runtime.mjs
```

浏览器测试只允许 localhost/127.0.0.1，需明确的假 `.invalid` 配置构建并拦截所有外部服务；不能将这些值用于部署。PostgreSQL 脚本的 `test-bootstrap.sql` 仍只适用于隔离空库，绝不用于真实 Supabase。

工作区证据目录：`/workspace/proofwell-community-p0-qa/`。包括修复前归档复现、33 项安全测试、CAPTCHA 前后日志、原生 Pages runtime 日志、16 并发 nonce 结果、浏览器截图、构建和索引结果。本报告给出的是本轮文件增量清单，不把此前未提交的其他开发成果算作本轮修改。

官方 IP 语义来源（本轮实际读取）：https://github.com/cloudflare/cloudflare-docs/blob/production/src/content/docs/fundamentals/reference/http-headers.mdx ，重点是 CF-Connecting-IP、Worker subrequests、CF-Worker 与 Pseudo IPv4；原文存于审计证据目录。此资料不代替对实际站点 Worker/Transform/域名设置的检查。

## 7. 本轮修改文件清单

| 状态 | 文件 |
| --- | --- |
| 修改 | `.gitignore` |
| 修改 | `components/community/community-admin.tsx` |
| 修改 | `components/community/turnstile.tsx` |
| 修改 | `docs/community/LAUNCH-READINESS.md` |
| 修改 | `docs/community/PREFLIGHT-QUERIES.sql` |
| 修改 | `docs/community/SETUP.md` |
| 修改 | `lib/community/client.ts` |
| 修改 | `scripts/community/check-api.mjs` |
| 修改 | `scripts/community/check-browser.mjs` |
| 修改 | `scripts/community/check-export.mjs` |
| 修改 | `supabase/.env.example` |
| 修改 | `supabase/functions/community/handler.mjs` |
| 新增 | `.dev.vars.example` |
| 新增 | `docs/community/P0-REMEDIATION.md` |
| 新增 | `functions/api/community.js` |
| 新增 | `lib/community/pages-gateway.mjs` |
| 新增 | `public/_routes.json` |
| 新增 | `scripts/community/check-admin-captcha.mjs` |
| 新增 | `scripts/community/check-gateway-concurrency.mjs` |
| 新增 | `scripts/community/check-gateway-database.sql` |
| 新增 | `scripts/community/check-gateway.mjs` |
| 新增 | `scripts/community/check-pages-runtime.mjs` |
| 新增 | `supabase/functions/_shared/community-gateway.mjs` |
| 新增 | `supabase/migrations/202611190002_community_gateway_nonces.sql` |
