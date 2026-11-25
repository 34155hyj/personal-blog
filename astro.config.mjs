import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { unified } from '@astrojs/markdown-remark';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { resolveSite } from './src/utils/site.mjs';

const site = resolveSite();

function remarkReadingFeatures() {
  return (tree, file) => {
    const features = { math: false, mermaid: false };
    function scan(node) {
      if (node.type === 'math' || node.type === 'inlineMath') features.math = true;
      if (node.type === 'code' && node.lang === 'mermaid') features.mermaid = true;
      node.children?.forEach(scan);
    }
    scan(tree);
    if (file.data.astro?.frontmatter) {
      file.data.astro.frontmatter.readingFeatures = features;
    }
  };
}

export default defineConfig({
  site,
  integrations: [
    mdx(),
    ...(site ? [sitemap({ filter: (page) => !new URL(page).pathname.startsWith('/search') })] : []),
  ],
  markdown: {
    processor: unified({
      remarkPlugins: [remarkMath, remarkReadingFeatures],
      rehypePlugins: [[rehypeKatex, { trust: false }]],
    }),
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      defaultColor: false,
      wrap: true,
      transformers: [{
        pre(node) {
          if (this.options.lang === 'mermaid') node.properties['data-mermaid'] = '';
        },
      }],
    },
  },
  image: { layout: 'constrained', responsiveStyles: true },
  build: { inlineStylesheets: 'never' },
  vite: {
    build: { assetsInlineLimit: 0 },
    css: {
      postcss: {
        plugins: [{
          postcssPlugin: 'katex-woff2',
          Declaration(declaration) {
            if (declaration.prop !== 'src' || declaration.parent?.name !== 'font-face') return;
            if (!declaration.source?.input.file?.replaceAll('\\', '/').includes('/katex/dist/')) return;
            const woff2 = declaration.value.split(',').find((source) => source.includes('.woff2'));
            if (woff2) declaration.value = woff2;
          },
        }],
      },
    },
  },
});
