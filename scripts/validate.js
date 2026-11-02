import { readdirSync, readFileSync, existsSync, statSync, mkdtempSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { build } from './build.js';
import { fileURLToPath } from 'node:url';
import { loadConfig, basePath } from './lib/config.js';
import { loadWorks } from './lib/content.js';
import { paginate, listPath, audioPath } from './lib/pages.js';

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
    if (w.audio && !existsSync(join(contentDir, 'audio', w.audio))) errors.push(`${w.arquivo}: áudio não encontrado: content/audio/${w.audio}`);
    if (!existsSync(join(contentDir, 'imagens', w.imagem))) errors.push(`${w.arquivo}: imagem não encontrada: content/imagens/${w.imagem}`);
  }

  const expected = ['index.html', '404.html', 'style.css', 'sitemap.xml', 'robots.txt', 'feed.xml', 'sobre/index.html'];
  const pages = paginate(works, config.porPagina);
  for (let n = 2; n <= pages.length; n++) expected.push(`pagina/${n}/index.html`);
  for (const w of works) {
    expected.push(fileFor('', w.path).replace(/^\//, ''));
    if (w.audio) expected.push(audioPath(w).replace(/^\//, ''));
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
  // só compara com uma geração nova quando o conteúdo está íntegro
  if (!errors.length) errors.push(...await staleOutput({ root, contentDir, outDir }));
  errors.push(...frozenUrls(root, config, outDir));
  return errors;
}

// Gera o site num diretório temporário e compara com a saída publicada.
async function staleOutput({ root, contentDir, outDir }) {
  if (!existsSync(outDir)) return [];
  const tmp = mkdtempSync(join(tmpdir(), 'cq-validate-'));
  try {
    await build({ root, contentDir, outDir: tmp });
    const errors = [];
    for (const file of walk(tmp).filter((f) => !/\.(jpg|mp3|ogg|m4a|wav)$/.test(f))) {
      const rel = relative(tmp, file);
      const atual = join(outDir, rel);
      if (existsSync(atual) && !readFileSync(atual).equals(readFileSync(file))) {
        errors.push(`saída desatualizada (rode npm run build): ${rel}`);
      }
    }
    return errors;
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

// Endereços já publicados (sitemap do último commit) não podem sumir.
function frozenUrls(root, config, outDir) {
  const sitemap = join(outDir, 'sitemap.xml');
  if (!existsSync(sitemap)) return [];
  let anterior;
  try {
    const rel = relative(root, sitemap);
    anterior = execFileSync('git', ['show', `HEAD:${rel}`], { cwd: root, stdio: 'pipe' }).toString();
  } catch {
    return [];
  }
  // cada sitemap tem o seu próprio caminho-base (a 1ª <loc> é sempre a página inicial)
  const caminhos = (xml) => {
    const locs = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
    const base = (locs[0] || '/').replace(/\/+$/, '');
    return locs.map((p) => p.slice(base.length) || '/');
  };
  const agora = new Set(caminhos(readFileSync(sitemap, 'utf8')));
  return caminhos(anterior).filter((p) => !agora.has(p))
    .map((p) => `endereço já publicado desapareceu: ${p} (endereços são congelados; crie um redirecionamento)`);
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
