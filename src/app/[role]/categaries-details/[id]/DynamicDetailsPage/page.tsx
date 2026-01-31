// src/components/dynamic/DynamicDetailsPage.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/glass";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/useToast";
import { apiService } from "@/common/services/apiService";
import DashboardLoader from "@/common/DashboardLoader";
import {
  Package,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  ArrowLeft,
  MessageSquare,
  Globe,
  User,
  Activity,
  AlertCircle,
  TrendingUp,
  RefreshCw,
  FileText,
  Shield,
  Server,
  Database,
  Cpu,
  Layers,
  Zap,
  Building,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  BarChart,
  Settings,
  Users,
  Key,
  Network,
  HardDrive,
  Cloud,
  Wifi,
  ShieldCheck,
  Terminal,
} from "lucide-react";

interface DynamicDetailsPageProps {
  recordType: number; // 1=Subscription, 2=Clients, etc.
  recordId: number;
  onClose?: () => void;
  config?: {
    title?: string;
    icon?: React.ReactNode;
    fields?: string[];
  };
}

// Configuration for different record types
const RECORD_TYPE_CONFIG: Record<number, {
  title: string;
  icon: React.ReactNode;
  primaryFields: string[];
  sections: Array<{
    title: string;
    icon: React.ReactNode;
    fields: string[];
    color: string;
  }>;
}> = {
  1: { // Subscriptions
    title: "Subscription Details",
    icon: <Package className="w-6 h-6 text-blue-400" />,
    primaryFields: ["product_name", "client_name", "amount", "status"],
    sections: [
      {
        title: "Billing Information",
        icon: <DollarSign className="w-5 h-5" />,
        fields: ["amount", "renewal_date", "expiry_date", "payment_method"],
        color: "blue",
      },
      {
        title: "Technical Details",
        icon: <Server className="w-5 h-5" />,
        fields: ["server_type", "storage", "bandwidth", "databases", "ssl_enabled"],
        color: "purple",
      },
      {
        title: "Contact Information",
        icon: <User className="w-5 h-5" />,
        fields: ["client_name", "email", "phone", "company"],
        color: "green",
      },
    ],
  },
  2: { // Clients
    title: "Client Details",
    icon: <Users className="w-6 h-6 text-green-400" />,
    primaryFields: ["client_name", "email", "phone", "status"],
    sections: [
      {
        title: "Contact Information",
        icon: <User className="w-5 h-5" />,
        fields: ["client_name", "email", "phone", "address"],
        color: "blue",
      },
      {
        title: "Company Details",
        icon: <Building className="w-5 h-5" />,
        fields: ["company", "industry", "employee_count", "revenue"],
        color: "purple",
      },
      {
        title: "Subscription Info",
        icon: <Package className="w-5 h-5" />,
        fields: ["active_subscriptions", "total_spent", "last_payment"],
        color: "green",
      },
    ],
  },
  3: { // Products
    title: "Product Details",
    icon: <Package className="w-6 h-6 text-orange-400" />,
    primaryFields: ["product_name", "category", "price", "status"],
    sections: [
      {
        title: "Product Information",
        icon: <Package className="w-5 h-5" />,
        fields: ["product_name", "description", "category", "sku"],
        color: "blue",
      },
      {
        title: "Pricing",
        icon: <DollarSign className="w-5 h-5" />,
        fields: ["price", "cost", "margin", "discount"],
        color: "green",
      },
      {
        title: "Inventory",
        icon: <Database className="w-5 h-5" />,
        fields: ["stock", "reorder_level", "warehouse", "supplier"],
        color: "purple",
      },
    ],
  },
};

