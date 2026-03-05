"use client";

import React, { useState, useEffect } from "react";
import { Clock, User, MessageCircle, AlertCircle, Loader2 } from "lucide-react";
import api from "@/lib/api";

interface RemarkHistoryItem {
    id: number;
    remark: string;
    user_name: string;
    created_at: string;
}

interface RemarkHistoryProps {
    module: string;
    recordId: number;
}

export const RemarkHistory = ({ module, recordId }: RemarkHistoryProps) => {
    const [history, setHistory] = useState<RemarkHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                setLoading(true);
                const response = await api.get(`remark-history?module=${module}&record_id=${recordId}`);
                if (response.data?.success) {
                    setHistory(response.data.data);
                } else {
                    setError("Failed to load history");
                }
            } catch (err) {
                console.error("Error fetching remark history:", err);
                setError("Error loading history");
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [module, recordId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-4 bg-white/5 rounded-lg border border-white/10 mt-2">
                <Loader2 className="w-5 h-5 animate-spin text-blue-400 mr-2" />
                <span className="text-sm text-gray-400">Loading history...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center py-4 bg-red-500/10 rounded-lg border border-red-500/20 mt-2">
                <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
                <span className="text-sm text-red-400">{error}</span>
            </div>
        );
    }

    if (history.length === 0) {
        return (
            <div className="text-center py-4 text-gray-500 italic text-sm bg-white/5 rounded-lg border border-white/5 mt-2">
                No previous remarks found.
            </div>
        );
    }

    return (
        <div className="mt-2 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-2 mb-3 ml-1">
                <div className="p-1 rounded bg-blue-500/10 border border-blue-500/20">
                    <Clock className="w-3.5 h-3.5 text-blue-400" />
                </div>
                <span className="text-[11px] uppercase tracking-[0.2em] font-black text-blue-400/90 drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]">Remark History</span>
            </div>

            <div className="grid gap-2 overflow-hidden">
                {history.map((item) => (
                    <div
                        key={item.id}
                        className="relative pl-4 pb-2 border-l border-blue-500/30 last:pb-0"
                    >
                        {/* Dot indicator */}
                        <div className="absolute left-[-4.5px] top-1.5 w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />

                        <div className="bg-white/5 hover:bg-white/[0.08] transition-all rounded-xl border border-white/10 p-3 ml-2 group ring-1 ring-white/0 hover:ring-white/10">
                            <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/5">
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                                        <User className="w-3.5 h-3.5 text-blue-400" />
                                    </div>
                                    <span className="text-sm font-bold text-gray-100">{item.user_name || "Unknown"}</span>
                                </div>
                                <div className="flex items-center gap-3 px-3 py-1.5 bg-black/40 rounded-xl border border-white/10 shadow-lg backdrop-blur-sm">
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-blue-400" />
                                        <span className="text-sm font-bold text-gray-100 whitespace-nowrap">
                                            {new Date(item.created_at).toLocaleTimeString('en-US', {
                                                hour: '2-digit', minute: '2-digit', hour12: true
                                            })}
                                        </span>
                                    </div>
                                    <div className="w-px h-4 bg-white/10" />
                                    <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
                                        {new Date(item.created_at).toLocaleString('en-US', {
                                            day: 'numeric', month: 'short'
                                        })}
                                        <span className="ml-1 text-gray-500">
                                            {new Date(item.created_at).getFullYear()}
                                        </span>
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 pl-1">
                                <div className="mt-1 flex-shrink-0">
                                    <MessageCircle className="w-3.5 h-3.5 text-blue-400/40 group-hover:text-blue-400/70 transition-colors" />
                                </div>
                                <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap font-medium">
                                    {item.remark}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
