import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { once } from 'node:events';
import { createServer } from 'node:net';
import { after, before, test } from 'node:test';
import { chromium } from 'playwright';

const article = '/blog/2026-11-20-example-markdown-features/';
let origin = process.env.TEST_ORIGIN;
let server;
let browser;
const errors = [];
const requests = [];

before(async () => {
  if (!origin) {
    const socket = createServer();
    socket.listen(0, '127.0.0.1');
    await once(socket, 'listening');
    const { port } = socket.address();
    socket.close();
    await once(socket, 'close');
    origin = `http://127.0.0.1:${port}`;
    server = spawn(process.execPath, ['node_modules/astro/bin/astro.mjs', 'preview', '--host', '127.0.0.1', '--port', String(port)], {
      stdio: 'ignore',
    });
    for (let attempt = 0; ; attempt++) {
      if (await fetch(origin).then((response) => response.ok).catch(() => false)) break;
      assert.ok(attempt < 50 && server.exitCode === null, 'Astro preview did not start');
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }
  const edge = join(process.env['ProgramFiles(x86)'] ?? 'C:/Program Files (x86)', 'Microsoft/Edge/Application/msedge.exe');
  const options = process.env.BROWSER_EXECUTABLE
    ? { executablePath: process.env.BROWSER_EXECUTABLE }
    : !process.env.BROWSER_CHANNEL && process.platform === 'win32' && existsSync(edge)
    ? { executablePath: edge }
    : { channel: process.env.BROWSER_CHANNEL ?? 'chromium' };
  browser = await chromium.launch(options);
});

after(async () => {
  await browser?.close();
  if (server && server.exitCode === null) {
    server.kill();
    await once(server, 'exit');
  }
  assert.deepEqual(errors, [], 'browser errors and CSP diagnostics');
  assert.deepEqual(requests, [], 'unexpected cross-origin requests');
});

async function withPage(options, fn) {
  const context = await browser.newContext(options);
  const page = await context.newPage();
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (/Content Security Policy|violates the following/.test(message.text())) errors.push(message.text().replace(/data:[^' ]{80,}/g, 'data:[inline resource]'));
  });
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (['http:', 'https:'].includes(url.protocol) && url.origin !== origin) requests.push(request.url());
  });
  try {
    await fn(page, context);
  } finally {
    await context.close();
  }
}

test('首页主导航、聚合索引与各类内容详情', () => withPage({}, async (page) => {
  const home = await page.goto(origin);
  assert.equal(home.status(), 200);
  if (process.env.TEST_ORIGIN) assert.ok(home.headers()['content-security-policy']);
  await page.locator('.hero-title').waitFor();
  const nav = page.getByRole('navigation', { name: '主导航', exact: true });
  assert.equal(await nav.locator('a[aria-current=page]').getAttribute('href'), '/');
  const paths = ['/', '/blog/', '/notes/', '/projects/', '/garden/', '/about/'];
  assert.deepEqual(await nav.locator('a').evaluateAll((links) => links.map((link) => link.getAttribute('href'))), paths);
  for (const path of paths.slice(1)) {
    await nav.locator(`a[href="${path}"]`).click();
    assert.equal(new URL(page.url()).pathname, path);
    await nav.locator(`a[href="${path}"][aria-current="page"]`).waitFor();
    if (path === '/about/') continue;
    await page.locator('.card-title a').first().click();
    await page.locator('article[data-pagefind-body] h1').waitFor();
  }
  for (const [label, path] of [['归档','archive'], ['标签','tags'], ['分类','categories'], ['RSS','rss.xml']]) {
    const target = await page.locator('.site-footer').getByRole('link', { name: label, exact: true }).getAttribute('href');
    assert.equal(target, path.endsWith('.xml') ? `/${path}` : `/${path}/`);
    assert.equal((await page.request.get(origin + target)).status(), 200);
  }
  for (const path of ['/tags/示例/', '/categories/项目/']) {
    assert.equal((await page.goto(origin + path)).status(), 200);
    assert.ok(await page.locator('.card-title a').count());
  }
}));

test('中文和英文搜索、空结果、历史与键盘提交', () => withPage({}, async (page) => {
  await page.goto(origin);
  await page.locator('.site-header').getByRole('link', { name: '全文搜索' }).click();
  const box = page.getByRole('searchbox');
  await box.fill('流程图');
  await box.press('Enter');
  await page.locator('#search-results a').first().waitFor();
  assert.ok((await page.locator('#search-results a').evaluateAll((links) => links.map((link) => link.pathname))).includes(article));
  await box.fill('KaTeX');
  await page.getByRole('button', { name: '搜索', exact: true }).click();
  await page.locator('#search-results mark').first().waitFor();
  await page.reload();
  assert.equal(await box.inputValue(), 'KaTeX');
  await page.locator('#search-results a').first().waitFor();
  await box.fill('unmatchablekeyword100001');
  await box.press('Enter');
  await page.getByText('没有找到匹配内容。').waitFor();
  await page.goBack();
  await page.locator('#search-results a').first().waitFor();
  assert.equal(await box.inputValue(), 'KaTeX');
}));

