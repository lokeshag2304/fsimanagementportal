"use client";
import React, { useState, useEffect } from "react";
import { X, History, Clock, Trash2, Download } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";

interface HistoryModalProps {
    isOpen: boolean;
    setIsOpen: (val: boolean) => void;
    entity: string; // e.g. "domain", "ssl", "hosting", "email", "counter"
}

export function HistoryModal({ isOpen, setIsOpen, entity }: HistoryModalProps) {
    const { getToken } = useAuth();
    const token = getToken();

    const [historyData, setHistoryData] = useState<any[]>([]);
    const [historyPage, setHistoryPage] = useState(1);
    const [historyTotalPages, setHistoryTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);

    const fetchHistory = async (page = 1) => {
        try {
            setLoading(true);
            const endpoint = entity === "subscription"
                ? `/import-export-history?page=${page}`
                : `/history?entity=${entity}&page=${page}`;

            const response = await api.get(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.data?.data && Array.isArray(response.data.data)) {
                setHistoryData(response.data.data);
                setHistoryTotalPages(response.data.last_page || 1);
                setHistoryPage(response.data.current_page || page);
            } else if (Array.isArray(response.data)) {
                setHistoryData(response.data);
                setHistoryTotalPages(1);
            } else {
                setHistoryData([]);
            }
        } catch (error) {
            console.error(`Error fetching history for ${entity}:`, error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteHistory = async (id: number) => {
        try {
            const endpoint = entity === "subscription"
                ? `/import-export-history/${id}`
                : `/history/${id}?entity=${entity}`; // Add entity param for backend if needed

            await api.delete(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
            });
            fetchHistory(historyPage);
        } catch (error) {
            console.error("Error deleting history log:", error);
        }
    };

    const handleDownloadFile = async (item: any) => {
        const downloadUrl = item.download_url || item.file_url;

        if (downloadUrl) {
            // Use browser download for direct URLs
            const link = document.createElement("a");
            link.href = downloadUrl;
            link.setAttribute("download", item.file_name || "download");
            link.target = "_blank";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            return;
        }

        try {
            const endpoint = `/import-export-history/${item.id}/download`;

            const response = await api.get(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: "blob",
            });

            const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = blobUrl;
            link.setAttribute("download", item.file_name || "downloaded-file");
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error("Error downloading file:", error);
            alert("File is not available for download or an error occurred.");
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchHistory(historyPage);
        }
    }, [isOpen, historyPage]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-md shadow-2xl flex flex-col max-h-[85vh]">
                <div className="p-5 border-b flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-800">Import/Export History</h2>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-5 overflow-y-auto flex-1">
                    {loading && historyData.length === 0 ? (
                        <div className="text-center py-8">
                            <span className="text-gray-500">Loading history...</span>
                        </div>
                    ) : historyData.length === 0 ? (
                        <div className="text-center py-8">
                            <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500">No history logs found.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {historyData.map((item: any) => (
                                <div key={item.id} className="border border-gray-100 rounded-lg p-3 bg-gray-50 relative group flex items-start justify-between">
                                    <div className="pr-16 w-full">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider text-white ${item.action?.toLowerCase() === 'import' ? 'bg-emerald-500' : 'bg-blue-500'}`}>
                                                {item.action || 'Unknown'}
                                            </span>
                                            <span className="text-sm font-semibold text-gray-700">
                                                {item.user?.name || item.user_name || "Unknown User"}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-sm text-gray-600 truncate flex-1">
                                                <span className="font-medium">File:</span> {item.file_name || 'N/A'}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-4 mt-2">
                                            <div className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                                                <span className="font-semibold">{item.inserted_count ?? item.successful_rows ?? 0}</span> Inserted
                                            </div>
                                            <div className="flex items-center gap-1 text-xs text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                                                <span className="font-semibold">{item.failed_count ?? item.failed_rows ?? 0}</span> Failed
                                            </div>
                                            {(item.duplicates > 0 || item.duplicates_count > 0) && (
                                                <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                                                    <span className="font-semibold">{item.duplicates ?? item.duplicates_count ?? 0}</span> Duplicates
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 mt-2.5">
                                            <p className="text-xs text-gray-400 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {new Date(item.created_at).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1 absolute top-3 right-3 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-all">
                                        {(item.duplicate_file || item.duplicates > 0) && (
                                            <button
                                                onClick={() => {
                                                    const downloadEndpoint = `/import-export-history/${item.id}/download-duplicates`;

                                                    api.get(downloadEndpoint, {
                                                        headers: { Authorization: `Bearer ${token}` },
                                                        responseType: 'blob'
                                                    }).then(response => {
                                                        const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
                                                        const link = document.createElement("a");
                                                        link.href = blobUrl;
                                                        link.setAttribute("download", `duplicates_${item.file_name || 'file.xlsx'}`);
                                                        document.body.appendChild(link);
                                                        link.click();
                                                        link.parentNode?.removeChild(link);
                                                        window.URL.revokeObjectURL(blobUrl);
                                                    }).catch(err => {
                                                        console.error("Error downloading duplicates:", err);
                                                        alert("Duplicate export file is not available locally. This usually happens for rows imported before this feature was added.");
                                                    });
                                                }}
                                                className="text-amber-500 hover:text-amber-600 hover:bg-amber-50 p-1.5 rounded-md transition-all flex items-center gap-1 text-xs font-semibold mr-1"
                                                title="Download Duplicates"
                                            >
                                                <Download className="w-3 h-3" />
                                                Duplicates
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDownloadFile(item)}
                                            className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 p-1.5 rounded-md transition-all"
                                            title="Download original file"
                                        >
                                            <Download className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteHistory(item.id)}
                                            className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-md transition-all"
                                            title="Delete log"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-4 border-t bg-gray-50 rounded-b-lg flex flex-col gap-4">
                    {historyTotalPages > 1 && (
                        <div className="flex justify-between items-center text-sm">
                            <button
                                disabled={historyPage <= 1 || loading}
                                onClick={() => setHistoryPage((prev) => prev - 1)}
                                className="px-3 py-1.5 bg-white border text-gray-600 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white font-medium transition-colors"
                            >
                                Previous
                            </button>
                            <span className="text-gray-500 font-medium">Page {historyPage} of {historyTotalPages}</span>
                            <button
                                disabled={historyPage >= historyTotalPages || loading}
                                onClick={() => setHistoryPage((prev) => prev + 1)}
                                className="px-3 py-1.5 bg-white border text-gray-600 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white font-medium transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    )}

                    <button
                        onClick={() => setIsOpen(false)}
                        className="w-full px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white font-medium rounded-md transition-colors"
                    >
                        Close History
                    </button>
                </div>
            </div>
        </div>
    );
}
