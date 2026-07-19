const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes('iconsax-react')) return;

  const importRegex = /import\s+\{([^}]+)\}\s+from\s+['"]iconsax-react['"]/g;
  let hasChanges = false;
  
  content = content.replace(importRegex, (match, iconListStr) => {
    const icons = iconListStr.split(',').map(s => s.trim()).filter(Boolean);
    const uniqueIcons = [...new Set(icons)];
    if (uniqueIcons.length !== icons.length) {
      hasChanges = true;
      return `import { ${uniqueIcons.join(', ')} } from "iconsax-react"`;
    }
    return match;
  });

  if (hasChanges) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Deduplicated imports in ${filePath}`);
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
console.log('Deduplication complete.');
