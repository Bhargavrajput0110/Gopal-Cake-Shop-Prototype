const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/v1/orders',
  method: 'GET',
  headers: {
    'Cookie': 'appRole=ADMIN; branchId=khanderao'
  }
};

const req = http.request(options, res => {
  let data = '';
  res.on('data', chunk => {
    data += chunk;
  });
  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    try {
      const json = JSON.parse(data);
      console.log(JSON.stringify(json, null, 2));
    } catch(e) {
      console.log(data);
    }
  });
});

req.on('error', error => {
  console.error(error);
});

req.end();
