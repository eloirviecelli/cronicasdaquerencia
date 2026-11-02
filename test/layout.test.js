import test from 'node:test';
import assert from 'node:assert/strict';
import { esc } from '../scripts/lib/html.js';
import { renderLayout } from '../scripts/lib/layout.js';

const config = { nome: 'Crônicas da Querência', frase: 'frase', autor: 'Eloir', idioma: 'pt-BR', url: 'https://x.github.io/repo', porPagina: 10 };
const meta = { titulo: 'Título', descricao: 'Desc', path: '/conto/a/', ogImage: '/imagens/a-og.jpg', jsonLd: [{ '@type': 'Article' }] };
const body = '<h1>Olá</h1>';

test('esc escapa caracteres especiais', () => {
  assert.equal(esc(`A & B <i> "x" 'y'`), 'A &amp; B &lt;i&gt; &quot;x&quot; &#39;y&#39;');
});

test('head de SEO completo', () => {
  const h = renderLayout(config, meta, body);
  assert.match(h, /<html lang="pt-BR">/);
  assert.equal(h.match(/<h1/g).length, 1);
  assert.match(h, /<link rel="canonical" href="https:\/\/x\.github\.io\/repo\/conto\/a\/">/);
  assert.match(h, /property="og:title" content="Título"/);
  assert.match(h, /property="og:description" content="Desc"/);
  assert.match(h, /property="og:image" content="https:\/\/x\.github\.io\/repo\/imagens\/a-og\.jpg"/);
  assert.match(h, /name="twitter:card"/);
  assert.match(h, /<script type="application\/ld\+json">/);
  assert.match(h, /href="#conteudo"/);
  assert.match(h, /<link rel="stylesheet" href="\/repo\/style\.css">/);
  assert.match(h, /type="application\/rss\+xml"/);
  assert.match(h, /name="viewport"/);
});

test('prev/next só quando informados', () => {
  assert.doesNotMatch(renderLayout(config, meta, body), /rel="prev"|rel="next"/);
  const h = renderLayout(config, { ...meta, prev: '/', next: '/pagina/3/' }, body);
  assert.match(h, /rel="prev" href="https:\/\/x\.github\.io\/repo\/"/);
  assert.match(h, /rel="next" href="https:\/\/x\.github\.io\/repo\/pagina\/3\/"/);
});

test('sem caminho-base nenhum href começa com //', () => {
  const h = renderLayout({ ...config, url: 'https://dominio.com.br' }, meta, body);
  assert.doesNotMatch(h, /href="\/\//);
  assert.match(h, /href="\/style\.css"/);
});

test('título com & e < escapado', () => {
  const h = renderLayout(config, { ...meta, titulo: 'A & B <i>' }, body);
  assert.match(h, /A &amp; B &lt;i&gt;/);
  assert.doesNotMatch(h, /<i>/);
});

test('JSON-LD não fecha o script', () => {
  const h = renderLayout(config, { ...meta, jsonLd: [{ x: '</script><b>' }] }, body);
  assert.equal(h.match(/<\/script>/g).length, 1);
});

test('sem goatcounter: nenhum script de contagem', () => {
  assert.doesNotMatch(renderLayout(config, meta, body), /goatcounter|gc\.zgo\.at/);
});

test('com goatcounter: script de contagem, sem cookies nem aviso', () => {
  const h = renderLayout({ ...config, goatcounter: 'https://nome.goatcounter.com/count' }, meta, body);
  assert.match(h, /<script data-goatcounter="https:\/\/nome\.goatcounter\.com\/count" async src="https:\/\/gc\.zgo\.at\/count\.js"><\/script>/);
  assert.doesNotMatch(h, /aviso-cookies|googletagmanager|data-reabrir|localStorage/);
});
