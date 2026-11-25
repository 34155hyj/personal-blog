import { glob, type Loader } from 'astro/loaders';

export function isPublished(data: unknown) {
  if (typeof data !== 'object' || data === null) return false;
  return !('draft' in data && data.draft === true) &&
    !(process.env.EXCLUDE_EXAMPLES === '1' && 'example' in data && data.example === true);
}

export function publishedMarkdown(base: string): Loader {
  const loader = glob({ pattern: '**/*.{md,mdx}', base });
  return {
    ...loader,
    async load(context) {
      const { store } = context;
      for (const [key, entry] of store.entries()) {
        if (!isPublished(entry.data)) store.delete(key);
      }
      // Filter before registration to keep source images and deferred MDX imports
      // from drafts and excluded examples out of Astro's asset manifest.
      await loader.load({
        ...context,
        store: {
          ...store,
          set(entry) {
            if (!isPublished(entry.data)) {
              store.delete(entry.id);
              return false;
            }
            return store.set(entry);
          },
        },
      });
    },
  };
}
