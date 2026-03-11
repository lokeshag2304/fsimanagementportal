const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/app/[role]/subscription/page.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// Replace fetchSubscriptions
const fetchSubStart = content.indexOf('const fetchSubscriptions = async () => {');
const fetchSubEnd = content.indexOf('};', fetchSubStart) + 2;

const newFetchSub = `const fetchSubscriptions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/subscriptions", {
        headers: { Authorization: \`Bearer \${token}\` },
      });
      if (Array.isArray(response.data)) {
        setData(response.data);
      } else if (Array.isArray(response.data?.data)) {
        setData(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
    } finally {
      setLoading(false);
    }
  }, [token]);`;

content = content.substring(0, fetchSubStart) + newFetchSub + content.substring(fetchSubEnd);

// Replace useEffects
const u1Start = content.indexOf('useEffect(() => {\n    fetchSubscriptions().catch(err => console.error("Load failed", err));');
const u2EndStr = '  }, [searchQuery]);';
const u2End = content.indexOf(u2EndStr, u1Start) + u2EndStr.length;

if (u1Start > -1 && u2End > -1) {
    const newUE = `useEffect(() => {
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

    content = content.substring(0, u1Start) + newUE + content.substring(u2End);
} else {
    console.log("Could not find useEffects");
}

// In handleSaveNew, remove fetchSubscriptions call
const fetchSubCall = 'fetchSubscriptions().catch(err => console.error("Load failed", err));';
const fetchReplaceIndex = content.indexOf(fetchSubCall);
if (fetchReplaceIndex > -1) {
    content = content.substring(0, fetchReplaceIndex) + `// Optimistic state update
        const newRecord = {
          ...payload,
          id: response.data?.id || Date.now(),
          ...(response.data || {}),
          isNewRecord: true
        };
        setData(prevData => [newRecord, ...prevData]);` + content.substring(fetchReplaceIndex + fetchSubCall.length);
}

fs.writeFileSync(filePath, content);
console.log("Hooks injected!");
