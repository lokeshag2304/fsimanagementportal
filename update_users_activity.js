const fs = require('fs');

let path = 'src/app/[role]/users/page.tsx';
if (fs.existsSync(path)) {
    let content = fs.readFileSync(path, 'utf8');

    // Replace import axios for user
    if (!content.includes('import api from "@/lib/axios"')) {
        content = content.replace(
            /import axios from "@\/lib\/axios"/,
            `import api from "@/lib/axios"\nimport axios from "@/lib/axios"`
        );
    }

    // 1. fetchUsers
    content = content.replace(
        /const response = await axios\.post<UsersResponse>\([\s\S]*?`\$\{BASE_URL\}\/secure\/Usermanagement\/get-clients-user-list`,[\s\S]*?\{[\s\S]*?type:\s*2,[\s\S]*?\},[\s\S]*?\{[\s\S]*?\}[\s\S]*?\)/,
        `const response = await api.get('/users', {
        headers: { 'Authorization': \`Bearer \${token}\`, 'Content-Type': 'application/json' },
        params: {
          type: 2,
          page: pagination.page + 1,
          rowsPerPage: pagination.rowsPerPage,
          order: pagination.order,
          orderBy: pagination.orderBy,
          search: searchQuery
        }
      })`
    );

    // 2. fetchUserDetails
    content = content.replace(
        /const response = await axios\.post<UserDetailsResponse>\([\s\S]*?`\$\{BASE_URL\}\/secure\/Usermanagement\/get-clients-user-details`,\s*\{\s*id\s*\},[\s\S]*?\{[\s\S]*?\}[\s\S]*?\)/,
        `const response = await api.get(\`/users/\${id}\`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${token}\`
        }
      })`
    );

    // 3. deleteUsers
    content = content.replace(
        /const response = await axios\.post<ApiResponse>\([\s\S]*?`\$\{BASE_URL\}\/secure\/Usermanagement\/get-clients-user-delete`,[\s\S]*?\{\s*ids:\s*idsToDelete,[\s\S]*?\}[\s\S]*?\{[\s\S]*?\}[\s\S]*?\)/,
        `// use loop over idsToDelete
      let deleteSuccessCount = 0;
      let deleteErrorMsg = "";
      for (const delId of idsToDelete) {
        try {
          const res = await api.delete(\`/users/\${delId}\`, { headers: { Authorization: \`Bearer \${token}\` } });
          if (res.data?.status || res.status === 200 || res.status === 204) deleteSuccessCount++;
        } catch (e: any) {
          deleteErrorMsg = e.response?.data?.message || "Error deleting";
        }
      }
      const response = { 
        data: {
            status: deleteSuccessCount > 0, 
            message: deleteSuccessCount > 0 ? \`Successfully deleted \${deleteSuccessCount} user(s)\` : deleteErrorMsg 
        }
      };`
    );

    // 4. handleSubmit (Add / Edit)
    content = content.replace(
        /if\s*\(editingUser\)\s*\{[\s\S]*?endpoint\s*=\s*`\$\{BASE_URL\}\/secure\/Usermanagement\/update-clients-user`[\s\S]*?formDataToSend\.append\('id',\s*editingUser\.id\.toString\(\)\)[\s\S]*?formDataToSend\.append\('type',\s*'2'\)[\s\S]*?\}\s*else\s*\{[\s\S]*?endpoint\s*=\s*`\$\{BASE_URL\}\/secure\/Usermanagement\/add-clients-user`[\s\S]*?\}/,
        `if (editingUser) {
        endpoint = \`/users/\${editingUser.id}\`;
        formDataToSend.append('_method', 'PUT'); // usually Laravel accepts PUT via _method with formData
      } else {
        endpoint = \`/users\`;
      }`
    );

    content = content.replace(
        /const response = await axios\.post<ApiResponse>\([\s\S]*?endpoint,[\s\S]*?formDataToSend,[\s\S]*?\{[\s\S]*?\}[\s\S]*?\)/,
        `const response = await api.post(
        endpoint,
        formDataToSend,
        {
          headers: {
            'Authorization': \`Bearer \${token}\`,
            'Content-Type': 'multipart/form-data'
          }
        }
      )`
    );

    fs.writeFileSync(path, content, 'utf8');
}

path = 'src/app/[role]/activity/page.tsx';
if (fs.existsSync(path)) {
    let content = fs.readFileSync(path, 'utf8');

    // Replace import axios for activity
    if (!content.includes('import api from "@/lib/axios"')) {
        content = content.replace(
            /import axios from "@\/lib\/axios"/,
            `import api from "@/lib/axios"\nimport axios from "@/lib/axios"`
        );
    }

    // fetchActivities
    content = content.replace(
        /const response = await axios\.post\([\s\S]*?`\$\{BASE_URL\}\/secure\/Activites\/Get-acitivites`,[\s\S]*?\{[\s\S]*?admin_id:\s*user\?\.id,[\s\S]*?\},[\s\S]*?\{[\s\S]*?\}[\s\S]*?\)/,
        `const response = await api.get('/activity', {
        headers: {
          'Authorization': \`Bearer \${token}\`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        params: {
          admin_id: user?.id,
          page: pagination.page + 1,
          rowsPerPage: pagination.rowsPerPage,
          search: searchQuery,
          orderBy: "id",
          order: "desc"
        }
      })`
    );

    // also fix if response returns rows in data vs response.data
    // Currently: if (response.data && response.data.rows) { setActivities(response.data.rows) }
    content = content.replace(
        /if\s*\(response\.data\s*&&\s*response\.data\.rows\)\s*\{[\s\S]*?setActivities\(response\.data\.rows\)[\s\S]*?setTotalItems\(response\.data\.total\s*\|\|\s*0\)[\s\S]*?\}\s*else\s*\{/,
        `if (response.data && response.data.rows) {
        setActivities(response.data.rows)
        setTotalItems(response.data.total || 0)
      } else if (response.data && Array.isArray(response.data.data)) {
        setActivities(response.data.data)
        setTotalItems(response.data.total || 0)
      } else if (Array.isArray(response.data)) {
        setActivities(response.data)
        setTotalItems(response.data.length || 0)
      } else {`
    );

    fs.writeFileSync(path, content, 'utf8');
}
