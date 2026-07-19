const fs = require('fs');
const path = require('path');

function addImport(file, icon) {
  const filePath = path.join(__dirname, '..', file);
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('iconsax-react')) {
    content = content.replace(/import\s+\{([^}]+)\}\s+from\s+['"]iconsax-react['"]/, (match, group) => {
      if (!group.includes(icon)) {
        return 'import { ' + group.trim() + ', ' + icon + ' } from "iconsax-react"';
      }
      return match;
    });
    fs.writeFileSync(filePath, content, 'utf8');
  }
}

addImport('src/app/login/LoginClient.tsx', 'Trash');
addImport('src/components/chef/ChefMobileNav.tsx', 'Box');
addImport('src/components/ui/status-badge.tsx', 'Warning2');
addImport('src/lib/design-system/status.ts', 'Edit2');
addImport('src/lib/design-system/status.ts', 'Edit');
addImport('src/lib/design-system/status.ts', 'TickSquare');

console.log("Imports added.");
