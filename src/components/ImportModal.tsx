"use client";
import React, { useState, useRef } from "react";
import { X, Upload, File, CheckCircle, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { GlassCard, GlassButton } from "@/components/glass";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/useToast";
import api from "@/lib/api";

interface ImportModalProps {
    recordType: number;
    title: string;
    isOpen: boolean;
    setIsOpen: (value: boolean) => void;
    onSuccess: (response?: any) => Promise<void>;
    endpoint?: string;
    module?: string;
}

export function ImportModal({ recordType, title, isOpen, setIsOpen, onSuccess, endpoint, module }: ImportModalProps) {
    const { user, getToken } = useAuth();
    const token = getToken();
    const { toast } = useToast();

    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [summary, setSummary] = useState<{ inserted: number; duplicates: number; failed: number; duplicateFileUrl?: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            toast({
                title: "Error",
                description: "Please select a file to import.",
                variant: "destructive"
            });
            return;
        }

        setLoading(true);
        setSummary(null);

        // Globally ready endpoint logic
        let uploadEndpoint = endpoint;

        if (!uploadEndpoint) {
            uploadEndpoint = `secure/${module || 'subscriptions'}/import`;
        }

        // Remove leading slash if present to avoid axios baseURL issues
        if (uploadEndpoint.startsWith('/')) {
            uploadEndpoint = uploadEndpoint.substring(1);
        }

        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("record_type", recordType.toString());

            if (user?.id) {
                // Determine `s_id`. If SuperAdmin, user is s_id.
                formData.append("s_id", (user.login_type === 1 || user.login_type === 2) ? user.id.toString() : ((user as any).s_id || 0).toString());

                // If it is a client, explicitly mark the client ID so backend can assign it
                if (user.role === "ClientAdmin" || user.login_type === 3) {
                    formData.append("client_id", user.id.toString());
                }
            }

            const response: any = await api.post(uploadEndpoint, formData, {
                headers: { Authorization: `Bearer ${token}` },
                timeout: 300000,
            });

            const data = response.data;

            // Always call onSuccess so parent table refreshes
            await onSuccess(data);

            // Always show summary panel with the 3 counters
            setSummary({
                inserted: data?.inserted ?? 0,
                duplicates: data?.duplicates ?? 0,
                failed: data?.failed ?? 0,
                duplicateFileUrl: data?.duplicate_file_url ?? data?.duplicate_file ?? "",
            });

        } catch (error: any) {
            const errData = error?.response?.data;
            console.error('Import error:', errData || error?.message);
            setSummary({
                inserted: 0,
                duplicates: 0,
                failed: 1,
            });
            toast({
                title: "Import Error",
                description: errData?.message || "Failed to upload file.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };


    const handleDownloadDuplicates = async () => {
        if (!summary?.duplicateFileUrl) return;
        try {
            const url = summary.duplicateFileUrl.startsWith('http') ? summary.duplicateFileUrl : `http://127.0.0.1:8000/api/${summary.duplicateFileUrl}`;
            const response = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!response.ok) throw new Error("Failed to download file");

            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;

            const filenameMatch = url.match(/\/([^\/?#]+)[^\/]*$/);
            link.download = filenameMatch ? filenameMatch[1] : 'duplicates.xlsx';

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error(error);
            toast({
                title: "Download Failed",
                description: "Could not download the duplicates file.",
                variant: "destructive"
            });
        }
    };

    const resetAndClose = () => {
        setFile(null);
        setSummary(null);
        setIsOpen(false);
    };

    return (
        <>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={resetAndClose}
                    />

                    <GlassCard className="relative w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold text-white">{title}</h2>
                            <button
                                onClick={resetAndClose}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {summary ? (
                            <div className="space-y-4">
                                <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-3">
                                    <h3 className="text-sm font-medium text-gray-300">Import Summary</h3>

                                    {/* Inserted */}
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="flex items-center gap-2 text-green-400">
                                            <CheckCircle className="w-4 h-4" /> Inserted
                                        </span>
                                        <span className="font-semibold text-white">{summary.inserted}</span>
                                    </div>

                                    {/* Duplicate */}
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="flex items-center gap-2 text-yellow-400">
                                            <AlertCircle className="w-4 h-4" /> Duplicate
                                        </span>
                                        <span className="font-semibold text-white">{summary.duplicates}</span>
                                    </div>

                                    {/* Failed */}
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="flex items-center gap-2 text-red-400">
                                            <XCircle className="w-4 h-4" /> Failed
                                        </span>
                                        <span className="font-semibold text-white">{summary.failed}</span>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-2">
                                    {summary.duplicates > 0 && summary.duplicateFileUrl && (
                                        <GlassButton
                                            variant="secondary"
                                            onClick={handleDownloadDuplicates}
                                            className="border-yellow-500/30 text-yellow-400"
                                        >
                                            Download Duplicates
                                        </GlassButton>
                                    )}
                                    <GlassButton variant="primary" onClick={resetAndClose}>
                                        Close
                                    </GlassButton>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div
                                    className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:border-blue-500/50 hover:bg-blue-500/5 transition-all cursor-pointer group"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        onChange={handleFileChange}
                                        onClick={(e) => e.stopPropagation()}
                                        accept=".csv,.xlsx,.xls"
                                    />
                                    <div className="flex flex-col items-center justify-center gap-3">
                                        <div className="p-3 bg-white/5 rounded-full group-hover:bg-blue-500/20 group-hover:text-blue-400 transition-colors">
                                            <Upload className="w-6 h-6" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium text-white">
                                                {file ? file.name : "Click to select a file"}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                Supports .csv, .xlsx, .xls
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3 justify-end">
                                    <GlassButton variant="danger" onClick={resetAndClose} disabled={loading}>
                                        Cancel
                                    </GlassButton>
                                    <GlassButton variant="primary" onClick={handleUpload} disabled={!file || loading} className="flex items-center gap-2">
                                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <File className="w-4 h-4" />}
                                        Upload
                                    </GlassButton>
                                </div>
                            </div>
                        )}
                    </GlassCard>
                </div>
            )}
        </>
    );
}

export default ImportModal;
