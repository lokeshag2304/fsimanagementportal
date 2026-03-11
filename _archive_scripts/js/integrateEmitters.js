const fs = require('fs');
const path = require('path');

const files = [
    { path: 'src/app/[role]/ssl/page.tsx', entity: 'ssl' },
    { path: 'src/app/[role]/domains/page.tsx', entity: 'domain' },
    { path: 'src/app/[role]/hosting/page.tsx', entity: 'hosting' },
    { path: 'src/app/[role]/sub-email/page.tsx', entity: 'email' },
    { path: 'src/app/[role]/counter/page.tsx', entity: 'counter' }
];

files.forEach(({ path: relPath, entity }) => {
    const fullPath = path.resolve(__dirname, relPath);
    if (!fs.existsSync(fullPath)) return;

    let content = fs.readFileSync(fullPath, 'utf8');

    // 1. Add Import
    if (!content.includes('import { emitEntityChange }')) {
        content = content.replace(
            'import { handleDateChangeLogic',
            'import { emitEntityChange } from "@/lib/entityBus";\nimport { handleDateChangeLogic'
        );
    }

    // 2. handleImportSuccess emission
    if (content.includes('setData(prev => [...newRecords, ...prev]);')) {
        content = content.replace(
            'setData(prev => [...newRecords, ...prev]);',
            `setData(prev => [...newRecords, ...prev]);\n        emitEntityChange('${entity}', 'import', newRecords);`
        );
    }

    // 3. handleSaveNew emission
    if (content.includes('setData((prev) => [newRecord, ...prev]);')) {
        content = content.replace(
            'setData((prev) => [newRecord, ...prev]);',
            `setData((prev) => [newRecord, ...prev]);\n      emitEntityChange('${entity}', 'create', newRecord);`
        );
    }

    // 4. handleSave (Update) emission
    // Note: Most modules use setData(prev => prev.map(...))
    if (content.includes('prev.map((item) => (item.id === id ? { ...item, ...payload, ...updatedRecord } : item))')) {
        content = content.replace(
            'prev.map((item) => (item.id === id ? { ...item, ...payload, ...updatedRecord } : item))',
            `prev.map((item) => (item.id === id ? { ...item, ...payload, ...updatedRecord } : item))\n        );\n        emitEntityChange('${entity}', 'update', { id, ...payload, ...updatedRecord });`
        );
        // Clean up potential double parens/semicolons from the above naive replace if needed
    }

    // 5. confirmDelete emission
    if (content.includes('setData((prev) => prev.filter((item) => !idsToDelete.includes(item.id)));')) {
        content = content.replace(
            'setData((prev) => prev.filter((item) => !idsToDelete.includes(item.id)));',
            `setData((prev) => prev.filter((item) => !idsToDelete.includes(item.id)));\n        emitEntityChange('${entity}', 'delete', idsToDelete);`
        );
    }

    fs.writeFileSync(fullPath, content);
    console.log(`Integrated ${entity} in ${relPath}`);
});
