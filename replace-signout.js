const fs = require('fs');
const glob = require('glob');
const path = require('path');

const files = glob.sync('src/**/*.{ts,tsx}', { nodir: true });

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('signOut') && !file.includes('authUtils.ts')) {
    // Add import
    if (!content.includes('import { authSignOut }')) {
      content = content.replace(/(import .* from "next-auth\/react".*\n)/g, `$1import { authSignOut } from "@/lib/authUtils";\n`);
    }
    // Replace signOut({ callbackUrl: '/login' })
    content = content.replace(/signOut\(\{\s*callbackUrl:\s*['"]\/login['"]\s*\}\)/g, 'authSignOut("/login")');
    // Replace signOut()
    content = content.replace(/signOut\(\)/g, 'authSignOut()');
    
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
  }
}
