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

const files = getAllFiles(srcDir);
let fixedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const initial = content;

  // Pattern 1: `// Format date for display` followed by optional whitespace and `};`
  content = content.replace(/\s*\/\/\s*Format date[^\n]*\n+\s*\};\n?/g, '\n');
  
  if (content !== initial) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Fixed stray bracket in: ${file}`);
    fixedCount++;
  }
});

console.log(`Total files fixed: ${fixedCount}`);
