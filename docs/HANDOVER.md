# 高级优化交接与验收

验收日期为 2026-11-24，基线提交 `962be0a`。本次工作位于 `codex/digital-garden-acceptance` 分支。验收截图、原始样本与日志留存在本地。

## 审查发现与处理

| 优先级 | 基线或验收中发现的问题 | 处理 |
| --- | --- | --- |
| 高 | 旧依赖树有 1 项严重、1 项高危和 6 项其他 npm 审计记录 | 升级到 Astro 7.4.13 与配套 MDX，统一 KaTeX 版本，切到 Node 24，重新锁定及审计 |
| 高 | 示例和草稿必须覆盖所有发布入口。验收还复现了隐藏示例的原图仍被写入 `dist/` | 内容加载阶段筛选草稿与发布示例，防止它们登记图片和 MDX 模块。用隔离构建测试原图、页面、RSS、Sitemap 和搜索索引 |
| 高 | Sitemap 和 robots.txt 使用占位域名，部署仍指向 Pages | 正式构建校验 HTTPS 源地址，配置 Workers Static Assets 及 GitHub Actions |
| 中 | 缺少搜索、RSS、Mermaid 和可验证的响应式图片 | 接入中文 Pagefind、RSS、按需 Mermaid、Astro 图片组件和 Markdown 图片优化。修复目录直达时 Mermaid 视口裁切 |
| 中 | 公式 CSS 全站加载，Windows 本地 Workers 的 CSP 拦截内联字体 | 数学页单独加载本地样式及 WOFF2，生产浏览器检查实际字体加载 |
| 中 | 四个详情页重复实现目录与元信息，项目标签未被索引 | 提取公共文章布局、项目卡片和发布条件，标签和分类覆盖四个集合 |
| 一般 | 首页入口分散，文章卡片与移动阅读层级有待统一 | 重新组织首页、导航、卡片、深浅主题与移动目录 |

## 优化前后

- 首页由单列介绍和分散统计升级为首页介绍与站内索引并列，保留最近更新、主题和精选项目。手机按阅读顺序排成单列。
- 文章使用统一排版、实际分类链接、带定位状态的目录和上下篇。数学由 KaTeX 在构建时渲染，Shiki 随主题换色。
- 页头搜索支持中文与英文、命中高亮、空结果和查询历史。Pagefind 索引来自公开详情。RSS 订阅覆盖四类内容。
- 项目卡片共享状态、技术栈、封面和外链。封面与 Markdown 示例取自本网站界面截图，生成 WebP 和响应式尺寸变体。
- `SITE_URL` 用于 canonical、Open Graph、RSS 和 Sitemap。预览构建保留示例，正式构建排除示例。未设置 `SITE_URL` 的构建拒绝抓取。
- Workers 资产模式保留自定义 404、哈希资源缓存和安全头。GitHub Actions 构建与测试。部署和内容发布步骤见下文。

## 自动化验收

| 检查 | 实测结果 |
| --- | --- |
| `npm ci` | Windows 独立依赖目录安装成功，锁定依赖完成 |
| `npm run check` | 43 个文件，0 错误、0 警告、0 提示 |
| `npm run build` | 40 个 HTML 页面，原有 35 个路径全部保留，Pagefind 索引 11 条演示内容 |
| `npm test` | 3 项通过，142 个内部 URL、锚点或资源目标，RSS、Sitemap 和部署产物检查通过 |
| `npm run test:browser` | Playwright 驱动系统 Edge，6 项通过。覆盖导航、四类详情、中文标签、搜索、深色、375px、目录、公式、代码、图表、图片和 404 |
| 本地 Workers HTTP | 同一浏览器测试 6 项通过，检查 CSP、同源网络、公式字体和自定义 404 |
| `npm run test:release` | 隔离样例覆盖四类草稿、示例、源图、MDX 公式、含斜杠分类、C++ 标签和占位域名拦截 |
| `npm run deploy:dry-run` | Wrangler 4.168.0 识别静态资产模式与产物 |
| `npm audit` | 基线共 8 项，升级后的锁定依赖树为 0 项 |
| 敏感信息 | 在源码、静态目录、构建脚本、工作流扫描常用密钥签名，未命中。无已跟踪的环境变量文件或密钥文件 |
| 外链 | 实际访问唯一外部演示 URL `https://example.com/`，HTTP 200 |
| 视觉 | 实际浏览器检查桌面与手机的深浅主题，首页与文章截图和性能原始数据位于本地验收目录 |

GitHub 远程工作流与真实 Cloudflare 账户部署留待连接仓库后执行。成果为静态站点，本次执行的是本地验证和干运行。

## 性能

