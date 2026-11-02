import test from 'node:test';
import assert from 'node:assert/strict';
import { renderWorkPage } from '../scripts/lib/pages.js';

const config = { nome: 'Crônicas da Querência', frase: 'f', autor: 'Eloir', idioma: 'pt-BR', url: 'https://x.github.io/repo', porPagina: 10 };
const w = (slug, extra = {}) => ({ titulo: `T ${slug}`, tipo: 'conto', data: '2026-11-05', slug, resumo: 'r', descricao: 'Descrição da obra', imagem: 'a.jpg', imagem_alt: 'Alt da capa', path: `/conto/${slug}/`, markdown: 'Primeiro *itálico*.\n\nSegundo.', ...extra });
const size = { width: 960, height: 720 };

test('conteúdo da página de leitura', () => {
  const h = renderWorkPage(config, w('a', { titulo: 'Tom & "Jerry"' }), null, null, size);
  assert.match(h, /<h1>Tom &amp; &quot;Jerry&quot;<\/h1>/);
  assert.match(h, /src="\/repo\/imagens\/a-capa\.jpg"[^>]*alt="Alt da capa"|alt="Alt da capa"/);
  assert.match(h, /width="960"[^>]*height="720"|height="720"/);
  assert.match(h, /<em>itálico<\/em>/);
  assert.match(h, /<p>Segundo\.<\/p>/);
  assert.match(h, /<title>Tom &amp; &quot;Jerry&quot; — Crônicas da Querência<\/title>/);
  assert.match(h, /name="description" content="Descrição da obra"/);
  assert.match(h, /property="og:type" content="article"/);
  assert.match(h, /og:image" content="https:\/\/x\.github\.io\/repo\/imagens\/a-og\.jpg"/);
});

test('anterior/próxima e volta à lista', () => {
  const h = renderWorkPage(config, w('b'), w('velha'), w('nova'), size);
  assert.match(h, /href="\/repo\/conto\/velha\/"/);
  assert.match(h, /href="\/repo\/conto\/nova\/"/);
  assert.match(h, /href="\/repo\/"[^>]*>[^<]*(todas|Voltar|voltar)/i);
  const solo = renderWorkPage(config, w('b'), null, null, size);
  assert.doesNotMatch(solo, /class="vizinhas"[^]*<a[^>]*conto/);
});

test('JSON-LD Article válido', () => {
  const h = renderWorkPage(config, w('a', { titulo: 'Tom & "Jerry" </script>' }), null, null, size);
  const raw = h.match(/<script type="application\/ld\+json">([^]*?)<\/script>/)[1];
  const ld = JSON.parse(raw);
  assert.equal(ld['@type'], 'Article');
  assert.equal(ld.headline, 'Tom & "Jerry" </script>');
  assert.equal(ld.datePublished, '2026-11-05');
  assert.equal(ld.author.name, 'Eloir');
  assert.equal(ld.inLanguage, 'pt-BR');
  assert.equal(ld.image, 'https://x.github.io/repo/imagens/a-og.jpg');
});

test('obra com áudio mostra o player logo abaixo do título', () => {
  const h = renderWorkPage(config, w('a', { audio: 'a.mp3' }), null, null, size);
  assert.match(h, /<audio controls preload="none" src="\/repo\/audio\/a\.mp3">/);
  assert.ok(h.indexOf('</h1>') < h.indexOf('<audio'), 'áudio depois do h1');
  assert.ok(h.indexOf('<audio') < h.indexOf('<img src="/repo/imagens/a-capa.jpg"'), 'áudio antes da imagem');
  assert.match(h, /href="\/repo\/audio\/a\.mp3"[^>]*download/);
});

test('obra sem áudio não tem player', () => {
  assert.doesNotMatch(renderWorkPage(config, w('a'), null, null, size), /<audio/);
});
