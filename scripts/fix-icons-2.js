const fs = require('fs');
const path = require('path');

const FIX_MAP = {
  'RefreshCw': 'Refresh',
  'Snowflake': 'Star', // fallback
  'Building2': 'Buildings2',
  'HeadphonesIcon': 'Headphone',
  'ImagePlus': 'GalleryAdd'
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
        if (good === 'any') {
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

    newIconListStr = newIconListStr.replace(/,\s*,/g, ',').replace(/\{\s*,/, '{').replace(/,\s*\}/, '}').trim();
    if (newIconListStr === '{}' || newIconListStr === '{ }') {
        content = content.replace(fullImport, '');
    } else {
        content = content.replace(fullImport, `import { ${newIconListStr} } from "iconsax-react"`);
    }
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
console.log('Fixes complete part 2.');
