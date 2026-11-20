# ProofWell Community 上线准备与人工验收报告

> **P1 非生产更新**：本文件继续保留首次审计历史；当前增量状态、已确认政策与未通过的生产门槛见 [P1-IMPLEMENTATION.md](./P1-IMPLEMENTATION.md)、[P1-OPERATIONS.md](./P1-OPERATIONS.md)。不得按历史文字启用已移除的 trust flag；生产继续关闭。

> **P0 后续状态更新**：本文件保留首次审计证据。管理员 token 缺口已在代码中修复；IP 方案已改为 Pages 可信网关签名 + Supabase 验签/私有 nonce 防重放。`COMMUNITY_TRUST_PROXY_IP` 已移除，不能按下方历史说明启用它。当前配置以 [SETUP.md](./SETUP.md) 为准；本轮修复与验收见 [P0-REMEDIATION.md](./P0-REMEDIATION.md)。真实托管环境验收、P1 政策/运营/分析配置和生产发布批准仍未完成。

审计日期：2026-11-19（Asia/Shanghai）。分支：`feature/article-community`；工作区：`/workspace/proofwell-article-community`；基准提交：`46d88f664bbb64931b552c5989f52e1737aeb79e`。

**当前结论：暂不具备启用生产互动的条件。** 可以完成项目、权限、数据处理方案的人工确认；管理员 CAPTCHA 缺口、可信 IP 证明、隐私条款、真实后台及 GA4 联调完成前，两个总开关必须保持 `false`。

本轮只审计代码、复核初始化行为、编写本报告与只读验收 SQL。没有访问或修改实际 Supabase、Cloudflare、GTM、GA4 账号；没有创建生产项目或密钥；没有修改实现代码、main、文章、SEO、生产环境变量；没有 commit/push/merge/deploy。上一轮改动仍未提交，应保留。此前本地测试通过不代表已通过托管 Auth、实际网关、Turnstile 和 Google 的端到端验证。

## 1. 发现与上线阻断

| 编号 | 状态 | 证据及需要完成的动作 |
| --- | --- | --- |
| B1 管理员密码登录缺少 CAPTCHA | **必须先修复** | `components/community/community-admin.tsx:43` 调用 `signInWithPassword({email,password})`，没有验证码组件或 `options.captchaToken`。而生产方案要求启用 Supabase Auth CAPTCHA；安装的 Auth SDK 密码登录会把 `options.captchaToken` 写入 `gotrue_meta_security.captcha_token`。当前调用不传值，不能认为能通过启用 CAPTCHA 的实际 Auth。后续需单独授权最小代码修复，并在真实 staging 测试缺失/错误/有效 token。不得靠关闭全局 Auth CAPTCHA 绕过。之前浏览器 fixture 只返回登录成功，没有模拟该强制检查。 |
| B2 网络身份可信性未证实 | **必须验证，失败则调整架构** | `supabase/functions/community/handler.mjs:71–86` 读取右端 `X-Forwarded-For`，真实性取决于托管网关如何覆盖/追加该头。`COMMUNITY_TRUST_PROXY_IP=true` 是操作者声明，不是验证手段。没有实际平台契约和防伪造测试之前维持 false，不能为了消除 503 直接打开。 |
| B3 隐私政策/Terms 尚不覆盖 Community | **必须经所有者审核后更新** | `lib/trust-pages.ts` 的隐私政策仍描述预览表单不存储；`lib/pages.ts` 的 Terms 仍为法律草稿并有占位内容。上线后会新增匿名 Auth 会话、持久存储、内容数据库、Turnstile 与数据服务商。见第 8 节。未修改现有政策或其索引设置。 |
| B4 实际配置和端到端验证缺失 | **必须完成** | 无已核对的项目 REF/公钥、Auth 设置、管理员授权、CAPTCHA 配置、网关证明或服务商日志。全部后台状态记为“待人工确认”，不能把本地 PostgreSQL/模拟浏览器结果记成生产通过。 |
| B5 GTM 权限及事件映射未确认 | **测量验收项** | 源码只确认全局 `GTM-TK8MNNSV` 与四类 dataLayer push。`G-9RENYENMPD` 是所有者此前提供的 GA4 ID，不是已读取后台的数据流证明。必须在现有容器配置和验证，不创建第二个容器或基础 Google tag。无容器权限时先恢复权限。 |
| B6 数据运营方案未定 | **必须确认** | 管理员及审核值班、保存期限、清理任务、删除请求、备份与费用告警尚无实际配置。匿名 Auth 用户被删除会级联删除其投票/反馈/内容，不能未经评估批量清理。 |

B1 是本轮新发现的实现缺口；本报告明确修正此前“本地验证完成”可能带来的上线准备程度误解。本轮不修复任何代码。

## 2. 后台入口与批准边界

以下为后台入口和常见导航名称；未登录实际账号验证当前 UI。界面改版时按加粗配置名称搜索，不能把这些导航描述当作已配置证明。`PROJECT_REF`、staging 域名、管理员邮箱均为待填写占位，不是已经存在的资源。

