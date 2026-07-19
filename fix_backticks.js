const fs = require("fs");
const files = [
  "src/app/chef/page.tsx",
  "src/app/sales/page.tsx",
  "src/app/sales/orders/page.tsx",
  "src/context/OrderContext.tsx"
];
files.forEach(f => {
  const lines = fs.readFileSync(f, "utf8").split("\n");
  lines.forEach((l, i) => {
    const trimmed = l.trim();
    if (trimmed.startsWith("className={") && !trimmed.startsWith("className={`") && !trimmed.startsWith('className={"')) {
      console.log(f + ":" + (i + 1) + " >> " + trimmed.substring(0, 100));
    }
  });
});
