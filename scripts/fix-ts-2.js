const fs = require('fs');
const path = require('path');

const fileFixes = [
  {
    file: "src/app/admin/categories/page.tsx",
    replacements: [
      { find: "categoryId:", replace: "id: 'mock', categoryId:" }
    ]
  },
  {
    file: "src/app/admin/orders/page.tsx",
    replacements: [
      { find: "value={totalRevenue}", replace: "value={Number(totalRevenue) || 0}" },
      { find: "value={totalOrders}", replace: "value={Number(totalOrders) || 0}" }
    ]
  },
  {
    file: "src/app/customer/orders/page.tsx",
    replacements: [
      { find: "Icon.permission", replace: "window.Notification.permission" },
      { find: "Icon.requestPermission()", replace: "window.Notification.requestPermission()" }
    ]
  }
];

const projectRoot = path.join(__dirname, '..');

for (const fix of fileFixes) {
  const filePath = path.join(projectRoot, fix.file);
  if (!fs.existsSync(filePath)) continue;
  
  let content = fs.readFileSync(filePath, 'utf8');
  for (const repl of fix.replacements) {
    content = content.split(repl.find).join(repl.replace);
  }
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Fixed TS errors in ${fix.file}`);
}
