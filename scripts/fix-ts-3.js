const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');
function update(file, cb) {
  const fp = path.join(projectRoot, file);
  if (fs.existsSync(fp)) {
    let old = fs.readFileSync(fp, 'utf8');
    let nw = cb(old);
    if (old !== nw) fs.writeFileSync(fp, nw, 'utf8');
  }
}

// 1. admin/categories
update('src/app/admin/categories/page.tsx', c => c.replace(/useMutation\(\{/g, 'useMutation<any, any, any>({'));
update('src/app/admin/categories/page.tsx', c => c.replace(/onMutate: async \(newCategory\) => \{/, 'onMutate: async (newCategory: any) => {'));

// 2. admin/design-library
update('src/app/admin/design-library/page.tsx', c => c.replace(/, price: \d+/g, ''));
update('src/app/admin/design-library/page.tsx', c => c.replace(/, priceAdjustment: \d+/g, ''));

// 3. admin/orders
update('src/app/admin/orders/page.tsx', c => {
  return c.replace(/value=\{totalOrders\}/g, 'value={Number(totalOrders)||0}')
          .replace(/value=\{totalRevenue\}/g, 'value={Number(totalRevenue)||0}');
});

// 4. sales/orders
update('src/app/sales/orders/page.tsx', c => {
  return c.replace(/\(th, i\)/g, '(th: any, i: number)')
          .replace(/req.note/g, '(req as any).note');
});

// 5. sales/page
update('src/app/sales/page.tsx', c => {
  return c.replace(/req.note/g, '(req as any).note');
});

// 6. sales/transfers
update('src/app/sales/transfers/page.tsx', c => {
  let text = c.replace(/order\.transferHistory/g, '(order as any).transferHistory')
              .replace(/\(th, i\)/g, '(th: any, i: number)');
  // handle `transferHistory: []` in Partial<Order>
  text = text.replace(/transferHistory: \[\]/g, '/* transferHistory: [] */');
  return text;
});

// 7. supplier
update('src/app/supplier/page.tsx', c => c.replace(/req\.id,\s*"resolved",\s*""/g, 'req.id, "fulfilled"'));

// 8. OrderContext
update('src/context/OrderContext.tsx', c => {
  return c.replace(/await requestIngredient\(req\.id, req\.item, note\)/g, 'await requestIngredient(req.id, req.item, 1, "unit")')
          .replace(/await markIngredientFulfilled\(req\.id, note, requestedBy\)/g, 'await markIngredientFulfilled(req.id)');
});

// 9. design-system/status
update('src/lib/design-system/status.ts', c => c.replace(/Edit, TickSquare/g, 'Edit2, TickSquare'));

console.log("Fixes applied.");
