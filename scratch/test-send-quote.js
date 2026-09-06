async function test() {
  try {
    const req = await fetch('http://localhost:3000/api/v1/orders/cmtlvf3zi00244gu3souzrioi/actions/send-quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-app-role': 'SALES', 'x-branch-id': 'branch_123' },
      body: JSON.stringify({
        discount: 50,
        basePrice: 1000
      })
    });
    console.log("Status:", req.status);
    console.log("Response:", await req.text());
  } catch (e) {
    console.error("Fetch failed:", e);
  }
}
test();