| 服务 | 后台入口 | 目标位置 |
| --- | --- | --- |
| Supabase | https://supabase.com/dashboard | 选择组织/项目；Project Settings、Authentication、Database、SQL Editor、Edge Functions |
| Cloudflare | https://dash.cloudflare.com/ | 选择实际账号；Turnstile；Workers & Pages → `proofwell` → Settings |
| Google Tag Manager | https://tagmanager.google.com/ | 所有者可管理的 `GTM-TK8MNNSV` → Workspace |
| Google Analytics | https://analytics.google.com/ | 正确 GA4 Property → Admin → Data streams / Custom definitions / DebugView |
| 网站管理页 | `/community-admin` | **未来已批准的 staging 部署**中测试；当前生产环境并未因本任务创建此页 |

**当前仅填写决策和验收记录。** 新建生产 Supabase 项目会自动生成项目凭证；创建 Turnstile widget 也会产生凭证；保存生产 Secrets、Cloudflare 环境变量或点击 GTM Submit 都属于配置/发布操作。上述动作均须再次获得所有者明确确认，本轮一个也没有执行。先确定独立 staging 项目/来源，不能把当前生产数据拿来测试。不得使用付费资源、修改 DNS 或现有生产域名来绕开配置问题。

## 3. 人工操作顺序：项目、数据库和 Auth

每一项均需填写“操作者、实际项目/环境、完成日期、证据位置”；密钥、密码、完整 token 不放入报告、聊天或截图。

| ID | 人工操作与后台位置 | 配置项及待填写内容 | 验收 |
| --- | --- | --- | --- |
| S01 | 批准资源方案；Supabase Dashboard → Organization → New project（**批准后再点击创建**） | 项目名称：建议 `proofwell-community-staging` / `proofwell-community-production`，仅为建议名称；Region 由受众、数据驻留和所有者选择；Plan/费用上限由所有者批准；Database password 使用独立强密码并存入密码库 | [ ] 组织、项目 REF、区域、预算记录齐全；staging/prod 明确隔离 |
| S02 | Project Settings → General / API 或 Data API / API Keys | 记录实际 Project REF、Project URL；选 public **publishable key** 或 legacy **anon** key，放入同名 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 变量。前端不得用 secret key/service_role/database password | [ ] REF/URL/公钥均来自同一项目；报告只记配置是否存在 |
| S03 | SQL Editor + migration history；执行前先跑 `PREFLIGHT-QUERIES.sql` 第 1 组 | 空项目应无 `community_*` 表；已有对象则先核对来源、迁移记录和备份，不能覆盖或删除 | [ ] 没有未知同名结构；执行路径已决定 |
| S04 | 经授权的迁移执行环境；推荐 Supabase CLI migration 工作流 | **先** `202611190001_article_community.sql`，**再**人工 SQL Editor 运行 `seed.sql`。推荐结构 migration 由 CLI 管理历史，seed 单独审阅执行；不要额外使用 `--include-seed` 又手工执行一遍 | [ ] 结构迁移只应用一次；迁移版本记录可查 |
| S05 | SQL Editor → 运行只读验收查询 | 初始快照：9 张业务表；19 个 article、19 个 active poll；10 enabled/9 disabled；votes/feedback/comments/questions/admins 均为 0。仅适用于全新无测试数据项目 | [ ] 与本分支实际清单一致；已有数据绝不清空以凑目标数字 |
| S06 | Authentication → Sign In / Providers（或 Providers）→ **Anonymous Sign-Ins** | 打开 **Allow anonymous sign-ins**。全局 **Allow new users to sign up** 若被关闭，会影响新匿名用户，必须按实际 Auth 行为验证；不要为了禁止普通管理员注册而误关匿名 signup 所需能力 | [ ] 无邮箱/GitHub 注册即可取得可验证的匿名 Auth 用户；刷新会话保留 |
| S07 | Authentication → Providers → **Email**；Users | 管理员使用正常非匿名的 Email + password 用户；后台 Email provider 必须支持密码登录。是否允许公众 Email signup 单独评估；普通注册用户仍没有管理员权限 | [ ] 真实工作邮箱经所有者确认，非匿名用户，不是浏览器伪造的 metadata 角色 |
| S08 | Authentication → Security and Protection / Bot and Abuse Protection | **Enable CAPTCHA protection**：Turnstile；填写未来批准的 widget Secret Key。配套前端 `NEXT_PUBLIC_COMMUNITY_AUTH_CAPTCHA=true`。**B1 修复前不能以此方案验收管理员登录** | [ ] 匿名 signup 和管理员 password sign-in 都必须有各自有效 token；无/错 token 被拒绝 |
| S09 | Authentication → **Rate Limits** / Security | 查看并决定匿名 signup、token、密码登录等项目支持的限制、费用及报警阈值，记录实际值。不要假设 SQL 互动限流也能限制 Auth 用户创建或 GET 读取 | [ ] 公钥被滥用创建匿名用户的成本已有防护；与共享网络正常用户一起测试 |
| S10 | Authentication → **URL Configuration** | Site URL=`https://proofwelllife.com`（生产方案）；staging 使用其获准域名。Redirect URLs 只列实际需要的精确路径；当前实现用密码登录，**未实现** magic-link/invite callback/密码重置页面，不能随意配置不存在的回调或通配所有 preview 域 | [ ] 登录、邀请/恢复方案明确；不把缺少回调的邮件链接当成完成的登录流程 |