同一台 Windows 电脑和系统 Edge，依次测基线和新版本。临时 HTTP 服务对 HTML、CSS、JS 启用 gzip，无网络节流和 CPU 模拟。每个宽度 5 个新浏览器上下文取中位数。传输量为页面及资源响应体的 `encodedBodySize`，不含 HTTP 头。

| 首页指标 | 优化前 | 优化后 |
| --- | ---: | ---: |
| 390px LCP | 268 ms | 124 ms |
| 1440px LCP | 276 ms | 140 ms |
| 两种尺寸 CLS | 0 | 0 |
| 390px 总传输量 | 15,200 B | 9,016 B |
| 1440px 总传输量 | 15,200 B | 16,244 B |
| 主 CSS 传输量 | 11,627 B | 4,734 B |
| 产物大小 | 1,357,112 B | 6,584,486 B |
| KaTeX 字体文件 | 59 | 20 |

桌面测量中浏览器额外预取了 7,228 B 的下方项目封面。新版本的 201 个文件含 Pagefind、Mermaid 及响应式图像。最大文件是 Mermaid 下按需使用的布局模块，1,498,941 B。首页不加载 Mermaid 和 Pagefind 运行库。以上 LCP 和 CLS 为本地对照值。

## 发布、日常维护和已知边界

- [部署与回滚](DEPLOYMENT.md)含 GitHub 自动化、Workers Builds 审批后的配置、免费额度和版本回滚。
- [日常文章发布](PUBLISHING.md)含四类内容目录、草稿、公式、图表、图片和上线核对步骤。
- 当前 11 条内容均为演示。正式构建过滤后，有内容的集合会正常展示。空站发布构建也通过，搜索索引为 0。将真实内容加到对应目录后再首次发布。
- 样式和性能测量使用桌面 Chromium 与模拟移动视口。Safari、iOS 真机与公网 CDN 指标待实际环境验证。
- Mermaid 流程图经过端到端测试。更复杂的图表及极端长度内容建议在实际文章中预览。Pagefind 索引在构建后可用。
- 浏览器回归使用仓库中的已标记示例作为测试数据。正式站点可保留源文件供测试使用。
- 内容量增长后，优先为长列表启用分页。真实项目封面准备后，再补分享图片。积累内容后可按关键词和标签评估双链与相关条目。

## 修改文件清单

- `.github/workflows/verify.yml`
- `.gitignore`
- `.nvmrc`
- `AGENTS.md`
- `astro.config.mjs`
- `docs/ARCHITECTURE.md`
- `docs/DEPLOYMENT.md`
- `docs/DEVELOPMENT_LOG.md`
- `docs/HANDOVER.md`
- `docs/PROJECT_PLAN.md`
- `docs/PUBLISHING.md`
- `package-lock.json`
- `package.json`
- `public/_headers`
- `public/robots.txt`
- `README.md`
- `scripts/build-release.mjs`
- `scripts/finalize-build.mjs`
- `src/assets/digital-garden-preview.jpg`
- `src/components/ArticleNavigation.astro`
- `src/components/Mermaid.astro`
- `src/components/PostCard.astro`
- `src/components/ProjectCard.astro`
- `src/components/ProjectLinks.astro`
- `src/components/SiteFooter.astro`
- `src/components/SiteHeader.astro`
- `src/components/TableOfContents.astro`
- `src/components/TagList.astro`
- `src/components/ThemeToggle.astro`
- `src/content.config.ts`
- `src/content/blog/2026-11-20-example-markdown-features.md`
- `src/content/projects/example-digital-garden.md`
- `src/layouts/ArticleLayout.astro`
- `src/layouts/BaseLayout.astro`
- `src/pages/404.astro`
- `src/pages/about.astro`
- `src/pages/archive/index.astro`
- `src/pages/blog/[...slug].astro`
- `src/pages/blog/index.astro`
- `src/pages/categories/[category].astro`
- `src/pages/categories/index.astro`
- `src/pages/garden/[...slug].astro`
- `src/pages/garden/index.astro`
- `src/pages/index.astro`
- `src/pages/notes/[...slug].astro`
- `src/pages/notes/index.astro`
- `src/pages/projects/[...slug].astro`
- `src/pages/projects/index.astro`
- `src/pages/robots.txt.ts`
- `src/pages/rss.xml.ts`
- `src/pages/search.astro`
- `src/pages/tags/[tag].astro`
- `src/pages/tags/index.astro`
- `src/styles/global.css`
- `src/utils/content.ts`
- `src/utils/publication.ts`
- `src/utils/site.mjs`
- `tests/browser.test.mjs`
- `tests/publication.test.mjs`
- `tests/site.test.mjs`
- `wrangler.jsonc`
