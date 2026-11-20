import { prisma } from '../../config/database';
import crypto from 'crypto';

export async function listReviewLinks() {
  return prisma.reviewLink.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      createdBy: {
        select: { firstName: true, lastName: true, email: true },
      },
      submissions: {
        orderBy: { createdAt: 'desc' },
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
      usageCount: 0,
    },
  });
}

/**
 * Validates and accesses a review link.
 * Permissive and reusable: does NOT lock users out or throw 410 on multiple visits.
 */
export async function redeemReviewLink(token: string, ipAddress?: string) {
  const link = await prisma.reviewLink.findUnique({
    where: { token },
    include: {
      submissions: {
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
    },
  });

  if (!link) {
    throw { status: 404, message: 'Invalid or non-existent review link.' };
  }

  if (link.expiresAt && link.expiresAt < new Date()) {
    throw { status: 410, message: 'This review link has expired.' };
  }

  // Update telemetry without locking the link out
  const updated = await prisma.reviewLink.update({
    where: { id: link.id },
    data: {
      isUsed: true,
      usedAt: new Date(),
      usedByIp: ipAddress,
      usageCount: { increment: 1 },
    },
  });

  return {
    valid: true,
    token: link.token,
    label: link.label || 'Verified Academy Review Invitation',
    targetUrl: link.targetUrl,
    usageCount: updated.usageCount,
    submissionsCount: link.submissions.length,
    recentSubmissions: link.submissions,
  };
}

/**
 * Submits a verified review through this review link.
 */
export async function submitReviewLink(
  token: string,
  data: {
    reviewerName?: string;
    reviewerEmail?: string;
    rating?: number;
    teachingRating?: number;
    platformRating?: number;
    title?: string;
    comment?: string;
    recommend?: boolean;
    allowPublicShare?: boolean;
  },
  ipAddress?: string
) {
  const link = await prisma.reviewLink.findUnique({
    where: { token },
  });

  if (!link) {
    throw { status: 404, message: 'Invalid or non-existent review link.' };
  }

  if (link.expiresAt && link.expiresAt < new Date()) {
    throw { status: 410, message: 'This review link has expired.' };
  }

  const submission = await prisma.reviewSubmission.create({
    data: {
      reviewLinkId: link.id,
      reviewerName: data.reviewerName?.trim() || 'Verified Student',
      reviewerEmail: data.reviewerEmail?.trim() || null,
      rating: Math.min(5, Math.max(1, Number(data.rating) || 5)),
      teachingRating: Math.min(5, Math.max(1, Number(data.teachingRating) || 5)),
      platformRating: Math.min(5, Math.max(1, Number(data.platformRating) || 5)),
      title: data.title?.trim() || null,
      comment: data.comment?.trim() || null,
      recommend: data.recommend !== undefined ? Boolean(data.recommend) : true,
      allowPublicShare: data.allowPublicShare !== undefined ? Boolean(data.allowPublicShare) : true,
      ipAddress: ipAddress || null,
    },
  });

  await prisma.reviewLink.update({
    where: { id: link.id },
    data: {
      isUsed: true,
      usedAt: new Date(),
      usedByIp: ipAddress,
    },
  });

  return {
    success: true,
    message: 'Thank you! Your verified review has been submitted successfully.',
    submissionId: submission.id,
    targetUrl: link.targetUrl,
  };
}

export async function deleteReviewLink(id: string) {
  return prisma.reviewLink.delete({ where: { id } });
}
