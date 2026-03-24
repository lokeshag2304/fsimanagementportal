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

const importStatementLine = 'import { formatDate } from "@/utils/dateFormatter";';

const allFiles = getAllFiles(srcDir);

for (const file of allFiles) {
  let content = fs.readFileSync(file, 'utf-8');
  if (content.includes(importStatementLine)) {
    // Remove all instances of the import statement
    let newContent = content.replace(new RegExp('import \\{ formatDate \\} from "@/utils/dateFormatter";\\s*\\n?', 'g'), '');
    
    // Find 'use client' or "use client" with optional semicolon
    const useClientRegex = /^(?:'use client'|"use client");?/m;
    const match = newContent.match(useClientRegex);
    
    if (match) {
       // insert right after the match line
       const matchStr = match[0];
       const matchIndex = match.index;
       
       // Find the end of the line
       const endOfLine = newContent.indexOf('\n', matchIndex);
       if (endOfLine !== -1) {
           newContent = newContent.slice(0, endOfLine + 1) + importStatementLine + '\n' + newContent.slice(endOfLine + 1);
       } else {
           newContent = newContent + '\n' + importStatementLine + '\n';
       }
    } else {
       // if no use client, just put at the very top
       newContent = importStatementLine + '\n' + newContent;
    }
    
    if (content !== newContent) {
        fs.writeFileSync(file, newContent, 'utf-8');
        console.log(`Fixed import in: ${file}`);
    }
  }
}
