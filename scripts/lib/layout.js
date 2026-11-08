import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { esc } from './html.js';
import { href, absUrl } from './config.js';

function renderCounter(config) {
  if (!config.goatcounter) return '';
  return `<script data-goatcounter="${esc(config.goatcounter)}" async src="https://gc.zgo.at/count.js"></script>\n`;
}

// Versão do CSS na URL: quando o estilo muda, o navegador do leitor busca o arquivo novo em vez do cache.
const CSS_VERSAO = createHash('md5')
  .update(readFileSync(new URL('../../site/style.css', import.meta.url)))
  .digest('hex')
  .slice(0, 8);

const ldJson = (data) => JSON.stringify(data).replace(/</g, '\\u003c');

export function renderLayout(config, meta, bodyHtml) {
  const canonical = absUrl(config, meta.path);
  const og = meta.ogImage ? absUrl(config, meta.ogImage) : null;
  const links = [
    `<link rel="canonical" href="${esc(canonical)}">`,
    meta.prev ? `<link rel="prev" href="${esc(absUrl(config, meta.prev))}">` : '',
    meta.next ? `<link rel="next" href="${esc(absUrl(config, meta.next))}">` : '',
    `<link rel="alternate" type="application/rss+xml" title="${esc(config.nome)}" href="${esc(href(config, '/feed.xml'))}">`,
    `<link rel="stylesheet" href="${esc(href(config, '/style.css'))}?v=${CSS_VERSAO}">`,
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
<span class="sol" aria-hidden="true"></span>
<svg class="coxilhas" viewBox="0 0 1280 90" preserveAspectRatio="none" aria-hidden="true" focusable="false">
<path d="M0 90 V52 C160 24 320 30 480 52 C640 74 800 32 960 40 C1100 47 1200 36 1280 30 V90 Z" fill="#b9b98e"/>
<path d="M0 90 V66 C200 44 380 56 560 68 C740 80 920 52 1100 60 C1180 64 1240 58 1280 54 V90 Z" fill="#8b8e5e"/>
<path d="M0 90 V78 C220 66 420 76 640 82 C860 88 1060 70 1280 76 V90 Z" fill="#5c5f3b"/>
</svg>
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