创建项目、运行 migration/seed、开启 Auth 等均是**后续获批后的人工步骤**，不是本轮已完成的生产操作。上表路径中的迁移指令只说明选择方法，不授权现在执行。

### 初始化顺序和重复执行风险

- 结构 migration 使用 `BEGIN/COMMIT`，创建表、索引、触发器及函数，没有 `IF NOT EXISTS` / `CREATE OR REPLACE`。它是**一次性迁移，不是幂等安装器**。重复运行会在已存在对象处报错、事务中止；不能用 DROP、reset 或删除用户数据“解决”。
- CLI 的迁移历史与 SQL Editor 手工跑 SQL 是不同事项。SQL Editor 不会自动登记该 migration 的 CLI 历史；若先手工执行再 `db push`，可能再次报已有对象。选一种结构迁移路径；发现手工执行但历史缺失时，先对比整个 schema，经单独审核再处理历史，不能盲目标记 applied。不要在生产执行 `supabase db reset`。
- seed 的文章 INSERT 用 `ON CONFLICT(article_key) DO NOTHING`，不覆盖已有标题、prompt 或 enabled 状态；投票 INSERT 仅在该文章没有 active poll 时建立一个。现有 active poll 的问题、选项、UUID、票数不会被 seed 同步改写。
- **有条件的重复安全**：正常完整初始化后串行再跑 seed 不变；但管理员/操作者将所有 poll 设为 inactive 后，再跑 seed 会按文件默认值创建新的 active poll。历史仍保留，新版是零票，可能违背“暂时关闭投票”的运营意图。若文章仍 enabled，会恢复可见投票；若文章 disabled，seed 不会重新 enabled 它。不要把 seed 放进每次部署、定时任务或后台自动修复；不要并发执行。
- 已注册为 disabled 的旧草稿后来正式发布时，seed 不会自动把它改成 enabled；须审核文章后在管理界面单独开放。初始 10/9 是当前内容快照，未来须按真实发布清单核对，不能硬凑。
- 发布前运行 `node scripts/community/generate-seed.mjs` 将输出写到**临时文件**，对比当前 seed，只评估变更，不要直接覆盖人工调整的 SQL。
- `scripts/community/test-bootstrap.sql` 只用于空白本地 PostgreSQL；它创建测试角色和简化 auth.users。**绝不在 Supabase 项目执行**。数据库行为测试含合成记录，也只在隔离测试库执行。

本轮已在 `--network none` 且无暴露端口的隔离 PostgreSQL 17 实测：首次安装成功；seed 重跑全状态不变；migration 重跑被拒且原状态不变；人工修改标题/prompt/enabled 后 seed 不覆盖；移除活动 poll 后 seed 会创建新版本并保留旧记录。详见工作区审计附件 `initialization-results.json`。没有因此连接实际 Supabase。

## 4. 管理员、RLS 和数据库权限

1. [ ] **创建工作账号**：Authentication → Users → Add user / Create user。填所有者批准的实际管理员邮箱和独立强密码，确认邮箱归属。仅在确认归属后采用后台支持的 email confirmation；不要伪造审稿资历。官方联系邮箱不自动等于管理员身份。
2. [ ] **核对 UUID**：Users 中打开该用户，记录实际 User UID；确认 `is_anonymous=false`。不要在聊天或前端放服务密钥来“授权”。
3. [ ] **授权白名单**：只有在批准的项目 SQL Editor 中，替换下列占位 UUID 后运行；本轮未运行：

   ```sql
   -- YOUR_APPROVED_USER_UUID 必须替换为实际已确认的非匿名 Auth 用户 UUID。
   insert into public.community_admins(user_id)
   select id from auth.users
   where id = 'YOUR_APPROVED_USER_UUID'::uuid
     and not coalesce(is_anonymous, false)
   on conflict(user_id) do nothing;
   ```

   初次应插入 1 行；重复执行可能是 0 行，也可能是用户不存在/条件不符，须查询白名单确认，不能仅凭“SQL 执行成功”判定有权限。普通用户不可自行增加白名单；不得用 `user_metadata.admin=true` 或登录邮箱字串替代它。
