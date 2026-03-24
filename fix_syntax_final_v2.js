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
  
  // Specific fix for these dropdowns that lost their wrappers but kept the closers
  c = c.replace(/placeholder=\"Product\" \/\>\s*\n\s*\<\/div\>/g, 'placeholder="Product" />');
  c = c.replace(/placeholder=\"Client\" \/\>\s*\n\s*\<\/div\>/g, 'placeholder="Client" />');
  c = c.replace(/placeholder=\"Vendor\" \/\>\s*\n\s*\<\/div\>/g, 'placeholder="Vendor" />');
  c = c.replace(/placeholder=\"Select Domain\" \/\>\s*\n\s*\<\/div\>/g, 'placeholder="Select Domain" />');
  c = c.replace(/placeholder=\"Select Client\" \/\>\s*\n\s*\<\/div\>/g, 'placeholder="Select Client" />');
  c = c.replace(/placeholder=\"Select Vendor\" \/\>\s*\n\s*\<\/div\>/g, 'placeholder="Select Vendor" />');

  // Also catch generic /> </div> on same line or nearby
  c = c.replace(/\/>\s*\n\s*\<\/div\>(?=\s*\n\s*\<\/td\>)/g, '/>');

  fs.writeFileSync(filePath, c, 'utf8');
});
console.log('Fixed dropdown syntax errors');
