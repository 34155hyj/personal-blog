---
title: "示例：Markdown 功能演示"
description: "用于验证标题层级、代码高亮、数学公式、表格与文章目录的示例文章。"
pubDate: 2026-11-20
updatedDate: 2026-11-22
tags: ["示例", "Markdown", "Astro"]
category: "网站搭建"
example: true
featured: true
---

> **示例内容声明**：本文仅用于验证本站的排版与渲染功能，不包含任何真实科研成果、论文发表记录或实验数据。

## 这篇文章在验证什么

这是数字花园的第一篇示例文章。它的作用很单纯：把第一版需要支持的 Markdown 能力全部跑一遍——标题层级、代码块、数学公式、表格、引用和自动目录。

## 文本与列表

普通段落里可以写**加粗**、*斜体*和 `行内代码`。也可以插入[外部链接](https://example.com)（此处为占位地址）。

无序列表：

- 第一项：内容都用 Markdown 文件维护
- 第二项：构建时生成静态 HTML
- 第三项：不需要数据库

有序列表：

1. 写 Markdown
2. 运行 `npm run build`
3. 部署静态产物

> 引用块适合放提示、声明或一段值得单独看的话。

## 代码高亮

TypeScript：

```typescript
interface Note {
  title: string;
  tags: string[];
}

function summarize(note: Note): string {
  return `${note.title} — ${note.tags.length} 个标签`;
}
```

Python：

```python
def normalize(values: list[float]) -> list[float]:
    if not values:
        return []
    low, high = min(values), max(values)
    span = high - low
    return [0.0 if span == 0 else (v - low) / span for v in values]
```

## 数学公式

行内公式写作 $y = mx + b$，渲染后应出现在文本行内。

块级公式单独成段，例如分类任务常用的交叉熵损失：

$$
\mathcal{L} = - \sum_{i=1}^{n} y_i \log \hat{y}_i
$$

再比如一个带上下标的表达式：

$$
\hat{y} = \arg\max_{k} \; P(y = k \mid x)
$$

## 表格

| 能力 | 实现方式 | 状态 |
| --- | --- | --- |
| 数学公式 | remark-math + KaTeX | 已接入 |
| 代码高亮 | Shiki 双主题 | 已接入 |
| 文章目录 | 标题自动提取 | 已接入 |

## 小结

如果右侧（或正文上方）的目录能跳转、公式正常显示、代码块随主题切换配色，说明第一版的渲染链路是通的。真实内容可以直接替换这些示例文件。

## Mermaid 流程图

```mermaid
flowchart LR
  accTitle: 科研笔记发布流程
  accDescr: Markdown 经过构建与校验后发布为静态页面
  A[撰写记录] --> B[构建与校验]
  B --> C[静态页面]
```

## 本地图片

![数字花园首页与花园索引](../../assets/digital-garden-preview.jpg)
