const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];
  files.forEach(function (file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        arrayOfFiles.push(path.join(dirPath, "/", file));
      }
    }
  });
  return arrayOfFiles;
}

function removeMatchedBraces(code, searchString) {
  let startIndex = code.indexOf(searchString);
  if (startIndex === -1) return code;
  
  // Also trim leading whitespace/comments before the function if any
  let realStart = startIndex;
  while (realStart > 0 && (code[realStart - 1] === ' ' || code[realStart - 1] === '\t')) {
    realStart--;
  }

  let braceCount = 0;
  let started = false;
  let endIndex = -1;

  for (let i = startIndex; i < code.length; i++) {
    if (code[i] === '{') {
      braceCount++;
      started = true;
    } else if (code[i] === '}') {
      braceCount--;
    }

    if (started && braceCount === 0) {
      endIndex = i;
      break;
    }
  }

  if (endIndex !== -1) {
    // Also remove trailing semicolon and newline if present
    if (code[endIndex+1] === ';') endIndex++;
    if (code[endIndex+1] === '\r') endIndex++;
    if (code[endIndex+1] === '\n') endIndex++;
    
    const before = code.slice(0, realStart);
    const after = code.slice(endIndex + 1);
    // Recursively removing if there are multiple occurrences
    return removeMatchedBraces(before + after, searchString);
  }
  return code;
}

const files = getAllFiles(srcDir);

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  content = removeMatchedBraces(content, 'const formatDate =');
  content = removeMatchedBraces(content, 'const formatDateForDisplay =');

  /* Regex replacements for standardizing .toLocaleDateString */
  content = content.replace(/new\s+Date\(([^)]+)\)\.toLocaleDateString\([^)]*\)/g, 'formatDate($1)');
  content = content.replace(/new\s+Date\(([^)]+)\)\.toLocaleDateString\(\)/g, 'formatDate($1)');
  content = content.replace(/([a-zA-Z0-9_?.\[\]]+)\.toLocaleDateString\([^)]*\)/g, 'formatDate($1)');
  content = content.replace(/([a-zA-Z0-9_?.\[\]]+)\.toLocaleDateString\(\)/g, 'formatDate($1)');

  /* Regex replacement for moment().format() if applicable */
  content = content.replace(/moment\(([^)]+)\)\.format\([^)]+\)/g, 'formatDate($1)');

  /* Fix Next.js Import Order ("use client" must be at the top) */
  if (content !== original) {
    // Inject the import at the top (after use client) if not present
    if (!content.includes('import { formatDate }')) {
      if (content.includes('"use client"') || content.includes("'use client'")) {
        content = content.replace(/(['"]use client['"];?)/, '$1\nimport { formatDate } from "@/utils/dateFormatter";');
      } else {
        content = 'import { formatDate } from "@/utils/dateFormatter";\n' + content;
      }
    } else {
        // Also ensure use client is at the top if we somehow pushed it down
        const useClientMatch = content.match(/^.*(['"]use client['"];?).*$/m);
        if (useClientMatch && content.indexOf(useClientMatch[1]) > 10) {
            content = content.replace(useClientMatch[1], '');
            content = useClientMatch[1] + '\n' + content;
        }
    }
    
    fs.writeFileSync(file, content, 'utf8');
    console.log("Updated: " + file);
  }
});
