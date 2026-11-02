import { esc } from './html.js';
import { href, absUrl } from './config.js';
import { marked } from 'marked';
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

export function renderWorkPage(config, work, older, newer, size) {
  const tipo = work.tipo === 'cronica' ? 'crônica' : 'conto';
  const vizinha = (w, rel, rotulo) =>
    w ? `<a rel="${rel}" href="${esc(href(config, w.path))}">${rotulo} ${esc(w.titulo)}</a>` : '<span></span>';
  const body = `<article class="obra">
<h1>${esc(work.titulo)}</h1>
<p class="meta">${esc(formatMonth(work.data))} · ${tipo} · por ${esc(config.autor)}</p>
<img src="${esc(href(config, `/imagens/${work.slug}-capa.jpg`))}" alt="${esc(work.imagem_alt)}" width="${size.width}" height="${size.height}">
${marked.parse(work.markdown)}
</article>
<nav class="vizinhas" aria-label="Outras histórias">
${vizinha(older, 'prev', '←')}
${vizinha(newer, 'next', '→')}
</nav>
<p class="paginacao"><a href="${esc(href(config, '/'))}">Voltar para todas as histórias</a></p>`;
  const ogImage = `/imagens/${work.slug}-og.jpg`;
  const meta = {
    titulo: `${work.titulo} — ${config.nome}`,
    descricao: work.descricao,
    path: work.path,
    ogImage,
    tipoOg: 'article',
    jsonLd: [{
      '@type': 'Article',
      headline: work.titulo,
      description: work.descricao,
      datePublished: work.data,
      inLanguage: config.idioma,
      image: absUrl(config, ogImage),
      mainEntityOfPage: absUrl(config, work.path),
      author: { '@type': 'Person', name: config.autor },
      publisher: { '@type': 'Organization', name: config.nome },
    }],
  };
  return renderLayout(config, meta, body);
}

export function renderAboutPage(config, markdown) {
  const body = `<article class="obra">\n<h1>Sobre</h1>\n${marked.parse(markdown)}\n</article>`;
  return renderLayout(config, {
    titulo: `Sobre — ${config.nome}`,
    descricao: config.frase,
    path: '/sobre/',
  }, body);
}

export function render404(config) {
  const body = `<h1>Página não encontrada</h1>
<p class="vazio">Esta trilha não leva a lugar nenhum. <a href="${esc(href(config, '/'))}">Volte para as histórias</a>.</p>`;
  return renderLayout(config, {
    titulo: `Página não encontrada — ${config.nome}`,
    descricao: config.frase,
    path: '/404.html',
    noindex: true,
  }, body);
}
