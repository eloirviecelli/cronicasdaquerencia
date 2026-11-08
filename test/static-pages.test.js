import test from 'node:test';
import assert from 'node:assert/strict';
import { renderAboutPage, render404 } from '../scripts/lib/pages.js';

const config = { nome: 'Crônicas da Querência', frase: 'f', autor: 'Eloir', idioma: 'pt-BR', url: 'https://x.github.io/repo', porPagina: 10 };

test('Sobre', () => {
  const h = renderAboutPage(config, 'Texto *sobre* o autor.');
  assert.match(h, /<h1>Sobre<\/h1>/);
  assert.match(h, /<em>sobre<\/em>/);
  assert.match(h, /rel="canonical" href="https:\/\/x\.github\.io\/repo\/sobre\/"/);
});

test('404 noindex e link para a lista', () => {
  const h = render404(config);
  assert.match(h, /<meta name="robots" content="noindex">/);
  assert.match(h, /href="\/repo\/"/);
  assert.match(h, /href="\/repo\/style\.css\?v=[0-9a-f]{8}"/);
});

import { renderPrivacyPage } from '../scripts/lib/pages.js';

test('página de privacidade', () => {
  const h = renderPrivacyPage(config, 'Texto de *privacidade*.');
  assert.match(h, /<h1>Privacidade<\/h1>/);
  assert.match(h, /<em>privacidade<\/em>/);
  assert.match(h, /rel="canonical" href="https:\/\/x\.github\.io\/repo\/privacidade\/"/);
});
