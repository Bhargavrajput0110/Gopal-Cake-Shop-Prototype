const fs = require('fs');
const file = 'src/components/navigation/nav-configs.ts';
let content = fs.readFileSync(file, 'utf8');

const targetStr = '{ name: "Notifications", href: "/admin/notifications",  icon: Notification },\n        { name: "Analytics",     href: "/admin/analytics",      icon: Chart },';
const replaceStr = '{ name: "Notifications", href: "/admin/notifications",  icon: Notification },\n        { name: "Transfers",     href: "/admin/transfers",      icon: ArrowSwapHorizontal },\n        { name: "Analytics",     href: "/admin/analytics",      icon: Chart },';

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replaceStr);
} else {
  // Try CRLF
  const targetStrCRLF = '{ name: "Notifications", href: "/admin/notifications",  icon: Notification },\r\n        { name: "Analytics",     href: "/admin/analytics",      icon: Chart },';
  const replaceStrCRLF = '{ name: "Notifications", href: "/admin/notifications",  icon: Notification },\r\n        { name: "Transfers",     href: "/admin/transfers",      icon: ArrowSwapHorizontal },\r\n        { name: "Analytics",     href: "/admin/analytics",      icon: Chart },';
  content = content.replace(targetStrCRLF, replaceStrCRLF);
}

fs.writeFileSync(file, content);
console.log("Done");
