import { outboxProcessor } from '../src/services/event-bus/OutboxProcessor';
import { registerSubscribers } from '../src/services/event-bus/EventSubscribers';

async function run() {
  console.log('Manually triggering OutboxProcessor to process pending events...');
  registerSubscribers();
  let totalProcessed = 0;
  while (true) {
    const res = await outboxProcessor.poll();
    totalProcessed += res.processed;
    console.log(`Batch complete. Processed: ${res.processed}`);
    if (res.processed === 0) break;
  }
  console.log(`Outbox processing complete. Total processed: ${totalProcessed}`);
}

run().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
