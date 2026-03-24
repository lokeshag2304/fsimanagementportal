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
  
  // Find cases where we have a div opened with flex gap-2 but it's not closed
  // Look for: <div className="flex items-center gap-2">\s*(<Package|<Globe|<User|<Globe2)[^>]*>\s*<span[^>]*>[\s\S]*?<\/span>(\s*)\n\s*<\/td>
  c = c.replace(/(<div className="flex items-center gap-2">[\s\S]+?<\/span>)(\s*)\n\s*<\/td>/g, (match, p1, p2) => {
    if (match.includes('</div>')) return match;
    return `${p1}\n              </div>\n            </td>`;
  });

  fs.writeFileSync(filePath, c, 'utf8');
});
console.log('Restored valid divs');