4. [ ] **分离平台与网站账号**：Supabase 组织成员/Cloudflare 成员不是自动的网站 moderator。组织账号可要求 MFA；网站应用目前未实现 MFA challenge/AAL2 强制校验，不能声称启用组织 MFA 后网站管理页也具备该保障。若所有者要求网站 MFA，另行批准开发和验收。
5. [ ] **RLS**：Database → Tables / RLS policies 中查看这 9 张表全部启用 RLS：articles、polls、votes、feedback、comments、questions、admins、audit_log、rate_buckets（均带 `community_` 前缀）。当前没有面向 anon/authenticated 的开放 policy，**空 policy 列表是设计结果**。
6. [ ] **实际权限**：使用只读验收 SQL 核对 anon/authenticated 对表的 SELECT/INSERT/UPDATE/DELETE 都为 false；三个数据 RPC `community_read`、`community_submit`、`community_admin` 对 anon/authenticated/PUBLIC 不可执行，仅 service_role 可执行；均 SECURITY DEFINER，固定空 search_path。`community_options_valid` 是无表数据访问的输入校验辅助函数，不代表公开数据 RPC。
7. [ ] **调用链**：浏览器只调用 Edge Function；Edge 用 Auth `/user` 验证 JWT，随后用服务凭证调用窄 RPC。只读数据也经 Edge 投影出已批准评论；RLS 不会自动保护 service_role，Edge 身份校验、RPC 私有权限和 SQL 白名单必须同时保留。
8. [ ] **权限负例**：未登录、匿名 Auth、普通 Email 用户均不能管理；正常 staff 才能审核、隐藏、删除、配置、导出。浏览器直连 REST 表、RPC，或伪造 actor/approved/status 字段均不得越权。管理员页 noindex 不是认证手段。
9. [ ] **撤权演练**：批准后在 SQL Editor 删除实际 UID 对应的白名单行，并在 Authentication 后台撤销该账号会话；保留非敏感审计记录。不要删除 auth.users 代替撤权，以免级联删除其互动数据。现有账号改密/恢复流程需确认，当前网站没有恢复 UI。

## 5. Turnstile、Edge Secrets、可信 IP

### Widget 和两次独立验证

| ID | 人工操作与入口 | 配置内容 | 验收 |
| --- | --- | --- | --- |
| T01 | Cloudflare → **Turnstile** → Add widget（批准后） | Widget name 可用 `ProofWell Community Production`；mode 建议 Managed。Hostname 生产填 `proofwelllife.com`，不要填协议或路径；staging 用单独实际 hostname，建议单独 widget/项目，避免数据和秘密串用 | [ ] 两种环境清单明确；未向所有 `pages.dev` 放行 |
| T02 | 该 widget 的 **Site key / Secret key** | Site key → `NEXT_PUBLIC_COMMUNITY_TURNSTILE_SITE_KEY`；Secret key → Supabase Auth CAPTCHA 和 Edge 的 `TURNSTILE_SECRET_KEY`。当前代码只支持一个前端 Site key，所以两处 verifier 必须对应同一 widget；若要拆成不同 widget，需要另行设计 | [ ] 公私钥匹配；Secret 不在 Cloudflare Pages 公共变量或 Git |
| T03 | 批准后的真实 staging 页面 | 建立匿名会话消耗一次 Auth CAPTCHA token；之后为每次写入使用新的 token。Edge 检查 `success=true`、`action=community_submit`、`hostname` 等于该请求精确 Origin 的主机名 | [ ] token 过期、重放、错 action/hostname、验证码服务故障均不写入；管理员 Auth 登录另测 B1 |
| T04 | 390/768/1440 px 与真实设备、阻止第三方脚本场景 | 验证 widget 完整、可操作；禁 JS/屏蔽验证码时不能写入也不能显示成功。不把屏幕上隐藏/裁切 widget 当作适配通过 | [ ] 用真实 provider 验证；模拟验证码截图不算通过 |

Turnstile widget 的 hostname allowlist 与 API 的 Origin allowlist 是两项独立配置，必须同时正确。API 只接受精确 Origin，未配置的 preview、缺 Origin 请求应被拒；CORS 可被非浏览器客户端伪造，不能代替 Auth、CAPTCHA 或限流。

### Edge 配置清单（当前仅准备，不保存）

Supabase → **Edge Functions → Secrets**；运行时默认秘密由平台提供，按实际项目核对，不抄到前端。`supabase/config.toml` 的 `project_id="proofwell-community"` 是本地项目名，不是实际项目 REF；`verify_jwt=false` 是为了允许公开 GET，写入仍在 handler 中验证 Auth，不能删掉该验证。

