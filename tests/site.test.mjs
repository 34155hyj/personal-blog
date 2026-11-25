import assert from 'node:assert/strict';
import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import test from 'node:test';
import { load } from 'cheerio';

const dist = 'dist';
async function collect(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return (await Promise.all(entries.map((entry) => {
    const file = join(dir, entry.name);
    return entry.isDirectory() ? collect(file) : [file];
  }))).flat();
}
const files = await collect(dist);
const pages = new Map();
for (const file of files.filter((file) => file.endsWith('.html'))) {
  const location = '/' + relative(dist, file).split(sep).join('/').replace(/index\.html$/, '');
  pages.set(location, load(await readFile(file, 'utf8')));
}

function pathname(url) {
  return decodeURIComponent(url.pathname);
}

test('所有内部链接、锚点及本地资源均存在', async (t) => {
  const issues = [];
  const external = new Set();
  const checked = new Set();
  const origin = 'https://garden.example.org';
  for (const [route, $] of pages) {
    const base = new URL(route, origin);
    for (const node of $('a[href], link[href], script[src], img[src], source[srcset], img[srcset]').toArray()) {
      const el = $(node);
      const href = el.attr('href') ?? el.attr('src');
      const urls = (el.attr('srcset') ?? '').split(',').map((part) => part.trim().split(/\s+/)[0]).filter(Boolean);
      if (href) urls.push(href);
      for (const address of urls) {
        const target = new URL(address, base);
        if (target.protocol === 'data:' && node.name !== 'a') continue;
        if (node.name === 'a' && ['mailto:', 'tel:'].includes(target.protocol)) continue;
        if (target.origin !== origin) {
          if (el.attr('rel') === 'canonical' && pathname(target) === route) continue;
          if (node.name !== 'a' || !['http:', 'https:'].includes(target.protocol)) issues.push(`${route} → ${target.href}`);
          else external.add(target.href);
          continue;
        }
        const key = target.pathname + target.hash;
        if (checked.has(key)) continue;
        checked.add(key);
        const path = pathname(target);
        const html = pages.get(path);
        if (html) {
          if (target.hash && !html('[id]').toArray().some((entry) => html(entry).attr('id') === decodeURIComponent(target.hash.slice(1)))) {
            issues.push(`${route} → ${key}`);
          }
        } else if (!await stat(join(dist, path)).then((file) => file.isFile()).catch(() => false)) {
          issues.push(`${route} → ${key}`);
        }
      }
    }
  }
  assert.deepEqual(issues, []);
  t.diagnostic(`${pages.size} HTML files, ${checked.size} distinct internal targets, external links: ${[...external].join(', ') || 'none'}`);
});

test('RSS、正式站点元数据与页面索引一致', async () => {
  const configured = pages.get('/')('link[rel="canonical"]').attr('href');
  const feed = load(await readFile(join(dist, 'rss.xml'), 'utf8'), { xml: true });
  const robots = await readFile(join(dist, 'robots.txt'), 'utf8');
  const entries = [...pages].filter(([, $]) => $('[data-pagefind-body]').length);
  const status = JSON.parse(await readFile(join(dist, 'pagefind/status.json'), 'utf8'));
  assert.equal(status.indexed, entries.length);
  assert.equal(feed('item').length, Math.min(30, entries.length));
  assert.ok(pages.get('/search/')('meta[name="robots"]').attr('content')?.includes('noindex'));
  assert.equal(pages.get('/search/')('link[rel="canonical"]').length, 0);
  if (configured) {
    const site = new URL(configured);
    assert.ok(robots.includes(`Sitemap: ${new URL('/sitemap-index.xml', site)}`));
    const sitemap = load(await readFile(join(dist, 'sitemap-0.xml'), 'utf8'), { xml: true });
    const links = sitemap('url loc').toArray().map((node) => new URL(sitemap(node).text()));
    for (const url of links) {
      assert.equal(url.origin, site.origin);
      assert.ok(pages.has(pathname(url)), url.href);
    }
    assert.ok(!links.some((url) => /\/(search|404)/.test(url.pathname)));
    for (const [, $] of entries) assert.ok($('link[rel="canonical"]').attr('href')?.startsWith(site.origin));
  } else {
    assert.match(robots, /Disallow: \/\n/);
    assert.ok(!files.some((file) => file.endsWith('sitemap-index.xml')));
  }
  for (const node of feed('item link').toArray()) assert.ok(pages.has(pathname(new URL(feed(node).text()))));
});

test('静态部署产物仅含公开资源并符合免费资产上限', async (t) => {
  const headers = await readFile(join(dist, '_headers'), 'utf8');
  assert.match(headers, /Content-Security-Policy: .*script-src 'self' 'wasm-unsafe-eval' 'sha256-/);
  assert.ok(!headers.includes("script-src 'unsafe-inline'"));
  assert.ok(files.length <= 20000);
  const sizes = await Promise.all(files.map(async (file) => [file, (await stat(file)).size]));
  const largest = sizes.reduce((a, b) => a[1] > b[1] ? a : b);
  assert.ok(largest[1] <= 25 * 1024 * 1024);
  assert.ok(files.every((name) => !/(?:^|[\\/])\.(?:git|env)|\.map$/i.test(name)));
  t.diagnostic(`${sizes.length} files, ${sizes.reduce((n, [, size]) => n + size, 0)} bytes, largest ${largest.join(' ')} bytes`);
});
