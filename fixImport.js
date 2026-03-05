const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/app/[role]/subscription/page.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

const s1 = `  const handleImportSuccess = async () => {
    console.log("IMPORT SUCCESS TRIGGERED");
    await fetchSubscriptions();
  };`;

const replacement = `  const handleImportSuccess = async (result?: any) => {
    console.log("IMPORT SUCCESS TRIGGERED", result);
    if (result) {
      const successCount = result.success_count ?? result.data?.success_count ?? 0;
      const dupCount = result.duplicate_count ?? result.data?.duplicate_count ?? 0;
      
      toast({
        title: "Success",
        description: \`\${dupCount} duplicates found. \${successCount} records stored.\`,
        variant: "default",
      });
    }
    await fetchSubscriptions();
  };`;

if (content.includes(s1)) {
    content = content.replace(s1, replacement);
    fs.writeFileSync(filePath, content);
    console.log("Success exact");
} else {
    // try regex
    const reg = /const handleImportSuccess = async \(\) => \{\s*console\.log\("IMPORT SUCCESS TRIGGERED"\);\s*await fetchSubscriptions\(\);\s*\};/m;
    if (reg.test(content)) {
        content = content.replace(reg, replacement);
        fs.writeFileSync(filePath, content);
        console.log("Success regex");
    } else {
        console.error("block not found!");
    }
}
