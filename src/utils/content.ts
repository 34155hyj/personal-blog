import { getCollection, type CollectionEntry } from 'astro:content';
import { isPublished } from './publication';

export type CollectionName = 'blog' | 'notes' | 'garden' | 'projects';

export interface ContentItem {
  id: string;
  collection: CollectionName;
  title: string;
  description: string;
  date: Date;
  updatedDate?: Date;
  tags: string[];
  category: string;
  example: boolean;
  featured: boolean;
  url: string;
}

export function getPublished<C extends CollectionName>(collection: C) {
  return getCollection(collection, ({ data }) => isPublished(data));
}

function toItem(entry: CollectionEntry<CollectionName>): ContentItem {
  const { collection, data, id } = entry;
  return {
    id,
    collection,
    title: data.title,
    description: data.description,
    date: 'pubDate' in data ? data.pubDate : data.updatedDate,
    updatedDate: 'updatedDate' in data ? data.updatedDate : undefined,
    tags: data.tags,
    category: 'category' in data ? data.category : collectionLabel(collection),
    example: data.example,
    featured: 'featured' in data && data.featured,
    url: `/${collection}/${id}/`,
  };
}

export async function getAllContent(): Promise<ContentItem[]> {
  const entries = await Promise.all([
    getPublished('blog'), getPublished('notes'), getPublished('garden'), getPublished('projects'),
  ]);
  return entries.flat().map(toItem).sort(
    (a, b) => (b.updatedDate ?? b.date).getTime() - (a.updatedDate ?? a.date).getTime() ||
      a.url.localeCompare(b.url),
  );
}

export async function getArticlePaths(collection: 'blog' | 'notes') {
  const entries = (await getPublished(collection)).sort(
    (a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime() || a.id.localeCompare(b.id),
  );
  return entries.map((entry, index) => ({
    params: { slug: entry.id },
    props: { entry, newer: entries[index - 1], older: entries[index + 1] },
  }));
}

export function indexParam(label: string): string {
  // Keep existing readable URLs. Escape labels that cannot be a portable directory name.
  if (label.startsWith('~') || /[<>:"/\\|?*#%\u0000-\u001f]|[. ]$/.test(label) ||
    /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(label) || label === 'index.html') {
    return `~${Buffer.from(label).toString('base64url')}`;
  }
  return label;
}

export function indexHref(section: 'tags' | 'categories', label: string): string {
  return `/${section}/${encodeURIComponent(indexParam(label))}/`;
}

export async function getAllTags(): Promise<Array<{ tag: string; count: number }>> {
  const counts = new Map<string, number>();
  for (const item of await getAllContent()) {
    for (const tag of item.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  return [...counts].map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag, 'zh-CN'));
}

export async function getAllCategories(): Promise<Array<{ category: string; count: number }>> {
  const counts = new Map<string, number>();
  for (const item of await getAllContent()) {
    counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
  }
  return [...counts].map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count || a.category.localeCompare(b.category, 'zh-CN'));
}

export async function groupByYear(): Promise<Array<{ year: number; items: ContentItem[] }>> {
  const groups = new Map<number, ContentItem[]>();
  for (const item of await getAllContent()) {
    const year = item.date.getUTCFullYear();
    const group = groups.get(year) ?? [];
    group.push(item);
    groups.set(year, group);
  }
  return [...groups].sort(([a], [b]) => b - a).map(([year, items]) => ({
    year,
    items: items.sort((a, b) => b.date.getTime() - a.date.getTime()),
  }));
}

export function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

const dateFormatter = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC',
});

export function formatDateLong(date: Date): string {
  return dateFormatter.format(date);
}

export function collectionLabel(collection: CollectionName): string {
  return { blog: '博客', notes: '科研笔记', garden: '知识花园', projects: '项目' }[collection];
}

export const statusLabel = {
  idea: '构想中', ongoing: '进行中', done: '已完成', archived: '已归档',
};

export const stageLabel = { seed: '种子', sprout: '生长中', evergreen: '常青' };
