# 部署到 Cloudflare Workers Static Assets

本项目的部署目标是纯静态的 Workers Static Assets。GitHub Actions 负责构建与测试。授权开通以后，可通过 Workers Builds 连接 GitHub 自动发布。

## 1. 本地准备与验收

使用最新补丁版 Node.js 24 和 npm。在仓库根目录执行：

```bash
npm ci
npm run check
npm run build
npm test
npm run deploy:dry-run
npm run preview:cloudflare
```

`deploy:dry-run` 验证 Wrangler 能识别配置和静态文件，`preview:cloudflare` 使用本地 Workers 运行器。用终端显示的本地地址测试中文标签、搜索以及不存在的 URL。普通构建包含已标记的演示内容。未设置 `SITE_URL` 时，本地产物允许手动浏览，robots.txt 禁止抓取。

`wrangler.jsonc` 将 `dist/` 指定为唯一静态资源目录。目录索引使用自动尾斜杠，无效 URL 使用 `404.html` 并返回 404。HTML 和 Pagefind 索引使用平台的默认重新验证机制。带内容哈希的 `/_astro/*` 资源允许长期缓存。[_headers 官方说明](https://developers.cloudflare.com/workers/static-assets/headers/) · [静态路由和自定义 404](https://developers.cloudflare.com/workers/static-assets/routing/static-site-generation/)

## 2. 获得首次发布确认后配置

1. 将仓库推送到你控制的 GitHub 仓库。在 Cloudflare Dashboard 打开 **Workers & Pages**，创建 Worker 并连接该仓库。Worker 名称与 `wrangler.jsonc` 的 `name` 保持一致。若先建 Worker 再连接，在 **Settings → Build** 配置。
2. 设置生产分支为拟发布的分支（通常为 `main`），根目录为仓库根目录。预览 URL 已在仓库配置中关闭。若平台提示是否自动构建非生产分支，可保持关闭，以便分支校验由 GitHub Actions 执行。
3. 在 **Build variables and secrets** 中把 `SITE_URL` 设为最终公开的 HTTPS 源地址，包括你选定的免费 `workers.dev` 地址。用版本文件 `.nvmrc` 选用 Node 24；必要时可设 `NODE_VERSION=24`。
4. 生产 Build command 使用 `npm run check && npm run build:release && npm test`，Deploy command 使用 `npx wrangler deploy`。Cloudflare 默认安装依赖。若指定自定义安装，可根据官方构建镜像文档设置 `SKIP_DEPENDENCY_INSTALL=1` 并将 `npm ci` 置于构建命令开头。
5. 生产构建要求实际 `SITE_URL`，从全部详情、列表、搜索、RSS 和 Sitemap 统一排除草稿和示例。仓库现有条目均为演示，发布前应先添加至少一条公开内容并检查关于页。
6. 获得发布确认后再执行首次部署。上线后访问首页，检验搜索结果链接、RSS、robots.txt、Sitemap、404 与安全响应头。

[Workers Builds 配置](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/) · [构建镜像与安装设置](https://developers.cloudflare.com/workers/ci-cd/builds/build-image/) · [静态资源 Wrangler 配置](https://developers.cloudflare.com/workers/static-assets/binding/)

## 3. 免费额度

纯静态资产请求免费且不限次数。Workers Free 每版本可上传 20,000 个静态文件，单个文件最大 25 MiB。Workers Builds 免费计划为每月 3,000 构建分钟、1 个并发构建，单次最多 20 分钟。本仓库的产物验收会检查静态文件数与单文件大小。 [静态计费](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/) · [平台限制](https://developers.cloudflare.com/workers/platform/limits/) · [构建额度](https://developers.cloudflare.com/workers/ci-cd/builds/limits-and-pricing/)

## 4. 回滚

在 Worker 的 **Deployments** 里选定此前版本并执行 **Rollback**，或在已授权环境运行 `npx wrangler rollback <版本 ID>`。确认首页、搜索和 RSS 已恢复后，在 Git 上 revert 对应变更，避免后续自动构建重新发布问题版本。若这是首个公网版本且无历史可回滚，可在 Dashboard 停用公开入口，修复后再发布。 [官方回滚说明](https://developers.cloudflare.com/workers/versions-and-deployments/rollbacks/)

## 5. 常见问题

| 现象 | 检查 |
| --- | --- |
| 本地开发搜索提示索引不可用 | 运行 `npm run build` 后用 `npm run preview` 或本地 Workers 预览 |
| Wrangler 无法找到资源 | 确认 `dist/` 由本次成功构建生成 |
| Sitemap 和 canonical 域名不正确 | 修改 Workers Builds 的 `SITE_URL` 后重新构建 |
| 部署清单无文章 | 核对文章是否标为 `draft: true` 或 `example: true` |
| 新文章图片未显示 | 用相对路径引用本地源图片。部署响应头限制外站资源加载 |
