import { esc } from './html.js';
import { href, absUrl } from './config.js';
import { renderLayout } from './layout.js';

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

export function paginate(items, porPagina) {
  const pages = [];
  for (let i = 0; i < items.length; i += porPagina) pages.push(items.slice(i, i + porPagina));
  return pages.length ? pages : [[]];
}

export function listPath(page) {
  return page === 1 ? '/' : `/pagina/${page}/`;
}

export function formatMonth(data) {
  const [ano, mes] = data.split('-');
  return `${MESES[Number(mes) - 1]} de ${ano}`;
}

function renderItem(config, work) {
  return `<li class="item">
<a href="${esc(href(config, work.path))}" tabindex="-1" aria-hidden="true"><img src="${esc(href(config, `/imagens/${work.slug}-thumb.jpg`))}" alt="${esc(work.imagem_alt)}" width="96" height="96" loading="lazy"></a>
<div>
<h2><a href="${esc(href(config, work.path))}">${esc(work.titulo)}</a></h2>
<p>${esc(work.resumo)}</p>
<p class="meta">${esc(formatMonth(work.data))} · ${esc(work.tipo === 'cronica' ? 'crônica' : 'conto')}</p>
</div>
</li>`;
}

function renderPagination(config, page, total) {
  if (total <= 1) return '';
  const nums = Array.from({ length: total }, (_, i) => i + 1).map((n) =>
    n === page
      ? `<span aria-current="page">${n}</span>`
      : `<a href="${esc(href(config, listPath(n)))}">${n}</a>`);
  const prev = page > 1 ? `<a rel="prev" href="${esc(href(config, listPath(page - 1)))}">← anterior</a> · ` : '';
  const next = page < total ? ` · <a rel="next" href="${esc(href(config, listPath(page + 1)))}">próxima →</a>` : '';
  return `<nav class="paginacao" aria-label="Paginação">${prev}${nums.join(' ')}${next}</nav>`;
}

export function renderListPage(config, pageWorks, page, totalPages) {
  const first = page === 1;
  const body = [
    `<h1>${first ? esc(config.nome) : `Página ${page}`}</h1>`,
    pageWorks.length
      ? `<ul class="lista">\n${pageWorks.map((w) => renderItem(config, w)).join('\n')}\n</ul>`
      : '<p class="vazio">Em breve, a primeira história chega por aqui.</p>',
    renderPagination(config, page, totalPages),
  ].join('\n');
  const meta = {
    titulo: first ? config.nome : `Página ${page} — ${config.nome}`,
    descricao: config.frase,
    path: listPath(page),
    prev: page > 1 ? listPath(page - 1) : undefined,
    next: page < totalPages ? listPath(page + 1) : undefined,
    jsonLd: first ? [{
      '@type': 'Blog',
      name: config.nome,
      description: config.frase,
      url: absUrl(config, '/'),
      inLanguage: config.idioma,
      author: { '@type': 'Person', name: config.autor },
    }] : [],
  };
  return renderLayout(config, meta, body);
}
