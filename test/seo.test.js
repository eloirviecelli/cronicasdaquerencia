import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSitemap, buildRobots, buildFeed } from '../scripts/lib/seo.js';

const config = { nome: 'Crônicas da Querência', frase: 'Frase', autor: 'Eloir', idioma: 'pt-BR', url: 'https://x.github.io/repo', porPagina: 10 };
const w = (i, extra = {}) => ({ titulo: `Obra ${i}`, tipo: 'conto', data: '2026-11-05', slug: `o-${i}`, resumo: `Resumo ${i}`, path: `/conto/o-${i}/`, ...extra });
const many = (n) => Array.from({ length: n }, (_, i) => w(i + 1));

test('sitemap com 11 obras lista pagina/2 e só URLs absolutas', () => {
  const x = buildSitemap(config, many(11), 2);
  assert.match(x, /<loc>https:\/\/x\.github\.io\/repo\/pagina\/2\/<\/loc>/);
  assert.match(x, /<loc>https:\/\/x\.github\.io\/repo\/sobre\/<\/loc>/);
  assert.match(x, /<lastmod>2026-11-05<\/lastmod>/);
  assert.doesNotMatch(x, /404/);
  for (const [, loc] of x.matchAll(/<loc>(.*?)<\/loc>/g)) assert.ok(loc.startsWith(config.url));
});

test('robots', () => {
  const r = buildRobots(config);
  assert.match(r, /User-agent: \*/);
  assert.match(r, /Allow: \//);
  assert.match(r, /Sitemap: https:\/\/x\.github\.io\/repo\/sitemap\.xml/);
});

test('feed vazio é válido', () => {
  const f = buildFeed(config, []);
  assert.match(f, /<channel>/);
  assert.doesNotMatch(f, /<item>/);
  assert.match(f, /<language>pt-BR<\/language>/);
});

test('feed escapa e formata data', () => {
  const f = buildFeed(config, [w(1, { titulo: 'Tom & Jerry <3' })]);
  assert.match(f, /Tom &amp; Jerry &lt;3/);
  assert.match(f, /<pubDate>Thu, 05 Nov 2026 12:00:00 GMT<\/pubDate>/);
  assert.match(f, /<guid[^>]*>https:\/\/x\.github\.io\/repo\/conto\/o-1\/<\/guid>/);
});

test('feed limita a 20 itens', () => {
  assert.equal(buildFeed(config, many(25)).match(/<item>/g).length, 20);
});
