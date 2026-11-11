# ProofWell 索引审计（2026-11-11）

## 核验范围与结论

基于 main 1163de3d7dd4f4bd24e006722e2033462ff93b0b 检查源码、现有静态输出并重新构建。下列结果来自实际 out HTML 与本地静态 HTTP 响应，**不是生产域名的实时扫描结果**。当前环境代理对 https://proofwelllife.com/ 的 CONNECT 请求返回 403；生产网站和 Cloudflare 部署状态尚未核验，该 403 不能当作生产站点自身返回的状态。

共 40 个注册页面，另有 2 个框架错误页构建产物。23 个正式公开页面输出 index, follow 并恰好进入 sitemap；19 个已知 HTML 输出 noindex：9 篇未完成文章、7 个规划栏目、1 个法律草稿和2个错误页产物。未发现正式文章或信任页面被错误 noindex，因而没有更改文章的发布状态来“解除保护”。

所有 4 篇已发表文章均已进入 sitemap：

- https://proofwelllife.com/science/633-vs-830-nm（既有 published: 2026-11-09）
- https://proofwelllife.com/science/how-led-masks-work（既有 published: 2026-11-06）
- https://proofwelllife.com/science/irradiance-vs-fluence（既有 published: 2026-11-09）
- https://proofwelllife.com/science/red-vs-near-infrared（既有 published: 2026-11-09）

五个核心信任页面 /about、/editorial-policy、/affiliate-disclosure、/privacy-policy、/contact，以及 /editorial-standards、/disclaimer 均 index, follow、self-canonical 且在 sitemap 中。

## 所有已知 noindex URL

| URL | 分类 | 最终 Meta Robots | Canonical | Sitemap |
| --- | --- | --- | --- | --- |
| https://proofwelllife.com/404 | 404 错误页构建产物 | noindex；noindex, nofollow | 无（错误页） | 排除 |
| https://proofwelllife.com/_not-found | 404 错误页构建产物 | noindex；noindex, nofollow | 无（错误页） | 排除 |
| https://proofwelllife.com/buying-guides/how-to-choose-led-mask | 未完成文章 | noindex, nofollow | https://proofwelllife.com/buying-guides/how-to-choose-led-mask | 排除 |
| https://proofwelllife.com/comparisons/omnilux-vs-currentbody | 未完成文章 | noindex, nofollow | https://proofwelllife.com/comparisons/omnilux-vs-currentbody | 排除 |
| https://proofwelllife.com/comparisons/omnilux-vs-solawave-vs-shark | 未完成文章 | noindex, nofollow | https://proofwelllife.com/comparisons/omnilux-vs-solawave-vs-shark | 排除 |
| https://proofwelllife.com/comparisons/omnilux-vs-solawave | 未完成文章 | noindex, nofollow | https://proofwelllife.com/comparisons/omnilux-vs-solawave | 排除 |
| https://proofwelllife.com/healthy-aging | 规划栏目 | noindex, nofollow | https://proofwelllife.com/healthy-aging | 排除 |
| https://proofwelllife.com/nutrition | 规划栏目 | noindex, nofollow | https://proofwelllife.com/nutrition | 排除 |
| https://proofwelllife.com/recovery | 规划栏目 | noindex, nofollow | https://proofwelllife.com/recovery | 排除 |
| https://proofwelllife.com/reviews/currentbody-series-2 | 未完成文章 | noindex, nofollow | https://proofwelllife.com/reviews/currentbody-series-2 | 排除 |
| https://proofwelllife.com/reviews/omnilux-contour-face | 未完成文章 | noindex, nofollow | https://proofwelllife.com/reviews/omnilux-contour-face | 排除 |
| https://proofwelllife.com/reviews/shark-cryoglow | 未完成文章 | noindex, nofollow | https://proofwelllife.com/reviews/shark-cryoglow | 排除 |
| https://proofwelllife.com/reviews/solawave-wrinkle-retreat-pro | 未完成文章 | noindex, nofollow | https://proofwelllife.com/reviews/solawave-wrinkle-retreat-pro | 排除 |
| https://proofwelllife.com/science/red-light-therapy-skin | 未完成文章 | noindex, nofollow | https://proofwelllife.com/science/red-light-therapy-skin | 排除 |
| https://proofwelllife.com/sleep | 规划栏目 | noindex, nofollow | https://proofwelllife.com/sleep | 排除 |
| https://proofwelllife.com/supplements | 规划栏目 | noindex, nofollow | https://proofwelllife.com/supplements | 排除 |
| https://proofwelllife.com/terms | 法律草稿 | noindex, nofollow | https://proofwelllife.com/terms | 排除 |
| https://proofwelllife.com/wellness-technology | 规划栏目 | noindex, nofollow | https://proofwelllife.com/wellness-technology | 排除 |
| https://proofwelllife.com/wellness | 规划栏目 | noindex, nofollow | https://proofwelllife.com/wellness | 排除 |

