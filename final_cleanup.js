const fs = require('fs');
const path = require('path');

const files = [
  'src/app/[role]/domains/DomainsContent.tsx',
  'src/app/[role]/ssl/SSLPageContent.tsx',
  'src/app/[role]/hosting/HostingContent.tsx',
  'src/app/[role]/sub-email/EmailsContent.tsx',
  'src/app/[role]/subscription/SubscriptionContent.tsx',
  'src/app/[role]/counter/page.tsx'
];

files.forEach(f => {
  const filePath = path.join('c:/xampp/htdocs/fsimanagementportal', f);
  if (!fs.existsSync(filePath)) return;
  
  let c = fs.readFileSync(filePath, 'utf8');
  
  // Fix nested min-min-w
  while (c.includes('min-min-w')) {
    c = c.replace(/min-min-w/g, 'min-w');
  }

  // Fix nested wrappers
  // <div className="whitespace-nowrap min-w-[280px]"> <div className="whitespace-nowrap min-w-[280px]">
  c = c.replace(/<div className="whitespace-nowrap min-w-\[280px\]">\s*<div className="whitespace-nowrap min-w-\[280px\]">/g, '<div className="whitespace-nowrap min-w-[280px]">');
  c = c.replace(/<\/div>\s*<\/div>\s*<\/td>/g, '</div>\n                          </td>');

  fs.writeFileSync(filePath, c, 'utf8');
});
console.log('Final cleanup done');
