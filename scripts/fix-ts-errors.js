const fs = require('fs');
const path = require('path');

const fileFixes = [
  {
    file: "src/app/admin/design-library/page.tsx",
    replacements: [
      { find: "priceAdjustment:", replace: "price:" }
    ]
  },
  {
    file: "src/app/customer/orders/page.tsx",
    replacements: [
      { find: "Notification.permission", replace: "window.Notification.permission" },
      { find: "Notification.requestPermission()", replace: "window.Notification.requestPermission()" }
    ]
  },
  {
    file: "src/app/sales/orders/page.tsx",
    replacements: [
      { find: "order.transferHistory", replace: "(order as any).transferHistory" },
      { find: "th,", replace: "th: any," }
    ]
  },
  {
    file: "src/app/sales/transfers/page.tsx",
    replacements: [
      { find: "order.transferHistory", replace: "(order as any).transferHistory" },
      { find: "th,", replace: "th: any," }
    ]
  },
  {
    file: "src/app/sales/page.tsx",
    replacements: [
      { find: "resolved", replace: "fulfilled" }
    ]
  },
  {
    file: "src/app/supplier/page.tsx",
    replacements: [
      { find: "req.id, \"resolved\", \"\"", replace: "req.id, \"fulfilled\"" }
    ]
  },
  {
    file: "src/context/OrderContext.tsx",
    replacements: [
      { find: "status: \"pending\" | \"resolved\", supplierName?: string", replace: "status: \"pending\" | \"fulfilled\" | \"cancelled\", supplierName?: string" },
      { find: "note?: string", replace: "qty?: number, unit?: string" },
      { find: "requestedBy?: string", replace: "" }
    ]
  }
];

const projectRoot = path.join(__dirname, '..');

for (const fix of fileFixes) {
  const filePath = path.join(projectRoot, fix.file);
  if (!fs.existsSync(filePath)) continue;
  
  let content = fs.readFileSync(filePath, 'utf8');
  for (const repl of fix.replacements) {
    // We use split/join for exact substring replacement globally
    content = content.split(repl.find).join(repl.replace);
  }
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Fixed TS errors in ${fix.file}`);
}
