const fs = require('fs');
const content = fs.readFileSync('sub_content.diff', 'utf-16le');
fs.writeFileSync('sub_content_utf8.diff', content, { encoding: 'utf-8' });
console.log("Converted to utf-8");
