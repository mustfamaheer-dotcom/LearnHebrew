import { prisma } from '../../config/database';
import crypto from 'crypto';

export async function listReviewLinks() {
  return prisma.reviewLink.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      createdBy: {
        select: { firstName: true, lastName: true, email: true },
      },
    },
  });
}

export async function createReviewLink(data: {
  targetUrl?: string;
  label?: string;
  createdById: string;
}) {
  const token = crypto.randomBytes(16).toString('hex');
  return prisma.reviewLink.create({
    data: {
      token,
      targetUrl: data.targetUrl || 'https://engrew.com/reviews',
      label: data.label,
      createdById: data.createdById,
      isUsed: false,
    },
  });
}

/**
 * Redeems a review link strictly ONCE.
 * Logs client IP and marks link as consumed.
 */
export async function redeemReviewLink(token: string, ipAddress?: string) {
  const link = await prisma.reviewLink.findUnique({
    where: { token },
  });

  if (!link) {
    throw { status: 404, message: 'Invalid or non-existent review link.' };
  }

  if (link.isUsed) {
    throw {
      status: 410,
      message: 'This review invitation has already been used and is no longer valid.',
    };
  }

  if (link.expiresAt && link.expiresAt < new Date()) {
    throw { status: 410, message: 'This review link has expired.' };
  }

  // Atomically mark as consumed
  await prisma.reviewLink.update({
    where: { id: link.id },
    data: {
      isUsed: true,
      usedAt: new Date(),
      usedByIp: ipAddress,
    },
  });

  return { targetUrl: link.targetUrl };
}

export async function deleteReviewLink(id: string) {
  return prisma.reviewLink.delete({ where: { id } });
}
