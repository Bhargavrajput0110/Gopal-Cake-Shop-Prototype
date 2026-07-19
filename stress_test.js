const baseUrl = "http://localhost:3000/api/orders";

async function transition(orderId, status, actorName, actorId, branchId) {
  const res = await fetch(`${baseUrl}/${orderId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, actorName, actorId, branchId })
  });
  return res;
}

async function assignDriver(orderId, driverId, driverName, branchId) {
  const res = await fetch(`${baseUrl}/${orderId}/assign`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ driverId, driverName, branchId })
  });
  return res;
}

async function runTests() {
  console.log("=== RUNNING CHAOS TESTS ===\n");

  // TEST 1: INVALID STATE TRANSITION
  console.log("Test 1: Driver trying to pick up an order that is 'new'");
  const t1 = await transition("UMA-10207", "picked_up_by_driver", "Driver AI", "DRV-1", "Uma Branch");
  console.log(`Status: ${t1.status}. Response: ${JSON.stringify(await t1.json())}\n`);

  // TEST 2: RACE CONDITION (Two drivers grabbing same order at same time)
  console.log("Test 2: Two drivers assigning themselves to UMA-10211 at the exact same millisecond");
  const [driver1, driver2] = await Promise.all([
    assignDriver("UMA-10211", "DRV-A", "Driver A", "Uma Branch"),
    assignDriver("UMA-10211", "DRV-B", "Driver B", "Uma Branch")
  ]);
  console.log(`Driver A Status: ${driver1.status}. Response: ${JSON.stringify(await driver1.json())}`);
  console.log(`Driver B Status: ${driver2.status}. Response: ${JSON.stringify(await driver2.json())}\n`);

  // TEST 3: INVALID DATA (No status provided)
  console.log("Test 3: Sending empty payload to status endpoint");
  const t3 = await fetch(`${baseUrl}/KHM-10201/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({})
  });
  console.log(`Status: ${t3.status}. Response: ${JSON.stringify(await t3.json())}\n`);

  // TEST 4: NON-EXISTENT ORDER
  console.log("Test 4: Modifying an order that doesn't exist");
  const t4 = await transition("FAKE-999", "baking", "AI", "AI", "Branch");
  console.log(`Status: ${t4.status}. Response: ${JSON.stringify(await t4.json())}\n`);
}

runTests();
