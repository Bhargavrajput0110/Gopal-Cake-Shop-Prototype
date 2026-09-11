/**
 * Full login flow test with proper CSRF cookie handling
 */
process.env.SKIP_ENV_VALIDATION = 'true';
import { prisma } from '../src/lib/prisma';

const BASE = 'https://gopalcakeshop.com';

async function testLogin(userId: string, pin: string, name: string) {
  console.log(`\n🔑 Testing login for: ${name} (${userId}), PIN: ${pin}`);

  // Step 1: Get CSRF token AND its cookie
  const csrfRes = await fetch(`${BASE}/api/auth/csrf`);
  const csrfData = await csrfRes.json() as any;
  const csrfToken = csrfData.csrfToken;
  
  // Extract all cookies from the CSRF response
  const setCookieHeader = csrfRes.headers.get('set-cookie') || '';
  // Parse cookies into a single Cookie header string
  const cookieStr = setCookieHeader
    .split(',')
    .map((c: string) => c.split(';')[0].trim())
    .join('; ');

  console.log('CSRF token:', csrfToken ? '✅' : '❌ missing');
  console.log('Cookies captured:', cookieStr.substring(0, 100));

  // Step 2: POST credentials with the CSRF cookie properly set
  const signinRes = await fetch(`${BASE}/api/auth/signin/credentials`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': cookieStr,
    },
    body: new URLSearchParams({
      id: userId,
      pin: pin,
      csrfToken: csrfToken,
      callbackUrl: `${BASE}/sales`,
    }).toString(),
    redirect: 'manual',
  });

  const location = signinRes.headers.get('location') || '';
  console.log('Signin status:', signinRes.status);
  console.log('Redirect location:', location);

  if (location.includes('onrender.com')) {
    console.log('❌ STILL REDIRECTING TO RENDER!');
  } else if (location.includes('error')) {
    console.log('❌ Login error!');
  } else if (location.includes('gopalcakeshop.com') || location.startsWith('/')) {
    console.log('✅ Redirecting to correct domain!');
    
    // Step 3: Follow the callback URL
    const callbackCookies = [...setCookieHeader.split(','), ...(signinRes.headers.get('set-cookie') || '').split(',')]
      .map((c: string) => c.split(';')[0].trim())
      .join('; ');
    
    const callbackRes = await fetch(location, {
      headers: { 'Cookie': callbackCookies },
      redirect: 'manual',
    });
    console.log('Callback status:', callbackRes.status);
    console.log('Final redirect:', callbackRes.headers.get('location'));
  }
}

async function main() {
  const sanket = await prisma.user.findFirst({
    where: { name: { contains: 'Sanket', mode: 'insensitive' } },
    select: { id: true, name: true, phone: true }
  });

  if (!sanket?.phone) {
    console.log('No Sanket user found with phone');
    await prisma.$disconnect();
    return;
  }

  const pin = sanket.phone.replace(/\D/g, '').slice(-4);
  await testLogin(sanket.id, pin, sanket.name);
  await prisma.$disconnect();
}

main().catch(console.error);
