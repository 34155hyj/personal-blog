import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { getAllContent } from '../utils/content';
import { siteDescription, siteTitle } from '../utils/site.mjs';

export const GET: APIRoute = async ({ site }) => rss({
  title: siteTitle,
  description: siteDescription,
  site: site ?? 'http://localhost:4321',
  customData: '<language>zh-CN</language>',
  items: (await getAllContent()).sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 30).map((item) => ({
    title: item.title,
    description: item.description,
    pubDate: item.date,
    link: item.url,
    categories: [item.category],
  })),
});
