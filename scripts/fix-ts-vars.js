const fs = require('fs');
const path = require('path');

const fileFixes = {
  "src/app/admin/orders/page.tsx": {
    "CheckCircle2": "TickCircle",
    "Ban": "CloseCircle"
  },
  "src/app/driver/components/TaskCard.tsx": {
    "Package": "Box",
    "Store": "Shop"
  },
  "src/app/login/LoginClient.tsx": {
    "Delete": "Trash"
  },
  "src/components/chef/ChefMobileNav.tsx": {
    "Inbox": "Box",
    "CheckCircle": "TickCircle"
  },
  "src/components/manager/ManagerSidebar.tsx": {
    "LayoutDashboard": "Category",
    "ChefHat": "Reserve",
    "PackageCheck": "BoxTick",
    "Bike": "Car"
  },
  "src/components/sales/SalesSidebar.tsx": {
    "ClipboardList": "ClipboardText",
    "Store": "Shop",
    "Bike": "Car",
    "CreditCard": "Card",
    "PlusCircle": "AddCircle"
  },
  "src/components/ui/notification/Notification.tsx": {
    "CheckCircle2": "TickCircle",
    "AlertTriangle": "Warning2",
    "XCircle": "CloseCircle",
    "Info": "InfoCircle",
    "Settings": "Setting2"
  },
  "src/components/ui/status-badge.tsx": {
    "CheckCircle2": "TickCircle",
    "AlertCircle": "Warning2",
    "XCircle": "CloseCircle",
    "Package": "Box"
  },
  "src/lib/design-system/status.ts": {
    "FileEdit": "Edit2",
    "Sparkles": "MagicStar",
    "ChefHat": "Reserve",
    "ThumbsUp": "Like1",
    "Utensils": "Reserve",
    "Brush": "Edit",
    "PackageCheck": "BoxTick",
    "MapPin": "Location",
    "Bike": "Car",
    "Package": "Box",
    "Truck": "TruckFast",
    "CheckCheck": "TickSquare",
    "CheckCircle2": "TickCircle",
    "XCircle": "CloseCircle",
    "AlertTriangle": "Warning2"
  }
};

const projectRoot = path.join(__dirname, '..');

for (const [relPath, fixes] of Object.entries(fileFixes)) {
  const filePath = path.join(projectRoot, relPath);
  if (!fs.existsSync(filePath)) continue;
  
  let content = fs.readFileSync(filePath, 'utf8');
  for (const [bad, good] of Object.entries(fixes)) {
    // Replace variable references exactly (match word boundaries)
    const regex = new RegExp(`\\b${bad}\\b`, 'g');
    content = content.replace(regex, good);
  }
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Fixed variables in ${relPath}`);
}
