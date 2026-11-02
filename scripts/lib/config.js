import { readFileSync } from 'node:fs';

const REQUIRED = ['nome', 'frase', 'autor', 'idioma', 'url', 'porPagina'];

export function loadConfig(path) {
  const config = JSON.parse(readFileSync(path, 'utf8'));
  for (const key of REQUIRED) {
    if (config[key] === undefined || config[key] === '') {
      throw new Error(`${path}: campo obrigatório ausente: ${key}`);
    }
  }
  return config;
}

export function basePath(config) {
  return new URL(config.url).pathname.replace(/\/+$/, '');
}

export function href(config, path) {
  return basePath(config) + path;
}

export function absUrl(config, path) {
  return config.url.replace(/\/+$/, '') + path;
}
