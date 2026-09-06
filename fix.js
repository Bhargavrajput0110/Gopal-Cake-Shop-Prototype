const fs = require('fs');
const files = [
  'src/components/sales/SalesSidebar.tsx',
  'src/components/sales/SalesMobileNav.tsx',
  'src/components/manager/ManagerSidebar.tsx',
  'src/components/manager/ManagerMobileNav.tsx',
  'src/components/admin/AdminSidebar.tsx',
  'src/components/admin/AdminMobileNav.tsx',
];

files.forEach(f => {
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, 'utf8');
    content = content.replace(/import \{ [A-Z_]+_NAV_CONFIG \} from \".+?\";/g, 'import { signOut } from "next-auth/react";');
    content = content.replace(/onClick=\{[A-Z_]+_NAV_CONFIG\.onSignOut\}/g, "onClick={() => signOut({ callbackUrl: '/login' })}");
    fs.writeFileSync(f, content);
  }
});
console.log('Done');
