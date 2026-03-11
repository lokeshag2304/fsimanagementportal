const fs = require('fs');

const pagesToUpdate = [
    { path: 'src/app/[role]/ssl/page.tsx', endpoint: '/ssl' },
    { path: 'src/app/[role]/hosting/page.tsx', endpoint: '/hosting' },
    { path: 'src/app/[role]/counter/page.tsx', endpoint: '/counter' },
    { path: 'src/app/[role]/domains/page.tsx', endpoint: '/domains' },
    { path: 'src/app/[role]/sub-email/page.tsx', endpoint: '/emails' },
];

for (const { path, endpoint } of pagesToUpdate) {
    if (!fs.existsSync(path)) continue;
    let content = fs.readFileSync(path, 'utf8');

    // Replace import
    if (!content.includes('import api from "@/lib/axios"')) {
        content = content.replace(
            /import \{ apiService \} from "@\/common\/services\/apiService";/,
            `import api from "@/lib/axios";\nimport { apiService } from "@/common/services/apiService";`
        );
    }

    // 1. fetchRecords
    // The old code looks exactly like:
    /*
        const response = await apiService.listRecords(
          {
            record_type: 2, // SSL
            search: debouncedSearchQuery,
            page: pagination.page,
            rowsPerPage: pagination.rowsPerPage,
            orderBy: pagination.orderBy,
            orderDir: pagination.orderDir,
          },
          user,
          token,
        );
  
        if (response.status) {
          setData(response.data || []);
          setTotalItems(response.total || 0);
        } else {
    */
    const fetchPattern = /const response = await apiService\.listRecords\([\s\S]*?,\s*user,\s*token,?\s*\);\s*if\s*\(response\.status\)\s*\{\s*setData\(response\.data\s*\|\|\s*\[\]\);\s*setTotalItems\(response\.total\s*\|\|\s*0\);\s*\}/g;

    content = content.replace(fetchPattern,
        `const response = await api.get('${endpoint}', {
        headers: { Authorization: \`Bearer \${token}\` },
        params: {
          search: typeof debouncedSearchQuery !== 'undefined' ? debouncedSearchQuery : (typeof searchQuery !== 'undefined' ? searchQuery : ""),
          page: pagination.page + 1,
          rowsPerPage: pagination.rowsPerPage,
          orderBy: pagination.orderBy,
          orderDir: pagination.orderDir,
        }
      });
      
      const resData = response.data;
      if (resData) {
        if (resData.data && Array.isArray(resData.data)) {
          setData(resData.data);
          setTotalItems(resData.total || resData.data.length);
        } else if (Array.isArray(resData)) {
          setData(resData);
          setTotalItems(resData.length);
        } else {
          setData([]);
          setTotalItems(0);
        }
      }`

    );

    // 2. addRecord
    // OLD: const response = await apiService.addRecord(payload as any, user, token);
    content = content.replace(
        /const response = await apiService\.addRecord\((?:payload\s*as\s*any|payload),\s*user,\s*token\);/g,
        `const response = await api.post('${endpoint}', payload, { headers: { Authorization: \`Bearer \${token}\` } });\n      await fetch${path.split('/').slice(-2, -1)[0].replace(/\\-/g, '').toUpperCase()}Records(); // fallback refresh, maybe ignored if it doesn't match`
    );

    // let's manually replace the addRecord response handling so it doesn't use `.message` from response if it expects response.data
    // Actually, wait, response.message from `apiService` is response.data?.message with axios.
    // The existing code does `description: response.message || ...` which is WRONG if it's an axios response object (where it's response.data.message)
    content = content.replace(
        /description:\s*response\.message/g,
        'description: response.data?.message'
    );
    content = content.replace(
        /if\s*\((response\s+as\s+any)\.success\)/g,
        'if (response.data?.success || response.data?.status)'
    );

    // 3. editRecord
    content = content.replace(
        /const response = await apiService\.editRecord\((?:payload\s*as\s*any|payload),\s*user,\s*token\);/g,
        `const response = await api.put(\`${endpoint}/\${id}\`, payload, { headers: { Authorization: \`Bearer \${token}\` } });`
    );

    // 4. deleteRecords
    let endpointVar = '`${endpoint}/${delId}`';
    if (endpoint === '/emails') {
        endpointVar = '`/sub-email/${delId}`';
    }
    content = content.replace(
        /const response = await apiService\.deleteRecords\(\s*idsToDelete,\s*\d+,\s*user,\s*token,?\s*\);/g,
        `
      let deleteSuccessCount = 0;
      let deleteErrorMsg = "";
      for (const delId of idsToDelete) {
        try {
          const res = await api.delete(\`${endpoint}/\${delId}\`, { headers: { Authorization: \`Bearer \${token}\` } });
          if (res.data?.status || res.status === 200 || res.status === 204) deleteSuccessCount++;
        } catch (e: any) {
          deleteErrorMsg = e.response?.data?.message || "Error deleting";
        }
      }
      const response = { 
        data: {
          status: deleteSuccessCount > 0, 
          message: deleteSuccessCount > 0 ? \`Successfully deleted \${deleteSuccessCount} record(s)\` : deleteErrorMsg 
        }
      };`
    );
    // change response.status check for delete since delete provides an object
    // It handles if `response.status` (for old code) was true but wait, the replacement `const response` above has `data.status`
    // so we should change `if (response.status)` to `if (response.status || response.data?.status)` generally.
    content = content.replace(/if\s*\(response\.status\)/g, 'if (response.status === 200 || response.status === 201 || response.data?.status === true || response.status === true)');

    fs.writeFileSync(path, content, 'utf8');
}
