const fs = require('fs');
const glob = require('glob');
const path = require('path');

const files = glob.sync('src/**/*.{ts,tsx}', { nodir: true });

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('authSignOut') && !file.includes('authUtils.ts')) {
    if (!content.includes('import { authSignOut }')) {
      // Find the last import statement or the top of the file
      const importRegex = /^import .*$/gm;
      let lastImportMatch;
      let match;
      while ((match = importRegex.exec(content)) !== null) {
        lastImportMatch = match;
      }
      
      if (lastImportMatch) {
        const insertIndex = lastImportMatch.index + lastImportMatch[0].length;
        content = content.slice(0, insertIndex) + '\nimport { authSignOut } from "@/lib/authUtils";' + content.slice(insertIndex);
      } else {
        content = 'import { authSignOut } from "@/lib/authUtils";\n' + content;
      }
      
      fs.writeFileSync(file, content);
      console.log(`Added import to ${file}`);
    }
  }
}
