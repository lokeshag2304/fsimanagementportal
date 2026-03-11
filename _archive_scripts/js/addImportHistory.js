const fs = require('fs');
const path = require('path');

const files = [
    'src/app/[role]/ssl/page.tsx',
    'src/app/[role]/domains/page.tsx',
    'src/app/[role]/hosting/page.tsx',
    'src/app/[role]/sub-email/page.tsx',
    'src/app/[role]/counter/page.tsx'
];

const moduleConfigs = {
    'ssl': { endpoint: '/ssl/import', recordType: 2, title: 'Import SSL Certificates', fetchFn: 'fetchSSLRecords' },
    'domains': { endpoint: '/domains/import', recordType: 3, title: 'Import Domains', fetchFn: 'fetchDomainRecords' },
    'hosting': { endpoint: '/hostings/import', recordType: 4, title: 'Import Hosting', fetchFn: 'fetchHostingRecords' },
    'sub-email': { endpoint: '/emails/import', recordType: 5, title: 'Import Emails', fetchFn: 'fetchEmailRecords' },
    'counter': { endpoint: '/counter/import', recordType: 6, title: 'Import Counter', fetchFn: 'fetchCounterRecords' }
};

for (const relPath of files) {
    const fullPath = path.resolve(__dirname, relPath);
    if (!fs.existsSync(fullPath)) {
        console.log(`Skipping ${fullPath} (does not exist)`);
        continue;
    }

    let content = fs.readFileSync(fullPath, 'utf8');

    // 1. Ensure lucide-react imports Upload and History
    const lucideMatch = content.match(/from\s+["']lucide-react["']/);
    if (lucideMatch) {
        const lucideStart = content.lastIndexOf('{', lucideMatch.index);
        const lucideEnd = content.indexOf('}', lucideStart);
        let lucideContent = content.substring(lucideStart, lucideEnd);
        if (!lucideContent.includes('Upload')) lucideContent = lucideContent.replace('{', '{ Upload,');
        if (!lucideContent.includes('History')) lucideContent = lucideContent.replace('{', '{ History,');
        content = content.substring(0, lucideStart) + lucideContent + content.substring(lucideEnd);
    }

    // 2. Ensure ImportModal is imported
    if (!content.includes('import { ImportModal }')) {
        content = content.replace(/(import.*from.*lucide-react["'];?\n)/, '$1import { ImportModal } from "@/components/ImportModal";\n');
    }

    // 3. Ensure HistoryModal is imported
    if (!content.includes('import { HistoryModal }')) {
        content = content.replace(/(import.*from.*lucide-react["'];?\n)/, '$1import { HistoryModal } from "@/components/HistoryModal";\n');
    }

    // Determine module
    const moduleName = Object.keys(moduleConfigs).find(k => relPath.includes(`/${k}/`));
    if (!moduleName) continue;
    const config = moduleConfigs[moduleName];

    // 4. State
    if (!content.includes('const [isImportOpen, setIsImportOpen]')) {
        content = content.replace('const [editingId, setEditingId]', 'const [isImportOpen, setIsImportOpen] = useState(false);\n  const [isHistoryOpen, setIsHistoryOpen] = useState(false);\n  const [editingId, setEditingId]');
    }

    // 5. handleImportSuccess function insertion
    if (!content.includes('handleImportSuccess =')) {
        const insertAfter = 'const handleCancelAdd = () => {';
        const funcCode = `
  const handleImportSuccess = async (response?: any) => {
    if (response?.data?.status === true || response?.status === true || response?.success === true || response?.data?.success === true) {
      toast({
        title: "Success",
        description: response?.data?.message || response?.message || "Import successful",
        variant: "default",
      });
      setIsImportOpen(false);
      
      const newRecords = response?.data?.data || response?.data || response?.records;
      if (Array.isArray(newRecords) && newRecords.length > 0) {
        setData(prev => [...newRecords, ...prev]);
        setTotalItems(prev => prev + newRecords.length);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        await ${config.fetchFn}();
      }
    }
  };

  `;
        content = content.replace(insertAfter, funcCode + insertAfter);
    }

    // 6. Fix JSX for buttons and modals
    // Replace the old export/import block
    const oldButtonsRegex = /<GlassButton\s+variant="primary"\s+onClick=\{handleExport\}[^>]*>[\s\S]*?(?:<\/GlassButton>)\s*(?:<ImportModal[^>]*>)?/g;

    const replacementJSX = `<GlassButton
                  variant="primary"
                  onClick={handleExport}
                  className="flex items-center gap-2"
                  disabled={exportLoading}
                >
                  {exportLoading ? ("Exporting...") : (" Export")}
                </GlassButton>
                <GlassButton
                  variant="primary"
                  onClick={() => setIsImportOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Import
                </GlassButton>
                <button
                  onClick={() => setIsHistoryOpen(true)}
                  className="px-4 py-2 bg-gray-800 text-white rounded flex items-center gap-2 transition-colors hover:bg-gray-700 font-medium text-sm"
                >
                  <History className="w-4 h-4" />
                  History
                </button>
                <ImportModal recordType={${config.recordType}} title="${config.title}" isOpen={isImportOpen} setIsOpen={setIsImportOpen} onSuccess={handleImportSuccess} endpoint="${config.endpoint}" />
                <HistoryModal isOpen={isHistoryOpen} setIsOpen={setIsHistoryOpen} entity="${moduleName}" />`;


    content = content.replace(oldButtonsRegex, replacementJSX);

    fs.writeFileSync(fullPath, content);
    console.log(`Updated ${relPath}`);
}
