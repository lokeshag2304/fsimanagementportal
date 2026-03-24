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
  
  // 1. Remove all our custom wrappers added in this session
  // This is the cleanest way to revert the mess
  c = c.replace(/<div className="whitespace-nowrap min-w-\[280px\]">/g, '');
  // Since we might have broken nesting, we just remove the </div>s that we added.
  // This is risky.
  
  // Actually, I'll just look for placeholders in addingNew blocks.
});
