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
    if (file.includes('categaries-details')) {
        if (content.match(/render:\s*\(\s*valid_till:\s*any\s*\)\s*=>\s*formatDate\(valid_till\s*as\s*string\)/)) {
            content = content.replace(/render:\s*\(\s*valid_till:\s*any\s*\)\s*=>\s*formatDate\(valid_till\s*as\s*string\)/g, "render: (record: any) => formatDate(record.valid_till as string)");
            changed = true;
        }
        if (content.match(/valid_till:\s*\(val\) => formatDate\(val as string\)/)) {
            content = content.replace(/valid_till:\s*\(val\) => formatDate\(val as string\)/g, "render: (val: any) => formatDate(val.valid_till as string) as any");
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
        // If earlier replace caused syntax like `if ((response.data as any).success || response.data.status)` check it too.
        if (content.match(/if\s*\(\s*\(response\.data\s*as\s*any\)\.success\s*\|\|\s*response\.data\.status\s*\)/)) {
            // that's ok
        }
    }

    // Delete all remark_id duplicated additions
    if (content.includes('remark_id?: number | null;')) {
        // just remove ALL remark_id inside interface and add only once
        content = content.replace(/remark_id\?:\s*number\s*\|\s*null;/g, "");
        if (content.indexOf("interface CounterRecord {") !== -1) {
            content = content.replace("interface CounterRecord {", "interface CounterRecord { remark_id?: number | null;");
            changed = true;
        }
        if (content.indexOf("interface DomainRecord {") !== -1) {
            content = content.replace("interface DomainRecord {", "interface DomainRecord { remark_id?: number | null; deleted_at?: string;");
            changed = true;
        }
        if (content.indexOf("interface EmailRecord {") !== -1) {
            content = content.replace("interface EmailRecord {", "interface EmailRecord { remark_id?: number | null;");
            changed = true;
        }
        if (content.indexOf("interface Subscription {") !== -1) {
            content = content.replace("interface Subscription {", "interface Subscription { remark_id?: number | null;");
            changed = true;
        }
    } else {
        if (content.indexOf("interface CounterRecord {") !== -1) {
            content = content.replace("interface CounterRecord {", "interface CounterRecord { remark_id?: number | null;");
            changed = true;
        }
        if (content.indexOf("interface DomainRecord {") !== -1) {
            content = content.replace("interface DomainRecord {", "interface DomainRecord { remark_id?: number | null; deleted_at?: string;");
            changed = true;
        }
        if (content.indexOf("interface EmailRecord {") !== -1) {
            content = content.replace("interface EmailRecord {", "interface EmailRecord { remark_id?: number | null;");
            changed = true;
        }
        if (content.indexOf("interface Subscription {") !== -1) {
            content = content.replace("interface Subscription {", "interface Subscription { remark_id?: number | null;");
            changed = true;
        }
    }

    // Optional chaining on latest_remark.remark as string for hosting, ssl, domains
    if (content.match(/item\?\.latest_remark\?\.remark/g)) {
        content = content.replace(/value=\{editData\[item\.id\]\?\.remarks\s*\|\|\s*item\?\.latest_remark\?\.remark\}/g, "value={editData[item.id]?.remarks || (item?.latest_remark?.remark as string) || ''}");
        content = content.replace(/\{\s*item\?\.latest_remark\?\.remark\s*\}/g, "{(item?.latest_remark?.remark as string) || ''}");
        changed = true;
    }
    if (content.match(/item\.latest_remark\?\.remark/g)) {
        content = content.replace(/item\.latest_remark\?\.remark\s*\|\|/g, "(item.latest_remark?.remark as string) ||");
        changed = true;
    }

    // 5. Argument of type '"0" | "1"' is not assignable to parameter of type '0 | 1'.
    if (content.includes('domain_protected: newRecordData.domain_protected as 0 | 1,')) {
        content = content.replace('domain_protected: newRecordData.domain_protected as 0 | 1,', "domain_protected: Number(newRecordData.domain_protected) as 0 | 1,");
        changed = true;
    }
    if (content.match(/status:\s*newRecordData\.status\s*as\s*0\s*\|\s*1/)) {
        content = content.replace(/status:\s*newRecordData\.status\s*as\s*0\s*\|\s*1/g, "status: Number(newRecordData.status) as 0 | 1");
        changed = true;
    }

    // 6. Fix `vendor_name` in table Sort
    if (content.match(/onChange=\{\(val\) => handleSort\("vendor_name"\)\}/)) {
        content = content.replace(/onChange=\{\(val\) => handleSort\("vendor_name"\)\}/g, "onChange={(val: any) => handleSort('vendor_name' as any)}");
        changed = true;
    }
    if (content.match(/<ApiDropdown([^>]*)onChange=\{\(val\) => handleSort\("[^"]+"\)\}/)) {
        content = content.replace(/<ApiDropdown([^>]*)onChange=\{\(val\) => handleSort\("([^"]+)"\)\}/g, "<ApiDropdown$1onChange={(val: any) => handleSort('$2' as any)}");
        changed = true;
    }

    // 7. Render functions in Customer admin
    if (content.match(/render:\s*\(\s*_[^,]*,\s*index:\s*number\s*\)\s*=>/)) {
        content = content.replace(/render:\s*\(\s*_[^,]*,\s*index:\s*number\s*\)\s*=>\s*/g, "render: (item: any) => ");
        changed = true;
    }
    if (file.includes('user-management')) {
        // Just force replace `(_, index)` -> `(item: any)` since it's the `Column` component which only provides `item`.
        if (content.includes('(_, index) =>')) {
            content = content.replace(/\([^,]+,\s*index\)\s*=>/g, "(item: any) =>");
            changed = true;
        }
        if (content.includes('(_) =>')) {
            content = content.replace(/\(_\)\s*=>/g, "(item: any) =>");
            changed = true;
        }
    }

    // 8. Auth token string | null
    if (file.includes('auth')) {
        if (content.match(/localStorage\.setItem\('token',\s*response\.token\)/)) {
            content = content.replace(/localStorage\.setItem\('token',\s*response\.token\)/g, "localStorage.setItem('token', response.token || '')");
            changed = true;
        }
        if (content.match(/authApi\.resetPassword\(token,\s*data\.password\)/)) {
            content = content.replace(/authApi\.resetPassword\(token,\s*data\.password\)/g, "authApi.resetPassword(token as string, data.password)");
            changed = true;
        }
        if (content.match(/ref=\{\(el\) => \(otpRefs\.current\[index\] = el\)\}/)) {
            content = content.replace(/ref=\{\(el\) => \(otpRefs\.current\[index\] = el\)\}/g, "ref={(el) => { otpRefs.current[index] = el; }}");
            changed = true;
        }
    }

    if (file.includes('counter') && content.match(/val\s*===\s*record\.product_id/)) {
        content = content.replace(/val\s*===\s*record\.product_id/g, "String(val) === String(record.product_id)");
        changed = true;
    }

    if (file.includes('subscription') && content.match(/value:\s*item\.id\.toString\(\)/)) {
        content = content.replace(/value:\s*item\.id\.toString\(\)/g, "value: item.id");
        changed = true;
    }

    if (file.includes('sub-email') && content.includes('handleViewDetails(item: Subscription)')) {
        content = content.replace(/handleViewDetails\(item:\s*Subscription\)/g, "handleViewDetails(item: EmailRecord)");
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(file, content);
        console.log('Fixed:', file);
    }
}
