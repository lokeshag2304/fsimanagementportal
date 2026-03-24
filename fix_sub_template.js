const fs = require('fs');
const path = require('path');

const file = 'src/app/[role]/subscription/SubscriptionContent.tsx';
const filePath = path.join('c:/xampp/htdocs/fsimanagementportal', file);
let c = fs.readFileSync(filePath, 'utf8');

// Fix the template mess in new row
c = c.replace(/placeholder=\"Product\" \/\>\s*\n\s*\)\}\s*\n\s*\<\/div\>\<\/td\>/g, 'placeholder="Product" />\n                            </div>\n                          )}</td>');
c = c.replace(/placeholder=\"Client\" \/\>\s*\n\s*\<\/div\>\<\/td\>/g, 'placeholder="Client" />\n                            </div>\n                          </td>');
c = c.replace(/placeholder=\"Vendor\" \/\>\s*\n\s*\<\/div\>\<\/td\>/g, 'placeholder="Vendor" />\n                            </div>\n                          </td>');

fs.writeFileSync(filePath, c, 'utf8');
console.log('Fixed SubscriptionContent template errors');
