const fs = require('fs');
const file = 'src/components/navigation/nav-configs.ts';
let content = fs.readFileSync(file, 'utf8');

// Remove from the old location
content = content.replace(/[ \t]*\{ name: "Transfers",     href: "\/admin\/transfers",      icon: ArrowSwapHorizontal \},[\r\n]*/, '');

// Insert after Orders
content = content.replace(/\{ name: "Orders",        href: "\/admin\/orders",         icon: Bag \},/, '{ name: "Orders",        href: "/admin/orders",         icon: Bag },\n        { name: "Transfers",     href: "/admin/transfers",      icon: ArrowSwapHorizontal },');

fs.writeFileSync(file, content);
console.log("Moved Transfers up");
