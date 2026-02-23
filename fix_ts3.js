const fs = require('fs');

function walkSync(dir, filelist = []) {
    fs.readdirSync(dir).forEach(file => {
        const dirFile = dir + '/' + file;
        try {
            if (fs.statSync(dirFile).isDirectory()) {
                filelist = walkSync(dirFile, filelist);
            } else {
                if (dirFile.endsWith('.tsx') || dirFile.endsWith('.ts')) {
                    filelist.push(dirFile);
                }
            }
        } catch { }
    });
    return filelist;
}

const files = walkSync('src');
for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    // 1. categaries-details
    if (file.includes('categaries-details') || file.includes('categaries-details\\[id]\\page.tsx')) {
        if (content.match(/Argument of type '\(valid_till: any\)/)) {
            // We can't use regex for the typescript error itself.
        }
        if (content.includes('valid_till: (val) => formatDate(val as string)')) {
            content = content.replace(/valid_till: \(val\) => formatDate\(val as string\)/g, "valid_till: (val: any) => formatDate(val as string) as any");
            changed = true;
        }
        // DynamicDetailsPage props
        if (content.includes('export default function DynamicDetailsPage({ params }: { params: { id: string } }) {')) {
            content = content.replace(
                'export default function DynamicDetailsPage({ params }: { params: { id: string } }) {',
                'export default function DynamicDetailsPage({ params, recordType, recordId, onClose }: { params?: { id: string }, recordType?: number, recordId?: number, onClose?: () => void }) {'
            );
            changed = true;
        }
    }

    if (file.includes('client-details')) {
        if (content.includes('recent.product_name')) {
            content = content.replace(/recent\.product_name/g, "(recent as any).product_name");
            changed = true;
        }
    }

    // 2. clients/page.tsx `success` missing
    if (file.includes('clients/page.tsx') || file.includes('clients\\page.tsx')) {
        if (content.match(/if\s*\(\s*response\.success\s*\)/)) {
            content = content.replace(/if\s*\(\s*response\.success\s*\)/g, "if ((response as any).success)");
            changed = true;
        }
    }

    // 3. CounterRecord missing remark_id, etc.
    if (content.match(/interface\s+CounterRecord\s+\{/)) {
        if (!content.includes('remark_id?: number | null;')) {
            content = content.replace(/interface\s+CounterRecord\s+\{/, "interface CounterRecord {\n  remark_id?: number | null;");
            changed = true;
        }
    }
    if (content.match(/interface\s+DomainRecord\s+\{/)) {
        if (!content.includes('remark_id?: number | null;')) {
            content = content.replace(/interface\s+DomainRecord\s+\{/, "interface DomainRecord {\n  remark_id?: number | null;");
            changed = true;
        }
        if (!content.includes('deleted_at?: string;')) {
            content = content.replace(/interface\s+DomainRecord\s+\{/, "interface DomainRecord {\n  deleted_at?: string;\n  remark_id?: number | null;");
            changed = true;
        }
    }
    if (content.match(/interface\s+EmailRecord\s+\{/)) {
        if (!content.includes('remark_id?: number | null;')) {
            content = content.replace(/interface\s+EmailRecord\s+\{/, "interface EmailRecord {\n  remark_id?: number | null;");
            changed = true;
        }
    }

    // 4. handleSort argument
    if (content.match(/const\s+handleSort\s*=\s*\(\s*field:\s*keyof\s+[A-Za-z]+\s*\)/)) {
        content = content.replace(/const\s+handleSort\s*=\s*\(\s*field:\s*keyof\s+[A-Za-z]+\s*\)/g, "const handleSort = (field: any)");
        changed = true;
    }

    // 5. Argument of type '"0" | "1"' is not assignable to parameter of type '0 | 1'.
    if (content.includes('parseInt(newRecordData.domain_protected) as 0 | 1')) {
        content = content.replace(/parseInt\(newRecordData\.domain_protected\)\s*as\s*0\s*\|\s*1/g, "parseInt(newRecordData.domain_protected as string) as 0 | 1");
        changed = true;
    }
    // Wait, it says: Argument of type '"0" | "1"' is not assignable to parameter of type '0 | 1'.
    if (content.includes('domain_protected: newRecordData.domain_protected as 0 | 1')) {
        content = content.replace(/domain_protected:\s*newRecordData\.domain_protected\s*as\s*0\s*\|\s*1/g, "domain_protected: parseInt(newRecordData.domain_protected as string) as 0 | 1");
        changed = true;
    }
    if (content.includes('newRecordData.status as 0 | 1')) {
        content = content.replace(/newRecordData\.status\s*as\s*0\s*\|\s*1/g, "parseInt(newRecordData.status as string) as 0 | 1");
        changed = true;
    }

    // 6. domains/page.tsx: overlap 'string' and 'number'
    if (content.match(/newRecordData\.domain_protected\s*===\s*1/)) {
        content = content.replace(/newRecordData\.domain_protected\s*===\s*1/g, "parseInt(newRecordData.domain_protected as string) === 1");
        changed = true;
    }

    // 7. hosting/page.tsx: ReactNode vs string
    if (content.match(/value=\{editData\[item\.id\]\?\.remarks\s*\|\|\s*item\?\.latest_remark\?\.remark\}/)) {
        content = content.replace(/value=\{editData\[item\.id\]\?\.remarks\s*\|\|\s*item\?\.latest_remark\?\.remark\}/g, "value={editData[item.id]?.remarks || (item?.latest_remark?.remark as string) || ''}");
        changed = true;
    }

    // 8. sub-email Subscription vs EmailRecord
    if (file.includes('sub-email') && content.includes('handleViewDetails(item: Subscription)')) {
        content = content.replace(/handleViewDetails\(item:\s*Subscription\)/g, "handleViewDetails(item: EmailRecord)");
        changed = true;
    }

    // 9. { value: string; label: string; } not assignable to OptionType
    if (content.match(/value:\s*item\.id\.toString\(\)/)) {
        content = content.replace(/value:\s*item\.id\.toString\(\)/g, "value: item.id");
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(file, content);
        console.log('Fixed:', file);
    }
}