| 变量 | 上线准备阶段 | 最终获批阶段/来源 |
| --- | --- | --- |
| `SUPABASE_URL` | 核对 runtime 默认值 | 实际同项目的 API origin |
| `SUPABASE_SERVICE_ROLE_KEY` | 核对 runtime 已提供；不显示、不复制到报告 | 保留服务端默认密钥；不是前端 publishable key。若项目取消 legacy keys 或改用新 secret key，先做兼容性验证，不能盲换 |
| `COMMUNITY_ENABLED` | **false** | 所有验收完成并获准后才 true |
| `COMMUNITY_ALLOWED_ORIGINS` | 记录方案，不修改生产 | 生产精确 `https://proofwelllife.com`；staging 精确实际 origin；不同项目分别配置，不用 `*` |
| `COMMUNITY_ENV` | 记录 production 方案 | 生产/staging 安全验收都按 `production`；不得靠 development 绕过验证码 |
| `COMMUNITY_REQUIRE_TURNSTILE` | true | 始终 true |
| `TURNSTILE_SECRET_KEY` | 尚不创建/填写生产值 | 批准后来自正确 widget 的 Secret key |
| `COMMUNITY_IP_HASH_SECRET` | 尚不生成生产值 | 批准后用密码库/安全工具生成至少 32 字符高熵独立秘密；不复用数据库密码，不记录明文；轮换会影响网络限流关联 |
| `COMMUNITY_TRUST_PROXY_IP` | **false** | 仅 IP 验收证据齐全后 true |

### 可信 IP 验收，不能省略

- [ ] 从 Supabase 官方平台说明/支持获得网关头处理契约；记录是否覆盖或可信追加 `X-Forwarded-For`，及最后一个值是否为**真实访客出口 IP**，而非某个所有用户共享的代理地址。
- [ ] 在获准的 staging 环境验证浏览器正常请求、无自填头、伪造左值/右值/多个头、IPv4 和 IPv6；用测试者自知网络出口校验服务端取值。右端值不得由客户端操纵，也不能所有用户都变成同一代理 IP。只观察受控测试请求，不将原始访客 IP 写入新生产日志。
- [ ] 确认 Supabase Auth 自身 signup/login 限流也有正确来源 IP；自建 SQL 限流不会保护 Auth `/signup`，而 signup 可直接从浏览器访问。
- [ ] **无法证明或测试失败就维持 false**。可能需要受信任代理或平台级防滥用边界；这涉及新架构/代码和额外部署，须另行授权。不能将可由外部设置的 `CF-Connecting-IP` 当作来自 Cloudflare 的签名证明，不能旁路直达后端破坏保护。
- [ ] 最后在真实后台复测：同一 Auth 身份重复投票不增票；更换匿名身份仍受网络频率限制；换设备/VPN不能宣称被彻底识别；共享公司/家庭网络不应被误认为每个人都是不同可信人。当前系统是防无限刷新和抑制滥用，不是严格“一人一票”。
- [ ] 评估公开 GET、失败认证及被拒提交的整体请求成本；SQL 计数限制成功写入，不是完整的请求层限流。平台支持的配额/告警/防滥用须核对，不能假设主站 Cloudflare WAF 自动保护直接访问 Supabase 的流量。若需要新增受信代理或硬性请求限流，先单独批准方案。

## 6. Cloudflare Pages 配置准备与发布顺序

入口：Cloudflare → Workers & Pages → `proofwell` → Settings → **Variables and Secrets / Environment variables**。保留现有 `main` 生产分支、构建命令、`out`、站点域名及其他变量。**本轮不保存任何值，也不触发重建。**

| Pages build 变量 | 待填值 | 注意事项 |
| --- | --- | --- |
| `NEXT_PUBLIC_COMMUNITY_ENABLED` | 准备阶段 false | true 会进入实际互动 UI，并会在接近文章底部时请求服务；包括管理员入口可用性也依赖这个开关。不能假设 false 时还能在网站后台完整验收；应在已获批 staging 单独启用 |
| `NEXT_PUBLIC_SUPABASE_URL` | 实际批准的项目 URL | staging 与生产不能串库 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 实际 public anon/publishable key | 公开是预期，不是授权管理员的秘密；RLS/RPC 边界必须保持 |
| `NEXT_PUBLIC_COMMUNITY_TURNSTILE_SITE_KEY` | 同环境 widget Site key | 不是 Secret key |
| `NEXT_PUBLIC_COMMUNITY_AUTH_CAPTCHA` | true | 和项目 Auth CAPTCHA 一致 |

这些是构建时变量，更改后需要后续获批的静态重建，不是改完马上生效。不得创建 `.env.production` 并提交秘密；Supabase 服务凭证、数据库密码、HMAC Secret 不放 Pages 的 `NEXT_PUBLIC_` 环境。

未来获批后的顺序：独立 staging 配置及 B1 修复 → staging migration/seed/权限/真实验证 → 政策与所有者验收 → 单独取得生产配置与部署授权 → 确认生产 schema/secrets/widget/账号 → 部署 Edge 且先关闭总开关 → 全部准备好后按批准计划启用 backend、构建发布 frontend → 验证并监控。此处只是计划，不包含任何本轮部署。

回退预案：优先将 backend `COMMUNITY_ENABLED=false` 停止 API 服务；随后获准重建 frontend `NEXT_PUBLIC_COMMUNITY_ENABLED=false` 恢复清晰不可用界面。保留真实数据和审计，不靠删库/重跑 seed 回退。总开关也会关闭网站管理员 API，事件期间授权运营人员可在 Supabase 后台处理审核；不要把此开关误认为仅关闭公众写入。

