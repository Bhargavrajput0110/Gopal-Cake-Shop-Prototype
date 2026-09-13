const dotenv = require('dotenv');
dotenv.config({ path: '.env.vercel.prod' });
dotenv.config({ path: '.env', override: true });
process.env.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || 'a_very_long_secret_32_characters_min_length_12345';
process.env.DISTANCE_PROVIDER = 'manual';

const { OrderService } = require('../src/services/OrderService');

async function main() {
  const result = await OrderService.listOrders('uma', 'CHEF', 1, 500, {});
  console.log(`OrderService returned ${result.data.length} orders (total ${result.total})`);
  
  const f4db = result.data.find((o: any) => o.orderNumber?.includes('F4DB'));
  console.log("Is F4DB in returned list?:", !!f4db);
  if (f4db) {
    console.log("F4DB in API response:", {
      id: f4db.id,
      orderNumber: f4db.orderNumber,
      status: f4db.status,
      branch: f4db.branch,
      timeTarget: f4db.timeTarget
    });
  }
}

main().catch(console.error);
