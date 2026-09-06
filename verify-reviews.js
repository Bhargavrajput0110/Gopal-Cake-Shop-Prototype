require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

async function main() {
  const connectionString = process.env.DATABASE_URL;
  const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log("=== PHASE 3 VERIFICATION ===");

  // 1. Check if there are any reviews in DB
  const reviewCount = await prisma.review.count();
  console.log(`[Verification] Total Reviews in DB: ${reviewCount}`);

  if (reviewCount > 0) {
    const sampleReview = await prisma.review.findFirst({
      include: {
        customer: { select: { name: true } },
        order: { select: { items: { select: { productName: true }, take: 1 } } }
      }
    });

    console.log(`[Verification] Sample Review fields:`);
    console.log(`- Rating: ${sampleReview.rating}`);
    console.log(`- Status: ${sampleReview.status}`);
    console.log(`- Feedback: ${sampleReview.feedback}`);
    console.log(`- Customer: ${sampleReview.customer?.name}`);
    
    const items = sampleReview.order?.items || [];
    const productName = items.length > 0 ? items[0].productName : 'Unknown Product';
    console.log(`- Product: ${productName}`);

    // Update test
    await prisma.review.update({
      where: { id: sampleReview.id },
      data: { status: 'APPROVED' }
    });
    console.log(`[Verification] Successfully tested status mutation to APPROVED`);
  } else {
    console.log(`[Verification] Database has 0 reviews. Schema exists but data is empty.`);
  }

  await prisma.$disconnect();
}

main().catch(console.error);
