import { prisma } from '../../config/database';
import { PointsEventType } from '@prisma/client';
import { getCachedOrFetch, cacheInvalidatePrefix } from '../../lib/cache';

export async function listPointRules() {
  return getCachedOrFetch('point-rules:all', 300, async () => {
    return prisma.pointRule.findMany({
      orderBy: { eventType: 'asc' },
    });
  });
}

export async function updatePointRule(
  id: string,
  data: { points: number; isActive?: boolean; description?: string },
  updatedById?: string
) {
  const updated = await prisma.pointRule.update({
    where: { id },
    data: {
      points: Number(data.points),
      isActive: data.isActive,
      description: data.description,
      updatedById,
    },
  });
  await cacheInvalidatePrefix('point-rules:');
  return updated;
}
