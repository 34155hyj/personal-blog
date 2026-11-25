export const siteTitle = 'Digital Garden';
export const siteDescription = '记录论文阅读、科研方法与个人项目的数字花园。';

export function resolveSite(value = process.env.SITE_URL) {
  if (!value) return undefined;
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('SITE_URL 必须是无路径、凭据、查询参数和片段的 HTTPS 源地址。');
  }
  return url.origin;
}
