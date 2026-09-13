const dotenv = require('dotenv');
dotenv.config({ path: '.env.vercel.prod' });
dotenv.config({ path: '.env', override: true });
process.env.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || 'a_very_long_secret_32_characters_min_length_12345';
process.env.DISTANCE_PROVIDER = 'manual';

const { outboxProcessor } = require('../src/services/event-bus/OutboxProcessor');
const { registerSubscribers } = require('../src/services/event-bus/EventSubscribers');

async function main() {
  console.log("Registering subscribers...");
  registerSubscribers();

  console.log("Polling outbox processor...");
  const res = await outboxProcessor.poll();
  console.log("Poll Result:", res);
}

main().catch(console.error);
