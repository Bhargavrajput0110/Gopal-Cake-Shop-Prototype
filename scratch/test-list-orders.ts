const { OrderService } = require('./src/services/OrderService');

async function testListOrders() {
  try {
    console.log("Calling listOrders...");
    const res = await OrderService.listOrders('branch_123', 'SALES', 1, 10, {});
    console.log("Success, got", res.data.length, "orders");
  } catch (err) {
    console.error("Error in listOrders:", err);
  }
}

testListOrders().catch(console.error);
