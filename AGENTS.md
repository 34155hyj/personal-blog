# AGENTS.md

在改动前先读本文件与 `docs/ARCHITECTURE.md`。

## 项目和构建

- 技术栈为 Astro 7、TypeScript、Markdown / MDX 和原生 CSS。使用 Node.js 24 的最新补丁版本。
- 提交前运行 `npm run check`、`npm run build` 和 `npm test`。涉及阅读、导航或交互时运行 `npm run test:browser`。
- `npm run build` 在 Astro 静态输出后生成 Pagefind 索引与安全响应头。`npm run build:release` 要求正式 `SITE_URL` 并隐藏示例。
- `wrangler.jsonc` 指向 `dist/`，本地可执行 `npm run deploy:dry-run` 和 `npm run preview:cloudflare`。
- GitHub Actions 负责校验。未经用户明确授权，禁止推送、首次公网发布、付费操作和域名购买。

## 代码和内容

- `src/content.config.ts` 是集合 schema 的入口。正文放在对应的 `src/content/{blog,notes,projects,garden}/` 目录。
- `src/utils/content.ts` 负责发布过滤、聚合、标签/分类路由及日期。新增列表、索引或详情应共用这里的发布条件。
- `BaseLayout.astro` 提供公共页面，四种内容详情共用 `ArticleLayout.astro`。
- `src/styles/global.css` 维护两套主题变量、响应式布局和动效降级。新增交互使用原生可聚焦元素和可见焦点样式。
- 示例标为 `example: true` 并注明是演示。站点不得虚构科研成果、论文、数据、身份或联系方式。
- 日期用 `YYYY-MM-DD`。写作期间设置 `draft: true`。项目链接使用 HTTP(S)，图片优先使用本地源文件及可读的替代文本。
- 不将凭据、个人敏感信息或未公开数据写入内容和仓库。
- 保留已有路由。扩展标签和分类时使用 `indexParam()` 与 `indexHref()` 构建路径。
- 每次视觉改动检查 375px、两种主题和减少动态效果偏好。
