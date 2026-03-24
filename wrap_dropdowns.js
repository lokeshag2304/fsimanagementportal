const fs = require('fs');

const file = 'src/app/[role]/subscription/SubscriptionContent.tsx';
let content = fs.readFileSync(file, 'utf8');

const stringsToReplace = [
  'endpoint="get-products"',
  'endpoint="get-clients"',
  'endpoint="get-venders"' // wait "venders" is used there
];

let replaced = 0;

// Use regex to locate each <ApiDropdown ... /> block ONLY inside addingNew row
// "addingNew && (" is an indicator, but wait, those dropdowns are only in addingNew or inline editing.
// The user specified "in the new entry row of the Subscription table display in a single line".
// Let's just wrap it in the addingNew block.

// We can just use an AST-like search to find the <ApiDropdown> in the addingNew block.
// Or just regex matching:
content = content.replace(
  /\<ApiDropdown\s+label=""\s+endpoint="get-products"([\s\S]+?)placeholder="Product"\s*\/\>/,
  '<div className="whitespace-nowrap overflow-hidden text-ellipsis min-w-[180px] max-w-[220px]"><ApiDropdown label="" endpoint="get-products"$1placeholder="Product" /></div>'
);

content = content.replace(
  /\<ApiDropdown\s+label=""\s+endpoint="get-clients"([\s\S]+?)placeholder="Client"\s*\/\>/,
  '<div className="whitespace-nowrap overflow-hidden text-ellipsis min-w-[180px] max-w-[220px]"><ApiDropdown label="" endpoint="get-clients"$1placeholder="Client" /></div>'
);

content = content.replace(
  /\<ApiDropdown\s+label=""\s+endpoint="get-venders"([\s\S]+?)placeholder="Vendor"\s*\/\>/,
  '<div className="whitespace-nowrap overflow-hidden text-ellipsis min-w-[180px] max-w-[220px]"><ApiDropdown label="" endpoint="get-venders"$1placeholder="Vendor" /></div>'
);

fs.writeFileSync(file, content, 'utf8');
console.log("Replaced");
