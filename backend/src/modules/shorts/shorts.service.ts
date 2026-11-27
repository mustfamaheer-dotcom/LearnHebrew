import { prisma } from '../../config/database';

export function extractGoogleDriveId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

export function formatGoogleDriveThumbnail(driveId: string): string {
  return `https://drive.google.com/thumbnail?id=${driveId}&sz=w1000`;
}

const LEVEL_TO_CEFR: Record<string, string> = {
  BEGINNER: 'A1',
  ELEMENTARY: 'A2',
  INTERMEDIATE: 'B1',
  UPPER_INTERMEDIATE: 'B2',
  ADVANCED: 'C1',
  FLUENT: 'C2',
};

export async function listActiveShorts(params: { levelCode?: string; languageTrack?: string; userId?: string }) {
  const where: any = { isActive: true };

  const conditions: any[] = [];

  // Filter by Level (supporting multi-level array levelCodes and levelCode)
  if (params.levelCode && params.levelCode.toUpperCase() !== 'ALL') {
    const raw = params.levelCode.toUpperCase();
    const mapped = LEVEL_TO_CEFR[raw] || raw;
    conditions.push({
      OR: [
        { levelCode: mapped },
        { levelCode: raw },
        { levelCode: 'ALL' },
        { levelCode: null },
        { levelCodes: { hasSome: [mapped, raw, 'ALL'] } },
        { levelCodes: { isEmpty: true } },
      ],
    });
  }

  // Filter by Language Track (AR_HE, HE_EN, AR_EN, ALL)
  if (params.languageTrack && params.languageTrack.toUpperCase() !== 'ALL') {
    const track = params.languageTrack.toUpperCase();
    conditions.push({
      OR: [
        { languageTrack: track },
        { languageTrack: 'ALL' },
        { languageTrack: null },
      ],
    });
  }

  if (conditions.length > 0) {
    where.AND = conditions;
  }

  const shorts = await prisma.practiceShort.findMany({
    where,
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    include: {
      level: { select: { id: true, code: true, labelEn: true, labelHe: true } },
      interactions: params.userId
        ? {
            where: { userId: params.userId },
            select: { isLiked: true, isSaved: true },
          }
        : false,
    },
  });

  return shorts.map((s: any) => ({
    ...s,
    isLiked: s.interactions?.[0]?.isLiked || false,
    isSaved: s.interactions?.[0]?.isSaved || false,
    interactions: undefined,
  }));
}

