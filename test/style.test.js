import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../site/style.css', import.meta.url), 'utf8');
const cor = (nome) => css.match(new RegExp(`--${nome}:\\s*(#[0-9a-f]{6})`, 'i'))[1];
const lum = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contraste = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};

for (const nome of ['texto', 'apoio', 'secundario', 'destaque']) {
  test(`contraste AA de --${nome} sobre o fundo`, () => {
    assert.ok(contraste(cor(nome), cor('fundo')) >= 4.5, `${nome}: ${contraste(cor(nome), cor('fundo')).toFixed(2)}`);
  });
}

test('--erva existe e tem contraste AA sobre fundo e cartão', () => {
  assert.ok(contraste(cor('erva'), cor('fundo')) >= 4.5);
  assert.ok(contraste(cor('erva'), cor('cartao')) >= 4.5);
});

for (const nome of ['texto', 'apoio', 'secundario', 'destaque']) {
  test(`contraste AA de --${nome} sobre o cartão`, () => {
    assert.ok(contraste(cor(nome), cor('cartao')) >= 4.5, `${nome}: ${contraste(cor(nome), cor('cartao')).toFixed(2)}`);
  });
}
