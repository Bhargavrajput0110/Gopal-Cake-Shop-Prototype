const fs = require('fs');
const path = require('path');

// 1. Get all valid icons
const dtsPath = path.join(__dirname, '../node_modules/iconsax-react/dist/index.d.ts');
const dtsContent = fs.readFileSync(dtsPath, 'utf8');

const validIcons = new Set();
const exportRegex = /export\s+const\s+([A-Za-z0-9_]+)/g;
let match;
while ((match = exportRegex.exec(dtsContent)) !== null) {
  validIcons.add(match[1]);
}

console.log(`Found ${validIcons.size} valid icons in iconsax-react`);

// 2. Scan all .tsx files
const missingIcons = new Map(); // iconName -> Array of filePaths

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes('iconsax-react')) return;

  const importRegex = /import\s+\{([^}]+)\}\s+from\s+['"]iconsax-react['"]/g;
  let importMatch;
  while ((importMatch = importRegex.exec(content)) !== null) {
    const iconListStr = importMatch[1];
    const icons = iconListStr.split(',').map(s => s.trim()).filter(Boolean);
    
    icons.forEach(iconName => {
      let baseIconName = iconName;
      if (iconName.includes(' as ')) {
        baseIconName = iconName.split(' as ')[0].trim();
      }
      if (!validIcons.has(baseIconName)) {
        if (!missingIcons.has(baseIconName)) {
          missingIcons.set(baseIconName, new Set());
        }
        missingIcons.get(baseIconName).add(filePath);
      }
    });
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

console.log("\n--- MISSING ICONS ---");
if (missingIcons.size === 0) {
    console.log("None! All imports are valid.");
}
for (const [icon, files] of missingIcons.entries()) {
  console.log(`${icon} is missing in:`);
  for (const file of files) {
    console.log(`  - ${file}`);
  }
}