export default function DynamicDetailsPage({
  recordType,
  recordId,
  onClose,
  config,
}: DynamicDetailsPageProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [record, setRecord] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({});
  
  const pageConfig = config ? {
    title: config.title || RECORD_TYPE_CONFIG[recordType]?.title || "Details",
    icon: config.icon || RECORD_TYPE_CONFIG[recordType]?.icon,
    sections: RECORD_TYPE_CONFIG[recordType]?.sections || [],
  } : RECORD_TYPE_CONFIG[recordType] || {
    title: "Details",
    icon: <FileText className="w-6 h-6 text-gray-400" />,
    sections: [],
  };

  useEffect(() => {
    fetchRecordDetails();
    fetchRecordStats();
  }, [recordType, recordId]);

  const fetchRecordDetails = async () => {
    try {
      setLoading(true);
      const response = await apiService.getRecordDetails(recordType, recordId);

      if (response.status) {
        setRecord(response.data);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch details",
          variant: "destructive",
        });
        handleClose();
      }
    } catch (error) {
      console.error("Error fetching record:", error);
      toast({
        title: "Error",
        description: "Failed to load details",
        variant: "destructive",
      });
      handleClose();
    } finally {
      setLoading(false);
    }
  };

  const fetchRecordStats = async () => {
    // Fetch stats based on record type
    try {
      const response = await apiService.getRecordStats(recordType, recordId);
      if (response.status) {
        setStats(response.data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      router.back();
    }
  };

  const formatDate = (dateString: string) => {
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getStatusConfig = (status: any) => {
    const statusStr = String(status).toLowerCase();
    if (statusStr === "active" || statusStr === "1" || statusStr === "true") {
      return {
        label: "Active",
        icon: CheckCircle,
        color: "text-green-400",
        bgColor: "bg-green-500/10",
        borderColor: "border-green-500/20",
      };
    } else {
      return {
        label: "Inactive",
        icon: XCircle,
        color: "text-red-400",
        bgColor: "bg-red-500/10",
        borderColor: "border-red-500/20",
      };
    }
  };

  const getFieldIcon = (fieldName: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      // General
      id: <Key className="w-4 h-4" />,
      name: <User className="w-4 h-4" />,
      status: <Activity className="w-4 h-4" />,
      created_at: <Calendar className="w-4 h-4" />,
      updated_at: <Clock className="w-4 h-4" />,
      
      // Contact
      email: <Mail className="w-4 h-4" />,
      phone: <Phone className="w-4 h-4" />,
      address: <MapPin className="w-4 h-4" />,
      client_name: <User className="w-4 h-4" />,
      
      // Financial
      amount: <DollarSign className="w-4 h-4" />,
      price: <DollarSign className="w-4 h-4" />,
      cost: <DollarSign className="w-4 h-4" />,
      revenue: <BarChart className="w-4 h-4" />,
      payment_method: <CreditCard className="w-4 h-4" />,
      
      // Technical
      server_type: <Server className="w-4 h-4" />,
      storage: <HardDrive className="w-4 h-4" />,
      bandwidth: <Wifi className="w-4 h-4" />,
      databases: <Database className="w-4 h-4" />,
      ssl_enabled: <ShieldCheck className="w-4 h-4" />,
      domain_name: <Globe className="w-4 h-4" />,
      
      // Product
      product_name: <Package className="w-4 h-4" />,
      description: <FileText className="w-4 h-4" />,
      category: <Layers className="w-4 h-4" />,
      sku: <Key className="w-4 h-4" />,
      stock: <Database className="w-4 h-4" />,
      
      // Company
      company: <Building className="w-4 h-4" />,
      industry: <Network className="w-4 h-4" />,
      employee_count: <Users className="w-4 h-4" />,
    };
    
    return iconMap[fieldName] || <FileText className="w-4 h-4" />;
  };

  const getFieldValue = (fieldName: string, value: any) => {
    if (value === null || value === undefined || value === "") {
      return "N/A";
    }
    
    // Date fields
    if (fieldName.includes("date") || fieldName.includes("_at")) {
      return formatDate(value);
    }
    
    // Amount/price fields
    if (fieldName.includes("amount") || fieldName.includes("price") || 
        fieldName.includes("cost") || fieldName.includes("revenue")) {
      return formatCurrency(Number(value));
    }
    
    // Boolean fields
    if (typeof value === "boolean") {
      return value ? "Yes" : "No";
    }
    
    // Status fields
    if (fieldName === "status") {
      return String(value) === "1" || value === true ? "Active" : "Inactive";
    }
    
    return String(value);
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <GlassCard className="p-8">
          <DashboardLoader label="Loading details..." />
        </GlassCard>
      </div>
    );
  }

  if (!record) {
    return null;
  }

  const StatusIcon = getStatusConfig(record.status).icon;

  return (
    <div className="min-h-screen pb-8">
      {/* Back Button */}
      <button
        onClick={handleClose}
        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back
      </button>

      {/* Main Card */}
      <GlassCard className="p-6 backdrop-blur-xl bg-gradient-to-br from-gray-900/80 via-black/80 to-gray-900/80 border border-white/10 shadow-2xl">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30">
              {pageConfig.icon}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                {record.name || record.product_name || record.client_name || `Record #${record.id}`}
                <span
                  className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                    getStatusConfig(record.status).bgColor
                  } ${getStatusConfig(record.status).color} border ${
                    getStatusConfig(record.status).borderColor
                  }`}
                >
                  <StatusIcon className="w-4 h-4" />
                  {getStatusConfig(record.status).label}
                </span>
              </h1>
              <p className="text-gray-400 mt-2">
                {record.description || record.product_description || "No description available"}
              </p>
              <div className="flex flex-wrap items-center gap-4 mt-3 text-sm">
                {record.email && (
                  <span className="flex items-center gap-2 text-gray-300">
                    <Mail className="w-4 h-4" />
                    {record.email}
                  </span>
                )}
                {record.phone && (
                  <span className="flex items-center gap-2 text-gray-300">
                    <Phone className="w-4 h-4" />
                    {record.phone}
                  </span>
                )}
                {record.domain_name && (
                  <span className="flex items-center gap-2 text-gray-300">
                    <Globe className="w-4 h-4" />
                    {record.domain_name}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-blue-400 text-sm font-medium transition-colors flex items-center gap-2">
              <Edit className="w-4 h-4" />
              Edit
            </button>
            <button className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white text-sm font-medium transition-colors">
              More Actions
            </button>
          </div>
        </div>

        {/* Quick Stats Boxes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          {/* Box 1: ID */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent rounded-xl blur-xl group-hover:blur-2xl transition-all duration-300" />
            <GlassCard className="p-5 relative backdrop-blur-xl border border-white/10 hover:border-blue-500/30 transition-all duration-300">
              <div className="flex items-center justify-between mb-3">
                <Key className="w-5 h-5 text-blue-400" />
                <span className="text-xs text-gray-400">ID</span>
              </div>
              <p className="text-sm text-gray-400 mb-1">Record ID</p>
              <p className="text-2xl font-bold text-white">#{record.id}</p>
            </GlassCard>
          </div>

          {/* Box 2: Created Date */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent rounded-xl blur-xl group-hover:blur-2xl transition-all duration-300" />
            <GlassCard className="p-5 relative backdrop-blur-xl border border-white/10 hover:border-purple-500/30 transition-all duration-300">
              <div className="flex items-center justify-between mb-3">
                <Calendar className="w-5 h-5 text-purple-400" />
                <span className="text-xs text-gray-400">Created</span>
              </div>
              <p className="text-sm text-gray-400 mb-1">Created On</p>
              <p className="text-lg font-bold text-white">
                {formatDate(record.created_at)}
              </p>
            </GlassCard>
          </div>

          {/* Box 3: Updated Date */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent rounded-xl blur-xl group-hover:blur-2xl transition-all duration-300" />
            <GlassCard className="p-5 relative backdrop-blur-xl border border-white/10 hover:border-green-500/30 transition-all duration-300">
              <div className="flex items-center justify-between mb-3">
                <Clock className="w-5 h-5 text-green-400" />
                <span className="text-xs text-gray-400">Updated</span>
              </div>
              <p className="text-sm text-gray-400 mb-1">Last Updated</p>
              <p className="text-lg font-bold text-white">
                {formatDate(record.updated_at)}
              </p>
            </GlassCard>
          </div>

          {/* Dynamic Boxes based on record type */}
          {recordType === 1 && record.amount && (
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent rounded-xl blur-xl group-hover:blur-2xl transition-all duration-300" />
              <GlassCard className="p-5 relative backdrop-blur-xl border border-white/10 hover:border-cyan-500/30 transition-all duration-300">
                <div className="flex items-center justify-between mb-3">
                  <DollarSign className="w-5 h-5 text-cyan-400" />
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                </div>
                <p className="text-sm text-gray-400 mb-1">Amount</p>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(record.amount)}
                </p>
              </GlassCard>
            </div>
          )}

          {/* Add more dynamic boxes as needed */}
          {record.status !== undefined && (
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent rounded-xl blur-xl group-hover:blur-2xl transition-all duration-300" />
              <GlassCard className="p-5 relative backdrop-blur-xl border border-white/10 hover:border-orange-500/30 transition-all duration-300">
                <div className="flex items-center justify-between mb-3">
                  <Activity className="w-5 h-5 text-orange-400" />
                </div>
                <p className="text-sm text-gray-400 mb-1">Status</p>
                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                  getStatusConfig(record.status).bgColor
                } ${getStatusConfig(record.status).color}`}>
                  {getStatusConfig(record.status).label}
                </div>
              </GlassCard>
            </div>
          )}
        </div>

        {/* Details Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Dynamic Sections */}
          <div className="space-y-6">
            {pageConfig.sections.map((section, index) => (
              <GlassCard key={index} className="p-6 border border-white/10">
                <div className="flex items-center gap-3 mb-6">
                  <div className={`p-2 rounded-lg bg-${section.color}-500/10`}>
                    <div className={`text-${section.color}-400`}>
                      {section.icon}
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-white">{section.title}</h3>
                </div>
                <div className="space-y-4">
                  {section.fields.map((field) => (
                    record[field] !== undefined && (
                      <div key={field} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="text-gray-400">
                            {getFieldIcon(field)}
                          </span>
                          <div>
                            <p className="text-sm text-gray-400 capitalize">
                              {field.replace(/_/g, ' ')}
                            </p>
                            <p className="text-white font-medium">
                              {getFieldValue(field, record[field])}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  ))}
                </div>
              </GlassCard>
            ))}
          </div>

          {/* Right Column - Common Sections */}
          <div className="space-y-6">
            {/* Remarks/Notes Section */}
            <GlassCard className="p-6 border border-white/10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <MessageSquare className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Notes & Remarks</h3>
              </div>
              <div className="space-y-4">
                {record.remarks || record.note || record.latest_remark ? (
                  <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                          <User className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-white mb-2">
                          {record.remarks || record.note || record.latest_remark?.remark || "No remarks"}
                        </p>
                        {record.updated_at && (
                          <p className="text-xs text-gray-400">
                            Updated: {formatDate(record.updated_at)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-400">No remarks yet</p>
                  </div>
                )}
              </div>
              <div className="mt-6">
                <textarea
                  placeholder="Add a new note..."
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/30 backdrop-blur-sm"
                  rows={3}
                />
                <button className="mt-3 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-purple-400 text-sm font-medium transition-colors">
                  Add Note
                </button>
              </div>
            </GlassCard>

            {/* Activity Timeline */}
            <GlassCard className="p-6 border border-white/10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <Activity className="w-5 h-5 text-orange-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-green-500" />
                  <div>
                    <p className="text-white">Record Created</p>
                    <p className="text-sm text-gray-400">
                      {formatDate(record.created_at)}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-blue-500" />
                  <div>
                    <p className="text-white">Last Updated</p>
                    <p className="text-sm text-gray-400">
                      {formatDate(record.updated_at)}
                    </p>
                  </div>
                </div>
                {record.expiry_date && (
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-purple-500" />
                    <div>
                      <p className="text-white">Expiry Date</p>
                      <p className="text-sm text-gray-400">
                        {formatDate(record.expiry_date)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </GlassCard>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}