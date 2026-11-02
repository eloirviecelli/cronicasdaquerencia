import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadConfig, basePath } from './lib/config.js';
import { loadWorks } from './lib/content.js';
import { paginate, listPath } from './lib/pages.js';

function walk(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

const fileFor = (outDir, path) => {
  const p = path.replace(/^\//, '');
  return join(outDir, p === '' || p.endsWith('/') ? `${p}index.html` : p);
};

export async function validate({ root, contentDir, outDir }) {
  const errors = [];
  let config;
  try { config = loadConfig(join(root, 'site.config.json')); } catch (e) { return [e.message]; }
  let works;
  try { works = loadWorks(contentDir); } catch (e) { return [e.message]; }

  const slugs = new Set();
  for (const w of works) {
    if (slugs.has(w.slug)) errors.push(`${w.arquivo}: slug duplicado "${w.slug}"`);
    slugs.add(w.slug);
    if (!/^[a-z0-9-]+$/.test(w.slug)) errors.push(`${w.arquivo}: slug inválido "${w.slug}" (só a-z, 0-9 e hífen)`);
    if (!w.arquivo.endsWith(`-${w.slug}.md`)) errors.push(`${w.arquivo}: o nome do arquivo deve terminar em -${w.slug}.md`);
    if (w.resumo.length < 80 || w.resumo.length > 300) errors.push(`${w.arquivo}: resumo deve ter 80–300 caracteres (tem ${w.resumo.length})`);
    if (w.descricao.length > 160) errors.push(`${w.arquivo}: descricao passa de 160 caracteres (${w.descricao.length})`);
    if (!existsSync(join(contentDir, 'imagens', w.imagem))) errors.push(`${w.arquivo}: imagem não encontrada: content/imagens/${w.imagem}`);
  }

  const expected = ['index.html', '404.html', 'style.css', 'sitemap.xml', 'robots.txt', 'feed.xml', 'sobre/index.html'];
  const pages = paginate(works, config.porPagina);
  for (let n = 2; n <= pages.length; n++) expected.push(`pagina/${n}/index.html`);
  for (const w of works) {
    expected.push(fileFor('', w.path).replace(/^\//, ''));
    for (const s of ['thumb', 'capa', 'og']) expected.push(`imagens/${w.slug}-${s}.jpg`);
  }
  for (const e of expected) if (!existsSync(join(outDir, e))) errors.push(`saída desatualizada: falta ${e}`);

  const sitemap = join(outDir, 'sitemap.xml');
  if (existsSync(sitemap)) {
    const locs = [...readFileSync(sitemap, 'utf8').matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]).sort();
    const want = [...pages.map((_, i) => listPath(i + 1)), '/sobre/', ...works.map((w) => w.path)]
      .map((p) => config.url.replace(/\/+$/, '') + p).sort();
    if (JSON.stringify(locs) !== JSON.stringify(want)) errors.push('sitemap.xml não confere com as páginas geradas');
  }

  const base = basePath(config);
  if (existsSync(outDir)) {
    for (const file of walk(outDir).filter((f) => f.endsWith('.html'))) {
      const html = readFileSync(file, 'utf8');
      for (const [, link] of html.matchAll(/(?:href|src)="(\/[^"#?]*)/g)) {
        if (link.startsWith('//')) { errors.push(`${file}: link inválido ${link}`); continue; }
        if (base && !link.startsWith(`${base}/`) && link !== base) { errors.push(`${file}: link sem caminho-base ${link}`); continue; }
        const rel = link.slice(base.length);
        if (!existsSync(fileFor(outDir, rel))) errors.push(`${file}: link quebrado ${link}`);
      }
    }
  }
  return errors;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = process.cwd();
  const errors = await validate({ root, contentDir: join(root, 'content'), outDir: join(root, 'docs') });
  if (errors.length) {
    console.error(errors.join('\n'));
    process.exit(1);
  }
  console.log('validação ok');
}
