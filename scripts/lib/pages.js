import { esc } from './html.js';
import { href, absUrl } from './config.js';
import { extname } from 'node:path';
import { marked } from 'marked';
import { renderLayout } from './layout.js';
import { ORNAMENTO_SVG } from './ornamento.js';

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

function renderItem(config, work, titulo = 'h2') {
  return `<li class="item">
<a href="${esc(href(config, work.path))}" tabindex="-1" aria-hidden="true"><img src="${esc(href(config, `/imagens/${work.slug}-thumb.jpg`))}" alt="${esc(work.imagem_alt)}" width="96" height="96" loading="lazy"></a>
<div>
<${titulo}><a href="${esc(href(config, work.path))}">${esc(work.titulo)}</a></${titulo}>
<p>${esc(work.resumo)}</p>
<p class="meta">${esc(formatMonth(work.data))} · ${esc(work.tipo === 'cronica' ? 'crônica' : 'conto')}</p>
</div>
</li>`;
}

const nomeDoTipo = (work) => (work.tipo === 'cronica' ? 'crônica' : 'conto');

function renderFeatured(config, work) {
  const link = esc(href(config, work.path));
  const artigo = work.tipo === 'cronica' ? 'a' : 'o';
  const chamada = `${work.audio ? 'Ler e ouvir' : 'Ler'} ${artigo} ${nomeDoTipo(work)} →`;
  return `<article class="destaque">
<a href="${link}" tabindex="-1" aria-hidden="true"><img src="${esc(href(config, `/imagens/${work.slug}-og.jpg`))}" alt="${esc(work.imagem_alt)}" width="1200" height="630"></a>
<div class="destaque-texto">
<p class="meta">A mais recente · ${esc(formatMonth(work.data))} · ${nomeDoTipo(work)}</p>
<h2><a href="${link}">${esc(work.titulo)}</a></h2>
<p>${esc(work.resumo)}</p>
<p class="ler"><a href="${link}">${chamada}</a></p>
</div>
</article>`;
}

// Palavras entre *asteriscos* viram itálico; todo o resto é escapado.
function chamadaHtml(texto) {
  return esc(texto).replace(/\*(.+?)\*/g, '<em>$1</em>');
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
  const destaque = first && pageWorks.length ? pageWorks[0] : null;
  const lista = destaque ? pageWorks.slice(1) : pageWorks;
  const itens = `<ul class="lista">\n${lista.map((w) => renderItem(config, w, destaque ? 'h3' : 'h2')).join('\n')}\n</ul>`;
  const body = [
    first ? ORNAMENTO_SVG : '',
    first ? `<h1 class="chamada">${chamadaHtml(config.chamada || config.nome)}</h1>` : `<h1>Página ${page}</h1>`,
    destaque ? renderFeatured(config, destaque) : '',
    destaque && lista.length ? '<h2 class="secao">Histórias anteriores</h2>' : '',
    lista.length ? itens : '',
    pageWorks.length ? '' : '<p class="vazio">Em breve, a primeira história chega por aqui.</p>',
    renderPagination(config, page, totalPages),
  ].filter(Boolean).join('\n');
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

export function audioPath(work) {
  return `/audio/${work.slug}${extname(work.audio)}`;
}

function renderAudio(config, work) {
  if (!work.audio) return '';
  const src = esc(href(config, audioPath(work)));
  return `<div class="audio">
<p class="audio-rotulo">Ouça esta história</p>
<audio controls preload="none" src="${src}">Seu navegador não toca áudio.</audio>
</div>
`;
}

export function renderWorkPage(config, work, older, newer, size) {
  const tipo = work.tipo === 'cronica' ? 'crônica' : 'conto';
  const vizinha = (w, rel, rotulo) =>
    w ? `<a rel="${rel}" href="${esc(href(config, w.path))}">${rotulo} ${esc(w.titulo)}</a>` : '<span></span>';
  const body = `<article class="obra">
<h1>${esc(work.titulo)}</h1>
<p class="meta">${esc(formatMonth(work.data))} · ${tipo} · por ${esc(config.autor)}</p>
${renderAudio(config, work)}<img src="${esc(href(config, `/imagens/${work.slug}-capa.jpg`))}" alt="${esc(work.imagem_alt)}" width="${size.width}" height="${size.height}">
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

export function renderPrivacyPage(config, markdown) {
  const body = `<article class="obra">\n<h1>Privacidade</h1>\n${marked.parse(markdown)}\n</article>`;
  return renderLayout(config, {
    titulo: `Privacidade — ${config.nome}`,
    descricao: `Como o site ${config.nome} trata seus dados e cookies.`,
    path: '/privacidade/',
  }, body);
}
