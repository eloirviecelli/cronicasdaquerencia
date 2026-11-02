import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { slugify } from '../scripts/lib/slug.js';
import { basePath, href, absUrl } from '../scripts/lib/config.js';
import { parseWork, loadWorks } from '../scripts/lib/content.js';

const fx = (n) => readFileSync(new URL(`./fixtures/content/${n}`, import.meta.url), 'utf8');
const cfg = (url) => ({ url });

test('slugify remove acentos', () => {
  assert.equal(slugify('Chimarrão à Tarde!'), 'chimarrao-a-tarde');
});

test('parseWork lê os campos', () => {
  const w = parseWork(fx('2026-11-teste-um.md'), '2026-11-teste-um.md');
  assert.equal(w.titulo, 'Tom & "Jerry" no Galpão');
  assert.equal(w.tipo, 'conto');
  assert.equal(w.path, '/conto/teste-um/');
  assert.match(w.markdown, /Primeiro parágrafo/);
});

test('tipo inválido cita o arquivo', () => {
  const t = fx('2026-11-teste-um.md').replace('tipo: conto', 'tipo: poema');
  assert.throws(() => parseWork(t, 'x.md'), /x\.md/);
});

test('campo faltando lança erro', () => {
  const t = fx('2026-11-teste-um.md').replace(/resumo:.*\n/, '');
  assert.throws(() => parseWork(t, 'y.md'), /y\.md.*resumo/);
});

test('data inválida lança erro', () => {
  const t = fx('2026-11-teste-um.md').replace('2026-11-05', '05/11/2026');
  assert.throws(() => parseWork(t, 'z.md'), /z\.md/);
});

test('mesma data ordena por slug', () => {
  const ws = loadWorks(new URL('./fixtures/content/', import.meta.url).pathname);
  assert.deepEqual(ws.map((w) => w.slug), ['teste-dois', 'teste-um']);
});

test('basePath, href e absUrl', () => {
  assert.equal(basePath(cfg('https://x.github.io/repo')), '/repo');
  assert.equal(basePath(cfg('https://dominio.com.br')), '');
  assert.equal(basePath(cfg('https://dominio.com.br/')), '');
  assert.equal(href(cfg('https://dominio.com.br'), '/a/'), '/a/');
  assert.equal(href(cfg('https://x.github.io/repo/'), '/a/'), '/repo/a/');
  assert.equal(absUrl(cfg('https://x.github.io/repo/'), '/a/'), 'https://x.github.io/repo/a/');
});
