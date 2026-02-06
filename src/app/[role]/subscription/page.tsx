"use client";
import { useState, useEffect, useRef } from "react";
import { Header } from "@/components/layout";
import { GlassCard, GlassButton } from "@/components/glass";
import { DeleteConfirmationModal } from "@/common/services/DeleteConfirmationModal";

import {
  Edit,
  Trash2,
  Search,
  Plus,
  Calendar,
  DollarSign,
  Package,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Save,
  X,
  Eye,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/useToast";
import { useRouter } from "next/navigation";
import { apiService } from "@/common/services/apiService";
import Pagination from "@/common/Pagination";
import DashboardLoader, { downloadBase64File } from "@/common/DashboardLoader";
import { getNavigationByRole } from "@/lib/getNavigationByRole";
import { ApiDropdown, glassSelectStyles } from "@/common/DynamicDropdown";
import { GlassSelect } from "@/components/glass/GlassSelect";

interface Subscription {
  id: number;
  client_name: string | null;
  client_id: number;
  domain_name: string | null;
  product_name: string;
  product_id?: number;
  renewal_date: string;
  amount: number | null;
  expiry_date: string;
  days_to_expire_today: number;
  today_date: string;
  status: 0 | 1;
  latest_remark?: {
    id: number;
    remark: string;
  };
  created_at: string;
  updated_at: string;
  remark_id: number;
  remarks: string;
}

interface AddEditSubscription {
  record_type: 1;
  id?: number;
  s_id: number;
  product_id: number;
  client_id: number;
  renewal_date: string;
  amount: number;
  expiry_date: string;
  status: 0 | 1;
  remarks: string;
  product_name: string;
  remark_id: number;
}

interface ProductOption {
  id: number;
  product_name: string;
  product_description?: string;
}

export default function SubscriptionsPage() {
  const {user, getToken } = useAuth()
    const token = getToken();
  const navigationTabs = getNavigationByRole(user?.role);
  const { toast } = useToast();
  const router = useRouter();

  const [data, setData] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [addingNew, setAddingNew] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);

  const [newRecordData, setNewRecordData] = useState({
    product_id: "",
    client_id: "",
    client_name: "",
    product_name: "",
    renewal_date: "",
    amount: "",
    expiry_date: "",
    status: "1" as "1" | "0",
    remarks: "",
  });

  const [editData, setEditData] = useState<
    Record<number, Partial<Subscription> & { remark_id?: number | null }>
  >({});

  const [pagination, setPagination] = useState({
    page: 0,
    rowsPerPage: 10,
    orderBy: "id" as "id" | "renewal_date" | "amount" | "product_name",
    orderDir: "desc" as "asc" | "desc",
  });

  const [totalItems, setTotalItems] = useState(0);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  

  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  const statusOptions = [
  { value: "1", label: "Active" },
  { value: "0", label: "Inactive" },
];

const getSelectedStatusOption = () => {
  return (
    statusOptions.find(
      (option) => option.value === newRecordData.status
    ) || null
  );
};

const handleStatusSelect = (selected: any) => {
  handleNewRecordChange(
    "status",
    selected?.value as "1" | "0"
  );
};

  // Fetch subscriptions
  const fetchSubscriptions = async () => {
    try {
      setLoading(true);

      const response = await apiService.listRecords({
        record_type: 1,
        search: searchQuery,
        page: pagination.page,
        rowsPerPage: pagination.rowsPerPage,
        orderBy: pagination.orderBy,
        orderDir: pagination.orderDir,
      },
        user,
      token
    );

      if (response.status) {
        setData(response.data || []);
        setTotalItems(response.total || 0);
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to fetch subscriptions",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
      toast({
        title: "Error",
        description: "Failed to fetch subscriptions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
    // fetchProducts();
  }, [pagination.page, pagination.orderBy, pagination.orderDir, token]);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setPagination((prev) => ({ ...prev, page: 0 }));
      fetchSubscriptions();
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Handle Add New
  const handleAddNew = () => {
    setAddingNew(true);
    setNewRecordData({
      product_id: "",
      product_name: "",
      client_id: "",
      client_name: "",
      renewal_date: "",
      amount: "",
      expiry_date: "",
      status: "1",
      remarks: "",
    });
  };

  // Cancel Add New
  const handleCancelAdd = () => {
    setAddingNew(false);
  };

  // Get product name by ID
  const getProductNameById = (id: string | number) => {
    const product = products.find((p) => p.id === Number(id));
    return product?.product_name || "";
  };

  // Save New Record
  const handleSaveNew = async () => {
    try {
      setIsSaving(true);

      if (
        !newRecordData.product_id ||
        !newRecordData.expiry_date
      ) {
        toast({
          title: "Error",
          description: "Please fill all required fields",
          variant: "destructive",
        });
        return;
      }

      const productName = getProductNameById(newRecordData.product_id);

      const payload: AddEditSubscription = {
        record_type: 1,
        s_id: user?.id || 0,
        product_id: Number(newRecordData.product_id),
        client_id: parseInt(newRecordData.client_id),
        client_name: newRecordData.client_name,
        product_name: productName,
        renewal_date: newRecordData.renewal_date,
        amount: parseFloat(newRecordData.amount) || 0,
        expiry_date: newRecordData.expiry_date,
        status: parseInt(newRecordData.status) as 0 | 1,
        remarks: newRecordData.remarks,
        remark_id: editData[0]?.remark_id || null,
      };

      const response = await apiService.addRecord(payload,user,token);

      if (response.status) {
        toast({
          title: "Success",
          description: response.message || "Subscription added successfully",
          variant: "default",
        });
        setAddingNew(false);
        fetchSubscriptions();
        setNewRecordData({
          product_id: "",
          client_id: "",
          client_name: "",
          product_name: "",
          renewal_date: "",
          amount: "",
          expiry_date: "",
          status: "1",
          remarks: "",
        });
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to add subscription",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error adding subscription:", error);
      toast({
        title: "Error",
        description: "Failed to add subscription",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = async () => {
    try {
      setExportLoading(true);

      const payload: AddEditSubscription = {
        record_type: 1,
        s_id: user?.id || 0,
      };

      const response = await apiService.exportRecord(payload,user,token);

      if (response.success) {
        toast({
          title: "Success",
          description: response.message || "Subscription exported successfully",
          variant: "default",
        });
        downloadBase64File(response.data.base64, response.data.filename);
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to export subscription",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error exporting subscription:", error);
      toast({
        title: "Error",
        description: "Failed to export subscription",
        variant: "destructive",
      });
    } finally {
      setExportLoading(false);
    }
  };

  // Handle Edit - Clear previous edit data
  const handleEdit = (subscription: Subscription) => {
    console.log(subscription);
    setEditingId(subscription.id);
    setEditData({
      [subscription.id]: {
        ...subscription,
        product_id: subscription.product_id || 0,
        client_id: subscription.client_id || 0,
        client_name: subscription.client_name || "",
        product_name: subscription.product_name || "",
        remarks: subscription.latest_remark?.remark || "",
        remark_id: subscription.latest_remark?.id || null,
      },
    });
  };

  // Handle Save (inline editing)
  const handleSave = async (id: number) => {
    try {
      setIsSaving(true);
      const updatedData = editData[id];

      if (!updatedData) return;

      const productId =
        updatedData.product_id ||
        data.find((item) => item.id === id)?.product_id ||
        0;
      const productName =
        updatedData.product_name || getProductNameById(productId);

      const payload: AddEditSubscription = {
        record_type: 1,
        id,
        s_id: user?.id || 6,
        product_id: Number(productId),
        client_id: updatedData.client_id || 0,
        client_name: updatedData.client_name || "",
        product_name: productName,
        renewal_date: updatedData.renewal_date || "",
        amount: updatedData.amount || 0,
        expiry_date: updatedData.expiry_date || "",
        status: updatedData.status ?? 1,
        remarks: updatedData.remarks || "",
        remark_id: updatedData.remark_id || null,
      };

      const response = await apiService.editRecord(payload,user,token);

      if (response.status) {
        toast({
          title: "Success",
          description: response.message || "Subscription updated successfully",
          variant: "default",
        });
        setEditingId(null);
        setEditData({});
        fetchSubscriptions();
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to update subscription",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating subscription:", error);
      toast({
        title: "Error",
        description: "Failed to update subscription",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Cancel Edit
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  // Handle field change for editing
  const handleEditChange = (
    id: number,
    field: keyof Subscription,
    value: any
  ) => {
    setEditData((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  // Handle field change for new record
  const handleNewRecordChange = (
    field: keyof typeof newRecordData,
    value: any
  ) => {
    setNewRecordData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle Delete
  const handleDeleteClick = (id: number) => {
    setItemToDelete(id);
    setShowDeleteModal(true);
  };

  const handleBulkDeleteClick = () => {
    if (selectedItems.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one subscription",
        variant: "destructive",
      });
      return;
    }
    setItemToDelete(null);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      setIsDeleting(true);

      const idsToDelete = itemToDelete ? [itemToDelete] : selectedItems;

      const response = await apiService.deleteRecords(idsToDelete, 1,user,token);

      if (response.status) {
        toast({
          title: "Success",
          description: response.message || "Record(s) deleted successfully",
          variant: "default",
        });

        setSelectedItems([]);
        setItemToDelete(null);
        fetchSubscriptions();
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to delete record(s)",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting:", error);
      toast({
        title: "Error",
        description: "Failed to delete record(s)",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  // Handle Select All
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(data.map((item) => item.id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleSelectItem = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedItems((prev) => [...prev, id]);
    } else {
      setSelectedItems((prev) => prev.filter((itemId) => itemId !== id));
    }
  };

  const isAllSelected = data.length > 0 && selectedItems.length === data.length;

  const getStatusColor = (status: 0 | 1) => {
    return status === 1 ? "text-green-400" : "text-red-400";
  };

  const getStatusText = (status: 0 | 1) => {
    return status === 1 ? "Active" : "Inactive";
  };

  const getStatusIcon = (status: 0 | 1) => {
    return status === 1 ? (
      <CheckCircle className="w-4 h-4" />
    ) : (
      <XCircle className="w-4 h-4" />
    );
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

  const calculateDays = (expiryDate: string) => {
    try {
      const today = new Date();
      const expiry = new Date(expiryDate);
      const diffTime = expiry.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch {
      return 0;
    }
  };

  const startItem = pagination.page * pagination.rowsPerPage + 1;

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  // Handle View Details (redirect to details page)
  const handleViewDetails = (item: Subscription) => {
    if (!item.id) {
      toast({
        title: "Error",
        description: "Product ID not found",
        variant: "destructive",
      });
      return;
    }
    
    // Redirect to details page with recordType and recordId
    router.push(`/${user?.role}/categaries-details/${item.id}?recordType=1`);
  };

  return (
    <div className="min-h-screen pb-8">
      <Header title="Subscription Management" tabs={navigationTabs} />

      <div className="px-4 sm:px-6 mt-6">
        <GlassCard className="p-6 backdrop-blur-xl bg-gradient-to-br from-gray-900/80 via-black/80 to-gray-900/80 border border-white/10 shadow-2xl">
          {/* Header with Search and Add Button */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <Package className="w-6 h-6 text-[#BC8969]" />
                <h2 className="text-xl font-semibold text-white">
                  Subscriptions
                </h2>
              </div>
              <p className="text-sm text-gray-400 mt-1">
                Manage your subscriptions and renewals
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search subscriptions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full sm:w-64 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/30 backdrop-blur-sm transition-all"
                />
              </div>

              <div className="flex gap-2">
                {selectedItems.length > 0 && (
                  <GlassButton
                    variant="danger"
                    onClick={handleBulkDeleteClick}
                    className="flex items-center gap-2"
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    Delete ({selectedItems.length})
                  </GlassButton>
                )}

                {!addingNew && (
                  <GlassButton
                    variant="primary"
                    onClick={handleAddNew}
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Subscription
                  </GlassButton>
                )}
                <GlassButton
                    variant="primary"
                    onClick={handleExport}
                    className="flex items-center gap-2"
                    disabled={exportLoading}
                  >
                    {exportLoading ? ("Exporting...") : (" Export" )}
                  </GlassButton>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-hidden rounded-xl border border-white/10 backdrop-blur-sm">
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-white/5 border-b border-white/10">
                    <th className="py-3 px-4 text-left w-12">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500/50 cursor-pointer"
                      />
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 min-w-[80px]">
                      S.NO
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 min-w-[180px]">
                      Product
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 min-w-[140px]">
                      Client
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 min-w-[120px]">
                      Amount
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 min-w-[140px]">
                      Renewal Date
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 min-w-[100px]">
                      Days Left
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 min-w-[100px]">
                      Status
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 min-w-[180px]">
                      Remarks
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 min-w-[140px]">
                      Last Updated
                    </th>
                    <th className="py-3 px-4 text-right text-sm font-medium text-gray-300 min-w-[160px]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={11} className="py-8 text-center">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <DashboardLoader label="Fetch Subscriptions..." />
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <>
                      {/* Add New Row */}
                      {addingNew && (
                        <tr className="border-b border-white/5 bg-blue-500/5">
                          <td className="py-3 px-4"></td>
                          <td className="py-3 px-4 text-sm text-gray-300">
                            New
                          </td>
                          <td className="py-3 px-4">
                            {loadingProducts ? (
                              <div className="w-full px-2 py-1 bg-white/5 border border-white/10 rounded text-sm text-gray-400">
                                Loading products...
                              </div>
                            ) : (
                              <ApiDropdown
                                label=""
                                endpoint="get-products"
                                value={
                                  newRecordData.product_id
                                    ? {
                                        value: newRecordData.product_id,
                                        label: newRecordData.product_name,
                                      }
                                    : null
                                }
                                onChange={(option) => {
                                  handleNewRecordChange(
                                    "product_id",
                                    option?.value ?? null
                                  );
                                  handleNewRecordChange(
                                    "product_name",
                                    option?.label ?? ""
                                  );
                                }}
                                placeholder="Product"
                              />
                            )}
                          </td>
                          <td className="py-3 px-4">
                              <ApiDropdown
                                label=""
                                endpoint="get-clients"
                                value={
                                  newRecordData.client_id
                                    ? {
                                        value: newRecordData.client_id,
                                        label: newRecordData.client_name,
                                      }
                                    : null
                                }
                                onChange={(option) => {
                                  handleNewRecordChange(
                                    "client_id",
                                    option?.value ?? null
                                  );
                                  handleNewRecordChange(
                                    "client_name",
                                    option?.label ?? ""
                                  );
                                }}
                                placeholder="Client"
                              />                          
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="number"
                              value={newRecordData.amount}
                              onChange={(e) =>
                                handleNewRecordChange("amount", e.target.value)
                              }
                              className="w-full px-2 py-1 bg-white/5 border border-blue-500/30 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/30 backdrop-blur-sm"
                              style={{ minHeight: "32px" }}
                              placeholder="0.00"
                              min="0"
                              step="0.01"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="date"
                              value={newRecordData.expiry_date}
                              onChange={(e) =>
                                handleNewRecordChange(
                                  "expiry_date",
                                  e.target.value
                                )
                              }
                              className="w-full px-2 py-1 bg-white/5 border border-blue-500/30 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/30 backdrop-blur-sm"
                              style={{ minHeight: "32px" }}
                            />
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-300">
                           <input
                              type="number"
                              value={calculateDays(newRecordData.expiry_date)}
                              readOnly
                              className="w-full px-2 py-1 bg-white/10 border border-white/10 rounded text-gray-400 text-xs cursor-not-allowed"
                              style={{ minHeight: '32px' }}
                            />
                          </td>
                          <td className="py-3 px-4">
                         <div className="w-40">
  <GlassSelect
    options={statusOptions}
    value={getSelectedStatusOption()}
    onChange={handleStatusSelect}
    isSearchable={false}
    isClearable
    styles={glassSelectStyles}
  />
</div>

                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="text"
                              value={newRecordData.remarks}
                              onChange={(e) =>
                                handleNewRecordChange("remarks", e.target.value)
                              }
                              className="w-full px-2 py-1 bg-white/5 border border-blue-500/30 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/30 backdrop-blur-sm"
                              style={{ minHeight: "32px" }}
                              placeholder="Remarks"
                            />
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-300">
                            --
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-end gap-2">
                              <GlassButton
                                onClick={handleSaveNew}
                                disabled={isSaving}
                                className="p-1.5 min-w-0 bg-green-500/20 hover:bg-green-500/30"
                                title="Save"
                              >
                                {isSaving ? (
                                  <Loader2 className="w-4 h-4 animate-spin text-green-400" />
                                ) : (
                                  <Save className="w-4 h-4 text-green-400" />
                                )}
                              </GlassButton>
                              <GlassButton
                                onClick={handleCancelAdd}
                                disabled={isSaving}
                                className="p-1.5 min-w-0 bg-red-500/20 hover:bg-red-500/30"
                                title="Cancel"
                              >
                                <X className="w-4 h-4 text-red-400" />
                              </GlassButton>
                            </div>
                          </td>
                        </tr>
                      )}

                      {/* Existing Data Rows */}
                      {data.length === 0 ? (
                        <tr>
                          <td colSpan={11} className="py-8 text-center">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <Package className="w-12 h-12 text-gray-400" />
                              <span className="text-gray-400">
                                No subscriptions found
                              </span>
                              {searchQuery && (
                                <button
                                  onClick={() => setSearchQuery("")}
                                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                                >
                                  Clear search
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ) : (
                        data.map((item, index) => (
                          <tr
                            key={item.id}
                            className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors ${
                              editingId === item.id ? "bg-blue-500/5" : ""
                            }`}
                          >
                            <td className="py-3 px-4">
                              <input
                                type="checkbox"
                                checked={selectedItems.includes(item.id)}
                                onChange={(e) =>
                                  handleSelectItem(item.id, e.target.checked)
                                }
                                className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500/50 cursor-pointer"
                              />
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-300">
                              {startItem + index}
                            </td>

                            {editingId === item.id ? (
                              <>
                                <td className="py-3 px-4">
                                  {loadingProducts ? (
                                    <div className="w-full px-2 py-1 bg-white/5 border border-white/10 rounded text-sm text-gray-400">
                                      Loading products...
                                    </div>
                                  ) : (
                                    <ApiDropdown
                                      endpoint="get-products"
                                      value={
                                        editData[item.id]?.product_id
                                          ? {
                                              value:
                                                editData[item.id]?.product_id ||
                                                0,
                                              label:
                                                editData[item.id]
                                                  ?.product_name ||
                                                getProductNameById(
                                                  editData[item.id]
                                                    ?.product_id || 0
                                                ),
                                            }
                                          : null
                                      }
                                      onChange={(option) => {
                                        handleEditChange(
                                          item.id,
                                          "product_id",
                                          option?.value ?? null
                                        );
                                        handleEditChange(
                                          item.id,
                                          "product_name",
                                          option?.label ?? ""
                                        );
                                      }}
                                      placeholder="Product"
                                    />
                                  )}
                                </td>
                                <td className="py-3 px-4">
                                  <ApiDropdown
                                      endpoint="get-clients"
                                      value={
                                        editData[item.id]?.client_id
                                          ? {
                                              value:
                                                editData[item.id]?.client_id ||
                                                0,
                                              label:
                                                editData[item.id]
                                                  ?.client_name ||
                                                getProductNameById(
                                                  editData[item.id]
                                                    ?.client_id || 0
                                                ),
                                            }
                                          : null
                                      }
                                      onChange={(option) => {
                                        handleEditChange(
                                          item.id,
                                          "client_id",
                                          option?.value ?? null
                                        );
                                        handleEditChange(
                                          item.id,
                                          "client_name",
                                          option?.label ?? ""
                                        );
                                      }}
                                      placeholder="Client"
                                    />
                                </td>
                                <td className="py-3 px-4">
                                  <input
                                    type="number"
                                    value={
                                      editData[item.id]?.amount ||
                                      item.amount ||
                                      ""
                                    }
                                    onChange={(e) =>
                                      handleEditChange(
                                        item.id,
                                        "amount",
                                        parseFloat(e.target.value) || 0
                                      )
                                    }
                                    className="w-full px-2 py-1 bg-white/5 border border-blue-500/30 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/30 backdrop-blur-sm"
                                    style={{ minHeight: "32px" }}
                                    min="0"
                                    step="0.01"
                                  />
                                </td>
                                <td className="py-3 px-4">
                                  <input
                                    type="date"
                                    value={
                                      editData[item.id]?.expiry_date ||
                                      item.expiry_date
                                    }
                                    onChange={(e) =>
                                      handleEditChange(
                                        item.id,
                                        "expiry_date",
                                        e.target.value
                                      )
                                    }
                                    className="w-full px-2 py-1 bg-white/5 border border-blue-500/30 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/30 backdrop-blur-sm"
                                    style={{ minHeight: "32px" }}
                                  />
                                </td>
                                <td className="py-3 px-4 text-sm text-gray-300">
                           <input
                              type="number"
                              value={calculateDays(editData[item.id]?.expiry_date || item.expiry_date)}
                              readOnly
                              className="w-full px-2 py-1 bg-white/10 border border-white/10 rounded text-gray-400 text-xs cursor-not-allowed"
                              style={{ minHeight: '32px' }}
                            />
                          </td>
                              </>
                            ) : (
                              <>
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-2">
                                    <Package className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                    <span className="text-sm text-white font-medium">
                                      {item.product_name}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-sm text-gray-300">
                                    {item.client_name}
                                </td>
                                <td className="py-3 px-4 text-sm text-gray-300">
                                  <div className="flex items-center gap-2">
                                    {item.amount || "0.00"}
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-sm text-gray-300">
                                  {formatDate(item.expiry_date)}
                                </td>
                                <td className="py-3 px-4">
                              <div
                                className={`inline-flex items-center whitespace-nowrap gap-1 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${
                                  calculateDays(item.expiry_date) < 0
                                    ? "bg-red-500/20 text-red-400 border border-red-500/20"
                                    : calculateDays(item.expiry_date) <= 7
                                    ? "bg-orange-500/20 text-orange-400 border border-orange-500/20"
                                    : "bg-green-500/20 text-green-400 border border-green-500/20"
                                }`}
                              >
                                {calculateDays(item.expiry_date)} days
                              </div>
                            </td>
                              </>
                            )}

                            
                            {editingId === item.id ? (
                              <td className="py-3 px-4">
                                <div className="w-40">
  <GlassSelect
    options={statusOptions}
    value={getSelectedStatusOption()}
    onChange={handleStatusSelect}
    isSearchable={false}
    isClearable
    styles={glassSelectStyles}
  />
</div>
                              </td>
                            ) : (
                              <td className="py-3 px-4">
                                <div
                                  className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm border ${
                                    item.status === 1
                                      ? "bg-green-500/20 text-green-400 border-green-500/20"
                                      : "bg-red-500/20 text-red-400 border-red-500/20"
                                  }`}
                                >
                                  {getStatusIcon(item.status)}
                                  {getStatusText(item.status)}
                                </div>
                              </td>
                            )}

                            {editingId === item.id ? (
                              <td className="py-3 px-4">
                                <input
                                  type="text"
                                  value={
                                    editData[item.id]?.remarks ||
                                    item?.latest_remark?.remark
                                  }
                                  onChange={(e) =>
                                    handleEditChange(
                                      item.id,
                                      "remarks",
                                      e.target.value
                                    )
                                  }
                                  className="w-full px-2 py-1 bg-white/5 border border-blue-500/30 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/30 backdrop-blur-sm"
                                  style={{ minHeight: "32px" }}
                                />
                              </td>
                            ) : (
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <MessageSquare className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                  <span className="text-sm text-gray-300 truncate max-w-[180px]">
                                    {item?.latest_remark?.remark}
                                  </span>
                                </div>
                              </td>
                            )}

                            <td className="py-3 px-4 text-sm text-gray-300 whitespace-nowrap">
                              {item.updated_at}
                            </td>

                            <td className="py-3 px-4">
                              <div
                                className="flex items-center justify-end gap-2"
                              >
                                {editingId === item.id ? (
                                  <>
                                    <GlassButton
                                      onClick={() => handleSave(item.id)}
                                      disabled={isSaving}
                                      className="p-1.5 min-w-0 bg-green-500/20 hover:bg-green-500/30"
                                      title="Save"
                                    >
                                      {isSaving ? (
                                        <Loader2 className="w-4 h-4 animate-spin text-green-400" />
                                      ) : (
                                        <Save className="w-4 h-4 text-green-400" />
                                      )}
                                    </GlassButton>
                                    <GlassButton
                                      onClick={handleCancelEdit}
                                      disabled={isSaving}
                                      className="p-1.5 min-w-0 bg-red-500/20 hover:bg-red-500/30"
                                      title="Cancel"
                                    >
                                      <X className="w-4 h-4 text-red-400" />
                                    </GlassButton>
                                  </>
                                ) : (
                                  <>
                                    <GlassButton
                                      onClick={() => handleViewDetails(item)}
                                      className="p-1.5 min-w-0 hover:bg-blue-500/20"
                                      title="View Details"
                                    >
                                      <Eye className="w-4 h-4 text-gray-300 hover:text-blue-400 transition-colors" />
                                    </GlassButton>
                                    <GlassButton
                                      onClick={() => handleEdit(item)}
                                      className="p-1.5 min-w-0 hover:bg-white/10"
                                      title="Edit"
                                    >
                                      <Edit className="w-4 h-4 text-gray-300 hover:text-blue-400 transition-colors" />
                                    </GlassButton>
                                    <GlassButton
                                      onClick={() => handleDeleteClick(item.id)}
                                      className="p-1.5 min-w-0 hover:bg-red-500/20"
                                      title="Delete"
                                    >
                                      <Trash2 className="w-4 h-4 text-gray-300 hover:text-red-400 transition-colors" />
                                    </GlassButton>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!loading && data.length > 0 && (
              <Pagination
                page={pagination.page}
                rowsPerPage={pagination.rowsPerPage}
                totalItems={totalItems}
                onPageChange={handlePageChange}
              />
            )}
          </div>

          {/* Selected Items Info */}
          {selectedItems.length > 0 && (
            <div className="mt-4 p-3 bg-white/5 rounded-lg border border-white/10 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">
                  {selectedItems.length} subscription
                  {selectedItems.length > 1 ? "s" : ""} selected
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedItems([])}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Clear selection
                  </button>
                  <button
                    onClick={handleBulkDeleteClick}
                    disabled={isDeleting}
                    className="text-sm text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                  >
                    {isDeleting
                      ? "Deleting..."
                      : `Delete ${selectedItems.length} items`}
                  </button>
                </div>
              </div>
            </div>
          )}
        </GlassCard>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setItemToDelete(null);
        }}
        onConfirm={confirmDelete}
        itemCount={itemToDelete ? 1 : selectedItems.length}
        isLoading={isDeleting}
        title={
          itemToDelete ? "Delete Subscription" : "Delete Multiple Subscriptions"
        }
        message={
          itemToDelete
            ? "Are you sure you want to delete this subscription? This action cannot be undone."
            : "Are you sure you want to delete the selected subscriptions? This action cannot be undone."
        }
      />
    </div>
  );
}
