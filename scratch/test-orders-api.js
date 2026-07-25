const https = require('https');

https.get({
  hostname: 'gopal-cake-shop-prototype.onrender.com',
  port: 443,
  path: '/api/v1/orders?limit=50',
  headers: {
    'Cookie': 'gopal_dummy_role=manager'
  }
}, res => {
  let raw = '';
  res.on('data', c => raw += c);
  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    const json = JSON.parse(raw);
    console.log('API Response Success:', json.success);
    console.log('Orders Count Returned:', json.data ? json.data.length : 0);
    if (json.data && json.data.length > 0) {
      console.log('First 3 Orders:', json.data.slice(0, 3).map(o => ({
        id: o.id,
        orderNumber: o.orderNumber,
        customerName: o.customerName,
        branch: o.branch,
        status: o.status,
        grandTotal: o.grandTotal
      })));
    }
  });
});
