const fs = require('fs');
const files = [
  'src/components/sales/SalesMobileNav.tsx',
  'src/components/admin/AdminMobileNav.tsx',
  'src/components/manager/ManagerMobileNav.tsx',
  'src/components/manager/ManagerSidebar.tsx',
  'src/components/chef/ChefMobileNav.tsx',
  'src/app/vendor/page.tsx',
  'src/app/supplier/page.tsx',
  'src/app/delivery/layout.tsx'
];
files.forEach(f => {
  if (!fs.existsSync(f)) return;
  let content = fs.readFileSync(f, 'utf8');
  if (content.includes('next-auth/react')) {
    if (!content.includes('signOut')) {
      content = content.replace('next-auth/react"', 'next-auth/react";\nimport { signOut } from "next-auth/react"');
    }
  } else {
    content = 'import { signOut } from "next-auth/react";\n' + content;
  }
  
  content = content.replace(/document\.cookie = ['"]gopal_dummy_role=; path=\/; max-age=0['"];?\s*window\.location\.href=['"]\/login['"];?/g, 'signOut({ callbackUrl: "/login" })');
  
  content = content.replace(/document\.cookie = ['"]gopal_dummy_role=; path=\/; max-age=0['"];?/g, 'signOut({ callbackUrl: "/login" })');
  
  fs.writeFileSync(f, content);
});
console.log('done');
