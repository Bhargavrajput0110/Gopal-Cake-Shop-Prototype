const dotenv = require('dotenv');
dotenv.config({ path: '.env.vercel.prod' });
dotenv.config({ path: '.env', override: true });
process.env.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || 'a_very_long_secret_32_characters_min_length_12345';
process.env.DISTANCE_PROVIDER = 'manual';

const { OrderService } = require('../src/services/OrderService');

async function main() {
  const result = await OrderService.listOrders('uma', 'CHEF', 1, 500, {});
  const queue = result.data
    .filter((o: any) => o.status === "WAITING_FOR_CHEF")
    .sort((a: any, b: any) => new Date(a.timeTarget).getTime() - new Date(b.timeTarget).getTime());

  console.log(`Total items in QUEUE: ${queue.length}`);
  queue.forEach((o: any, idx: number) => {
    const ticketNum = o.orderNumber ? o.orderNumber.split('-').pop() : o.id.slice(-6);
    console.log(`Position #${idx + 1}: Ticket #${ticketNum} (${o.orderNumber}) | Target: ${new Date(o.timeTarget).toLocaleTimeString()} | Customer: ${o.customerName}`);
  });
}

main().catch(console.error);
