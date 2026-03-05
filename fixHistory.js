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
    if (!c.includes('HistoryModal } from')) {
        c = c.replace('import { ImportModal } from "@/components/ImportModal";', 'import { ImportModal } from "@/components/ImportModal";\nimport { HistoryModal } from "@/components/HistoryModal";');
        c = c.replace('import { ImportModal } from "@/components/ImportModal"\r\n', 'import { ImportModal } from "@/components/ImportModal"\r\nimport { HistoryModal } from "@/components/HistoryModal"\r\n');
        c = c.replace('import { ImportModal } from "@/components/ImportModal"\n', 'import { ImportModal } from "@/components/ImportModal"\nimport { HistoryModal } from "@/components/HistoryModal"\n');
        fs.writeFileSync(f, c);
    }
});
console.log("Fixed again!");
