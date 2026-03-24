const fs = require('fs');

const file = 'src/app/[role]/subscription/SubscriptionContent.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /\<td className="py-3 px-4"\>\s*\<div className="w-full"\>\s*\<GlassSelect\s+options=\{statusOptions\}/g,
  '<td className="py-3 px-4">\n                          <div className="whitespace-nowrap overflow-hidden text-ellipsis min-w-[180px] max-w-[220px] select-value-wrapper">\n                            <GlassSelect\n                              options={statusOptions}'
);

fs.writeFileSync(file, content, 'utf8');
console.log("Replaced GlassSelect");
