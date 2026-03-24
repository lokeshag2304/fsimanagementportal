const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
        arrayOfFiles.push(fullPath);
      }
    }
  });

  return arrayOfFiles;
}

const allFiles = getAllFiles(srcDir);

for (const file of allFiles) {
  let content = fs.readFileSync(file, 'utf-8');
  let originalContent = content;

  // 1. Remove exactly known local implementations of formatDate
  const replacePatterns = [
    // This removes the local `const formatDate = ...` logic.
    // We can just match the function blocks.
    /const (?:formatDate|formatDateForDisplay) = \([\s\S]*?(?:return date\.toLocaleDateString|[^{]*try \{[\s\S]*?toLocaleDateString[\s\S]*?catch[\s\S]*?return[^;]+;)[\s\S]*?\n\s*\};?\n?/g,
    /const (?:formatDate|formatDateForDisplay) = \([\s\S]*?=>\s*\{[\s\S]*?return[^\}]*\.toLocaleDateString\([\s\S]*?\}[\s\S]*?\n\s*\};?\n?/g
  ];

  for(const pat of replacePatterns) {
    content = content.replace(pat, '');
  }

  // 2. Replace occurrences of `new Date(...).toLocaleDateString(...)`
  // with `formatDate(...)`
  // Because `formatDate` from `dateFormatter` accepts strings/dates, we can just pass the inner param
  content = content.replace(/new Date\(([^)]*)\)\.toLocaleDateString\([^)]*\)/g, 'formatDate($1)');
  
  // Also instances without arguments inside Date() or toLocaleDateString()
  content = content.replace(/new Date\(\)\.toLocaleDateString\([^)]*\)/g, 'formatDate(new Date())');
  
  // 3. Replace direct `localDateVar.toLocaleDateString(...)`
  // Note: we want to replace `date.toLocaleDateString('en-GB', ...)`
  content = content.replace(/(\w+)\.toLocaleDateString\([^)]*\)/g, 'formatDate($1)');

  // 4. Also `formatDateForDisplay` should be replaced
  content = content.replace(/formatDateForDisplay\(/g, 'formatDate(');

  if (content !== originalContent) {
    // Add import statement if it doesn't exist
    if (!content.includes('import { formatDate }') && !content.includes('export function formatDate')) {
      const importStatement = `import { formatDate } from "@/utils/dateFormatter";\n`;
      const lastImportIndex = content.lastIndexOf('import ');
      if (lastImportIndex !== -1) {
          const endOfLine = content.indexOf('\n', lastImportIndex);
          content = content.slice(0, endOfLine + 1) + importStatement + content.slice(endOfLine + 1);
      } else {
          content = importStatement + content;
      }
    }

    fs.writeFileSync(file, content, 'utf-8');
    console.log(`Modified: ${file}`);
  }
}
