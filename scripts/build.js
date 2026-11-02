import { mkdirSync, writeFileSync, readFileSync, rmSync, existsSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadConfig } from './lib/config.js';
import { loadWorks } from './lib/content.js';
import { paginate, listPath, renderListPage, renderWorkPage, renderAboutPage, render404 } from './lib/pages.js';
import { buildSitemap, buildRobots, buildFeed } from './lib/seo.js';
import { processImage, imageSize } from './lib/images.js';

const STYLE = fileURLToPath(new URL('../site/style.css', import.meta.url));

function write(outDir, rel, content) {
  const file = join(outDir, rel);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content);
}

const dirOf = (path) => `${path.replace(/^\/|\/$/g, '')}/index.html`;

export async function build({ root, contentDir, outDir }) {
  const config = loadConfig(join(root, 'site.config.json'));
  const works = loadWorks(contentDir);
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });

  const pages = paginate(works, config.porPagina);
  pages.forEach((list, i) => {
    const n = i + 1;
    write(outDir, n === 1 ? 'index.html' : dirOf(listPath(n)), renderListPage(config, list, n, pages.length));
  });

  for (let i = 0; i < works.length; i++) {
    const w = works[i];
    const imgs = await processImage(join(contentDir, 'imagens', w.imagem), w.slug, outDir);
    const size = await imageSize(join(outDir, imgs.capa));
    write(outDir, dirOf(w.path), renderWorkPage(config, w, works[i + 1] || null, works[i - 1] || null, size));
  }

  const sobre = join(contentDir, 'sobre.md');
  write(outDir, dirOf('/sobre/'), renderAboutPage(config, existsSync(sobre) ? readFileSync(sobre, 'utf8') : ''));
  write(outDir, '404.html', render404(config));
  copyFileSync(STYLE, join(outDir, 'style.css'));
  write(outDir, 'sitemap.xml', buildSitemap(config, works, pages.length));
  write(outDir, 'robots.txt', buildRobots(config));
  write(outDir, 'feed.xml', buildFeed(config, works));
  write(outDir, '.nojekyll', '');
  if (existsSync(join(root, 'CNAME'))) copyFileSync(join(root, 'CNAME'), join(outDir, 'CNAME'));
  return { works: works.length, pages: pages.length };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = process.cwd();
  const r = await build({ root, contentDir: join(root, 'content'), outDir: join(root, 'docs') });
  console.log(`site gerado: ${r.works} obra(s), ${r.pages} página(s) de lista`);
}
