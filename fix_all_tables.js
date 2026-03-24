const fs = require('fs');
const path = require('path');

const projectRoot = 'c:/xampp/htdocs/fsimanagementportal';
const files = [
  'src/app/[role]/domains/DomainsContent.tsx',
  'src/app/[role]/ssl/SSLPageContent.tsx',
  'src/app/[role]/hosting/HostingContent.tsx',
  'src/app/[role]/sub-email/EmailsContent.tsx',
  'src/app/[role]/subscription/SubscriptionContent.tsx',
  'src/app/[role]/counter/page.tsx'
];

files.forEach(fileRel => {
  const filePath = path.join(projectRoot, fileRel);
  if (!fs.existsSync(filePath)) {
    console.log(`Skipping missing file: ${fileRel}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Change table-fixed to table-auto
  content = content.replace(/table-fixed/g, 'table-auto');

  // 2. Increase base widths in thead headers and use min-w
  // Pattern match w-[...] in th tags or nearby
  content = content.replace(/w-\[220px\]/g, 'min-w-[280px]');
  content = content.replace(/w-\[200px\]/g, 'min-w-[240px]');
  content = content.replace(/w-\[180px\]/g, 'min-w-[220px]');
  content = content.replace(/w-\[150px\]/g, 'min-w-[180px]');
  
  // Extra specific for Domain Name/Product/Client/Vendor if they vary
  // (Assuming typical layouts seen so far)

  // 3. Wrap inputs/dropdowns in the addingNew row to ensure no wrap and min width
  // Since wrapping logic might be recursive or specific, I'll target common patterns:
  // Find <ApiDropdown ... /> and wrap if not wrapped
  // Find <GlassSelect ... /> and wrap if not wrapped
  
  // Actually, I'll just look for common container patterns in those specific files.
  // Many use <div className="w-full">
  content = content.replace(/<div className="w-full">\s*(<ApiDropdown|<GlassSelect)/g, '<div className="whitespace-nowrap min-w-[240px]">$1');

  // Also catch the ones I manually wrapped earlier in SubscriptionContent.tsx
  content = content.replace(/whitespace-nowrap overflow-hidden text-ellipsis/g, 'whitespace-nowrap');

  // For domain name input
  content = content.replace(/(placeholder="Domain Name[^"]*")\s*className="([^"]*)"/g, '$1 className="$2" style={{ minWidth: "280px" }}');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Processed ${fileRel}`);
});
