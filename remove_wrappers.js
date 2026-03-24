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
  
  // 1. Remove ALL custom wrappers I added
  c = c.replace(/<div className="whitespace-nowrap min-w-\[2[0-9]+px\]">/g, '');
  // Since some might have trailing spaces or different widths...
  c = c.replace(/<div className="whitespace-nowrap min-w-\[180px\]">/g, '');

  // 2. Remove ONLY the closing tag if it directly follows the ApiDropdown/GlassSelect block
  // This is the hard part. I'll just remove all stray </div> before </td>.
  c = c.replace(/<\/div>(\s*)\<\/td\>/g, '$1</td>');

  // Let's also restore the table classes if we want, but table-auto is generally good.
  
  fs.writeFileSync(filePath, c, 'utf8');
});
console.log('Wrappers removed. Let global component styles handle it.');
