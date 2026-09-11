import 'dotenv/config';
import { outboxProcessor } from '../src/services/event-bus/OutboxProcessor';
import { registerSubscribers } from '../src/services/event-bus/EventSubscribers';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: { url: 'postgresql://postgres.llxzjblybaojugfunnxv:Rishi%409712632132@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true' }
  }
});
process.env.DATABASE_URL = 'postgresql://postgres.llxzjblybaojugfunnxv:Rishi%409712632132@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true';

async function run() {
  console.log('Targeting resend events directly...');
  registerSubscribers();

  const myEvents = await prisma.outbox.findMany({
    where: {
      eventId: { startsWith: 'resend_' },
      status: 'PENDING'
    }
  });

  console.log(`Found ${myEvents.length} targeted events.`);

  for (const ev of myEvents) {
    try {
      console.log(`Processing ${ev.eventId}...`);
      await outboxProcessor.processEvent(ev);
      await prisma.outbox.update({
        where: { id: ev.id },
        data: { status: 'PROCESSED', processedAt: new Date() }
      });
      console.log(`✅ Processed ${ev.eventId}`);
    } catch (e: any) {
      console.error(`❌ Failed ${ev.eventId}:`, e.message);
    }
  }

  await prisma.$disconnect();
}

run().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
