const fs = require('fs');
const path = require('path');

const config = [
    { path: 'src/app/[role]/ssl/page.tsx', entity: 'ssl', fetchFn: 'fetchSSLRecords' },
    { path: 'src/app/[role]/domains/page.tsx', entity: 'domain', fetchFn: 'fetchDomainRecords' },
    { path: 'src/app/[role]/hosting/page.tsx', entity: 'hosting', fetchFn: 'fetchHostingRecords' },
    { path: 'src/app/[role]/sub-email/page.tsx', entity: 'email', fetchFn: 'fetchEmailRecords' },
    { path: 'src/app/[role]/counter/page.tsx', entity: 'counter', fetchFn: 'fetchCounterRecords' }
];

config.forEach(({ path: relPath, entity, fetchFn }) => {
    const fullPath = path.resolve(__dirname, relPath);
    if (!fs.existsSync(fullPath)) return;

    let c = fs.readFileSync(fullPath, 'utf8');

    // Ensure Import
    if (!c.includes('emitEntityChange } from')) {
        c = c.replace('import { handleDateChangeLogic', 'import { emitEntityChange } from "@/lib/entityBus";\nimport { handleDateChangeLogic');
    }

    // Handle Save (Update) - Replacement
    const updateSearch = new RegExp(`if \\((?:response\\.status === 200 || response\\.status === 201 || response\\.data\\?\\.status === true || response\\.status === true)\\) \\{[\\s\\S]*?await ${fetchFn}\\(\\);`, 'g');
    const updateReplace = `if (response.status === 200 || response.status === 201 || response.data?.status === true || response.status === true) {
        toast({
          title: "Success",
          description: response.data?.message || "${entity.toUpperCase()} updated successfully",
          variant: "default",
        });
        const updatedRecord = response.data?.data || {};
        setData((prev) =>
          prev.map((item) => (item.id === id ? { ...item, ...payload, ...updatedRecord } : item))
        );
        emitEntityChange('${entity}', 'update', { id, ...payload, ...updatedRecord });
        setEditingId(null);
        setEditData({});`;
    c = c.replace(updateSearch, updateReplace);

    // Handle Delete - Replacement
    const deleteSearch = new RegExp(`if \\(deleteSuccessCount > 0\\) \\{[\\s\\S]*?await ${fetchFn}\\(\\);`, 'g');
    const deleteReplace = `if (deleteSuccessCount > 0) {
        toast({
          title: "Success",
          description: \`Successfully deleted \${deleteSuccessCount} record(s)\`,
          variant: "default"
        })
        const idsToDelete = itemToDelete ? [itemToDelete] : selectedItems;
        setData((prev) => prev.filter((item) => !idsToDelete.includes(item.id)));
        setTotalItems((prev) => prev - idsToDelete.length);
        setSelectedItems([]);
        setItemToDelete(null);
        emitEntityChange('${entity}', 'delete', idsToDelete);`;
    c = c.replace(deleteSearch, deleteReplace);

    // Handle Import Success
    if (c.includes('setData(prev => [...newRecords, ...prev]);')) {
        if (!c.includes(`emitEntityChange('${entity}', 'import'`)) {
            c = c.replace(
                'setData(prev => [...newRecords, ...prev]);',
                `setData(prev => [...newRecords, ...prev]);\n        emitEntityChange('${entity}', 'import', newRecords);`
            );
        }
    }

    // Handle Save New
    if (c.includes('setData((prev) => [newRecord, ...prev]);')) {
        if (!c.includes(`emitEntityChange('${entity}', 'create'`)) {
            c = c.replace(
                'setData((prev) => [newRecord, ...prev]);',
                `setData((prev) => [newRecord, ...prev]);\n        emitEntityChange('${entity}', 'create', newRecord);`
            );
        }
    }

    fs.writeFileSync(fullPath, c);
    console.log(`Finalized ${entity}`);
});
