# Digital Garden

一个用 Markdown 维护的静态个人数字花园，包含博客、科研笔记、知识卡片和项目。站点通过 Astro 生成静态页面，支持 Pagefind 全文搜索、RSS、KaTeX、Mermaid 和 Shiki 双主题代码高亮。

## 本地使用

使用 Node.js 24 的最新补丁版本及 npm。

```bash
npm ci
npm run dev              # 本地编辑，默认 http://localhost:4321
npm run check            # Astro 与 TypeScript 检查
npm run build            # 生成 dist/，同时建立 Pagefind 索引
npm run preview          # 查看完整产物，包括全文搜索
npm test                # 检查内部链接、RSS、SEO、安全头和产物
npm run test:release     # 验证正式构建的草稿与示例隔离
npm run test:browser     # 使用 Chromium 测试构建产物
```

浏览器测试在 Windows 优先使用已安装的 Edge。其他环境可先运行 `npx playwright install chromium`，Linux CI 还会安装系统依赖。只在构建时设置 `SITE_URL`，使用最终公开 HTTPS 源地址生成 canonical、Open Graph 和 Sitemap。没有 `SITE_URL` 的预览产物默认禁止抓取。

## 写作与发布

- [日常文章发布](docs/PUBLISHING.md)覆盖内容位置、frontmatter、公式、图表和图片。
- [Cloudflare 部署](docs/DEPLOYMENT.md)覆盖本地 Workers 验收、GitHub 自动化、免费额度和回滚。
- [架构](docs/ARCHITECTURE.md)说明路由、内容模型和构建流程。
- [交接与验收](docs/HANDOVER.md)记录优化差异、测试结果、已知问题和演进建议。

仓库中的演示条目带 `example: true`。普通构建显示演示内容，`npm run build:release` 排除演示条目。草稿在两种构建中都不会进入站点产物。
