const fs = require('fs');

try {
  const content = fs.readFileSync('src/app/sales/pos/components/PaymentDialog.tsx', 'utf-8');
  const openDivs = (content.match(/<div/g) || []).length;
  const closeDivs = (content.match(/<\/div>/g) || []).length;
  
  console.log(`Open Divs: ${openDivs}`);
  console.log(`Close Divs: ${closeDivs}`);
  
  const openBraces = (content.match(/\{/g) || []).length;
  const closeBraces = (content.match(/\}/g) || []).length;
  console.log(`Open Braces: ${openBraces}`);
  console.log(`Close Braces: ${closeBraces}`);
  
  const openParens = (content.match(/\(/g) || []).length;
  const closeParens = (content.match(/\)/g) || []).length;
  console.log(`Open Parens: ${openParens}`);
  console.log(`Close Parens: ${closeParens}`);
  
} catch (e) {
  console.error(e);
}
