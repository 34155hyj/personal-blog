import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { cp, mkdir, mkdtemp, readFile, readdir, realpath, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import test from 'node:test';
import { promisify } from 'node:util';

const exec = promisify(execFile);
const sections = ['blog', 'notes', 'garden', 'projects'];
const site = 'https://digital-garden-release-fixture.workers.dev';

test('发布过滤覆盖详情、索引、订阅及草稿原图', { timeout: 90000 }, async () => {
  await mkdir('.astro', { recursive: true });
  const root = await realpath('.astro');
  const sandbox = await mkdtemp(join(root, 'release-test-'));
  assert.equal(dirname(await realpath(sandbox)), root);
  try {
    for (const path of ['src', 'public', 'scripts', 'astro.config.mjs', 'tsconfig.json', 'package.json']) {
      await cp(path, join(sandbox, path), {
        recursive: true, filter: (source) => resolve(source) !== resolve('src/content'),
      });
    }
    const blog = join(sandbox, 'src/content/blog');
    await Promise.all(sections.map((section) => mkdir(join(sandbox, 'src/content', section), { recursive: true })));
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jBFEAAAAASUVORK5CYII=', 'base64');
    await writeFile(join(blog, 'draft-only-image.png'), png);
    await writeFile(join(blog, 'example-only-image.png'), png);
    await writeFile(join(blog, 'example-only.md'),
      '---\ntitle: "example-only-sentinel"\ndescription: "An example fixture"\npubDate: 2026-11-24\nexample: true\n---\n\n![示例](./example-only-image.png)\n');
    for (const section of sections) {
      const date = section === 'garden' ? 'updatedDate' : 'pubDate';
      const image = section === 'blog' ? '\n![草稿图片](./draft-only-image.png)\n' : '';
      await writeFile(join(sandbox, 'src/content', section, 'draft-only.md'),
        '---\n' +
        'title: "draft-only-sentinel"\n' +
        'description: "A draft fixture"\n' +
        date + ': 2026-11-24\n' +
        'tags: ["draft-only-tag"]\n' +
        'draft: true\n' +
        '---\n\n' + image);
    }
    await writeFile(join(blog, 'release-fixture.mdx'),
      '---\n' +
      'title: "验收样例文章"\n' +
      'description: "验收 MDX 和标签路径"\n' +
      'pubDate: 2026-11-24\n' +
      'category: "G×E / 氮响应"\n' +
      'tags: ["C++", "表型", "表型 ", "G×E / 氮响应"]\n' +
      '---\n\n## 内容\n\n行内公式 $x^2$。\n\n$$\nx+y=z\n$$\n');
    const build = (SITE_URL) => exec(process.execPath, [resolve('scripts/build-release.mjs')], {
      cwd: sandbox, env: { ...process.env, SITE_URL }, timeout: 80000,
    });
    await assert.rejects(build('https://garden.example.org'), (error) => /实际公开站点/.test(error.stderr));
    await build(site);
    const dist = join(sandbox, 'dist');
    const files = await readdir(dist, { recursive: true });
    assert.ok(!files.some((file) => /draft-only|example-only/.test(file)));
    const [rss, sitemap, pagefind, mdx] = await Promise.all(
      ['rss.xml', 'sitemap-0.xml', 'pagefind/status.json', 'blog/release-fixture/index.html']
        .map((file) => readFile(join(dist, file), 'utf8')),
    );
    for (const metadata of [rss, sitemap]) {
      assert.ok(metadata.includes(site + '/blog/release-fixture/'));
      assert.ok(!/draft-only|example-only/.test(metadata));
    }
    assert.equal(JSON.parse(pagefind).indexed, 1);
    assert.match(mdx, /class="katex-display"/);
    assert.match(mdx, /katex\.min\..+\.css/);
    assert.ok(files.some((file) => file.replaceAll('\\', '/').startsWith('tags/C++/')));
    assert.ok(files.some((file) => file.replaceAll('\\', '/').startsWith('categories/~')));
  } finally {
    await rm(sandbox, { recursive: true, force: true });
  }
});
