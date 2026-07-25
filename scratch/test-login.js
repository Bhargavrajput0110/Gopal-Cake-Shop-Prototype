const https = require('https');

const RENDER_BASE = 'https://gopal-cake-shop-prototype.onrender.com';

function getPage(url, cookieHeader) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    https.get({
      hostname: u.hostname,
      port: 443,
      path: u.pathname,
      headers: {
        'Host': 'gopal-cake-shop-prototype.onrender.com',
        'X-Forwarded-Proto': 'https',
        'Cookie': cookieHeader
      }
    }, res => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: raw }));
    }).on('error', reject);
  });
}

async function testRoleCookie() {
  console.log('Testing /sales with gopal_dummy_role cookie...');
  const res = await getPage(`${RENDER_BASE}/sales`, 'gopal_dummy_role=manager');
  console.log('/sales Status Code:', res.status);
  console.log('/sales Location Header:', res.headers.location || 'Direct 200 OK ✅');
}

testRoleCookie().catch(console.error);
