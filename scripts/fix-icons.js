const fs = require('fs');
const path = require('path');

const FIX_MAP = {
  'MessageSquare': 'Message',
  'Inbox': 'ArchiveBook',
  'ChefHat': 'Reserve',
  'Square': 'Stop',
  'ListOrdered': 'TextalignJustifycenter',
  'MessageCircle': 'Message',
  'Navigation': 'Location',
  'Loader2': 'Refresh2',
  'PackageCheck': 'BoxTick',
  'Bike': 'Car',
  'UsersRound': 'People',
  'LineChart': 'Chart',
  'History': 'Clock',
  'PlusCircle': 'AddCircle',
  'ArrowLeftRight': 'ArrowSwapHorizontal',
  'LucideIcon': 'any', // Type fallback
  'ImageIcon': 'Gallery',
  'UploadCloud': 'CloudPlus',
  'ArrowDown': 'ArrowDown2',
  'ArrowUp': 'ArrowUp2',
  'ChevronsUpDown': 'ArrowSwap',
  'ChevronsLeft': 'ArrowLeft2',
  'ChevronsRight': 'ArrowRight2',
  'Settings2': 'Setting4',
  'LayoutTemplate': 'Element3',
  'MonitorSmartphone': 'Devices',
  'XIcon': 'CloseSquare',
  'ChevronDownIcon': 'ArrowDown2',
  'CheckCheck': 'TickDouble',
  'FileEdit': 'DocumentText',
  'Sparkles': 'MagicStar',
  'ThumbsUp': 'Like1',
  'Utensils': 'Reserve',
  'Brush': 'Brush2'
};

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes('iconsax-react')) return;

  let hasChanges = false;
  
  // Find import { ... } from "iconsax-react"
  const importRegex = /import\s+\{([^}]+)\}\s+from\s+['"]iconsax-react['"]/g;
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    const fullImport = match[0];
    const iconListStr = match[1];
    let newIconListStr = iconListStr;
    
    for (const [bad, good] of Object.entries(FIX_MAP)) {
      if (newIconListStr.includes(bad)) {
        // If it's a type alias like "any", we might need to remove it from the import
        if (good === 'any') {
            // we will handle LucideIcon manually or replace with generic component type
            const regex = new RegExp(`\\b${bad}\\b`, 'g');
            newIconListStr = newIconListStr.replace(regex, '');
        } else {
            const regex = new RegExp(`\\b${bad}\\b`, 'g');
            newIconListStr = newIconListStr.replace(regex, good);
            
            // replace JSX usage
            const jsxRegex = new RegExp(`<${bad}(\\s|>)`, 'g');
            content = content.replace(jsxRegex, `<${good}$1`);
            const jsxCloseRegex = new RegExp(`</${bad}>`, 'g');
            content = content.replace(jsxCloseRegex, `</${good}>`);
        }
        hasChanges = true;
      }
    }

    // clean up empty commas
    newIconListStr = newIconListStr.replace(/,\s*,/g, ',').replace(/\{\s*,/, '{').replace(/,\s*\}/, '}').trim();
    if (newIconListStr === '{}' || newIconListStr === '{ }') {
        content = content.replace(fullImport, '');
    } else {
        content = content.replace(fullImport, `import { ${newIconListStr} } from "iconsax-react"`);
    }
  }

  // Find any stragglers for `LucideIcon`
  if (content.includes('LucideIcon')) {
      content = content.replace(/LucideIcon/g, 'any');
      hasChanges = true;
  }

  if (hasChanges) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed ${filePath}`);
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
console.log('Fixes complete.');
