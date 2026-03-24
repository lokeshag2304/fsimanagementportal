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
  
  // Specifically find and fix the stray div on checkboxes
  // Look for className="... cursor-pointer"\s*/></div>
  c = c.replace(/(className="[^"]*cursor-pointer"[^>]*\/>)\s*<\/div>/g, '$1');

  // Also catch stray div on any inputs that are direct children of td
  // (unless we intended it, but we only wanted it for dropdowns)
  // No, we only want to fix the obvious errors first.

  fs.writeFileSync(filePath, c, 'utf8');
});
console.log('Fixed stray divs on checkboxes');
