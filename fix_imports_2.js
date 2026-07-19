const fs = require('fs');
const glob = require('glob'); // Assumes glob is installed, else I'll use node fs readdir recursive
const path = require('path');

const dir = path.join(__dirname, 'src', 'app');

function findFiles(dir, filter, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      findFiles(filePath, filter, fileList);
    } else if (filter.test(filePath)) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const allTsx = findFiles(dir, /\.tsx$/);

allTsx.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('<BackButton') && !content.includes('BackButton"')) {
    // Needs import
    // Find the first import statement and prepend it.
    const importStr = 'import { BackButton } from "@/components/ui/BackButton";\n';
    content = content.replace(/(import .*?\n)/, importStr + '$1');
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed', file);
  }
});
