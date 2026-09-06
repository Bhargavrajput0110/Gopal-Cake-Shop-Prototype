import { OrderService } from './services/OrderService';

async function testFetchOrder() {
  try {
    const res = await OrderService.listOrders(undefined, 'SALES', 1, 10, { search: 'ORD-1788460860633-C867' });
    if (res.data.length > 0) {
      const order = res.data[0];
      console.log(JSON.stringify(order, null, 2));
    } else {
      console.log("Order not found");
    }
  } catch(e) {
    console.error(e);
  }
}
testFetchOrder();
