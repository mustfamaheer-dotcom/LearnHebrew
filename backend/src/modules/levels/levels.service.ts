import { prisma } from '../../config/database';
import { getCachedOrFetch, cacheInvalidatePrefix } from '../../lib/cache';

export async function listLevels() {
  return getCachedOrFetch('levels:all', 300, async () => {
    return prisma.level.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { students: true, games: true, levelExams: true },
        },
      },
    });
  });
}

export async function createLevel(data: {
  code: string;
  labelEn: string;
  labelHe: string;
  sortOrder: number;
  color?: string;
  description?: string;
}) {
  const level = await prisma.level.create({
    data: {
      code: data.code.trim().toUpperCase(),
      labelEn: data.labelEn.trim(),
      labelHe: data.labelHe.trim(),
      sortOrder: Number(data.sortOrder),
      color: data.color || '#3B82F6',
      description: data.description,
    },
  });
  await cacheInvalidatePrefix('levels:');
  return level;
}

export async function updateLevel(
  id: string,
  data: {
    labelEn?: string;
    labelHe?: string;
    sortOrder?: number;
    color?: string;
    description?: string;
    isActive?: boolean;
  }
) {
  const level = await prisma.level.update({
    where: { id },
    data,
  });
  await cacheInvalidatePrefix('levels:');
  return level;
}

export async function deleteLevel(id: string) {
  // Check if students or games are linked
  const count = await prisma.student.count({ where: { levelId: id } });
  if (count > 0) {
    throw { status: 400, message: `Cannot delete level: ${count} students are currently assigned to it. Deactivate instead.` };
  }
  const deleted = await prisma.level.delete({ where: { id } });
  await cacheInvalidatePrefix('levels:');
  return deleted;
}
