const fs = require('fs');
const content = fs.readFileSync('build_output.log', 'utf-16le');
fs.writeFileSync('build_error.log', content, { encoding: 'utf-8' });
console.log("Converted to utf-8");
