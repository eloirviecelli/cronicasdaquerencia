import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, readFileSync, rmSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { build } from '../scripts/build.js';
import { validate } from '../scripts/validate.js';

const RESUMO = 'Um resumo de teste longo o bastante para passar na validação de tamanho mínimo do resumo das obras.';

async function setup(n, url = 'https://x.github.io/repo', tweak = (m) => m) {
  const root = mkdtempSync(join(tmpdir(), 'cqb-'));
  const contentDir = join(root, 'content');
  mkdirSync(join(contentDir, 'imagens'), { recursive: true });
  writeFileSync(join(root, 'site.config.json'), JSON.stringify({ nome: 'Crônicas da Querência', frase: 'Frase', autor: 'Eloir', idioma: 'pt-BR', url, porPagina: 10 }));
  writeFileSync(join(contentDir, 'sobre.md'), 'Sobre o site.');
  await sharp({ create: { width: 800, height: 600, channels: 3, background: '#8a6a3d' } }).jpeg().toFile(join(contentDir, 'imagens', 'img.jpg'));
  for (let i = 1; i <= n; i++) {
    const mes = String(((i - 1) % 12) + 1).padStart(2, '0');
    const ano = 2000 + Math.floor((i - 1) / 12);
    const slug = `obra-${i}`;
    const meta = tweak(`---\ntitulo: Obra ${i}\ntipo: conto\ndata: ${ano}-${mes}-10\nslug: ${slug}\nresumo: ${RESUMO}\ndescricao: Descrição ${i}\nimagem: img.jpg\nimagem_alt: Alt ${i}\n---\nTexto ${i}.\n`, i);
    writeFileSync(join(contentDir, `${ano}-${mes}-${slug}.md`), meta);
  }
  return { root, contentDir, outDir: join(root, 'docs') };
}

test('gera o site com 2 obras e valida', async () => {
  const o = await setup(2);
  const r = await build(o);
  assert.deepEqual(r, { works: 2, pages: 1 });
  for (const f of ['index.html', 'sobre/index.html', '404.html', 'style.css', 'sitemap.xml', 'robots.txt', 'feed.xml', '.nojekyll', 'conto/obra-1/index.html', 'imagens/obra-1-thumb.jpg']) {
    assert.ok(existsSync(join(o.outDir, f)), f);
  }
  assert.deepEqual(await validate(o), []);
});

test('11 obras geram pagina/2', async () => {
  const o = await setup(11);
  await build(o);
  assert.ok(existsSync(join(o.outDir, 'pagina/2/index.html')));
  assert.deepEqual(await validate(o), []);
});

test('zero obras gera site válido', async () => {
  const o = await setup(0);
  await build(o);
  assert.match(readFileSync(join(o.outDir, 'index.html'), 'utf8'), /Em breve/);
  assert.deepEqual(await validate(o), []);
});

test('domínio próprio: sem // e valida', async () => {
  const o = await setup(2, 'https://cronicasdaquerencia.com.br');
  await build(o);
  assert.doesNotMatch(readFileSync(join(o.outDir, 'index.html'), 'utf8'), /href="\/\//);
  assert.deepEqual(await validate(o), []);
});

test('arquivo apagado da saída é reportado', async () => {
  const o = await setup(2);
  await build(o);
  rmSync(join(o.outDir, 'conto/obra-1/index.html'));
  const e = await validate(o);
  assert.ok(e.some((m) => m.includes('conto/obra-1/index.html')), e.join('\n'));
});

test('slug duplicado e resumo curto', async () => {
  const dup = await setup(2, undefined, (m) => m.replace(/slug: obra-\d/, 'slug: obra-1'));
  assert.ok((await validate(dup)).some((m) => m.includes('duplicado')));
  const curto = await setup(1, undefined, (m) => m.replace(RESUMO, 'curto'));
  assert.ok((await validate(curto)).some((m) => m.includes('resumo')));
});

test('link interno quebrado é reportado', async () => {
  const o = await setup(1);
  await build(o);
  writeFileSync(join(o.outDir, 'index.html'), readFileSync(join(o.outDir, 'index.html'), 'utf8').replace('</main>', '<a href="/repo/nada/">x</a></main>'));
  assert.ok((await validate(o)).some((m) => m.includes('/repo/nada/')));
});

test('campo faltando cita o arquivo', async () => {
  const o = await setup(1, undefined, (m) => m.replace(/resumo:.*\n/, ''));
  await assert.rejects(build(o), /resumo/);
  const e = await validate(o);
  assert.ok(e[0].includes('resumo'));
});

test('conteúdo alterado sem regerar é reportado', async () => {
  const o = await setup(2);
  await build(o);
  const f = join(o.contentDir, readdirSync(o.contentDir).find((n) => n.endsWith('obra-1.md')));
  writeFileSync(f, readFileSync(f, 'utf8').replace('Obra 1', 'Obra Um Alterada'));
  const e = await validate(o);
  assert.ok(e.some((m) => m.includes('desatualizad') && m.includes('conto/obra-1/index.html')), e.join('\n'));
});

test('endereço publicado que some é reportado', async () => {
  const { execFileSync } = await import('node:child_process');
  const o = await setup(2);
  await build(o);
  const git = (...a) => execFileSync('git', a, { cwd: o.root, stdio: 'pipe' });
  git('init', '-q'); git('add', '.');
  git('-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-qm', 'x');
  const antigo = join(o.contentDir, readdirSync(o.contentDir).find((n) => n.endsWith('obra-2.md')));
  const novo = antigo.replace('obra-2.md', 'renomeada.md');
  writeFileSync(novo, readFileSync(antigo, 'utf8').replace('slug: obra-2', 'slug: renomeada'));
  rmSync(antigo);
  await build(o);
  const e = await validate(o);
  assert.ok(e.some((m) => m.includes('/conto/obra-2/') && m.includes('endereço')), e.join('\n'));
});

test('áudio é copiado para a saída e áudio faltando é reportado', async () => {
  const o = await setup(1, undefined, (m) => m.replace('imagem_alt:', 'audio: som.mp3\nimagem_alt:'));
  mkdirSync(join(o.contentDir, 'audio'), { recursive: true });
  writeFileSync(join(o.contentDir, 'audio', 'som.mp3'), 'fake');
  await build(o);
  assert.ok(existsSync(join(o.outDir, 'audio/obra-1.mp3')));
  assert.match(readFileSync(join(o.outDir, 'conto/obra-1/index.html'), 'utf8'), /\/audio\/obra-1\.mp3/);
  assert.deepEqual(await validate(o), []);
  rmSync(join(o.contentDir, 'audio', 'som.mp3'));
  const e = await validate(o);
  assert.ok(e.some((m) => m.includes('som.mp3')), e.join('\n'));
});

test('troca de domínio não conta como endereço removido', async () => {
  const { execFileSync } = await import('node:child_process');
  const o = await setup(2);
  await build(o);
  const git = (...a) => execFileSync('git', a, { cwd: o.root, stdio: 'pipe' });
  git('init', '-q'); git('add', '.');
  git('-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-qm', 'x');
  const cfgFile = join(o.root, 'site.config.json');
  writeFileSync(cfgFile, readFileSync(cfgFile, 'utf8').replace('https://x.github.io/repo', 'https://www.exemplo.com.br'));
  await build(o);
  assert.deepEqual(await validate(o), []);
});
