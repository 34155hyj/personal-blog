import { spawnSync } from 'node:child_process';
import { resolveSite } from '../src/utils/site.mjs';

const site = resolveSite();
const hostname = site && new URL(site).hostname;
if (!hostname || !hostname.includes('.') || /(?:^|\.)(?:localhost|example|test|invalid|local)$/.test(hostname) ||
  /(?:^|\.)example\.(?:com|net|org)$/.test(hostname)) {
  throw new Error('请在构建环境中设置实际公开站点的 SITE_URL，再运行发布构建。');
}

const npm = process.env.npm_execpath;
if (!npm) throw new Error('请通过 npm run build:release 运行。');
const run = spawnSync(process.execPath, [npm, 'run', 'build'], {
  stdio: 'inherit',
  env: { ...process.env, EXCLUDE_EXAMPLES: '1', SITE_URL: site },
});
if (run.error) throw run.error;
process.exitCode = run.status ?? 1;
