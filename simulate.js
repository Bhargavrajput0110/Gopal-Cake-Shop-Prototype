const orderId = "WAS-10204";
const baseUrl = "http://localhost:3000/api/orders";

async function transition(status, actorName, actorId, branchId) {
  console.log(`Transitioning ${orderId} to '${status}'...`);
  const res = await fetch(`${baseUrl}/${orderId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, actorName, actorId, branchId })
  });
  
  const data = await res.json();
  if (!res.ok) {
    console.error(`Error transitioning to ${status}:`, data);
  } else {
    console.log(`Success: ${orderId} is now ${status}`);
  }
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runSimulation() {
  console.log("Starting AI Bakery Simulation...");
  
  // 1. Chef accepts
  await transition("accepted_by_chef", "AI Chef Agent", "AI-CHEF", "Varasiya Factory Outlet");
  await sleep(4000); // Wait 4 seconds for user to see it move in UI
  
  // 2. Chef starts baking
  await transition("baking", "AI Chef Agent", "AI-CHEF", "Varasiya Factory Outlet");
  await sleep(4000);
  
  // 3. Chef starts decorating
  await transition("decorating", "AI Chef Agent", "AI-CHEF", "Varasiya Factory Outlet");
  await sleep(4000);
  
  // 4. Chef marks as ready
  await transition("ready_for_pickup", "AI Chef Agent", "AI-CHEF", "Varasiya Factory Outlet");
  await sleep(4000);

  // 5. Driver assigns to self
  console.log(`Driver assigning ${orderId} to self...`);
  const assignRes = await fetch(`${baseUrl}/${orderId}/assign`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ driverId: "AI-DRV", driverName: "AI Delivery Agent", branchId: "Varasiya Factory Outlet" })
  });
  const assignData = await assignRes.json();
  if (assignRes.ok) console.log(`Success: Driver assigned.`);
  else console.error(`Error assigning driver:`, assignData);
  
  await sleep(4000);

  // 6. Driver marks on the way
  await transition("on_the_way", "AI Delivery Agent", "AI-DRV", "Varasiya Factory Outlet");
  
  console.log("Simulation complete! The user should have seen the UI update in real-time.");
}

runSimulation();
