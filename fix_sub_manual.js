const fs = require('fs');
const path = require('path');

const file = 'src/app/[role]/subscription/SubscriptionContent.tsx';
const filePath = path.join('c:/xampp/htdocs/fsimanagementportal', file);
let c = fs.readFileSync(filePath, 'utf8');

// Fix 1: Status edit mode
c = c.replace(/styles=\{glassSelectStyles\}\s*\n\s*\/\>\s*\n\s*\n\s*\<\/td\>/g, 'styles={glassSelectStyles}\n              />\n            </div>\n          </td>');

// Fix 2: Status view mode
c = c.replace(/\{Number\(item\.status\) === 1 \? \"Active\" : \"Inactive\"\}\s*\n\s*\n\s*\<\/td\>\s*\n\s*\)\}/g, '{Number(item.status) === 1 ? "Active" : "Inactive"}\n            </div>\n          </td>\n        )}');

fs.writeFileSync(filePath, c, 'utf8');
console.log('Manually fixed SubscriptionContent');
