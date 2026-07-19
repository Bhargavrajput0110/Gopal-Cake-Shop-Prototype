const fs = require('fs');
const path = require('path');

const ICON_MAP = {
  'Search': 'SearchNormal1',
  'Plus': 'Add',
  'Minus': 'Minus',
  'X': 'CloseSquare',
  'Menu': 'HambergerMenu',
  'Settings': 'Setting2',
  'User': 'User',
  'Users': 'Profile2User',
  'LogOut': 'Logout',
  'Home': 'Home2',
  'Check': 'TickSquare',
  'ChevronRight': 'ArrowRight2',
  'ChevronLeft': 'ArrowLeft2',
  'ChevronDown': 'ArrowDown2',
  'ChevronUp': 'ArrowUp2',
  'Edit': 'Edit2',
  'Trash': 'Trash',
  'Trash2': 'Trash',
  'Eye': 'Eye',
  'EyeOff': 'EyeSlash',
  'Package': 'Box',
  'MapPin': 'Location',
  'Clock': 'Clock',
  'Phone': 'Call',
  'Mail': 'Sms',
  'CreditCard': 'Card',
  'FileText': 'DocumentText',
  'Download': 'DocumentDownload',
  'Upload': 'DocumentUpload',
  'Star': 'Star1',
  'Heart': 'Heart',
  'Bell': 'Notification',
  'Camera': 'Camera',
  'Image': 'Gallery',
  'Lock': 'Lock1',
  'Unlock': 'Unlock',
  'MoreVertical': 'MoreSquare',
  'MoreHorizontal': 'More',
  'ShoppingCart': 'ShoppingCart',
  'ShoppingBag': 'Bag',
  'Filter': 'Filter',
  'ArrowLeft': 'ArrowLeft',
  'ArrowRight': 'ArrowRight',
  'Info': 'InfoCircle',
  'AlertCircle': 'Danger',
  'AlertTriangle': 'Warning2',
  'CheckCircle': 'TickCircle',
  'CheckCircle2': 'TickCircle',
  'XCircle': 'CloseCircle',
  'Maximize': 'Maximize',
  'Minimize': 'Minimize',
  'Play': 'Play',
  'Pause': 'Pause',
  'Monitor': 'Monitor',
  'Smartphone': 'Mobile',
  'Truck': 'TruckFast',
  'PieChart': 'ChartPie',
  'BarChart': 'Chart',
  'TrendingUp': 'TrendUp',
  'TrendingDown': 'TrendDown',
  'DollarSign': 'Moneys',
  'Banknote': 'MoneyArchive',
  'Shield': 'ShieldTick',
  'ShieldAlert': 'ShieldCross',
  'ShieldCheck': 'ShieldTick',
  'File': 'Document',
  'Folders': 'Folder2',
  'Folder': 'Folder2',
  'Link': 'Link2',
  'List': 'TaskSquare',
  'LayoutDashboard': 'Category',
  'PenTool': 'Edit2',
  'Briefcase': 'Briefcase',
  'Save': 'Save2',
  'Printer': 'Printer',
  'Layers': 'Layer',
  'Activity': 'Activity',
  'Zap': 'Flash',
  'Cpu': 'Cpu',
  'Calendar': 'Calendar2',
  'CalendarDays': 'Calendar2',
  'Archive': 'Archive',
  'ClipboardList': 'ClipboardText',
  'Map': 'Map',
  'Tag': 'Tag',
  'Tags': 'Tag',
  'Store': 'Shop',
  'Building': 'Building',
  'Circle': 'Record',
  'CameraOff': 'CameraSlash',
  'ImageOff': 'GallerySlash',
  'CheckSquare': 'TickSquare',
  'Wifi': 'Wifi',
  'WifiOff': 'WifiSquare',
  'Video': 'Video',
  'Mic': 'Microphone2',
  'MicOff': 'MicrophoneSlash',
  'GripVertical': 'MoreSquare',
  'Sun': 'Sun1',
  'Moon': 'Moon',
  'Globe': 'Global',
  'RotateCcw': 'RotateLeft',
  'RotateCw': 'RotateRight',
  'SearchX': 'CloseSquare',
  'ArrowUpRight': 'ArrowUpRight',
  'ArrowDownRight': 'ArrowDownRight',
  'ArrowUpLeft': 'ArrowUpLeft',
  'ArrowDownLeft': 'ArrowDownLeft'
};

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes('lucide-react')) return;

  const importRegex = /import\s+\{([^}]+)\}\s+from\s+['"]lucide-react['"]/g;
  
  let match;
  let hasChanges = false;
  
  while ((match = importRegex.exec(content)) !== null) {
    const fullImport = match[0];
    const iconListStr = match[1];
    const icons = iconListStr.split(',').map(s => s.trim()).filter(Boolean);
    
    const iconsaxIcons = new Set();
    const replacements = [];

    icons.forEach(iconName => {
      let baseIconName = iconName;
      let alias = null;
      if (iconName.includes(' as ')) {
        const parts = iconName.split(' as ');
        baseIconName = parts[0].trim();
        alias = parts[1].trim();
      }

      const mapped = ICON_MAP[baseIconName];
      if (mapped) {
        iconsaxIcons.add(mapped);
        if (alias) {
          replacements.push({ from: alias, to: mapped });
        } else {
          replacements.push({ from: baseIconName, to: mapped });
        }
      } else {
        console.warn(`WARNING: No mapping found for ${baseIconName} in ${filePath}`);
        iconsaxIcons.add(baseIconName);
        replacements.push({ from: baseIconName, to: baseIconName });
      }
    });

    const newImportStr = `import { ${Array.from(iconsaxIcons).join(', ')} } from "iconsax-react"`;
    content = content.replace(fullImport, newImportStr);
    hasChanges = true;

    replacements.forEach(({ from, to }) => {
      if (from !== to) {
        const jsxRegex = new RegExp(`<${from}(\\s|>)`, 'g');
        content = content.replace(jsxRegex, `<${to}$1`);
        
        const jsxCloseRegex = new RegExp(`</${from}>`, 'g');
        content = content.replace(jsxCloseRegex, `</${to}>`);
      }
    });
  }

  if (hasChanges) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (!filePath.includes('node_modules') && !filePath.includes('.next')) {
        walk(filePath);
      }
    } else if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
      processFile(filePath);
    }
  }
}

walk(path.join(__dirname, '../src'));
console.log('Migration complete.');
