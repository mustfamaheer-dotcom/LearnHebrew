import { prisma } from '../../config/database';
import { getCachedOrFetch, cacheInvalidatePrefix } from '../../lib/cache';

export async function listLanguages() {
  return getCachedOrFetch('languages:all', 600, async () => {
    return prisma.language.findMany({
      orderBy: { code: 'asc' },
    });
  });
}

export async function createLanguage(data: {
  code: string;
  labelEn: string;
  labelNative: string;
  flagEmoji?: string;
}) {
  const lang = await prisma.language.create({
    data: {
      code: data.code.trim().toLowerCase(),
      labelEn: data.labelEn.trim(),
      labelNative: data.labelNative.trim(),
      flagEmoji: data.flagEmoji || '🌐',
    },
  });
  await cacheInvalidatePrefix('languages:');
  return lang;
}

export async function toggleLanguage(id: string, isActive: boolean) {
  const updated = await prisma.language.update({
    where: { id },
    data: { isActive },
  });
  await cacheInvalidatePrefix('languages:');
  return updated;
}

export async function updateLanguage(
  id: string,
  data: { code?: string; labelEn?: string; labelNative?: string; flagEmoji?: string; isActive?: boolean }
) {
  const updated = await prisma.language.update({
    where: { id },
    data: {
      ...(data.code && { code: data.code.trim().toLowerCase() }),
      ...(data.labelEn && { labelEn: data.labelEn.trim() }),
      ...(data.labelNative && { labelNative: data.labelNative.trim() }),
      ...(data.flagEmoji && { flagEmoji: data.flagEmoji }),
      ...(typeof data.isActive === 'boolean' && { isActive: data.isActive }),
    },
  });
  await cacheInvalidatePrefix('languages:');
  return updated;
}

export async function deleteLanguage(id: string) {
  const deleted = await prisma.language.delete({ where: { id } });
  await cacheInvalidatePrefix('languages:');
  return deleted;
}
