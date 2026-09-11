const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/services/notifications/WhatsAppTemplateService.ts');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(/variables:\s+string\[\];/g, 'variables: { name: string; text: string }[];');

content = content.replace(/variables:\s*\[([\s\S]*?)\]/g, (match, body) => {
  const lines = body.split('\n');
  const newLines = lines.map(line => {
    // e.g. customer.name,                               // {{1}} customer_name
    const m = line.match(/^(\s*)(.+?),\s*\/\/\s*\{\{\d+\}\}\s*([a-zA-Z0-9_]+)\s*$/);
    if (m) {
       return `${m[1]}{ name: '${m[3]}', text: ${m[2]} },`;
    }
    return line;
  });
  return `variables: [${newLines.join('\n')}]`;
});

// Also fix the missing imageUrl for templates that don't have it, because they might all require images now.
// Actually, let's just make sure WhatsAppProvider uploads a fallback image if imageUrl is missing but the template expects one.
// Wait, we don't know which templates expect one. If we pass an image header to a template that doesn't expect one, Meta might reject it.
// Let's just fix the variables first.

fs.writeFileSync(filePath, content);
console.log('Refactored WhatsAppTemplateService.ts');
