import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

/**
 * Optimizes an uploaded buffer into modern WebP format
 * Drastically improves transmission speeds and reduces storage footprint by ~70-80%
 */
export async function processAndSaveWebP(
  buffer: Buffer,
  subFolder: string = 'general',
  quality: number = 85
): Promise<{ relativePath: string; fullPath: string }> {
  const uploadsDir = path.join(process.cwd(), 'uploads', subFolder);
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.webp`;
  const fullPath = path.join(uploadsDir, fileName);

  await sharp(buffer)
    .webp({ quality, effort: 4 })
    .toFile(fullPath);

  const relativePath = `/uploads/${subFolder}/${fileName}`;
  return { relativePath, fullPath };
}
