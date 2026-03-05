const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/app/[role]/subscription/page.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

const s1 = `  useEffect(() => {
    // Optimistic state update`;
const e1 = `  }, [searchQuery]);`;

const blockStart = content.indexOf(s1);
const blockEnd = content.indexOf(e1, blockStart) + e1.length;

if (blockStart > -1 && blockEnd > -1) {
    const replacement = `  useEffect(() => {
    if (token) fetchSubscriptions();
  }, [fetchSubscriptions, token]);

  const processedData = useMemo(() => {
    let filtered = data;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(item => {
        const prod = ((item as any).product?.name || item.product_name || (item as any).product || "").toLowerCase();
        const cli = ((item as any).client?.name || item.client_name || (item as any).client || "").toLowerCase();
        return prod.includes(q) || cli.includes(q);
      });
    }
    return filtered;
  }, [data, searchQuery]);

  useEffect(() => {
    setTotalItems(processedData.length);
  }, [processedData.length]);

  const paginatedData = useMemo(() => {
    const start = pagination.page * pagination.rowsPerPage;
    return processedData.slice(start, start + pagination.rowsPerPage);
  }, [processedData, pagination.page, pagination.rowsPerPage]);`;

    content = content.substring(0, blockStart) + replacement + content.substring(blockEnd);

    // Now replace the fetchSubscriptions().catch correctly in handleSaveNew
    const fetchLine = 'fetchSubscriptions().catch(err => console.error("Load failed", err));';
    const fetchLineIdx = content.indexOf(fetchLine);
    if (fetchLineIdx > -1) {
        const optUpdate = `// Optimistic state update
        const newRecord = {
          ...payload,
          id: response.data?.id || Date.now(),
          ...(response.data || {}),
          isNewRecord: true
        };
        setData(prevData => [newRecord, ...prevData]);`;
        content = content.substring(0, fetchLineIdx) + optUpdate + content.substring(fetchLineIdx + fetchLine.length);
    }

    fs.writeFileSync(filePath, content);
    console.log("Success");
} else {
    console.error("block not found!");
}
