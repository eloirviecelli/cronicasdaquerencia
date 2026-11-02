import { esc } from './html.js';
import { href, absUrl } from './config.js';

function renderConsent(config) {
  if (!config.analytics) return '';
  const id = JSON.stringify(config.analytics);
  return `<div id="aviso-cookies" class="aviso-cookies" role="region" aria-label="Aviso de cookies" hidden>
<p>Este site usa o Google Analytics, com cookies, para saber quantas pessoas leem as histórias. Só funciona se você aceitar. <a href="${esc(href(config, '/privacidade/'))}">Saiba mais</a>.</p>
<p class="acoes"><button type="button" data-aceitar>Aceitar</button> <button type="button" data-recusar>Recusar</button></p>
</div>
<script>
(function () {
  var ID = ${id}, K = 'cq-consent', b = document.getElementById('aviso-cookies'), s = null;
  try { s = localStorage.getItem(K); } catch (e) {}
  function salvar(v) { try { localStorage.setItem(K, v); } catch (e) {} }
  function carregar() {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { dataLayer.push(arguments); };
    gtag('js', new Date()); gtag('config', ID);
    var t = document.createElement('script');
    t.async = true; t.src = 'https://www.googletagmanager.com/gtag/js?id=' + ID;
    document.head.appendChild(t);
  }
  function perguntar() {
    b.hidden = false;
    b.querySelector('[data-aceitar]').onclick = function () { salvar('granted'); b.hidden = true; carregar(); };
    b.querySelector('[data-recusar]').onclick = function () { salvar('denied'); b.hidden = true; };
  }
  if (s === 'granted') carregar(); else if (!s) perguntar();
  var r = document.querySelector('[data-reabrir]');
  if (r) r.onclick = function () { try { localStorage.removeItem(K); } catch (e) {} perguntar(); };
})();
</script>
`;
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
<p>© ${esc(config.autor)} · <a href="${esc(href(config, '/sobre/'))}">Sobre</a> · <a href="${esc(href(config, '/privacidade/'))}">Privacidade</a>${config.analytics ? ' · <button type="button" class="link" data-reabrir>Cookies</button>' : ''} · <a href="${esc(href(config, '/feed.xml'))}">Feed RSS</a></p>
</footer>
${renderConsent(config)}</body>
</html>
`;
}