## 7. GA4 与现有 GTM 的映射方案

源码 `app/layout.tsx` 中只有一次全局 `GTM-TK8MNNSV` 安装；bootstrap 和 noscript 是同一套安装的两个部分。社区代码不直接加载 `gtag/js`、不新建 GA4/Ads 基础标签。未访问远程容器，不能据源码断言线上没有其他注入或标签；上线验收时仍需 Network/Tag Assistant 排除两容器和重复触发。`GTM-PH85ZDWJ` 的来源不是本次已确认事实，不作来源假设，也不新增它。

1. [ ] **确认访问权**：GTM 登录后定位 `GTM-TK8MNNSV`；查已有已发布 Google tag/GA4 configuration 和关联数据流。GA4 → Admin → Data streams → 实际 Web stream 中核对 `G-9RENYENMPD` 与网站 URL。找不到原容器时请求当前管理员授权，不创建替代容器。账户权限不等于此容器的发布权限。
2. [ ] **先查重复标签/触发器**：已有同名事件标签就复用或调整，不能再建第二套。审查 GA4 Enhanced Measurement、自动 form_submit、第三方 DOM/form listener 是否读昵称/文本或造成双计数；测试/排除 `/community-admin` 的表单采集与敏感字段。不得无差别修改其他标签。
3. [ ] **仅创建/配置工作区草稿**（后续获准后）：Variables → New → **Data Layer Variable**，版本 2：`DLV - article_slug` 的 Data Layer Variable Name=`article_slug`；`DLV - interaction_type` 的 Name=`interaction_type`。变量默认值不填个人数据。
4. [ ] **Custom Event triggers 和 GA4 Event tags**：使用下表的精确事件名，触发器不启用正则。每个 GA4 Event tag 引用已确认的现有 Google tag/GA4 destination，不再加一个 All Pages Google tag，也不把所有事件同时发给两个 Measurement ID。

| 事件名/GA4 Event name | 建议触发器名称与类型 | 建议标签名称 | 发生语义 |
| --- | --- | --- | --- |
| `poll_vote` | `CE - poll_vote` / Custom Event | `GA4 - Community - poll_vote` | 后台首次接受一票，不含选项正文 |
| `comment_submit` | `CE - comment_submit` / Custom Event | `GA4 - Community - comment_submit` | 后台接受待审评论，不表示审核通过 |
| `article_feedback` | `CE - article_feedback` / Custom Event | `GA4 - Community - article_feedback` | 后台首次接受 helpfulness，不含具体回答 |
| `question_submit` | `CE - question_submit` / Custom Event | `GA4 - Community - question_submit` | 后台接受私密选题，不含问题文本 |

每个 tag 仅配置两个 Event parameters：`article_slug={{DLV - article_slug}}`、`interaction_type={{DLV - interaction_type}}`。禁止添加昵称、正文、问题、邮箱、Auth UUID、access/refresh token、CAPTCHA token、IP/hash。不得把表单 DOM 元素、表单对象或全部 dataLayer 直接转发；用户文本不得写 URL/query/hash/title 供自动采集。

5. [ ] **Consent settings**：沿用现有同意策略和 CMP，核验 `analytics_storage` 及适用的广告同意状态；不要为促成事件强设 granted。当前互动 checkbox 是内容公开/行为说明，**不是** Analytics/Ads Cookie 同意，也没有新增完整 Consent Mode/CMP。若所在地区需事先同意而现有控制不足，应先另行解决，不能以这个 checkbox 代替。
6. [ ] **GA4 报表维度**：Admin → Custom definitions → Create custom dimension；Display name 可用 `Article slug` / `Interaction type`，Scope=Event，Event parameter 分别为 `article_slug` / `interaction_type`。先检查是否已存在；无需把已自动收集的 event_name 再注册为自定义参数。暂不 Mark as key event，不导入 Ads conversion，不添加 `AW-18568807997` 事件标签。
7. [ ] **Preview / DebugView 验收**：在获准 staging 用 Tag Assistant 和对应 GA4 测试/过滤策略验证。一条首次接受的互动应有一条对应事件且只有一个目标 destination；重复提交、429、CAPTCHA 失败、仅创建匿名会话、审核操作不应发送四类成功事件。浏览器刷新会清除内存 dataLayer，刷新后还要重新验证，不把旧日志重复算成新事件。DebugView 可能显示调试技术参数，但不得带上述 PII。
8. [ ] **发布须单独批准**：GTM Workspace Draft、Preview、Submit/Publish 是不同步骤；本轮没有创建草稿或发布容器。确认 Analytics/Ads 自动表单采集和接收情况前，不宣称 GA4 已正常收到事件。

## 8. 隐私政策与使用条款待补内容

