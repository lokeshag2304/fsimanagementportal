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
  if (!fs.existsSync(filePath)) return;

  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Fix duplicate styles and merge them
  // Find style={{ minWidth: "280px" }}\s*style={{ minHeight: "32px" }}
  content = content.replace(/style=\{\{\s*minWidth:\s*"280px"\s*\}\}\s*style=\{\{\s*minHeight:\s*"32px"\s*\}\}/g, 'style={{ minWidth: "280px", minHeight: "32px" }}');

  // 2. Wrap ApiDropdown/GlassSelect in td if not already wrapped with whitespace-nowrap
  // Case: <td className="py-3 px-4">\n  <ApiDropdown
  // We want to avoid double wrapping.
  content = content.split('\n').map(line => {
    // If a line has ApiDropdown or GlassSelect and is not preceded by our target div...
    // Actually regex is better for multi-line
    return line;
  }).join('\n');

  // Regex to find <td> followed by ApiDropdown or GlassSelect and wrap it
  // This targets the addingNew row structure
  content = content.replace(/\<td className="py-3 px-4"\>\s*\n\s*\<(ApiDropdown|GlassSelect)/g, (match, p1) => {
    return `<td className="py-3 px-4">\n                            <div className="whitespace-nowrap min-w-[240px]">\n                              <${p1}`;
  });

  // Close the div after the component ends
  // This is tricky with regex. Let's look for the component close tag /> or </ApiDropdown>
  // Most use />. 
  // Let's just target the specific instances in addingNew block if possible.
  
  // Actually, I'll just do it for the specific components we care about: Product, Client, Vendor, Domain.
  const components = ['Product', 'Client', 'Vendor', 'vendor', 'Domain', 'Status', 'Protect Status'];
  components.forEach(placeholder => {
    const regex = new RegExp(`(<(ApiDropdown|GlassSelect)[^>]+placeholder="${placeholder}"[^>]*\\/?>)`, 'g');
    content = content.replace(regex, (match) => {
      if (match.includes('whitespace-nowrap')) return match; // already wrapped or has class
      return `<div className="whitespace-nowrap min-w-[240px]">${match}</div>`;
    });
  });

  // 3. Fix table headers - ensure min-w is used
  // If someone used w-[...] change to min-w-[...]
  content = content.replace(/className="([^"]*)w-\[([0-9]+)px\]([^"]*)"/g, (match, p1, p2, p3) => {
    if (p1.includes('min-w') || p3.includes('min-w')) return match;
    const width = parseInt(p2);
    let newWidth = width;
    if (width >= 200) newWidth = 280;
    else if (width >= 180) newWidth = 240;
    else if (width >= 150) newWidth = 200;
    return `className="${p1}min-w-[${newWidth}px]${p3}"`;
  });

  fs.writeFileSync(filePath, content, 'utf8');
});
console.log('Fixed all tables with improved logic');
