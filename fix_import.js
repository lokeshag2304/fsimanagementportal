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
    // Determine the safe spot to insert
    // Either after '"use client";' or at the very beginning
    let newContent = content.replace(new RegExp('import \\{ formatDate \\} from "@/utils/dateFormatter";\\s*\\n?', 'g'), '');
    
    // Check if we need to remove a stray `import { formatDate } from "@/utils/dateFormatter";`
    
    // Now insert correctly at the top
    const useClientIndex = newContent.indexOf('"use client";');
    if (useClientIndex !== -1) {
       const nextLineIndex = newContent.indexOf('\n', useClientIndex);
       newContent = newContent.slice(0, nextLineIndex + 1) + importStatementLine + '\n' + newContent.slice(nextLineIndex + 1);
    } else {
       newContent = importStatementLine + '\n' + newContent;
    }
    
    fs.writeFileSync(file, newContent, 'utf-8');
    console.log(`Fixed import in: ${file}`);
  }
}
