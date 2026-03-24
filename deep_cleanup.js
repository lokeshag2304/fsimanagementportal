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
  
  // 1. Remove all our custom wrappers added in this session COMPLETELY
  // This includes the ones with double spaces or different widths
  c = c.replace(/<div className=\"whitespace-nowrap\s+min-w-\[2[0-9]+px\]\">\s*/g, '');
  c = c.replace(/<div className=\"whitespace-nowrap\s+w-full\">\s*/g, '');
  c = c.replace(/<div className=\"whitespace-nowrap\s+min-w-\[1[0-9]+px\]\">\s*/g, '');

  // 2. Remove all </div> tags that are followed by </td> if they were added by us
  // We can identify them because we know the structure now
  // Actually, let's just use the balance logic on EVERY td to be safe
  const parts = c.split(/<td/);
  for (let i = 1; i < parts.length; i++) {
    const tdContentPart = parts[i];
    const tdEndIndex = tdContentPart.indexOf('</td>');
    if (tdEndIndex === -1) continue;

    let tdInner = tdContentPart.substring(0, tdEndIndex);
    
    // Cleanup inner: remove double closes first if any were created
    while (tdInner.includes('</div></div>')) {
        tdInner = tdInner.replace(/<\/div><\/div>/g, '</div>');
    }

    let opens = (tdInner.match(/<div/g) || []).length;
    let closes = (tdInner.match(/<\/div>/g) || []).length;

    // If we have extra closes, remove them from the end
    while (closes > opens && tdInner.trim().endsWith('</div>')) {
        tdInner = tdInner.trim().slice(0, -6);
        closes--;
    }
    
    // If we still have extra opens, add them (though we shouldn't if we removed wrappers)
    if (opens > closes) {
        tdInner = tdInner + '</div>'.repeat(opens - closes);
    }

    parts[i] = tdInner + tdContentPart.substring(tdEndIndex);
  }
  c = parts.join('<td');

  fs.writeFileSync(filePath, c, 'utf8');
});
console.log('Deep cleanup of wrappers and synax done');