目标文件 `lib/trust-pages.ts` 的 `privacy-policy` 对应 https://proofwelllife.com/privacy-policy；Terms 位于 `lib/pages.ts`，对应 `/terms`。本轮仅列待补项，不修改页面、发布日期或 noindex。

| 政策位置/主题 | 需要改成准确说明的内容 | 所有者待确认 |
| --- | --- | --- |
| “Information you choose to provide” | 区分仍然不提交的 Contact/Newsletter 预览与**真实提交**的 Community。评论的 nickname/body、投票、helpfulness、选题正文、时间、文章标识分别如何保存/使用 | 内容审核人和处理目的 |
| “Technical and analytics information” | 匿名 Auth UUID 是可关联的假名标识，不是完全匿名；请求 IP/浏览器信息由供应商接收。四个事件只传 slug/type，但 GA4 本身的自动数据收集和现有广告标签要单独描述 | 实际 Google tags、数据用途/法律依据 |
| “Cookies and similar technologies” | Supabase JS 会话通过浏览器持久存储（代码 key=`proofwell-community-session`，包含会话凭证）；说明目的、保存/刷新/失效方式、清除影响与安全。不能再泛称所有交互只存在内存 | Auth Session 设置及适用地区的同意方案 |
| 请求发生时点 | 接近底部会先加载公开互动与 Turnstile，未勾 checkbox 前服务商已可能接收请求；匿名 Auth 是主动开始会话时创建。必须按真实时序说明，不能宣称全部服务都只在提交/同意后加载 | 安全服务必要性、合法依据及是否需调整加载时机 |
| “Third-party services” | 明确 Supabase 数据/身份服务、Cloudflare Pages/Turnstile、Google Analytics/GTM，以及已有联盟外链；服务商可能记录原始请求信息。应用表不保存原始 IP，不等于供应商不接收/不记录 IP | 合同、区域、跨境传输、DPA、实际子处理者 |
| 评论可见范围 | pending/hidden 非公开；approved 后昵称和正文对所有人可见，可被复制或截图。当前评论客户端加载、不建新索引页面，但**不能承诺搜索引擎绝不读取或保存** | 社区规范、审核标准、联系与申诉 |
| 私密建议与互动统计 | 选题仅授权编辑可见；投票/反馈公开汇总、不公开 Auth UUID；管理员 CSV 包含文本/昵称，属于需限制存取的数据 | 谁能导出、存放/传输方式及导出文件保留期限 |
| IP 防滥用 | 应用保存基于可信 IP 的 keyed HMAC 计数键，按周轮换；仅是防滥用标识，不是匿名化的法律保证。计数行两天到期，实际删除依赖写入或后续清理任务，不能承诺恰好两天自动消失 | 清理作业、技术日志周期、HMAC 轮换方案 |
| “Retention, access, and security” | 分别决定 pending/hidden/approved comments、questions、votes/feedback、anonymous Auth users、rate buckets、audit logs、供应商日志/备份的期限与删除办法。没有预设合法有效期限 | 每类具体期限、依据、执行人、作业与备份限制 |
| “Privacy rights and requests” | 联系官方邮箱处理访问/更正/删除等请求，说明必要身份核实和匿名会话丢失后的定位局限；不要求用户发送密码或完整 token，也不保证能恢复已丢失身份 | 适用权利、时限、删除备份及公开副本的限制 |
| “Status / Changes” | 确认真实数据控制者、适用地区/司法辖区和**实际生效日**；生效日期应与获准启用时点匹配，不把本次报告日期当作政策已生效 | 不编造公司、地址、电话或法律合规结论 |
| Terms / 社区规则 | 禁垃圾/滥用/医疗隐私、内容权利和适当展示许可、审核/隐藏/删除、非医疗建议、个人经历非临床证据、儿童/适龄参与、申诉和服务中断规则 | 由所有者确定适用年龄及规则；不虚构特定法律必然要求 |

官方联系人继续统一为：**ProofWell Editorial Team — proofwelllife@gmail.com**，使用有效 mailto。不是医学审稿人身份，不替代真实控制者信息。

### 数据维护人工项

- [ ] 在 Supabase **Integrations → Cron**（或 Database/Extensions → pg_cron，按实际界面）审查是否有可用调度能力；本轮不启用扩展或创建作业。
- [ ] 后续批准的任务名称可用 `proofwell_community_rate_cleanup`；SQL 为 `delete from public.community_rate_buckets where expires_at < now();`；每天一次的示例为 `0 3 * * *`，**若作业采用 UTC 则是上海 11:00**，以后台实际时区为准。只确认方案，不在本轮运行删除。
- [ ] 匿名账号保留/删除必须单独评估；删除 auth.users 会 cascade 其互动，改变真实总票数和有用率。管理员撤权仅删白名单并撤销会话，不删 Auth 用户。
- [ ] 记录实际备份和恢复能力、项目暂停/配额、费用告警、DB/Edge/Auth/CAPTCHA 异常监控；Plan 相关能力以实际订阅为准，不假设都有 PITR 或无限存储。

