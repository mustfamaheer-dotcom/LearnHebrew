import { prisma } from '../../config/database';
import { getCachedOrFetch, cacheInvalidatePrefix } from '../../lib/cache';

export async function listSessionTypes() {
  return getCachedOrFetch('session-types:all', 300, async () => {
    return prisma.sessionType.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { lessons: true, packageItems: true },
        },
      },
    });
  });
}

export async function createSessionType(data: {
  name: string;
  durationMinutes: number;
  labelEn: string;
  labelHe: string;
  sortOrder?: number;
}) {
  const item = await prisma.sessionType.create({
    data: {
      name: data.name.trim(),
      durationMinutes: Number(data.durationMinutes),
      labelEn: data.labelEn.trim(),
      labelHe: data.labelHe.trim(),
      sortOrder: data.sortOrder ? Number(data.sortOrder) : 0,
    },
  });
  await cacheInvalidatePrefix('session-types:');
  return item;
}

export async function updateSessionType(
  id: string,
  data: {
    durationMinutes?: number;
    labelEn?: string;
    labelHe?: string;
    sortOrder?: number;
    isActive?: boolean;
  }
) {
  const item = await prisma.sessionType.update({
    where: { id },
    data,
  });
  await cacheInvalidatePrefix('session-types:');
  return item;
}

export async function deleteSessionType(id: string) {
  const usageCount = await prisma.lesson.count({ where: { sessionTypeId: id } });
  if (usageCount > 0) {
    throw { status: 400, message: `Cannot delete: ${usageCount} sessions have been booked with this type. Deactivate it instead.` };
  }
  const item = await prisma.sessionType.delete({ where: { id } });
  await cacheInvalidatePrefix('session-types:');
  return item;
}
