"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout";
import { StatsRow } from "@/components/shared";
import { GlassCard } from "@/components/glass/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    ShoppingCart,
    Shield,
    Server,
    Globe,
    BookOpen,
    BarChart3,
} from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { getNavigationByRole } from "@/lib/getNavigationByRole";
import DashboardLoader from "@/common/DashboardLoader";
import SearchResultsPage from "../../[role]/search-result/page";
import { subscribeEntity } from "@/lib/entityBus";

export interface SubscriptionItem {
    id: number;
    product: string;
    client: string;
    amount: string;
    renewal_date: string;
    deletion_date: string | null;
    days_left: number;
    days_to_delete: number | null;
    status: number;
    remarks: string | null;
    updated_at: string | null;
}

export default function ClientDashboard() {
    const [startDate, setStartDate] = useState<string>("");
    const [endDate, setEndDate] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [mainLoading, setMainLoading] = useState(true);
    const [subscriptionsData, setSubscriptionsData] = useState<SubscriptionItem[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
    const [counts, setCounts] = useState({
        subscription: 0,
        ssl: 0,
        hosting: 0,
        domains: 0,
        emails: 0,
        counter: 0
    });

    const { user, getToken } = useAuth();
    const token = getToken();
    const navigationTabs = getNavigationByRole(user?.role);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            if (!token) {
                setMainLoading(false);
                return;
            }

            const params = {
                start_date: startDate,
                end_date: endDate,
                search: searchQuery,
                s_id: user?.id || "",
                client_id: user?.id || "", // Ensure client_id is sent
            };

            // Fetch counting data
            try {
                const countsResponse = await api.post(
                    "/secure/dashboard/counting",
                    params,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                const safeData = countsResponse?.data?.data || {};
                setCounts({
                    subscription: safeData.subscription ?? 0,
                    ssl: safeData.ssl ?? 0,
                    hosting: safeData.hosting ?? 0,
                    domains: safeData.domains ?? 0,
                    emails: safeData.emails ?? 0,
                    counter: safeData.counter ?? 0,
                });
            } catch (e) { }

            const response = await api.get<SubscriptionItem[]>(
                "/secure/dashboard/subscriptions",
                {
                    params,
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (response?.data && Array.isArray(response.data)) {
                setSubscriptionsData(response.data);
            }
        } catch (error) {
            console.error("Dashboard error:", error);
        } finally {
            setLoading(false);
            setMainLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, [debouncedSearch]);

    useEffect(() => {
        const unsub = subscribeEntity('all', fetchDashboardData);
        return () => unsub();
    }, [startDate, endDate, user]);

    const formatDateForDisplay = (dateString: string) => {
        if (!dateString) return "N/A";
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString("en-GB");
        } catch {
            return dateString;
        }
    };

    if (mainLoading) return <div className="min-h-screen flex items-center justify-center"><DashboardLoader /></div>;

    return (
        <div className="min-h-screen pb-8">
            <Header title="My Dashboard" tabs={navigationTabs} />

            <div className="px-4 sm:px-6 mt-6">
                <GlassCard variant="liquid" noPadding className="overflow-hidden mb-6 hidden-border">
                    <StatsRow
                        stats={[
                            { title: "Subscriptions", value: counts.subscription, icon: <ShoppingCart className="w-5 h-5 text-blue-400" />, url: "/client/subscription" },
                            { title: "SSL", value: counts.ssl, icon: <Shield className="w-5 h-5 text-green-400" />, url: "/client/ssl" },
                            { title: "Hosting", value: counts.hosting, icon: <Server className="w-5 h-5 text-purple-400" />, url: "/client/hosting" },
                            { title: "Domains", value: counts.domains, icon: <Globe className="w-5 h-5 text-orange-400" />, url: "/client/domains" },
                            { title: "Emails", value: counts.emails, icon: <BookOpen className="w-5 h-5 text-red-400" />, url: "/client/sub-email" },
                            { title: "Counter", value: counts.counter, icon: <BarChart3 className="w-5 h-5 text-indigo-400" />, url: "/client/counter" },
                        ]}
                    />
                </GlassCard>

                <div className="mb-6">
                    <SearchResultsPage query={searchQuery} onSearchChange={setSearchQuery} />
                </div>

                <GlassCard variant="liquid" noPadding className="overflow-hidden mb-6 hidden-border">
                    <div className="p-4 sm:p-5">
                        <h3 className="text-white font-medium mb-4 text-lg">My Recent Subscriptions</h3>
                        <div className="overflow-auto rounded-lg border border-white/[0.08]">
                            <table className="w-full">
                                <thead className="bg-[#1A1A1A] text-gray-400 uppercase text-xs">
                                    <tr>
                                        <th className="py-3 px-4 text-left">Sr No</th>
                                        <th className="py-3 px-4 text-left">Product</th>
                                        <th className="py-3 px-4 text-left">Amount</th>
                                        <th className="py-3 px-4 text-left">Renewal Date</th>
                                        <th className="py-3 px-4 text-left">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/[0.08]">
                                    {subscriptionsData.map((item, index) => (
                                        <tr key={item.id} className="hover:bg-white/[0.03]">
                                            <td className="py-3 px-4 text-sm text-white">{index + 1}</td>
                                            <td className="py-3 px-4 text-sm text-white font-medium">{item.product}</td>
                                            <td className="py-3 px-4 text-sm text-green-400 font-medium">₹{Number(item.amount).toFixed(2)}</td>
                                            <td className="py-3 px-4 text-sm text-gray-400">{formatDateForDisplay(item.renewal_date)}</td>
                                            <td className="py-3 px-4">
                                                <Badge variant={item.status === 1 ? "success" : "secondary"}>
                                                    {item.status === 1 ? "Active" : "Inactive"}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </GlassCard>
            </div>
        </div>
    );
}
