const fs = require('fs');
const path = require('path');
function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx')) {
      results.push(file);
    }
  });
  return results;
}
const files = walk('d:/Gopal Cake Shop/src/app/admin');
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  let changed = false;
  if (content.includes('DashboardSection') || content.includes('PageHeader') || true) {
    if (content.includes('href="/admin"') && content.includes('Back')) {
      const regex1 = /<Link\s+href="\/admin"[^>]*>.*?Back<\/Link>/g;
      if (regex1.test(content)) {
        content = content.replace(regex1, '<BackButton fallback="/admin" label="Back" variant="outline" />');
        if (!content.includes('import { BackButton }')) {
          content = content.replace(/(import .*?\n)/, '$1import { BackButton } from "@/components/ui/BackButton";\n');
        }
        changed = true;
      }
    }
  }
  if (changed) {
    fs.writeFileSync(f, content);
    console.log('Updated', f);
  }
});
