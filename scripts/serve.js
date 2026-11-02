import http from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { loadConfig, basePath } from './lib/config.js';

const TIPOS = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.jpg': 'image/jpeg', '.xml': 'application/xml', '.txt': 'text/plain' };
const root = process.cwd();
const out = join(root, 'docs');
const base = basePath(loadConfig(join(root, 'site.config.json')));
const port = Number(process.env.PORT) || 8080;

http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  if (!url.startsWith(`${base}/`) && url !== base) {
    res.writeHead(404);
    return res.end(`Fora do caminho-base. Use ${base}/`);
  }
  let file = join(out, url.slice(base.length) || '/');
  if (!file.startsWith(out)) { res.writeHead(403); return res.end(); }
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
  if (!existsSync(file)) {
    res.writeHead(404, { 'content-type': TIPOS['.html'] });
    return res.end(readFileSync(join(out, '404.html')));
  }
  res.writeHead(200, { 'content-type': TIPOS[extname(file)] || 'application/octet-stream' });
  res.end(readFileSync(file));
}).listen(port, () => console.log(`http://localhost:${port}${base}/`));
