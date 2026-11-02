import { esc } from './html.js';
import { absUrl } from './config.js';
import { listPath } from './pages.js';

export function buildSitemap(config, works, totalPages) {
  const urls = [];
  for (let p = 1; p <= totalPages; p++) {
    urls.push({ loc: absUrl(config, listPath(p)), lastmod: p === 1 && works[0] ? works[0].data : undefined });
  }
  urls.push({ loc: absUrl(config, '/sobre/') });
  urls.push({ loc: absUrl(config, '/privacidade/') });
  for (const w of works) urls.push({ loc: absUrl(config, w.path), lastmod: w.data });
  const items = urls.map((u) => `  <url><loc>${esc(u.loc)}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}</url>`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items.join('\n')}\n</urlset>\n`;
}

export function buildRobots(config) {
  return `User-agent: *\nAllow: /\n\nSitemap: ${absUrl(config, '/sitemap.xml')}\n`;
}

export function buildFeed(config, works) {
  const items = works.slice(0, 20).map((w) => `    <item>
      <title>${esc(w.titulo)}</title>
      <link>${esc(absUrl(config, w.path))}</link>
      <guid isPermaLink="true">${esc(absUrl(config, w.path))}</guid>
      <pubDate>${new Date(`${w.data}T12:00:00Z`).toUTCString()}</pubDate>
      <description>${esc(w.resumo)}</description>
    </item>`);
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${esc(config.nome)}</title>
    <link>${esc(absUrl(config, '/'))}</link>
    <description>${esc(config.frase)}</description>
    <language>${esc(config.idioma)}</language>
${items.join('\n')}
  </channel>
</rss>
`;
}
