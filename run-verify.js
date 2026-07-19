const fs = require('fs');

async function verify() {
  console.log('Starting verification...');
  try {
    const res = await fetch('http://localhost:3000/api/admin/verify-2f', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const text = await res.text();
    fs.writeFileSync('verify-result.json', text);
    console.log(`Status: ${res.status}`);
    console.log('Response saved to verify-result.json');
    if (!res.ok) {
        console.error('Failed verification');
    }
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

verify();
