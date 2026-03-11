const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function walkSync(dir, filelist = []) {
  fs.readdirSync(dir).forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.next') {
        filelist = walkSync(filePath, filelist);
      }
    } else if (filePath.endsWith('.tsx') || filePath.endsWith('.ts') || filePath.endsWith('.jsx') || filePath.endsWith('.js')) {
      filelist.push(filePath);
    }
  });
  return filelist;
}

const files = walkSync(srcDir);

files.forEach(filePath => {
  if (filePath.includes('api.ts')) return; // skip the api file itself

  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Replace imports
  const oldContent = content;
  content = content.replace(/import\s+axios\s+from\s+['"](axios|@\/lib\/axios)['"]/g, 'import api from "@/lib/api"');
  content = content.replace(/import\s+api\s+from\s+['"]@\/lib\/axios['"]/g, 'import api from "@/lib/api"');
  
  if (content !== oldContent) changed = true;

  if (content.includes('axios.')) {
    content = content.replace(/axios\.post\(/g, 'api.post(');
    content = content.replace(/axios\.get\(/g, 'api.get(');
    content = content.replace(/axios\.put\(/g, 'api.put(');
    content = content.replace(/axios\.delete\(/g, 'api.delete(');
    changed = true;
  }

  // Also replace `axios(` or `axios.create(` usage if any? User probably only uses `axios.get` and `axios.post`.

  const beforeBaseUrl = content;
  // Remove const BASE_URL = ...
  content = content.replace(/const\s+BASE_URL\s*=\s*[^;]+;?\s*\n?/g, '');
  // Because BASE_URL is gone, `${BASE_URL}/api` becomes `/`. Wait, we should just remove `${BASE_URL}/api`.
  // Wait, if next line had `${BASE_URL}/api/secure/...`, it will become `/secure/...`
  content = content.replace(/\$\{BASE_URL\}\/api/g, '');
  content = content.replace(/`api\//g, '`/');
  content = content.replace(/['"]api\//g, '"/');
  
  // What if it was just `${BASE_URL}` without `/api`?
  content = content.replace(/\$\{BASE_URL\}/g, '');
  
  if (content !== beforeBaseUrl) changed = true;

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${filePath}`);
  }
});

try { fs.unlinkSync(path.join(srcDir, 'lib/axios.ts')); console.log('Deleted src/lib/axios.ts'); } catch (e) {}