test('系统主题变化、手动覆盖与跨页面记忆', () => withPage({ colorScheme: 'dark' }, async (page) => {
  await page.goto(origin);
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
  await page.emulateMedia({ colorScheme: 'light' });
  await page.locator('html[data-theme="light"]').waitFor();
  const toggle = page.getByRole('button', { name: '深色模式' });
  await toggle.click();
  assert.equal(await toggle.getAttribute('aria-pressed'), 'true');
  await page.reload();
  await page.locator('html[data-theme="dark"]').waitFor();
  await page.goto(origin + '/blog/');
  assert.equal(await toggle.getAttribute('aria-pressed'), 'true');
}));

test('桌面目录、公式、代码、Mermaid 和真实 404 状态', () => withPage({ viewport: { width: 1280, height: 850 }, reducedMotion: 'reduce' }, async (page) => {
  await page.goto(origin + article);
  const toc = page.locator('.toc-sidebar');
  const link = toc.getByRole('link', { name: 'Mermaid 流程图' });
  await link.click();
  await page.waitForURL((url) => decodeURIComponent(url.hash).includes('mermaid'));
  const svg = page.locator('.mermaid-chart svg');
  await svg.waitFor({ timeout: 15000 });
  assert.equal(await page.locator('pre[data-mermaid]').isVisible(), false);
  const nodesFit = await svg.evaluate((el) => {
    const svgBox = el.getBoundingClientRect();
    return [...el.querySelectorAll('.node')].map((node) => {
      const box = node.getBoundingClientRect();
      return box.width > 0 && box.height > 0 && box.left >= svgBox.left &&
        box.right <= svgBox.right && box.top >= svgBox.top && box.bottom <= svgBox.bottom;
    });
  });
  assert.deepEqual(nodesFit, [true, true, true]);
  const svgBefore = await svg.innerHTML();
  await svg.scrollIntoViewIfNeeded();
  await toc.locator('a[aria-current=location]').first().waitFor();
  await page.getByRole('button', { name: '深色模式' }).click();
  await page.waitForFunction((before) => document.querySelector('.mermaid-chart svg')?.innerHTML !== before, svgBefore);
  assert.ok(await page.locator('.katex-display .katex-mathml math').count());
  assert.match(await page.locator('.katex').first().evaluate((el) => getComputedStyle(el).fontFamily), /KaTeX/);
  const formula = await page.locator('.katex').first().evaluate(async () => {
    await document.fonts.ready;
    return [...document.fonts].some((font) => font.family.includes('KaTeX') && font.status === 'loaded');
  });
  assert.equal(formula, true);
  const code = page.locator('.prose pre.astro-code span[style*="--shiki-dark"]').first();
  const dark = await code.evaluate((el) => getComputedStyle(el).color);
  await page.getByRole('button', { name: '深色模式' }).click();
  assert.notEqual(await code.evaluate((el) => getComputedStyle(el).color), dark);
  const missing = await page.goto(origin + '/this-page-does-not-exist/');
  assert.equal(missing.status(), 404);
  await page.getByRole('heading', { name: '这片地还没种东西' }).waitFor();
  await page.getByRole('link', { name: '回到首页' }).click();
  assert.equal(new URL(page.url()).pathname, '/');
}));

test('本地图片和项目封面使用响应式资源', () => withPage({ viewport: { width: 390, height: 900 } }, async (page) => {
  for (const [path, selector] of [[article, '.prose img'], ['/projects/', '.project-cover']]) {
    await page.goto(origin + path);
    const image = page.locator(selector).first();
    await image.scrollIntoViewIfNeeded();
    await page.waitForFunction((query) => document.querySelector(query)?.naturalWidth > 0, selector);
    assert.match(await image.getAttribute('srcset'), /\b\d+w/);
    assert.ok(Number(await image.getAttribute('width')) > 0);
    assert.ok(Number(await image.getAttribute('height')) > 0);
    assert.equal(await image.getAttribute('loading'), 'lazy');
    assert.ok(await image.getAttribute('alt'));
    assert.match(await image.evaluate((el) => el.currentSrc), /\.(webp|avif)(?:$|\?)/);
  }
}));

test('375px 移动端菜单、目录收起与无横向溢出', () => withPage({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2, reducedMotion: 'reduce' }, async (page) => {
  await page.goto(origin);
  await page.locator('.mobile-nav summary').tap();
  await Promise.all([
    page.waitForURL('**/blog/'),
    page.locator('.mobile-menu').getByRole('link', { name: '博客', exact: true }).tap(),
  ]);
  for (const path of ['/', '/blog/', '/notes/', '/projects/', '/garden/', '/search/', article]) {
    await page.goto(origin + path);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 375, path);
  }
  await page.locator('.toc-mobile summary').tap();
  await page.locator('.toc-mobile a').first().tap();
  assert.equal(await page.locator('.toc-mobile').getAttribute('open'), null);
  await page.waitForURL((url) => url.hash.length > 1);
}));
