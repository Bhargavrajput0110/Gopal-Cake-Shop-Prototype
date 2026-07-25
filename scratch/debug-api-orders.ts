import 'dotenv/config'
import { OrderService } from '../src/services/OrderService'

async function main() {
  console.log('--- Testing OrderService.listOrders with (khanderao, MANAGER) ---')
  const res1 = await OrderService.listOrders('khanderao', 'MANAGER', 1, 50, {})
  console.log('Result count (MANAGER):', res1.total, 'Orders length:', res1.data.length)
  if (res1.data.length > 0) {
    console.log('Sample Order:', res1.data[0])
  }

  console.log('\n--- Testing OrderService.listOrders with (null, ADMIN) ---')
  const res2 = await OrderService.listOrders(null, 'ADMIN', 1, 50, {})
  console.log('Result count (ADMIN):', res2.total, 'Orders length:', res2.data.length)
  if (res2.data.length > 0) {
    console.log('Sample Order (ADMIN):', res2.data[0])
  }
}

main().catch(console.error)