export async function listAdminShorts() {
  return prisma.practiceShort.findMany({
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    include: {
      level: { select: { id: true, code: true, labelEn: true, labelHe: true } },
      createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  });
}

export async function createShort(data: {
  title: string;
  titleHe?: string;
  titleAr?: string;
  description?: string;
  descriptionHe?: string;
  descriptionAr?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  levelId?: string | null;
  levelCode?: string | null;
  levelCodes?: string[];
  languageTrack?: string;
  durationSeconds?: number;
  sortOrder?: number;
  isActive?: boolean;
  tags?: string[];
  createdById?: string | null;
}) {
  const driveId = extractGoogleDriveId(data.videoUrl);
  let finalThumbnail = data.thumbnailUrl;
  if (!finalThumbnail && driveId) {
    finalThumbnail = formatGoogleDriveThumbnail(driveId);
  }

  let finalLevelCodes = (data.levelCodes || []).map((c) => c.toUpperCase());
  if (finalLevelCodes.length === 0 && data.levelCode) {
    finalLevelCodes = [data.levelCode.toUpperCase()];
  }
  let resolvedLevelCode = data.levelCode;
  if (!resolvedLevelCode && finalLevelCodes.length > 0) {
    resolvedLevelCode = finalLevelCodes[0];
  }

  return prisma.practiceShort.create({
    data: {
      title: data.title,
      titleHe: data.titleHe,
      titleAr: data.titleAr,
      description: data.description,
      descriptionHe: data.descriptionHe,
      descriptionAr: data.descriptionAr,
      videoUrl: data.videoUrl,
      googleDriveId: driveId,
      thumbnailUrl: finalThumbnail,
      levelId: data.levelId || null,
      levelCode: resolvedLevelCode ? resolvedLevelCode.toUpperCase() : 'ALL',
      levelCodes: finalLevelCodes,
      languageTrack: data.languageTrack ? data.languageTrack.toUpperCase() : 'ALL',
      durationSeconds: data.durationSeconds || 0,
      sortOrder: data.sortOrder || 0,
      isActive: data.isActive !== undefined ? data.isActive : true,
      tags: data.tags || [],
      createdById: data.createdById || null,
    },
    include: {
      level: true,
    },
  });
}

export async function updateShort(
  id: string,
  data: {
    title?: string;
    titleHe?: string;
    titleAr?: string;
    description?: string;
    descriptionHe?: string;
    descriptionAr?: string;
    videoUrl?: string;
    thumbnailUrl?: string;
    levelId?: string | null;
    levelCode?: string | null;
    levelCodes?: string[];
    languageTrack?: string;
    durationSeconds?: number;
    sortOrder?: number;
    isActive?: boolean;
    tags?: string[];
  }
) {
  let driveId = undefined;
  if (data.videoUrl) {
    driveId = extractGoogleDriveId(data.videoUrl);
  }

  let finalLevelCodes = data.levelCodes ? data.levelCodes.map((c) => c.toUpperCase()) : undefined;
  let resolvedLevelCode = data.levelCode;
  if (finalLevelCodes && finalLevelCodes.length > 0 && !resolvedLevelCode) {
    resolvedLevelCode = finalLevelCodes[0];
  }

  return prisma.practiceShort.update({
    where: { id },
    data: {
      ...data,
      googleDriveId: driveId !== undefined ? driveId : undefined,
      levelCode: resolvedLevelCode !== undefined ? (resolvedLevelCode ? resolvedLevelCode.toUpperCase() : 'ALL') : undefined,
      levelCodes: finalLevelCodes,
      languageTrack: data.languageTrack !== undefined ? (data.languageTrack ? data.languageTrack.toUpperCase() : 'ALL') : undefined,
    },
    include: {
      level: true,
    },
  });
}

export async function deleteShort(id: string) {
  return prisma.practiceShort.delete({ where: { id } });
}

export async function reorderShorts(items: { id: string; sortOrder: number }[]) {
  return prisma.$transaction(
    items.map((item) =>
      prisma.practiceShort.update({
        where: { id: item.id },
        data: { sortOrder: item.sortOrder },
      })
    )
  );
}

export async function interactWithShort(
  shortId: string,
  userId: string,
  action: { isLiked?: boolean; isSaved?: boolean; watchedSeconds?: number }
) {
  const existing = await prisma.shortInteraction.findUnique({
    where: { shortId_userId: { shortId, userId } },
  });

  let likeDiff = 0;
  if (action.isLiked !== undefined) {
    const prevLiked = existing?.isLiked || false;
    if (action.isLiked && !prevLiked) likeDiff = 1;
    if (!action.isLiked && prevLiked) likeDiff = -1;
  }

  const interaction = await prisma.shortInteraction.upsert({
    where: { shortId_userId: { shortId, userId } },
    create: {
      shortId,
      userId,
      isLiked: action.isLiked || false,
      isSaved: action.isSaved || false,
      watchTime: action.watchedSeconds || 0,
    },
    update: {
      isLiked: action.isLiked !== undefined ? action.isLiked : undefined,
      isSaved: action.isSaved !== undefined ? action.isSaved : undefined,
      watchTime:
        action.watchedSeconds !== undefined
          ? (existing?.watchTime || 0) + action.watchedSeconds
          : undefined,
      watchedAt: new Date(),
    },
  });

  if (likeDiff !== 0) {
    await prisma.practiceShort.update({
      where: { id: shortId },
      data: { likeCount: { increment: likeDiff } },
    });
  }

  return interaction;
}

export async function incrementViewCount(shortId: string) {
  return prisma.practiceShort.update({
    where: { id: shortId },
    data: { viewCount: { increment: 1 } },
  });
}
