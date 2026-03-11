const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/app/[role]/subscription/page.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// The tricky part: extracting the <tr> node inside data.map
const startMapIdx = content.indexOf('data.map((item, index) => (');
if (startMapIdx === -1) {
    console.error("Could not find data.map block!");
    process.exit(1);
}

const trStart = content.indexOf('<tr', startMapIdx);
let openBraces = 0;
let trEnd = -1;

for (let i = trStart; i < content.length; i++) {
    const doubleChars = content.substring(i, i + 2);
    if (content.substr(i, 3) === '<tr') openBraces++;
    if (content.substr(i, 5) === '</tr>') {
        openBraces--;
        if (openBraces === 0) {
            trEnd = i + 5;
            break;
        }
    }
}

if (trEnd === -1) {
    console.error("Could not find end of <tr>");
    process.exit(1);
}

const trContent = content.substring(trStart, trEnd);

// Replace the original map with the row component usage
const replaceMap = `paginatedData.map((item, index) => (
                          <SubscriptionRow
                            key={item.id}
                            item={item}
                            index={index}
                            startItem={startItem}
                            selectedItems={selectedItems}
                            editingId={editingId}
                            highlightedRecordId={highlightedRecordId}
                            editData={editData}
                            handleSelectItem={handleSelectItem}
                            handleEditChange={handleEditChange}
                            handleStatusSelect={handleStatusSelect}
                            getSelectedStatusOption={getSelectedStatusOption}
                            handleSave={handleSave}
                            handleCancelEdit={handleCancelEdit}
                            handleViewDetails={handleViewDetails}
                            handleEdit={handleEdit}
                            handleDeleteClick={handleDeleteClick}
                            loadingProducts={loadingProducts}
                            statusOptions={statusOptions}
                            glassSelectStyles={glassSelectStyles}
                            getDaysToColor={getDaysToColor}
                            calculateDays={calculateDays}
                            formatDate={formatDate}
                            getProductNameById={getProductNameById}
                            isSaving={isSaving}
                          />`;

// Next, add the component definition above export default
const componentDef = `\nconst SubscriptionRow = React.memo(({
  item, index, startItem, selectedItems, editingId, highlightedRecordId, editData,
  handleSelectItem, handleEditChange, handleStatusSelect, getSelectedStatusOption,
  handleSave, handleCancelEdit, handleViewDetails, handleEdit, handleDeleteClick,
  loadingProducts, statusOptions, glassSelectStyles, 
  getDaysToColor, calculateDays, formatDate, getProductNameById, isSaving
}: any) => {
  return (
${trContent.split('\n').map(l => '    ' + l).join('\n')}
  );
});\n\n`;

content = content.substring(0, startMapIdx) + replaceMap + content.substring(trEnd);
const exportIdx = content.indexOf('export default function SubscriptionsPage');
content = content.substring(0, exportIdx) + componentDef + content.substring(exportIdx);

// Also add React.memo, useMemo, useCallback
content = content.replace('import { useState, useEffect, useRef } from "react";', 'import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";');

fs.writeFileSync(filePath, content);
console.log("Extraction and React.memo wrapper complete!");
