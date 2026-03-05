const fs = require('fs');
const path = require('path');

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;

            // Pattern: find fetch[Something]() optionally with a semicolon, possibly inside an arrow function
            // We only want to replace bare calls, e.g. "fetchSubscriptions();"
            // Let's use a regex that looks for lines starting with spaces then "fetch[A-Z][a-zA-Z]*();"

            const regex = /^(\s*)(fetch[A-Z][a-zA-Z0-9_]*\(\);?)$/gm;
            if (regex.test(content)) {
                content = content.replace(regex, (match, p1, p2) => {
                    // strip trailing semicolon if there is one
                    let call = p2.endsWith(';') ? p2.slice(0, -1) : p2;
                    return p1 + call + `.catch(err => console.error("Load failed", err));`;
                });
                modified = true;
            }

            if (modified) {
                fs.writeFileSync(fullPath, content);
                console.log('Modified:', fullPath);
            }
        }
    }
}

processDir('c:/xampp/htdocs/fsimanagementportal/src/app');
console.log('Done');
