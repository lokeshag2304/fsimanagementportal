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
  
  // Advanced fix: For each td, count open vs closed divs and fix
  // Use a loop to be safe with large files
  const parts = c.split(/<td/);
  for (let i = 1; i < parts.length; i++) {
    const tdContentPart = parts[i];
    const tdEndIndex = tdContentPart.indexOf('</td>');
    if (tdEndIndex === -1) continue;

    const tdInner = tdContentPart.substring(0, tdEndIndex);
    const opens = (tdInner.match(/<div/g) || []).length;
    const closes = (tdInner.match(/<\/div>/g) || []).length;

    if (opens > closes) {
      const fix = '</div>'.repeat(opens - closes);
      parts[i] = tdInner + fix + tdContentPart.substring(tdEndIndex);
    }
  }
  c = parts.join('<td');

  // Fix some other minor layout issues seen
  c = c.replace(/max-min-w/g, 'min-w');

  fs.writeFileSync(filePath, c, 'utf8');
});
console.log('Fixed all syntax errors in tables');
