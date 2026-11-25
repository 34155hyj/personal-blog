# 开发日志

按时间倒序记录。只记决策、问题和结果，不贴大段代码。

---

## 2026-11-24 · 高级优化与验收

- 对截至 `962be0a` 的站点做基线检查。原 35 个 HTML 页面及四类内容保留。
- 升级 Astro 及 Node 构建环境。统一内容过滤、原图边界、项目卡片和详情布局，补全文搜索、RSS、Mermaid、图像和 SEO。
- 配置 Workers Static Assets、GitHub 校验和正式构建，增加浏览器、静态产物和发布回归。
- 实测结果、指标、已知问题与后续建议见 [交接与验收](HANDOVER.md)。

## 2026-11-24 · 第一阶段开发

### 环境检查

| 项目 | 结果 |
| --- | --- |
| Node.js | v22.22.2 |
| npm | 10.9.7 |
| Git | 2.55.0.windows.3 |
| 全局 Git 用户 | 未配置（项目内使用本地占位身份，不修改全局） |
| npm registry | `https://registry.npmjs.org/` 可达 |

结论：无需清理任何已有文件；项目建在工作区下的 `digital-garden/` 子目录，自包含，不影响 `.workbuddy`。

### 版本决策

- 最新 Astro 为 7.4.13，但要求 Node ≥ 22.23.4；本机 22.22.2，差一个补丁版本。
- 不升级用户 Node 环境，改选 **Astro 6.4.8**（要求 ≥ 22.12.0），配套 `@astrojs/mdx` 6.0.3、`@astrojs/sitemap` 3.7.6。
- 公式链路：`remark-math` 6.0.0 + `rehype-katex` 7.0.1 + `katex` 0.19.1。
- CSS 不引入框架，用原生 CSS 变量，减少依赖面与升级成本。

### 实现顺序

1. 骨架：`package.json`、`astro.config.mjs`、`tsconfig.json`、`.gitignore`、`public/`
2. 内容：`src/content.config.ts` 四个集合 + 11 个示例条目
3. 样式：`src/styles/global.css`（变量、布局、组件、响应式）
4. 组件：BaseLayout、Header、Footer、ThemeToggle、PostCard、TOC、TagList、Pagination
5. 页面：首页、博客、笔记、项目、花园、标签、分类、归档、关于、404
6. 文档：README、AGENTS、docs 五份
7. 安装、构建、验收、提交

### 设计决策

- **内容分四类而不是一个集合**：博客/笔记/项目/花园生命周期不同，分开后列表页语义清晰；标签、分类、归档通过 `utils/content.ts` 跨集合聚合。
- **示例内容全部 `example: true`**：frontmatter、页面徽章、正文声明三层标记，避免演示内容被误认为真实成果。
- **主题脚本内联在 head**：先于首屏渲染设置 `data-theme`，消除深色模式闪白。
- **移动菜单用原生 `<details>`**：省掉一段 JS 与焦点管理逻辑。
- **TOC 双实例**：桌面侧栏 sticky，移动端 `<details>` 折叠；高亮用 IntersectionObserver，一次脚本同时驱动两处。
- **不分页**：示例内容量小，`Pagination.astro` 保留但未启用；后续内容增多可在列表页接 `paginate()`。

### 验证结果

**依赖安装**

- 官方源 `registry.npmjs.org` 首次安装 7 分半仍无写入（国内网络慢），主动终止。
- 改用 `registry.npmmirror.com` 后 **2 分 13 秒完成，406 个包，exit 0**，无 peer 依赖报错。
- 结论：`package-lock.json` 中的 resolved 指向 npmmirror；如需官方源可重装，不影响版本。

**构建与类型检查**

| 命令 | 结果 |
| --- | --- |
| `npm run build` | 成功，**35 个页面**，10–13 秒 |
| `npm run check` | **0 errors / 0 warnings / 0 hints**（28 个文件） |

构建过程中修掉两个弃用项：

1. `markdown.remarkPlugins / rehypePlugins` → 改为 `markdown.processor: unified({...})`（`@astrojs/markdown-remark`）。
2. `import { z } from 'astro:content'` → `import { z } from 'astro/zod'`；`z.string().url()` → `z.url()`。

**渲染验证**（示例文章 HTML 实测）

- KaTeX：11 处 `class="katex"`，2 个块级公式
- Shiki：4 个 `astro-code` 块，80 处 `--shiki-light` 变量
- 目录：中文 slug 正常生成，如 `data-toc-link="这篇文章在验证什么"`

**页面与响应式验证**

- 13 个主要路由 + 4 个中文标签/分类路由全部 HTTP 200
- 404 路由返回 404 且渲染自定义文案「这片地还没种东西」
- 用 DevTools 协议强制 375px 视口实测：`clientWidth = scrollWidth = 375`，**横向溢出元素 0 个**
- 1280px 桌面：两栏文章布局、右侧 sticky 目录、代码块、公式、表格均正常
- 移动端：导航折叠为汉堡菜单，目录折叠为 `<details>`，卡片单列

**深色模式**

- `prefers-color-scheme: dark` 下 `data-theme=dark` 正确写入
- 发现并修复：深色模式下主按钮为浅绿底 + 白字，对比度不足 → 新增 `--on-accent` 变量（浅色 #fff / 深色 #0f211b）

**内容更新链路**

- 新增 `2099-01-01-temp-build-check.md` → 构建页数 35 → 38，新路由生成
- 删除该文件后重新构建 → 回到 35 页，临时路由消失
- 证明无需改代码即可通过 Markdown 更新内容

**安全扫描**

- `src/` 下无 api key / secret / password / token 模式
- 全项目（排除 node_modules）无邮箱地址
- 无 `.env`，about 页为占位文本
