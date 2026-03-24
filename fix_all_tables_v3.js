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

  // 1. Cleanup previous messes (min-min-w, duplicate styles)
  content = content.replace(/min-min-w/g, 'min-w');
  content = content.replace(/style=\{\{\s*minWidth:\s*"280px",\s*minHeight:\s*"32px"\s*\}\}\s*style=\{\{\s*minHeight:\s*"32px"\s*\}\}/g, 'style={{ minWidth: "280px", minHeight: "32px" }}');

  // 2. Wrap ApiDropdown/GlassSelect correctly in td with closing div
  // We look for td followed by component and wrap
  // This version targets components that don't have the wrapper yet
  content = content.replace(/\<td className="py-3 px-4"\>\s*\n\s*\<(ApiDropdown|GlassSelect)([^>]+?)\/\>\s*\n\s*\<\/td\>/g, (match, p1, p2) => {
    if (match.includes('whitespace-nowrap')) return match;
    return `<td className="py-3 px-4">\n                            <div className="whitespace-nowrap min-w-[280px]">\n                              <${p1}${p2}/>\n                            </div>\n                          </td>`;
  });

  // 3. For multiline components (ones that don't end in /> on same line)
  // This is harder. Let's use a placeholder-based approach or just target specific ones.
  // Actually, I'll just use a regex that handles the newRecordData blocks
  const targetComponents = ['ApiDropdown', 'GlassSelect'];
  targetComponents.forEach(comp => {
    const startRegex = new RegExp(`<td className="py-3 px-4">\\s*\\n\\s*<${comp}`, 'g');
    content = content.replace(startRegex, (match) => {
       return `<td className="py-3 px-4">\n                            <div className="whitespace-nowrap min-w-[280px]">\n                              <${comp}`;
    });
    
    // Now we need to close the div before </td> if we opened one in a td
    // We can look for </ApiDropdown> </td> or /> </td> patterns
    content = content.replace(new RegExp(`(<\\/${comp}>|\\/>)(\\s*\\n\\s*)<\\/td>`, 'g'), (match, p1, p2) => {
        // If we have an open div in this td, we close it. 
        // We assume indentation or proximity safely.
        return `${p1}</div>${p2}</td>`;
    });
  });

  // Double check: remove nested wraps if any were created
  content = content.replace(/<div className="whitespace-nowrap min-w-\[280px\]">\s*<div className="whitespace-nowrap min-w-\[[0-9]+px\]">/g, '<div className="whitespace-nowrap min-w-[280px]">');
  content = content.replace(/<\/div>\s*<\/div>\s*\n\s*<\/td>/g, '</div>\n                          </td>');

  // 4. Ensure table-auto and header widths
  content = content.replace(/table-fixed/g, 'table-auto');
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
console.log('Fixed all tables with logic v3');
