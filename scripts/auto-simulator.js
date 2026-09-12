const sleep = ms => new Promise(res => setTimeout(res, ms));

async function pollOrders() {
  console.log("==========================================================");
  console.log("🤖 AUTO-SIMULATOR IS RUNNING IN THE BACKGROUND 🤖");
  console.log("Waiting for new orders on the storefront... Go order a cake!");
  console.log("==========================================================");

  while (true) {
    try {
      const response = await fetch('http://localhost:3030/api/v1/debug-simulate');
      const data = await response.json();
      
      if (data.success && data.message !== 'No NEW orders found to simulate.') {
        console.log(`\n🎉 New order detected!`);
        console.log(`🚀 Dispatching automated bakery staff: ${data.message}`);
      }
    } catch (err) {
      // API might be down or restarting, ignore
    }
    
    // Check every 5 seconds
    await sleep(5000);
  }
}

pollOrders().catch(console.error);
