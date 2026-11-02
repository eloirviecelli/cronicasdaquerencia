import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const FIELDS = ['titulo', 'tipo', 'data', 'slug', 'resumo', 'descricao', 'imagem', 'imagem_alt'];
const WORK_FILE = /^\d{4}-\d{2}-.+\.md$/;

export function parseWork(text, arquivo) {
  const m = text.replace(/\r\n/g, '\n').match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) throw new Error(`${arquivo}: front matter ausente`);
  const meta = {};
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(':');
    if (i < 0) continue;
    let value = line.slice(i + 1).trim();
    if (/^(".*"|'.*')$/.test(value)) value = value.slice(1, -1);
    meta[line.slice(0, i).trim()] = value;
  }
  for (const f of FIELDS) {
    if (!meta[f]) throw new Error(`${arquivo}: campo obrigatório ausente: ${f}`);
  }
  if (!['conto', 'cronica'].includes(meta.tipo)) {
    throw new Error(`${arquivo}: tipo inválido "${meta.tipo}" (use conto ou cronica)`);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(meta.data) || Number.isNaN(Date.parse(meta.data))) {
    throw new Error(`${arquivo}: data inválida "${meta.data}" (use AAAA-MM-DD)`);
  }
  const work = { ...meta, markdown: m[2].trim(), arquivo };
  work.path = `/${work.tipo}/${work.slug}/`;
  return work;
}

export function loadWorks(dir) {
  return readdirSync(dir)
    .filter((f) => WORK_FILE.test(f))
    .map((f) => parseWork(readFileSync(join(dir, f), 'utf8'), f))
    .sort((a, b) => b.data.localeCompare(a.data) || a.slug.localeCompare(b.slug));
}