## 9. 上线前逐项验收与放行记录

以下状态均待真实环境验收，不能凭上一轮模拟数据勾选。证据须脱敏，不保存密钥/密码/token。后续执行部署、配置及发布时仍需单独授权。

| ID | 验收项 | 通过标准/证据 | 状态 |
| --- | --- | --- | --- |
| A01 | 资源和环境隔离 | 实际项目 REF、区域、预算；staging 不写生产库 | [ ] |
| A02 | migration/seed 历史 | 顺序正确；已有结构不覆盖；记录 seed SHA/执行人；初始计数合理且无伪造互动 | [ ] |
| A03 | RLS 与 RPC | 只读查询结果和真实 anon/authenticated REST 负例均通过；无公开 staff 管理权限 | [ ] |
| A04 | Auth 与 B1 修复 | 无/错/过期 token 登录失败；有效 token 的匿名会话和 staff 登录成功；不是 mock | [ ] |
| A05 | 管理权限 | 匿名/普通用户 403；管理员可审核/隐藏/删除/导出；撤权即时阻断新请求 | [ ] |
| A06 | 网络来源 B2 | 可信网关契约及头伪造测试通过；不靠 Origin 或浏览器 ID 判断真实人 | [ ] |
| A07 | Token 与防垃圾 | 重放/错误 hostname/action、honeypot、HTML/超长/频率限制失败；失败不增加统计 | [ ] |
| A08 | 数据行为 | 不同文章独立；刷新不重复投票/反馈；pending 不公开；问题不公开；新 poll 不挪旧票 | [ ] |
| A09 | 故障恢复 | Auth/验证码/DB/网络不可用时清晰报错且不伪装保存；测试超时后重试的实际落库/去重结果。客户端超时 15s、多个后端步骤各可等 10s，需真实延迟测试 | [ ] |
| A10 | 前端回归 | 19 篇文章与 390/768/1440 px、真实 widget、桌面/手机表单；草稿关闭；未配置不发请求 | [ ] |
| A11 | SEO/静态架构 | TS、build、导出/索引回归通过；正文未变；canonical/robots/sitemap/JSON-LD 保留；管理员 noindex 且不进 sitemap | [ ] |
| A12 | 秘密与会话 | 服务密钥不出现在浏览器、构建物、Source Map、Git、截图、URL 或 GA4；Auth 会话持久存储和账号恢复已评估 | [ ] |
| A13 | 法律与运营 | Privacy/Terms 的真实数据流、期限、控制者、生效日与社区规则获准；审核值班和删除流程可执行 | [ ] |
| A14 | 分析事件与同意 | 现有单一 GTM；四事件一次且无 PII；失败/重复不计；管理员表单采集受控；DebugView 与同意测试通过 | [ ] |
| A15 | 清理/备份/监控 | 过期计数有可验证清理作业；匿名账户清理无误伤；备份、配额、告警记录 | [ ] |
| A16 | 生产启用与回退授权 | B1–B6 处理结果和剩余风险获所有者书面验收；生产配置、GTM 发布、代码合并、部署分别明确批准 | [ ] |

所有者批准人：________；范围：________；实际验收日期：________；证据记录：________。未填写或存在阻断时，保持 `NEXT_PUBLIC_COMMUNITY_ENABLED=false`、`COMMUNITY_ENABLED=false`、`COMMUNITY_TRUST_PROXY_IP=false`。

## 10. 本轮检查依据与交付

- 已读取 `SETUP.md`、migration、seed/generator、Auth/Turnstile/admin/Edge/client、root GTM、当前 Privacy/Terms 和测试逻辑。
- 实际动态检查仅使用隔离本地 PostgreSQL；重复初始化测试结果在 `/workspace/proofwell-community-launch-audit/initialization-results.json`。没有再次运行网站全量构建，因为本轮只新增审计文档，不改实现；上一轮测试结果仍作为历史记录，不重新标记为本轮生产验收。
- 本轮新增 `docs/community/LAUNCH-READINESS.md` 与 `docs/community/PREFLIGHT-QUERIES.sql`。后者只有 SELECT，是给所有者在**获准项目**中验证用的，不含建表、授权、删除或生产秘密。
- 结束时已核对：本轮开始前的 134 个已跟踪/未跟踪文件均字节一致，main 工作区干净且提交未变；既有未提交开发成果完整保留。新增只读 SQL 已在隔离库语法与只读事务检查通过，不代表已在实际 Supabase 验收。

操作参考（提供官方文档入口，不表示本轮已访问账号或核验当前 Dashboard UI）：[Supabase anonymous sign-ins](https://supabase.com/docs/guides/auth/auth-anonymous)、[Supabase CAPTCHA](https://supabase.com/docs/guides/auth/auth-captcha)、[Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)、[Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/)、[Turnstile server-side validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/)。若平台实际设置与此文不符，先核实再操作，不能跳过验证或放宽生产权限。
