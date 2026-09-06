const { OrderTransitionService } = require('./src/services/OrderTransitionService.ts');
require('ts-node').register();

async function testTransition() {
  try {
    const { OrderTransitionService } = require('./src/services/OrderTransitionService');
    await OrderTransitionService.transitionState({
      orderId: 'cmtlvf3zi00244gu3souzrioi',
      action: 'send-quote',
      actorId: 'usr_admin',
      appRole: 'ADMIN',
      branchId: 'branch_123',
      discount: 50,
      basePrice: 1000
    });
    console.log("Success");
  } catch (e) {
    console.error("Error:", e);
  }
}
testTransition();
