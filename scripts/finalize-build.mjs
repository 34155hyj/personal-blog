import { createHash } from 'node:crypto';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { load } from 'cheerio';
import { close, createIndex } from 'pagefind';

const dist = 'dist';
const indexDir = join(dist, 'pagefind');
await mkdir(indexDir, { recursive: true });

async function* htmlFiles(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* htmlFiles(path);
    else if (entry.name.endsWith('.html')) yield path;
  }
}

function checkErrors({ errors }) {
  if (errors.length) throw new Error(errors.join('\n'));
}

const inlineScripts = new Set();
let indexed = 0;
try {
  const response = await createIndex({ excludeSelectors: ['pre[data-mermaid]', '.katex'] });
  checkErrors(response);
  const { index } = response;
  for await (const file of htmlFiles(dist)) {
    const content = await readFile(file, 'utf8');
    const $ = load(content);
    for (const script of $('script:not([src])').toArray()) {
      const source = $(script).html();
      if (source) inlineScripts.add(`'sha256-${createHash('sha256').update(source).digest('base64')}'`);
    }
    if (!$('[data-pagefind-body]').length) continue;
    const url = `/${relative(dist, file).split(sep).join('/')}`.replace(/index\.html$/, '');
    checkErrors(await index.addHTMLFile({ url, content }));
    indexed++;
  }
  if (indexed) checkErrors(await index.writeFiles({ outputPath: indexDir }));
  await writeFile(join(indexDir, 'status.json'), JSON.stringify({ indexed }) + '\n');
} finally {
  await close();
}

const scriptSources = ["'self'", "'wasm-unsafe-eval'", ...inlineScripts].join(' ');
const policy = [
  "default-src 'self'",
  `script-src ${scriptSources}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "form-action 'self'",
].join('; ');
const headers = await readFile(join(dist, '_headers'), 'utf8');
const cspLine = `  Content-Security-Policy: ${policy}`;
if (cspLine.length > 2000) throw new Error('CSP header exceeds the Cloudflare line length limit.');
await writeFile(join(dist, '_headers'), headers.replace('/*\n', `/*\n${cspLine}\n`));
console.log(`Pagefind: ${indexed} indexed documents. Workers security headers generated.`);
