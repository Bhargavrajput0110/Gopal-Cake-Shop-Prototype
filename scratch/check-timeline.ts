import { prisma } from '../src/lib/prisma';

async function run() {
  const events = await prisma.timeline.findMany({
    where: { action: 'complete' },
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  console.log(events.map(e => ({ id: e.id, action: e.action, nextState: e.nextState, createdAt: e.createdAt })));
}
run().catch(console.error).finally(() => process.exit(0));
