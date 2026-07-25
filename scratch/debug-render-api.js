require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local', override: true });

async function testApi() {
  // Test with dummy role cookie
  const res1 = await fetch('https://gopal-cake-shop-prototype.onrender.com/api/v1/orders?page=1&limit=3', {
    headers: {
      'Cookie': 'gopal_dummy_role=MANAGER',
      'Accept': 'application/json'
    }
  });
  console.log('Status (MANAGER cookie):', res1.status, res1.headers.get('content-type'));
  console.log('Body:', (await res1.text()).slice(0, 800));
}

testApi().catch(console.error);
