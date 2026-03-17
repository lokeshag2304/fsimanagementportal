"use client";

import { useState, useEffect } from "react";
import { GlassCard } from "@/components/glass";
import { useToast } from "@/hooks/useToast";
import DashboardLoader from "@/common/DashboardLoader";
import {
  X,
  MessageSquare,
  Activity,
  Calendar,
  User,
  Package,
  Globe,
  UserCircle,
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/layout";
import { getNavigationByRole } from "@/lib/getNavigationByRole";
import { formatLastUpdated } from "@/utils/dateFormatter";
import api from "@/lib/api";

interface Remark {
  id: number;
  remark: string;
  created_at: string;
}

interface Activity {
  id: number;
  action: string;
  message: string;
  creator_name: string;
  created_at: string;
}

interface Category {
  id: number;
  record_type: string;
  valid_till: string;
  client_name: string | null;
  domain_name: string | null;
  product_name: string;
  expiry_date: string;
  vallid_till: string;
  days_to_expired: number;
  today_date: string;
  created_at: string;
  updated_at: string;
  grace_period?: number;
  due_date?: string;
}

interface CategoryDetailsData {
  status: boolean;
  category: Category;
  remarks: Remark[];
  activities: Activity[];
}

interface DynamicDetailsPageProps {
  recordType?: string | number;
  recordId?: string | number;
  onClose?: () => void;
}

export default function DynamicDetailsPage({ recordType: propRecordType, recordId: propRecordId, onClose }: DynamicDetailsPageProps = {}) {
  const { user, getToken } = useAuth();
  const params = useParams();
  const navigationTabs = getNavigationByRole(user?.role);
  const searchParams = useSearchParams();

  const id = (propRecordId || params.id) as string;
  const recordType = (propRecordType || searchParams.get('recordType')) as string;
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<CategoryDetailsData | null>(null);
  const [activeTab, setActiveTab] = useState<"remarks" | "activities">("remarks");

  useEffect(() => {
    if (id && recordType) {
      fetchCategoryDetails().catch(err => console.error("Load failed", err));
    }
  }, [id, recordType]);

  const fetchCategoryDetails = async () => {
    try {
      setLoading(true);

      console.log("Fetching details for recordId:", id, "recordType:", recordType);

      const token = getToken();

      if (!token) {
        toast({
          title: "Authentication Error",
          description: "Please login again to continue.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // API endpoint based on recordType
      let endpoint = '/secure/Categories/get-categories-details';
      let payload = { cat_id: id };

      const response = await api.post(
        endpoint,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const result = response.data;
      console.log("API Response:", result);

      if (result.status) {
        setData(result);
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to fetch details",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching details:", error);
      toast({
        title: "Error",
        description: "Failed to fetch details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Format date function
  const formatDate = (dateString: string) => {
    return formatLastUpdated(dateString);
  };

  // Format simple date (without time)
  const formatSimpleDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  // Get days status color
  const getDaysStatusColor = (days: number) => {
    if (days < 0) return "text-red-400";
    if (days <= 7) return "text-orange-400";
    return "text-green-400";
  };

  // Get days status badge
  const getDaysStatusBadge = (days: number) => {
    if (days < 0) return "Expired";
    if (days <= 7) return "Expiring Soon";
    return "Active";
  };

  // Get days status icon
  const getDaysStatusIcon = (days: number) => {
    if (days < 0) return <AlertCircle className="w-4 h-4" />;
    if (days <= 7) return <Clock className="w-4 h-4" />;
    return <CheckCircle className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <DashboardLoader label="Loading details..." />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-gradient-to-br from-gray-900/90 via-black/90 to-gray-900/90 border border-white/10 rounded-2xl p-8 backdrop-blur-xl max-w-md text-center">
          <h3 className="text-xl font-semibold text-white mb-2">No Data Found</h3>
          <p className="text-gray-400 mb-6">Unable to load details.</p>
        </div>
      </div>
    );
  }

  const { category } = data;

  return (
    <div className="min-h-screen pb-8">
      <Header title="Subscription Management" tabs={navigationTabs} />
      <div className="px-4 sm:px-6 mt-6">
        <GlassCard className="p-0 overflow-hidden backdrop-blur-xl bg-gradient-to-br from-gray-900/90 via-black/90 to-gray-900/90 border border-white/10 shadow-2xl">
          {/* Header */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Categories Details</h2>
                {/* <p className="text-gray-400 mt-1">
                  Record Type: <span className="text-blue-400 font-medium">{recordType === '1' ? 'Subscription' : 'Other'}</span>
                </p> */}
              </div>
            </div>
          </div>

          {/* Category Details Card */}
          <div className="p-6 border-b border-white/10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Product Name */}
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Package className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-400">Product</h4>
                    <p className="text-white font-medium mt-1">{category.product_name}</p>
                  </div>
                </div>
              </div>

              {/* Client Name (Conditional) */}
              {category.client_name && (
                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <UserCircle className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-400">Client</h4>
                      <p className="text-white font-medium mt-1">{category.client_name}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Domain Name (Conditional) */}
              {category.domain_name && (
                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <Globe className="w-4 h-4 text-green-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-400">Domain</h4>
                      <p className="text-white font-medium mt-1">{category.domain_name}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Expiry Date */}
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-orange-500/20 rounded-lg">
                    <Calendar className="w-4 h-4 text-orange-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-400">Expiry Date</h4>
                    <p className="text-white font-medium mt-1">{category.expiry_date ? formatSimpleDate(category.expiry_date) : formatSimpleDate(category.valid_till)}</p>
                  </div>
                </div>
              </div>

              {/* Days to Expire */}
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-yellow-500/20 rounded-lg">
                    <Clock className="w-4 h-4 text-yellow-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-400">Days to Expire</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`font-medium ${getDaysStatusColor(category.days_to_expired)}`}>
                        {category.days_to_expired} days
                      </span>
                      {/* <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                        category.days_to_expired < 0 
                          ? "bg-red-500/20 text-red-400 border border-red-500/20"
                          : category.days_to_expired <= 7
                          ? "bg-orange-500/20 text-orange-400 border border-orange-500/20"
                          : "bg-green-500/20 text-green-400 border border-green-500/20"
                      }`}>
                        {getDaysStatusIcon(category.days_to_expired)}
                        {getDaysStatusBadge(category.days_to_expired)}
                      </div> */}
                    </div>
                  </div>
                </div>
              </div>

              {/* Created Date */}
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-indigo-500/20 rounded-lg">
                    <Calendar className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-400">Created Date</h4>
                    <p className="text-white font-medium mt-1">{formatDate(category.created_at)}</p>
                  </div>
                </div>
              </div>

              {/* Last Updated */}
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-cyan-500/20 rounded-lg">
                    <Calendar className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-400">Last Updated</h4>
                    <p className="text-white font-medium mt-1">{formatDate(category.updated_at)}</p>
                  </div>
                </div>
              </div>

              {/* Grace Period */}
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-pink-500/20 rounded-lg">
                    <Clock className="w-4 h-4 text-pink-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-400">Grace Period</h4>
                    <p className="text-white font-medium mt-1">{category.grace_period !== undefined ? `${category.grace_period} days` : '0 days'}</p>
                  </div>
                </div>
              </div>

              {/* Due Date */}
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-red-500/20 rounded-lg">
                    <Calendar className="w-4 h-4 text-red-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-400">Due Date</h4>
                    <p className="text-white font-medium mt-1">{category.due_date ? formatSimpleDate(category.due_date) : '-'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="flex border-b border-white/10">
            <button
              onClick={() => setActiveTab("remarks")}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-all ${activeTab === "remarks"
                ? "border-blue-500 text-blue-400 bg-blue-500/10"
                : "border-transparent text-gray-400 hover:text-white hover:bg-white/5"
                }`}
            >
              <MessageSquare className="w-4 h-4" />
              Remarks ({data.remarks.length})
            </button>
            <button
              onClick={() => setActiveTab("activities")}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-all ${activeTab === "activities"
                ? "border-green-500 text-green-400 bg-green-500/10"
                : "border-transparent text-gray-400 hover:text-white hover:bg-white/5"
                }`}
            >
              <Activity className="w-4 h-4" />
              Activities ({data.activities.length})
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            {activeTab === "remarks" ? (
              // Remarks Tab Content
              <div className="space-y-4">
                {data.remarks.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-white mb-1">No Remarks</h3>
                    <p className="text-gray-400">No remarks found for this category.</p>
                  </div>
                ) : (
                  data.remarks.map((remark) => (
                    <div
                      key={remark.id}
                      className="p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-500/20 rounded-lg">
                            <MessageSquare className="w-4 h-4 text-blue-400" />
                          </div>
                          <div>
                            <h4 className="text-white font-medium">{(remark as any).creator_name}</h4>
                            <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(remark.created_at)}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="pl-12">
                        <p className="text-gray-300 whitespace-pre-wrap">{remark.remark}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              // Activities Tab Content
              <div className="space-y-4">
                {data.activities.length === 0 ? (
                  <div className="text-center py-8">
                    <Activity className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-white mb-1">No Activities</h3>
                    <p className="text-gray-400">No activity history found for this category.</p>
                  </div>
                ) : (
                  <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-white/10"></div>

                    {data.activities.map((activity, index) => (
                      <div key={activity.id} className="relative pl-12 pb-6 last:pb-0">
                        {/* Timeline dot */}
                        <div className={`absolute left-5 top-0 w-3 h-3 rounded-full border-2 border-white/20 ${index === 0
                          ? "bg-green-500 border-green-500"
                          : "bg-gray-700"
                          }`}></div>

                        {/* Activity card */}
                        <div className="p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="text-white font-medium flex items-center gap-2">
                                <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                                {activity.action}
                              </h4>
                              <div className="flex items-center gap-4 text-sm text-gray-400 mt-2">
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-3 h-3" />
                                  {formatDate(activity.created_at)}
                                </div>
                                <div className="flex items-center gap-2">
                                  <User className="w-3 h-3" />
                                  {activity.creator_name}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="mt-3 p-3 rounded bg-black/30 border border-white/5">
                            <p className="text-sm text-gray-300 whitespace-pre-wrap">{activity.message}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-white/10 bg-black/20 flex items-center justify-between">
            <div className="text-sm text-gray-400">
              Showing {activeTab === "remarks" ? data.remarks.length : data.activities.length} items
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.back()}
                className="px-4 py-2 text-sm bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-lg border border-white/10 transition-all"
              >
                Back
              </button>
              <button
                onClick={() => fetchCategoryDetails()}
                className="px-4 py-2 text-sm bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-lg border border-white/10 transition-all"
              >
                Refresh
              </button>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}