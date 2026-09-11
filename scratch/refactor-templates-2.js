const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/services/notifications/WhatsAppTemplateService.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Fix messageOnCake
content = content.replace(/customization\.messageOnCake\s*\|\|\s*'None',\s*\/\/\s*([a-zA-Z0-9_]+)\s*/g, (match, name) => {
  return `{ name: '${name.trim()}', text: customization.messageOnCake || 'None' },`;
});

// Fix specialInstructions
content = content.replace(/customization\.specialInstructions\s*\|\|\s*'None',\s*\/\/\s*([a-zA-Z0-9_]+)\s*/g, (match, name) => {
  return `{ name: '${name.trim()}', text: customization.specialInstructions || 'None' },`;
});

// Fix imageUrl for all returned objects
// Since ALL templates might require an image now, let's just make imageUrl default to a fallback.
// Search for `imageUrl: _meta.selectedImageUrl,` and replace it
content = content.replace(/imageUrl:\s*_meta\.selectedImageUrl,/g, "imageUrl: _meta.selectedImageUrl || 'https://bhargavrajput0110.github.io/Gopal-Cake-Shop-Prototype/logo.png',");

// But what about templates that DON'T have `imageUrl` in the code? E.g. `order_ready_delivery`
// If they require an image, we should inject `imageUrl: _meta.selectedImageUrl || '...',` before `};` in every return block.
content = content.replace(/variables:\s*\[[\s\S]*?\],(?!\s*imageUrl)/g, match => {
  return match + "\n            imageUrl: _meta.selectedImageUrl || 'https://bhargavrajput0110.github.io/Gopal-Cake-Shop-Prototype/logo.png',";
});

fs.writeFileSync(filePath, content);
console.log('Fixed messageOnCake, specialInstructions, and imageUrl');
