

const testAccounts = [
  { email: 'admin@gopalcakeshop.com', expectedRole: 'ADMIN', canAccessAdmin: true },
  { email: 'manager@gopalcakeshop.com', expectedRole: 'MANAGER', canAccessAdmin: true },
  { email: 'sales@gopalcakeshop.com', expectedRole: 'SALESPERSON', canAccessAdmin: true },
  { email: 'chef@gopalcakeshop.com', expectedRole: 'CHEF', canAccessAdmin: true },
  { email: 'driver@gopalcakeshop.com', expectedRole: 'DELIVERY', canAccessAdmin: true },
  { email: 'florist@gopalcakeshop.com', expectedRole: 'VENDOR_FLORIST', canAccessAdmin: false }, // Middleware blocks non-internal roles from /admin
  { email: 'priya@example.com', expectedRole: null, canAccessAdmin: false } // Customer
]

async function runTests() {
  console.log('Starting RBAC Integration Tests against http://localhost:3000 ...')
  
  for (const account of testAccounts) {
    console.log(`\nTesting login for: ${account.email}`)
    
    try {
      const res = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: account.email, password: '123456' })
      })

      const data = await res.json()
      
      if (!res.ok && account.email === 'priya@example.com') {
        console.log(`✅ Passed: Customer login rejected as expected (Not synced in Auth yet, or no password setup)`)
        continue
      }
      
      if (!res.ok) {
        console.error(`❌ Failed: Login rejected for ${account.email} - ${data.message}`)
        continue
      }

      if (data.data.appRole !== account.expectedRole) {
        console.error(`❌ Failed: Expected role ${account.expectedRole}, got ${data.data.appRole}`)
        continue
      }

      console.log(`✅ Passed: Login successful. Role: ${data.data.appRole}`)

      // Test Route Protection by passing the cookie
      const cookieStr = res.headers.get('set-cookie')
      
      const adminRes = await fetch('http://localhost:3000/admin', {
        headers: {
          cookie: cookieStr || ''
        },
        redirect: 'manual' // Don't follow redirects so we can check status
      })

      const isRedirectedToLogin = adminRes.status === 302 || adminRes.status === 307
      const isAuthorized = !isRedirectedToLogin || adminRes.headers.get('location')?.includes('/admin')

      if (account.canAccessAdmin && isRedirectedToLogin && adminRes.headers.get('location')?.includes('/login')) {
        console.error(`❌ Failed: ${account.expectedRole} was unexpectedly blocked from /admin`)
      } else if (!account.canAccessAdmin && (!isRedirectedToLogin || adminRes.headers.get('location')?.includes('/admin'))) {
        console.error(`❌ Failed: ${account.expectedRole} was unexpectedly ALLOWED into /admin`)
      } else {
        console.log(`✅ Passed: /admin access control working for ${account.expectedRole}`)
      }

    } catch (e) {
      console.error(`Error testing ${account.email}:`, e)
    }
  }
}

runTests()
