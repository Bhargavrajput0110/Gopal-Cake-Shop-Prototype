import { NextResponse } from 'next/server';
import { withApiHandler } from '@/lib/withApiHandler';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const PatchReviewSchema = z.object({
  reviewId: z.string(),
  status: z.enum(['APPROVED', 'HIDDEN', 'PENDING'])
});

export const GET = withApiHandler(async (ctx) => {
  const { appRole } = ctx;

  if (appRole !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const reviews = await prisma.review.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { name: true } },
        order: {
          select: {
            items: {
              select: { productName: true },
              take: 2
            }
          }
        }
      }
    });

    const formattedReviews = reviews.map(r => {
      const items = r.order?.items || [];
      const productName = items.length > 0 
        ? items[0].productName + (items.length > 1 ? ' + more' : '') 
        : 'Unknown Product';

      return {
        id: r.id,
        rating: r.rating,
        comment: r.feedback,
        status: r.status,
        photos: r.photos,
        createdAt: r.createdAt,
        reviewerName: r.customer?.name || 'Anonymous',
        productName
      };
    });

    return NextResponse.json(formattedReviews);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch reviews' }, { status: 500 });
  }
});

export const PATCH = withApiHandler(async (ctx) => {
  const { appRole, req } = ctx;

  if (appRole !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const payload = PatchReviewSchema.parse(body);

    const updatedReview = await prisma.review.update({
      where: { id: payload.reviewId },
      data: { status: payload.status }
    });

    return NextResponse.json({ success: true, review: updatedReview });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to moderate review' }, { status: 500 });
  }
}, true);
