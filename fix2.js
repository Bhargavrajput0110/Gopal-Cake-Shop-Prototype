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
    if (content.startsWith('import { signOut } from "next-auth/react";\r\n"use client";') || 
        content.startsWith('import { signOut } from "next-auth/react";\n"use client";')) {
      const match = content.match(/^import \{ signOut \} from "next-auth\/react";\r?\n"use client";/);
      if (match) {
        content = '"use client";\nimport { signOut } from "next-auth/react";' + content.slice(match[0].length);
        fs.writeFileSync(f, content);
        console.log('Fixed use client in ' + f);
      }
    }
  }
});
console.log('Done');
