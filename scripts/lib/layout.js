import { esc } from './html.js';
import { href, absUrl } from './config.js';

function renderCounter(config) {
  if (!config.goatcounter) return '';
  return `<script data-goatcounter="${esc(config.goatcounter)}" async src="https://gc.zgo.at/count.js"></script>\n`;
}

const ldJson = (data) => JSON.stringify(data).replace(/</g, '\\u003c');

export function renderLayout(config, meta, bodyHtml) {
  const canonical = absUrl(config, meta.path);
  const og = meta.ogImage ? absUrl(config, meta.ogImage) : null;
  const links = [
    `<link rel="canonical" href="${esc(canonical)}">`,
    meta.prev ? `<link rel="prev" href="${esc(absUrl(config, meta.prev))}">` : '',
    meta.next ? `<link rel="next" href="${esc(absUrl(config, meta.next))}">` : '',
    `<link rel="alternate" type="application/rss+xml" title="${esc(config.nome)}" href="${esc(href(config, '/feed.xml'))}">`,
    `<link rel="stylesheet" href="${esc(href(config, '/style.css'))}">`,
  ].filter(Boolean);
  const og_tags = [
    ['og:type', meta.tipoOg || 'website'],
    ['og:site_name', config.nome],
    ['og:locale', config.idioma.replace('-', '_')],
    ['og:title', meta.titulo],
    ['og:description', meta.descricao],
    ['og:url', canonical],
    og ? ['og:image', og] : null,
  ].filter(Boolean).map(([p, c]) => `<meta property="${p}" content="${esc(c)}">`);
  const ld = (meta.jsonLd || []).map((d) => `<script type="application/ld+json">${ldJson({ '@context': 'https://schema.org', ...d })}</script>`);
  return `<!doctype html>
<html lang="${esc(config.idioma)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(meta.titulo)}</title>
<meta name="description" content="${esc(meta.descricao)}">
${meta.noindex ? '<meta name="robots" content="noindex">\n' : ''}${links.join('\n')}
${og_tags.join('\n')}
<meta name="twitter:card" content="${og ? 'summary_large_image' : 'summary'}">
${ld.join('\n')}
</head>
<body>
<a class="pular" href="#conteudo">Pular para o conteúdo</a>
<header class="topo">
<a class="marca" href="${esc(href(config, '/'))}">${esc(config.nome)}</a>
<p class="frase">${esc(config.frase)}</p>
</header>
<main id="conteudo">
${bodyHtml}
</main>
<footer class="rodape">
<p>© ${esc(config.autor)} · <a href="${esc(href(config, '/sobre/'))}">Sobre</a> · <a href="${esc(href(config, '/privacidade/'))}">Privacidade</a> · <a href="${esc(href(config, '/feed.xml'))}">Feed RSS</a></p>
</footer>
${renderCounter(config)}</body>
</html>
`;
}
