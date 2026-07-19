const fs = require('fs');
const files = [
  'src/app/admin/categories/page.tsx',
  'src/app/admin/coupons/page.tsx',
  'src/app/admin/customers/page.tsx',
  'src/app/admin/products/page.tsx',
  'src/app/admin/settings/page.tsx',
  'src/app/admin/users/page.tsx'
];
files.forEach(f => {
  let p = 'd:/Gopal Cake Shop/' + f;
  let content = fs.readFileSync(p, 'utf8');
  if (!content.includes('import { BackButton }')) {
    content = content.replace(/(import .*?\n)/, '$1import { BackButton } from "@/components/ui/BackButton";\n');
    fs.writeFileSync(p, content);
    console.log('Fixed', f);
  }
});
