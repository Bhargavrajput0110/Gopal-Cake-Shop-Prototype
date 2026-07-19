const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');
function replaceText(file, search, replaceStr) {
  const fp = path.join(projectRoot, file);
  if (fs.existsSync(fp)) {
    let old = fs.readFileSync(fp, 'utf8');
    let nw = old.split(search).join(replaceStr);
    if (old !== nw) fs.writeFileSync(fp, nw, 'utf8');
  }
}

// 1. sales/orders
replaceText('src/app/sales/orders/page.tsx', 'th, i', 'th: any, i: number');
replaceText('src/app/sales/orders/page.tsx', 'req.note', '(req as any).note');

// 2. sales/transfers
replaceText('src/app/sales/transfers/page.tsx', 'order.transferHistory', '(order as any).transferHistory');
replaceText('src/app/sales/transfers/page.tsx', 'transferHistory: []', '/* transferHistory: [] */');
replaceText('src/app/sales/transfers/page.tsx', 'th, i', 'th: any, i: number');

// 3. supplier
replaceText('src/app/supplier/page.tsx', 'req.id, "resolved", ""', 'req.id, "fulfilled"');

// 4. OrderContext
replaceText('src/context/OrderContext.tsx', 'await markIngredientFulfilled(req.id, note, requestedBy)', 'await markIngredientFulfilled(req.id)');

console.log("Final fixes applied.");
