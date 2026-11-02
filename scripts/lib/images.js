import { mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

export async function processImage(srcFile, slug, outDir) {
  if (!existsSync(srcFile)) throw new Error(`imagem não encontrada: ${srcFile}`);
  const dir = join(outDir, 'imagens');
  mkdirSync(dir, { recursive: true });
  const result = {
    thumb: `imagens/${slug}-thumb.jpg`,
    capa: `imagens/${slug}-capa.jpg`,
    og: `imagens/${slug}-og.jpg`,
  };
  const jpeg = { quality: 82, mozjpeg: true };
  const src = () => sharp(srcFile).rotate();
  await src().resize(192, 192, { fit: 'cover' }).jpeg(jpeg).toFile(join(outDir, result.thumb));
  await src().resize({ width: 960, withoutEnlargement: true }).jpeg(jpeg).toFile(join(outDir, result.capa));
  await src().resize(1200, 630, { fit: 'cover' }).jpeg(jpeg).toFile(join(outDir, result.og));
  return result;
}

export async function imageSize(file) {
  const { width, height } = await sharp(file).metadata();
  return { width, height };
}
