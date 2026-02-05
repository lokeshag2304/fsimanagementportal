"use client";

import { useState, useEffect } from "react";
import { GlassCard } from "@/components/glass";
import { useToast } from "@/hooks/useToast";
import DashboardLoader from "@/common/DashboardLoader";
import { 
  Package,
  Shield,
  Server,
  Globe,
  Mail,
  Hash,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowUpRight,
  ChevronRight
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/layout";
import { getNavigationByRole } from "@/lib/getNavigationByRole";
import { useParams, useRouter } from "next/navigation"
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;
// Type Counts Interface
interface TypeCount {
  type_id: number;
  type_name: string;
  count: number;
}

// Recent Category Interface
interface RecentCategory {
  id: number;
  record_type: string;
  status: string;
  created_at: string;
  days_to_expired: number;
}

// Client Details Interface
interface ClientDetailsData {
  status: boolean;
  type_counts: TypeCount[];
  recent_categories: {
    total: number;
    page: number;
    rowsPerPage: number;
    data: RecentCategory[];
  };
}

interface DynamicDetailsPageProps {
  params: {
    id: string;
  };
}

export default function DynamicDetailsPage({
  params,
}: DynamicDetailsPageProps) {
  const param = useParams()
  const { id } = param;
  console.log("idddddd",id)
  const { toast } = useToast();
  const { getToken, user } = useAuth();
  const navigationTabs = getNavigationByRole(user?.role);
  
  const [loading, setLoading] = useState(true);
  const [clientDetails, setClientDetails] = useState<ClientDetailsData | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchClientDetails();
    }
  }, [user?.id]);

  // Fetch client details function
  const fetchClientDetails = async () => {
    try {
      setLoading(true);
      
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
      
      if (!user?.id) {
        toast({
          title: "Error",
          description: "User ID not found",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      
      const response = await fetch(
        `${BASE_URL}/secure/Usermanagement/get-clients-details`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'accept': 'application/json, text/plain, */*',
          },
          body: JSON.stringify({ id: id }),
        }
      );

      const result = await response.json();
      console.log("Client Details API Response:", result);
      
      if (result.status) {
        setClientDetails(result);
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to fetch client details",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching client details:", error);
      toast({
        title: "Error",
        description: "Failed to fetch client details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Get icon for type
  const getTypeIcon = (typeName: string) => {
    switch (typeName.toLowerCase()) {
      case 'subscriptions':
        return <Package className="w-6 h-6" />;
      case 'ssl':
        return <Shield className="w-6 h-6" />;
      case 'hosting':
        return <Server className="w-6 h-6" />;
      case 'domains':
        return <Globe className="w-6 h-6" />;
      case 'emails':
        return <Mail className="w-6 h-6" />;
      case 'counter':
        return <Hash className="w-6 h-6" />;
      default:
        return <Package className="w-6 h-6" />;
    }
  };

  // Get color for type
  const getTypeColor = (typeName: string) => {
    switch (typeName.toLowerCase()) {
      case 'subscriptions':
        return {
          bg: "bg-blue-500/20",
          text: "text-blue-400",
          border: "border-blue-500/20",
          dark: "bg-blue-500/10"
        };
      case 'ssl':
        return {
          bg: "bg-green-500/20",
          text: "text-green-400",
          border: "border-green-500/20",
          dark: "bg-green-500/10"
        };
      case 'hosting':
        return {
          bg: "bg-purple-500/20",
          text: "text-purple-400",
          border: "border-purple-500/20",
          dark: "bg-purple-500/10"
        };
      case 'domains':
        return {
          bg: "bg-orange-500/20",
          text: "text-orange-400",
          border: "border-orange-500/20",
          dark: "bg-orange-500/10"
        };
      case 'emails':
        return {
          bg: "bg-red-500/20",
          text: "text-red-400",
          border: "border-red-500/20",
          dark: "bg-red-500/10"
        };
      case 'counter':
        return {
          bg: "bg-cyan-500/20",
          text: "text-cyan-400",
          border: "border-cyan-500/20",
          dark: "bg-cyan-500/10"
        };
      default:
        return {
          bg: "bg-gray-500/20",
          text: "text-gray-400",
          border: "border-gray-500/20",
          dark: "bg-gray-500/10"
        };
    }
  };

  // Get status color for recent items
  const getStatusColor = (status: string, days: number) => {
    if (status.toLowerCase() === 'active' && days >= 0) {
      return "bg-green-500/20 text-green-400 border-green-500/20";
    } else if (status.toLowerCase() === 'deactive' || days < 0) {
      return "bg-red-500/20 text-red-400 border-red-500/20";
    } else {
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/20";
    }
  };

  // Get days icon
  const getDaysIcon = (days: number) => {
    if (days < 0) return <AlertCircle className="w-4 h-4" />;
    if (days <= 7) return <Clock className="w-4 h-4" />;
    return <CheckCircle className="w-4 h-4" />;
  };

  // Handle recent item click
  const handleRecentItemClick = (item: RecentCategory) => {
    // Navigate to the specific item details
    console.log("Recent item clicked:", item);
    toast({
      title: item.record_type,
      description: `ID: ${item.id}, Status: ${item.status}`,
      variant: "default",
    });
  };

  // Handle view all recent items
  const handleViewAll = () => {
    toast({
      title: "View All",
      description: "Showing all recent items",
      variant: "default",
    });
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchClientDetails();
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header title="Client Dashboard" tabs={navigationTabs} />
        <div className="px-4 sm:px-6 mt-6">
          <GlassCard className="p-8 backdrop-blur-xl">
            <DashboardLoader label="Loading client details..." />
          </GlassCard>
        </div>
      </div>
    );
  }

  if (!clientDetails) {
    return (
      <div className="min-h-screen">
        <Header title="Client Dashboard" tabs={navigationTabs} />
        <div className="px-4 sm:px-6 mt-6">
          <GlassCard className="p-8 backdrop-blur-xl text-center">
            <h3 className="text-xl font-semibold text-white mb-2">No Data Found</h3>
            <p className="text-gray-400 mb-6">Unable to load client details.</p>
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg border border-blue-500/20 transition-all"
            >
              Try Again
            </button>
          </GlassCard>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-8">
      <Header 
        title="Client Dashboard" 
        tabs={navigationTabs} 
      />

      <div className="px-4 sm:px-6 mt-6">
        <GlassCard className="p-6 backdrop-blur-xl bg-gradient-to-br from-gray-900/80 via-black/80 to-gray-900/80 border border-white/10 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-white">Service Overview</h2>
            </div>
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-lg border border-white/10 transition-all flex items-center gap-2"
            >
              <Clock className="w-4 h-4" />
              Refresh
            </button>
          </div>

          {/* 6 Boxes Section - Service Summary */}
          <div className="mb-10">
            <h3 className="text-lg font-semibold text-white mb-4">Service Summary</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {clientDetails.type_counts.map((type) => {
                const color = getTypeColor(type.type_name);
                return (
                  <div
                    key={type.type_id}
                    className={`p-5 rounded-xl ${color.bg} border ${color.border} hover:${color.dark} transition-all group cursor-pointer`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className={`p-3 rounded-lg ${color.bg}`}>
                        {getTypeIcon(type.type_name)}
                      </div>
                     
                    </div>
                    
                    <div className="mb-2">
                      <h4 className="text-sm font-medium text-gray-400 mb-1">
                        {type.type_name}
                      </h4>
                      <div className="text-3xl font-bold text-white">
                        {type.count}
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-400 mt-3 flex items-center gap-1">
                      <span>Total Services</span>
                      <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Categories Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white">Recent Activities</h3>
                <p className="text-sm text-gray-400 mt-1">
                  Showing {clientDetails.recent_categories.data.length} of {clientDetails.recent_categories.total} recent items
                </p>
              </div>
              {clientDetails.recent_categories.total > 5 && (
                <button
                  onClick={handleViewAll}
                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
                >
                  View All ({clientDetails.recent_categories.total})
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              )}
            </div>
            
            {clientDetails.recent_categories.data.length === 0 ? (
              <div className="text-center py-8 rounded-lg bg-white/5 border border-white/10">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-500/20 mb-4">
                  <Package className="w-6 h-6 text-gray-400" />
                </div>
                <h4 className="text-lg font-medium text-white mb-1">No Recent Activities</h4>
                <p className="text-gray-400">No recent categories found for this client.</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-white/10">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-white/5 border-b border-white/10">
                        <th className="py-4 px-6 text-left text-sm font-medium text-gray-300">ID</th>
                        <th className="py-4 px-6 text-left text-sm font-medium text-gray-300">Service Type</th>
                        <th className="py-4 px-6 text-left text-sm font-medium text-gray-300">Products</th>
                        <th className="py-4 px-6 text-left text-sm font-medium text-gray-300">Status</th>
                        <th className="py-4 px-6 text-left text-sm font-medium text-gray-300">Created Date</th>
                        <th className="py-4 px-6 text-left text-sm font-medium text-gray-300">Days Left</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientDetails.recent_categories.data.map((item) => (
                        <tr 
                          key={item.id}
                          className="border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer"
                          onClick={() => handleRecentItemClick(item)}
                        >
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <div className="p-2 rounded-lg bg-white/5">
                                <span className="text-sm font-medium text-white">#{item.id}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${getTypeColor(item.record_type).bg}`}>
                                {getTypeIcon(item.record_type)}
                              </div>
                              <div>
                                <span className="text-sm font-medium text-white block">{item.record_type}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-300">{item.product_name}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status, item.days_to_expired)}`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-300">{item.created_at}</span>
                            </div>
                          </td>
                          
                          <td className="py-4 px-6">
                            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                              item.days_to_expired < 0 
                                ? "bg-red-500/20 text-red-400 border border-red-500/20"
                                : item.days_to_expired <= 7
                                ? "bg-orange-500/20 text-orange-400 border border-orange-500/20"
                                : "bg-green-500/20 text-green-400 border border-green-500/20"
                            }`}>
                              <span className="font-bold">{Math.abs(item.days_to_expired)}</span>
                              <span>days</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Footer Stats */}
          <div className="mt-8 p-4 border-t border-white/10 bg-black/20 rounded-lg">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-400">
                Last updated: {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
              <div className="flex items-center gap-4">
                <div className="text-sm">
                  <span className="text-gray-400">Total Services: </span>
                  <span className="text-white font-medium">
                    {clientDetails.type_counts.reduce((sum, type) => sum + type.count, 0)}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-400">Recent Items: </span>
                  <span className="text-white font-medium">
                    {clientDetails.recent_categories.total}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}