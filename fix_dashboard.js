const fs = require('fs');

const fixFiles = [
  './src/app/[role]/dashboard/page.tsx',
];

for(const f of fixFiles) {
  if (fs.existsSync(f)) {
      let content = fs.readFileSync(f, 'utf-8');
      content = content.replace(/\s*\/\/\s*Format date for display\s*\};/, '');
      fs.writeFileSync(f, content, 'utf-8');
      console.log(`Fixed ${f}`);
  }
}
