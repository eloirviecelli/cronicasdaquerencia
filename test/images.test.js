import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { processImage, imageSize } from '../scripts/lib/images.js';

const tmp = () => mkdtempSync(join(tmpdir(), 'cq-'));

test('gera thumb, capa e og com os tamanhos certos', async () => {
  const dir = tmp();
  const src = join(dir, 'origem.png');
  await sharp({ create: { width: 2000, height: 1500, channels: 3, background: '#a8794f' } }).png().toFile(src);
  const out = join(dir, 'saida');
  const r = await processImage(src, 'minha-obra', out);
  const dims = async (f) => { const m = await sharp(join(out, f)).metadata(); return [m.width, m.height]; };
  assert.deepEqual(await dims('imagens/minha-obra-thumb.jpg'), [192, 192]);
  assert.deepEqual(await dims('imagens/minha-obra-og.jpg'), [1200, 630]);
  assert.deepEqual(await dims('imagens/minha-obra-capa.jpg'), [960, 720]);
  assert.deepEqual(r, { thumb: 'imagens/minha-obra-thumb.jpg', capa: 'imagens/minha-obra-capa.jpg', og: 'imagens/minha-obra-og.jpg' });
  assert.deepEqual(await imageSize(join(out, r.capa)), { width: 960, height: 720 });
  assert.ok(existsSync(join(out, r.og)));
});

test('origem inexistente cita o caminho', async () => {
  await assert.rejects(processImage('/nao/existe.jpg', 'x', tmp()), /\/nao\/existe\.jpg/);
});
