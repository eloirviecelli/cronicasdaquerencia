import test from 'node:test';
import assert from 'node:assert/strict';
import { paginate, listPath, formatMonth, renderListPage } from '../scripts/lib/pages.js';

const config = { nome: 'Crônicas da Querência', frase: 'f', autor: 'Eloir', idioma: 'pt-BR', url: 'https://x.github.io/repo', porPagina: 10 };
const work = (i, extra = {}) => ({ titulo: `Obra ${i}`, tipo: 'conto', data: '2026-11-05', slug: `obra-${i}`, resumo: `Resumo ${i}`, descricao: 'd', imagem: 'a.jpg', imagem_alt: `Alt ${i}`, path: `/conto/obra-${i}/`, ...extra });
const many = (n) => Array.from({ length: n }, (_, i) => work(i + 1));

test('paginate', () => {
  assert.equal(paginate(many(10), 10).length, 1);
  const p = paginate(many(11), 10);
  assert.deepEqual(p.map((x) => x.length), [10, 1]);
  assert.deepEqual(paginate([], 10), [[]]);
});

test('listPath', () => {
  assert.equal(listPath(1), '/');
  assert.equal(listPath(2), '/pagina/2/');
});

test('formatMonth', () => {
  assert.equal(formatMonth('2026-11-05'), 'novembro de 2026');
  assert.equal(formatMonth('2026-03-01'), 'março de 2026');
});

test('item da lista completo', () => {
  const h = renderListPage(config, [work(1, { titulo: 'Tom & "Jerry"' })], 2, 2);
  assert.match(h, /<img [^>]*src="\/repo\/imagens\/obra-1-thumb\.jpg"[^>]*alt="Alt 1"[^>]*width="96"[^>]*height="96"|<img [^>]*alt="Alt 1"/);
  assert.match(h, /width="96"/);
  assert.match(h, /href="\/repo\/conto\/obra-1\/"/);
  assert.match(h, /Tom &amp; &quot;Jerry&quot;/);
  assert.match(h, /Resumo 1/);
  assert.match(h, /novembro de 2026 · conto/);
});

test('uma página só não mostra paginação', () => {
  const h = renderListPage(config, many(10), 1, 1);
  assert.doesNotMatch(h, /← anterior|próxima →/);
});

test('página 1 de 2 e página 2 de 2', () => {
  const h1 = renderListPage(config, many(10), 1, 2);
  assert.match(h1, /próxima/);
  assert.doesNotMatch(h1, /← anterior/);
  assert.match(h1, /rel="next" href="https:\/\/x\.github\.io\/repo\/pagina\/2\/"/);
  const h2 = renderListPage(config, many(1), 2, 2);
  assert.match(h2, /← anterior/);
  assert.doesNotMatch(h2, /próxima/);
  assert.match(h2, /rel="prev" href="https:\/\/x\.github\.io\/repo\/"/);
  assert.match(h2, /aria-current="page"/);
  assert.match(h2, /<h1>Página 2<\/h1>/);
});

test('sem obras mostra mensagem', () => {
  const h = renderListPage(config, [], 1, 1);
  assert.match(h, /Em breve, a primeira história chega por aqui\./);
});

test('página 1 tem JSON-LD Blog', () => {
  const h = renderListPage(config, many(1), 1, 1);
  assert.match(h, /"@type":"Blog"/);
});

test('h1 da página 1 usa a chamada da configuração, com palavras em destaque', () => {
  const h = renderListPage({ ...config, chamada: 'Momentos para *refletir*, *imaginar*, *sonhar*…' }, many(1), 1, 1);
  assert.match(h, /<h1 class="chamada">Momentos para <em>refletir<\/em>, <em>imaginar<\/em>, <em>sonhar<\/em>…<\/h1>/);
  assert.match(h, /<title>Crônicas da Querência<\/title>/);
});

test('chamada escapa HTML e sem asteriscos fica como texto', () => {
  const h = renderListPage({ ...config, chamada: 'A <b> & B' }, many(1), 1, 1);
  assert.match(h, /<h1 class="chamada">A &lt;b&gt; &amp; B<\/h1>/);
});

test('ornamento de chaleira e cuia só na página 1, decorativo', () => {
  const h1 = renderListPage(config, many(1), 1, 2);
  assert.match(h1, /<svg class="ornamento"[^>]*aria-hidden="true"/);
  assert.ok(h1.indexOf('class="ornamento"') < h1.indexOf('<h1'), 'ornamento antes do h1');
  assert.doesNotMatch(renderListPage(config, many(1), 2, 2), /ornamento/);
});

test('página 1: a obra mais recente vira destaque e as outras ficam em histórias anteriores', () => {
  const h = renderListPage(config, many(3), 1, 1);
  assert.match(h, /<article class="destaque">/);
  assert.match(h, /src="\/repo\/imagens\/obra-1-og\.jpg"[^>]*width="1200"[^>]*height="630"|width="1200"/);
  assert.match(h, /A mais recente · novembro de 2026 · conto/);
  assert.match(h, /Histórias anteriores/);
  assert.equal(h.match(/class="item"/g).length, 2);
  assert.doesNotMatch(h.match(/<article class="destaque">[^]*?<\/article>/)[0], /obra-2/);
  assert.match(h, /obra-2-thumb\.jpg/);
});

test('destaque: chamada para ler muda se há áudio', () => {
  assert.match(renderListPage(config, [work(1, { audio: 'a.mp3' })], 1, 1), /Ler e ouvir o conto →/);
  assert.match(renderListPage(config, [work(1)], 1, 1), /Ler o conto →/);
  assert.match(renderListPage(config, [work(1, { tipo: 'cronica' })], 1, 1), /Ler a crônica →/);
});

test('só uma obra: destaque sem seção de anteriores', () => {
  const h = renderListPage(config, many(1), 1, 1);
  assert.match(h, /class="destaque"/);
  assert.doesNotMatch(h, /Histórias anteriores/);
});

test('página 2 não tem destaque', () => {
  const h = renderListPage(config, many(3), 2, 2);
  assert.doesNotMatch(h, /destaque|Histórias anteriores/);
  assert.equal(h.match(/class="item"/g).length, 3);
});