两条错误页记录是 /404.html 和 /_not-found.html 对应的构建产物访问路径，不是文章或重定向页面。任意不存在的路径也会使用 noindex 的 404 响应；不可能穷举这些不存在的 URL。本地测试随机未注册路径实际返回 HTTP 404。显式访问两个构建产物在简易本地服务器下返回 200，不能据此断言 Cloudflare 对错误页产物的线上状态。

用户本轮明确确认：7 个仅含 Upcoming/Planned 内容的栏目和 /terms 法律草稿继续保留 noindex。其余 9 篇未完成文章缺少有效的既有 published 日期，继续受发布资格守卫保护；没有为这些文章伪造日期或修改 Frontmatter。

## 全部允许索引 URL

- https://proofwelllife.com/about — 信任/政策页面
- https://proofwelllife.com/affiliate-disclosure — 信任/政策页面
- https://proofwelllife.com/beauty-tech — 公开入口/栏目
- https://proofwelllife.com/buying-guides — 公开入口/栏目
- https://proofwelllife.com/comparisons — 公开入口/栏目
- https://proofwelllife.com/contact — 信任/政策页面
- https://proofwelllife.com/disclaimer — 信任/政策页面
- https://proofwelllife.com/editorial-policy — 信任/政策页面
- https://proofwelllife.com/editorial-standards — 信任/政策页面
- https://proofwelllife.com/ — 公开入口/栏目
- https://proofwelllife.com/privacy-policy — 信任/政策页面
- https://proofwelllife.com/reviews — 公开入口/栏目
- https://proofwelllife.com/science/633-vs-830-nm — 正式文章
- https://proofwelllife.com/science/how-led-masks-work — 正式文章
- https://proofwelllife.com/science/irradiance-vs-fluence — 正式文章
- https://proofwelllife.com/science/red-vs-near-infrared — 正式文章
- https://proofwelllife.com/science — 公开入口/栏目
- https://proofwelllife.com/skincare — 公开入口/栏目
- https://proofwelllife.com/topics/beauty-devices — 公开入口/栏目
- https://proofwelllife.com/topics/led-masks — 公开入口/栏目
- https://proofwelllife.com/topics/red-light-therapy — 公开入口/栏目
- https://proofwelllife.com/topics/skincare-science — 公开入口/栏目
- https://proofwelllife.com/topics — 公开入口/栏目

## 修复的根因

root layout 为正式公开页面提供 index, follow 和首页 canonical。Next.js 对 not-found 响应自动追加 noindex，但旧 app/not-found.tsx 未覆盖继承 metadata，导致两个错误页同时输出 noindex 与 index, follow，且 canonical 指向首页。

在 app/not-found.tsx 中添加页面级 Metadata：robots.index=false、robots.follow=false、alternates.canonical=null。重建后错误页输出框架自动的 noindex 及一致的 noindex, nofollow，不再出现正向索引/关注指令，也不再把不存在的 URL canonical 到首页。错误页继续排除在 sitemap。

Next.js 自动标签与显式标签并存是框架行为；修复针对互相矛盾的指令，不通过移除 noindex 让错误页被收录。

## 重定向分类

仓库没有 _redirects、Next.js redirects 配置、meta-refresh 页面或 redirect() 页面。23 条 sitemap URL 在本地均不经过重定向，直接 HTTP 200。没有把 noindex、canonical 差异或错误页当作重定向。

