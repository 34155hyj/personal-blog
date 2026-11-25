---
title: "示例：本地写作与发布流程"
description: "演示如何在不接触代码的情况下，通过 Markdown 文件更新站点内容。"
pubDate: 2026-11-15
tags: ["示例", "Markdown", "工作流"]
category: "网站搭建"
example: true
---

> **示例内容声明**：本文仅说明本站的内容维护方式，不包含任何真实科研数据或成果记录。

## 新增一篇内容

在对应目录下新建 Markdown 文件，例如 `src/content/blog/my-post.md`：

```markdown
---
title: "文章标题"
description: "一句话摘要"
pubDate: 2026-11-24
tags: ["标签一", "标签二"]
category: "分类"
---

正文从这里开始。
```

保存后开发服务器会自动刷新，不需要重启。

## 四个内容目录

| 目录 | 用途 | 必填字段 |
| --- | --- | --- |
| `content/blog` | 博客文章 | title, description, pubDate |
| `content/notes` | 科研笔记 | title, description, pubDate |
| `content/projects` | 项目展示 | title, description, pubDate |
| `content/garden` | 知识卡片 | title, description, updatedDate |

## 本地预览与构建

```bash
npm run dev      # 本地开发
npm run build    # 生成静态站点到 dist/
npm run preview  # 预览构建产物
```

构建产物 `dist/` 可以直接交给 Cloudflare Pages 托管，不需要服务器运行时。

## 草稿与示例标记

在 frontmatter 加 `draft: true` 可以让内容不出现在构建结果里；加 `example: true` 会在页面上显示示例提示，避免读者把演示内容误认为真实记录。
