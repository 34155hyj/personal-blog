# 架构

## 数据和渲染

```text
Markdown / MDX → 内容集合与类型校验 → 发布筛选与聚合
                              ↓
                     Astro 静态 HTML 与资源
                              ↓
                      Pagefind 索引及安全头
                              ↓
                     Cloudflare Static Assets
```

Astro 7、TypeScript strict 和原生 CSS。四个集合保留原有内容文件、详情 URL 和列表入口。运行时使用浏览器原生交互和少量分页面脚本。

| 位置 | 职责 |
| --- | --- |
| `src/content.config.ts` | 集合、日期、标签、项目链接与图片 schema |
| `src/utils/content.ts` | 发布条件、四类聚合、日期、标签和分类 URL |
| `src/layouts/BaseLayout.astro` | 页面骨架、主题、canonical、Open Graph 与 RSS 自动发现 |
| `src/layouts/ArticleLayout.astro` | 详情页标题、标签、日期、目录与阅读组件 |
| `src/components/ProjectCard.astro` | 首页精选和项目列表共用的展示组件 |
| `src/styles/global.css` | 两套配色、系统字体、响应式布局、焦点样式和动效降级 |
| `astro.config.mjs` | 静态输出、MDX、Markdown 数学插件、Shiki、图片、Sitemap |
| `scripts/finalize-build.mjs` | 索引详情页、生成搜索状态及 Cloudflare CSP |
| `scripts/build-release.mjs` | 检查发布域名并在构建过程启用示例过滤 |

## 路由

| URL | 内容 |
| --- | --- |
| `/` | 最近更新、四类入口、精选项目和主题 |
| `/blog/`、`/notes/`、`/garden/`、`/projects/` | 四类列表和各自的 `/<entry.id>/` 详情 |
| `/tags/`、`/tags/<tag>/` | 跨集合标签索引与结果 |
| `/categories/`、`/categories/<category>/` | 跨集合分类索引与结果 |
| `/archive/` | 按发布年份归档 |
| `/about/` | 站点说明 |
| `/search/` | Pagefind 全文搜索，支持 `?q=` |
| `/rss.xml` | 最近最多 30 条内容的摘要 |
| `/robots.txt`、`/sitemap-index.xml` | 爬虫和 Sitemap。只有配置 HTTPS `SITE_URL` 时生成 Sitemap |
| `/404.html` | 静态 404 模板，由托管环境返回 HTTP 404 |

普通中英文标签沿用可读 URL。文件系统保留字符及路径分隔符的标签使用稳定转义。同一条目中首尾空格会去除，重复标签只计一次。

## 内容模型

四类均有 `title`、`description`、`tags`、`draft` 和 `example`。博客和笔记使用 `pubDate`、可选 `updatedDate`、分类和精选标记。知识卡片使用必需的 `updatedDate`、`stage`（`seed`、`sprout`、`evergreen`）。项目使用 `pubDate`、`status`（`idea`、`ongoing`、`done`、`archived`）、`tech`、可选 `link`、`repo`、`cover`、`coverAlt` 与 `featured`。项目和知识卡片在索引中分别归入「项目」与「知识花园」。

内容加载时筛掉草稿和发布构建中的示例，阻止它们的 Markdown 图片和 MDX 模块进入资产清单。路由和聚合共用这套发布条件。RSS 基于相同集合，Pagefind 只索引详情页，Sitemap 使用实际生成的可索引路由。未设置 `SITE_URL` 时预览 RSS 使用 `http://localhost:4321` 作为基准，爬虫与页面索引默认关闭。

## 阅读与性能

- 目录使用二、三级标题，桌面固定在文章侧栏，手机可折叠。碎片链接保留中文锚点。
- 数学公式由 KaTeX 在构建期渲染，含公式的详情才链接数学样式。代码由 Shiki 构建期生成两套主题颜色。
- Mermaid 在图表接近视口时才加载渲染器，使用严格安全模式和本地模块。失败时保留原始围栏代码。
- Pagefind 搜索模块在提交查询时加载。正文可以在无 JavaScript 时阅读。
- 本地 Markdown 图像和项目封面由 Astro 生成响应式尺寸变体。站点字体使用系统字体，公式字体使用独立的同源 WOFF2 文件。
- 安全头由静态托管应用。脚本权限限定同源和构建期的内联哈希，Pagefind WASM 使用单独权限。样式允许内联以支持 KaTeX、Shiki 和 Mermaid。浏览器从同源加载站点资源，外站导航链接可用。
