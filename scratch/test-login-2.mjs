const url = 'http://localhost:3000/api/auth/callback/credentials';
fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  redirect: 'manual',
  body: new URLSearchParams({
    id: 'chefKhm',
    pin: '2222',
    redirect: 'false'
  })
}).then(async (res) => {
  console.log('Status:', res.status);
  console.log('Headers:', res.headers);
  const text = await res.text();
  console.log('Body start:', text.substring(0, 100));
}).catch(console.error);
