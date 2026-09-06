async function test() {
  const req = await fetch('http://localhost:3000/api/v1/orders/cmtlvf3zi00244gu3souzrioi/edit', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'x-app-role': 'SALES', 'x-branch-id': 'branch_123', 'Cookie': 'next-auth.session-token=mock' },
    body: JSON.stringify({
      totalAmount: 1000,
      pendingBalance: 1000
    })
  });
  console.log(req.status);
  console.log(await req.text());
}
test();
