import fs from 'fs';

const data = JSON.parse(fs.readFileSync('lint-errors.json', 'utf8'));

let filesChanged = 0;
let errorsFixed = 0;

for (const fileResult of data) {
  if (fileResult.errorCount === 0 && fileResult.warningCount === 0) continue;

  let content = fs.readFileSync(fileResult.filePath, 'utf8');
  let originalContent = content;

  // Fix catch (e: any) -> catch (e: unknown)
  if (content.includes('catch (e: any)')) {
    content = content.replace(/catch\s*\(\s*e:\s*any\s*\)/g, 'catch (e: unknown)');
  }
  if (content.includes('catch (err: any)')) {
    content = content.replace(/catch\s*\(\s*err:\s*any\s*\)/g, 'catch (err: unknown)');
  }
  if (content.includes('catch (error: any)')) {
    content = content.replace(/catch\s*\(\s*error:\s*any\s*\)/g, 'catch (error: unknown)');
  }

  // Fix require() imports
  if (content.includes('require(')) {
    content = content.replace(/const\s+(\w+)\s*=\s*require\('([^']+)'\)/g, 'import $1 from \'$2\'');
    content = content.replace(/import\s+{\s*([^}]+)\s*}\s*=\s*require\('([^']+)'\)/g, 'import { $1 } from \'$2\'');
  }

  if (content !== originalContent) {
    fs.writeFileSync(fileResult.filePath, content, 'utf8');
    filesChanged++;
    errorsFixed++;
  }
}

console.log(`Changed ${filesChanged} files.`);
