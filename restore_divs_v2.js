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
  
  // Find cases where we have a div opened with specific classes inside a td but it's not closed before </td>
  // This regex targets common start patterns of our layout divs
  const patterns = [
    'flex items-center gap-2',
    'flex items-center justify-center gap-1',
    'inline-flex items-center whitespace-nowrap gap-1',
    'flex items-center justify-center',
    'flex items-center justify-end'
  ];

  patterns.forEach(p => {
    // Escaping [ ] for regex
    const escapedP = p.replace(/\[/g, '\\[').replace(/\]/g, '\\]');
    const regex = new RegExp(`(<div className=\"[^\"]*${escapedP}[^>]*>[\\s\\S]+?)(?=\\s*\\n?\\s*<\\/td>)`, 'g');
    c = c.replace(regex, (match) => {
      // If it already has exactly one more <div> than </div>, it needs a closing tag.
      // This is a rough heuristic.
      const opens = (match.match(/<div/g) || []).length;
      const closes = (match.match(/<\/div>/g) || []).length;
      if (opens > closes) {
          return match + '\n                </div>';
      }
      return match;
    });
  });

  fs.writeFileSync(filePath, c, 'utf8');
});
console.log('Restored all valid divs using improved logic');