Cloudflare 的 HTTP→HTTPS、www→主域、尾斜杠/clean URL 规范化等可能属于平台规则；生产访问被阻断，不能宣称已核实这些线上跳转。若未来发现重定向源 URL，应只将最终的 200 self-canonical 目标加入 sitemap，不能给重定向源伪造页面级索引状态。

## Canonical / robots / sitemap 一致性

- 正式公开页面：index, follow；单一 self-canonical；https://proofwelllife.com 域；在 sitemap 中恰好一次。
- 受保护页面：noindex, nofollow；除错误页外保留 self-canonical；不在 sitemap。
- 错误页：一致的 noindex 指令；无 canonical；不在 sitemap。
- 生产 robots.txt：User-agent: *，Allow: /，Sitemap: https://proofwelllife.com/sitemap.xml。草稿可被抓取以读取其 noindex，不通过 Disallow 隐藏 noindex 信号。
- out/sitemap.xml 仍为 23 条，与修改前逐字节一致；out/robots.txt 也逐字节一致。
- Preview / development 保护不变；不得为解决线上问题而将预览伪装成 main。
- PartnerBoost 所有权 meta 在全部 42 个导出 HTML 的 head 中保持不变。

控制文件：lib/public-routes.ts 定义注册路由和发布/索引资格；lib/indexing.ts 控制 Preview 和 Meta Robots；app/layout.tsx 与 app/[...slug]/page.tsx 输出 metadata；app/not-found.tsx 覆盖错误页；app/robots.ts 和 app/sitemap.ts 生成静态 SEO 文件。

## 验证与部署步骤

新增 scripts/check-sitemap.mjs 回归检查覆盖所有导出页面的 robots 冲突、错误页错误 canonical 以及正常页 self-canonical。该回归在修复前实际失败于 out/404.html: conflicting index/noindex directives；修复后已通过。

本轮不修改 MDX 正文、文章发布日期、作者/审稿信息、图片、设计、依赖、生产域名、DNS 或 Cloudflare 账号配置。README 中“13篇均草稿、19条 sitemap”的旧说明已更新；原 sitemap 修复记录标明历史范围。

本地验收结果：

| 检查 | 结果 |
| --- | --- |
| npm run typecheck | 通过 |
| CF_PAGES=1 CF_PAGES_BRANCH=main NEXT_PUBLIC_SITE_URL=https://proofwelllife.com npm run build | 通过，生成 out |
| node scripts/check-indexing.mjs | 通过；23 个资格 URL，4 篇正式文章各一次，9 篇未完成文章受保护，Preview 守卫不变 |
| BASE_URL=http://127.0.0.1:4410 node scripts/check-sitemap.mjs | 通过；XML 合法无重复，23 个目标均 HTTP 200，所有 42 个 HTML 的 Meta Robots/canonical 检查通过 |
| 完整 URL 清单和本地 HTTP 分类 | 通过；42 个产物，19 个 noindex；无本地重定向；不存在路径返回 404 |
| node scripts/check-site.mjs | 通过；67 个页面/资源、13 篇文章直接访问/刷新、390/768/1024/1440 视口，零失败 |
| git diff --check 及源码范围检查 | 通过；13 篇 MDX 和发布元数据均未改，既有图片/设计/依赖/PartnerBoost 验证未改 |

这些结果只证明当前生产配置的本地构建，不能代替 Cloudflare 线上检查。


生产核验必须确认 Cloudflare Pages 的生产分支为 main、部署对应最终提交 SHA 且成功，然后对同一构建运行：

```sh
BASE_URL=https://proofwelllife.com npm run check:sitemap
```

还应逐一检查本报告受保护 URL 的生产 HTTP、Meta Robots 与 X-Robots-Tag；检查已发表页面无 hosting-level noindex、Cloudflare Access 或缓存旧响应；区分 main 生产域与 pages.dev Preview。只有线上检查通过才可报告实际部署已验证。当前缺少生产域名与 api.cloudflare.com 的运行环境网络放行，报告不宣称线上完成，也未请求 Google 索引。
