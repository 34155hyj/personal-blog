# 日常发布文章

## 1. 选择目录

| 内容 | 目录 | 日期 |
| --- | --- | --- |
| 博客 | `src/content/blog/` | `pubDate`，可加 `updatedDate` |
| 科研笔记 | `src/content/notes/` | `pubDate`，可加 `updatedDate` |
| 知识卡片 | `src/content/garden/` | `updatedDate`，可加 `stage` |
| 项目 | `src/content/projects/` | `pubDate`，可加 `status`、`tech`、`repo`、`link`、`cover` |

文件名或相对路径会成为 URL。已公开的文件改名会改变地址。

## 2. 写作

在对应目录新建 Markdown。博客与笔记用同一个模板：

```markdown
---
title: "文章标题"
description: "一句话摘要，用于列表、分享与订阅"
pubDate: 2026-11-24
tags: ["表型提取", "图像分析"]
category: "科研方法"
draft: true
---

## 问题

用二级或三级标题组织内容。

行内公式用 $x^2$，独立公式用两行 $$ 包裹。
```

- 图表使用带 `mermaid` 语言标识的代码围栏。推荐写 `accTitle` 与 `accDescr`。解析失败时读者仍可见源码。
- 代码围栏填写语言，如 `python`、`r` 或 `typescript`。站点按主题配色。
- 将图片保存在文章旁边或 `src/assets/`，使用相对路径写 `![图像替代说明](./figure.png)`。Astro 为本地图生成响应式变体。项目还可在 frontmatter 写 `cover: "./cover.png"` 和 `coverAlt: "界面预览说明"`。
- `example: true` 表示演示条目，必须带示例声明。发布构建会排除这类条目。
- 草稿源文件可能仍在 Git 历史或远程仓库中。未公开的研究结果、原始数据和凭据应保存在专用私有位置。放在 public/ 的文件会被直接复制到产物。MDX 可以执行组件代码，应使用可信源文件。

## 3. 预览并发布

1. 准备公开时改成 `draft: false`，或者删除该字段。使用本地预览检查正文、移动端和图表。
2. 运行 `npm run check`、`npm run build`、`npm test`。用 `npm run preview` 验证搜索。常规开发模式下 Pagefind 尚未生成索引。
3. 只暂存本次内容与图片，检查 `git diff --cached`，提交并按你的仓库工作流合并至生产分支。
4. GitHub Actions 校验源仓库内容。配置 Workers Builds 后，生产分支更新会触发发布构建。上线后用文章标题测试站内搜索并检查 RSS。
