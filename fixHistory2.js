const fs = require('fs');
const files = [
    'src/app/[role]/ssl/page.tsx',
    'src/app/[role]/domains/page.tsx',
    'src/app/[role]/hosting/page.tsx',
    'src/app/[role]/sub-email/page.tsx',
    'src/app/[role]/counter/page.tsx'
];
files.forEach(f => {
    let c = fs.readFileSync(f, 'utf8');
    if (!c.includes('HistoryModal')) {
        console.log("Adding HistoryModal to " + f);
    }
    // Let's forcefully replace line 7's ImportModal with both
    if (!c.includes('import { HistoryModal } from "@/components/HistoryModal"')) {
        c = c.replace(/import\s+\{\s*ImportModal\s*\}.*/g, 'import { ImportModal } from "@/components/ImportModal"\nimport { HistoryModal } from "@/components/HistoryModal"');
        fs.writeFileSync(f, c);
    }
});
console.log("Done checking HistoryModal imports.");
