"use client";

import { useState, useEffect, useRef } from "react";
import { Header } from "@/components/layout";
import { GlassCard, GlassButton } from "@/components/glass";
import { EditRow } from "@/common/services/EditRow";
import { DeleteConfirmationModal } from "@/common/services/DeleteConfirmationModal";
import { useDetailsModal } from "@/hooks/useDetailsModal";
import DynamicDetailsPage from "../categaries-details/[id]/DynamicDetailsPage/page";
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
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/useToast";
import { useRouter } from "next/navigation";
import { apiService } from "@/common/services/apiService";
import Pagination from "@/common/Pagination";
import DashboardLoader from "@/common/DashboardLoader";
import { getNavigationByRole } from "@/lib/getNavigationByRole";
import { ApiDropdown } from "@/common/DynamicDropdown";

interface Subscription {
  id: number;
  client_name: string | null;
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
  const { user } = useAuth();
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
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const { isOpen, modalData, openDetails, closeDetails } = useDetailsModal();

  const [newRecordData, setNewRecordData] = useState({
    product_id: "",
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

  // Fetch products dropdown
  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      const response = await apiService.getDropdownOptions("get-products");

      if (response.data.status) {
        setProducts(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive",
      });
    } finally {
      setLoadingProducts(false);
    }
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
      });

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
    fetchProducts();
  }, [pagination.page, pagination.orderBy, pagination.orderDir]);

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
        !newRecordData.renewal_date ||
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
        product_name: productName,
        renewal_date: newRecordData.renewal_date,
        amount: parseFloat(newRecordData.amount) || 0,
        expiry_date: newRecordData.expiry_date,
        status: parseInt(newRecordData.status) as 0 | 1,
        remarks: newRecordData.remarks,
        remark_id: editData[0]?.remark_id || null, // FIXED: updatedData से editData में change
      };

      const response = await apiService.addRecord(payload);

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

  // Handle Edit - Clear previous edit data
  const handleEdit = (subscription: Subscription) => {
    console.log(subscription);
    setEditingId(subscription.id);
    setEditData({
      [subscription.id]: {
        ...subscription,
        product_id: subscription.product_id || 0,
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
        product_name: productName,
        renewal_date: updatedData.renewal_date || "",
        amount: updatedData.amount || 0,
        expiry_date: updatedData.expiry_date || "",
        status: updatedData.status ?? 1,
        remarks: updatedData.remarks || "",
        remark_id: updatedData.remark_id || null,
      };

      const response = await apiService.editRecord(payload);

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

      const response = await apiService.deleteRecords(idsToDelete, 1);

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

  // Handle row click
  const handleRowClick = (e: React.MouseEvent, item: Subscription) => {
    // Prevent opening when clicking on checkbox or action buttons
    if (
      (e.target as HTMLElement).closest('input[type="checkbox"]') ||
      (e.target as HTMLElement).closest("button") ||
      editingId === item.id
    ) {
      return;
    }

    // Open details modal (or navigate to details page)
    openDetails(1, item.id, item.product_name);
    // OR if you want to navigate to a page:
    // router.push(`/subscriptions/${item.id}`);
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
                      Renewal Date
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 min-w-[120px]">
                      Amount
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 min-w-[140px]">
                      Expiry Date
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
                    <th className="py-3 px-4 text-right text-sm font-medium text-gray-300 min-w-[140px]">
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
                            <input
                              type="date"
                              value={newRecordData.renewal_date}
                              onChange={(e) =>
                                handleNewRecordChange(
                                  "renewal_date",
                                  e.target.value
                                )
                              }
                              className="w-full px-2 py-1 bg-white/5 border border-blue-500/30 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/30 backdrop-blur-sm"
                              style={{ minHeight: "32px" }}
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
                            --
                          </td>
                          <td className="py-3 px-4">
                            <select
                              value={newRecordData.status}
                              onChange={(e) =>
                                handleNewRecordChange(
                                  "status",
                                  e.target.value as "1" | "0"
                                )
                              }
                              className="w-full px-2 py-1 bg-white/5 border border-blue-500/30 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/30 backdrop-blur-sm"
                              style={{ minHeight: "32px" }}
                            >
                              <option
                                value="1"
                                className="bg-gray-900 text-white"
                              >
                                Active
                              </option>
                              <option
                                value="0"
                                className="bg-gray-900 text-white"
                              >
                                Inactive
                              </option>
                            </select>
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
                            className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer group ${
                              editingId === item.id ? "bg-blue-500/5" : ""
                            }`}
                            onClick={(e) => handleRowClick(e, item)}
                          >
                            <td
                              className="py-3 px-4"
                              onClick={(e) => e.stopPropagation()}
                            >
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
                                      placeholder="Select Product"
                                    />
                                  )}
                                </td>
                                <td className="py-3 px-4">
                                  <input
                                    type="date"
                                    value={
                                      editData[item.id]?.renewal_date ||
                                      item.renewal_date
                                    }
                                    onChange={(e) =>
                                      handleEditChange(
                                        item.id,
                                        "renewal_date",
                                        e.target.value
                                      )
                                    }
                                    className="w-full px-2 py-1 bg-white/5 border border-blue-500/30 rounded text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/30 backdrop-blur-xs"
                                    style={{ minHeight: "32px" }}
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
                                  <div className="flex items-center gap-2">
                                    {formatDate(item.renewal_date)}
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-sm text-gray-300">
                                  <div className="flex items-center gap-2">
                                    {item.amount || "0.00"}
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-sm text-gray-300">
                                  {formatDate(item.expiry_date)}
                                </td>
                              </>
                            )}

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
                            {editingId === item.id ? (
                              <td className="py-3 px-4">
                                <select
                                  value={
                                    editData[item.id]?.status?.toString() ||
                                    item.status.toString()
                                  }
                                  onChange={(e) =>
                                    handleEditChange(
                                      item.id,
                                      "status",
                                      parseInt(e.target.value) as 0 | 1
                                    )
                                  }
                                  className="w-full px-2 py-1 bg-white/5 border border-blue-500/30 rounded text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/30 backdrop-blur-sm"
                                  style={{ minHeight: "32px" }}
                                >
                                  <option
                                    value="1"
                                    className="bg-gray-900 text-white"
                                  >
                                    Active
                                  </option>
                                  <option
                                    value="0"
                                    className="bg-gray-900 text-white"
                                  >
                                    Inactive
                                  </option>
                                </select>
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

                            <td className="py-3 px-4 text-sm text-gray-300">
                              {item.updated_at}
                            </td>

                            <td className="py-3 px-4">
                              <div
                                className="flex items-center justify-end gap-2"
                                onClick={(e) => e.stopPropagation()}
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
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEdit(item);
                                      }}
                                      className="p-1.5 min-w-0 hover:bg-white/10"
                                      title="Edit"
                                    >
                                      <Edit className="w-4 h-4 text-gray-300 hover:text-blue-400 transition-colors" />
                                    </GlassButton>
                                    <GlassButton
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteClick(item.id);
                                      }}
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
      {isOpen && modalData && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={closeDetails}
          />

          {/* Modal Container */}
          <div className="relative min-h-screen px-4 py-8 flex items-start justify-center">
            {/* Modal Content */}
            <div className="relative w-full max-w-7xl bg-transparent">
              <DynamicDetailsPage
                recordType={modalData.recordType}
                recordId={modalData.recordId}
                onClose={closeDetails}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}






// "use client";

// import { useState, useEffect, useRef } from "react";
// import { Header } from "@/components/layout";
// import { GlassCard, GlassButton } from "@/components/glass";
// import { EditRow } from "@/common/services/EditRow";
// import { DeleteConfirmationModal } from "@/common/services/DeleteConfirmationModal";
// import { useDetailsModal } from "@/hooks/useDetailsModal";
// import DynamicDetailsPage from "../categaries-details/[id]/DynamicDetailsPage/page";
// import {
//   Edit,
//   Trash2,
//   Search,
//   Plus,
//   Calendar,
//   DollarSign,
//   Package,
//   MessageSquare,
//   Clock,
//   CheckCircle,
//   XCircle,
//   Loader2,
//   ChevronLeft,
//   ChevronRight,
//   Save,
//   X,
// } from "lucide-react";
// import { useAuth } from "@/contexts/AuthContext";
// import { useToast } from "@/hooks/useToast";
// import { useRouter } from "next/navigation";
// import { apiService } from "@/common/services/apiService";
// import Pagination from "@/common/Pagination";
// import DashboardLoader from "@/common/DashboardLoader";
// import { getNavigationByRole } from "@/lib/getNavigationByRole";
// import { ApiDropdown } from "@/common/DynamicDropdown";

// interface Subscription {
//   id: number;
//   client_name: string | null;
//   domain_name: string | null;
//   product_name: string;
//   product_id?: number;
//   renewal_date: string;
//   amount: number | null;
//   expiry_date: string;
//   days_to_expire_today: number;
//   today_date: string;
//   status: 0 | 1;
//   latest_remark?: {
//     id: number;
//     remark: string;
//   };
//   created_at: string;
//   updated_at: string;
//   remark_id: number;
//   remarks: string;
// }

// interface AddEditSubscription {
//   record_type: 1;
//   id?: number;
//   s_id: number;
//   product_id: number;
//   renewal_date: string;
//   amount: number;
//   expiry_date: string;
//   status: 0 | 1;
//   remarks: string;
//   product_name: string;
//   remark_id: number;
// }

// interface ProductOption {
//   id: number;
//   product_name: string;
//   product_description?: string;
// }

// export default function SubscriptionsPage() {
//   const { user } = useAuth();
//   const navigationTabs = getNavigationByRole(user?.role);
//   const { toast } = useToast();
//   const router = useRouter();

//   const [data, setData] = useState<Subscription[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [selectedItems, setSelectedItems] = useState<number[]>([]);
//   const [editingId, setEditingId] = useState<number | null>(null);
//   const [addingNew, setAddingNew] = useState(false);
//   const [isSaving, setIsSaving] = useState(false);
//   const [isDeleting, setIsDeleting] = useState(false);
//   const [showDeleteModal, setShowDeleteModal] = useState(false);
//   const [itemToDelete, setItemToDelete] = useState<number | null>(null);
//    const { isOpen, modalData, openDetails, closeDetails } = useDetailsModal();

//   const [newRecordData, setNewRecordData] = useState({
//     product_id: "",
//     product_name: "",
//     renewal_date: "",
//     amount: "",
//     expiry_date: "",
//     status: "1" as "1" | "0",
//     remarks: "",
//   });

//   const [editData, setEditData] = useState<
//     Record<number, Partial<Subscription> & { remark_id?: number | null }>
//   >({});

//   const [pagination, setPagination] = useState({
//     page: 0,
//     rowsPerPage: 10,
//     orderBy: "id" as "id" | "renewal_date" | "amount" | "product_name",
//     orderDir: "desc" as "asc" | "desc",
//   });

//   const [totalItems, setTotalItems] = useState(0);
//   const [products, setProducts] = useState<ProductOption[]>([]);
//   const [loadingProducts, setLoadingProducts] = useState(false);

//   const searchTimeoutRef = useRef<NodeJS.Timeout>();

//   // Fetch products dropdown
//   const fetchProducts = async () => {
//     try {
//       setLoadingProducts(true);
//       const response = await apiService.getDropdownOptions("get-products");

//       if (response.data.status) {
//         setProducts(response.data.data);
//       }
//     } catch (error) {
//       console.error("Error fetching products:", error);
//       toast({
//         title: "Error",
//         description: "Failed to load products",
//         variant: "destructive",
//       });
//     } finally {
//       setLoadingProducts(false);
//     }
//   };

//   // Fetch subscriptions
//   const fetchSubscriptions = async () => {
//     try {
//       setLoading(true);

//       const response = await apiService.listRecords({
//         record_type: 1,
//         search: searchQuery,
//         page: pagination.page,
//         rowsPerPage: pagination.rowsPerPage,
//         orderBy: pagination.orderBy,
//         orderDir: pagination.orderDir,
//       });

//       if (response.status) {
//         setData(response.data || []);
//         setTotalItems(response.total || 0);
//       } else {
//         toast({
//           title: "Error",
//           description: response.message || "Failed to fetch subscriptions",
//           variant: "destructive",
//         });
//       }
//     } catch (error) {
//       console.error("Error fetching subscriptions:", error);
//       toast({
//         title: "Error",
//         description: "Failed to fetch subscriptions",
//         variant: "destructive",
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchSubscriptions();
//     fetchProducts();
//   }, [pagination.page, pagination.orderBy, pagination.orderDir]);

//   useEffect(() => {
//     if (searchTimeoutRef.current) {
//       clearTimeout(searchTimeoutRef.current);
//     }

//     searchTimeoutRef.current = setTimeout(() => {
//       setPagination((prev) => ({ ...prev, page: 0 }));
//       fetchSubscriptions();
//     }, 300);

//     return () => {
//       if (searchTimeoutRef.current) {
//         clearTimeout(searchTimeoutRef.current);
//       }
//     };
//   }, [searchQuery]);

//   // Handle Add New
//   const handleAddNew = () => {
//     setAddingNew(true);
//     setNewRecordData({
//       product_id: "",
//       product_name: "",
//       renewal_date: "",
//       amount: "",
//       expiry_date: "",
//       status: "1",
//       remarks: "",
//     });
//   };

//   // Cancel Add New
//   const handleCancelAdd = () => {
//     setAddingNew(false);
//   };

//   // Get product name by ID
//   const getProductNameById = (id: string | number) => {
//     const product = products.find((p) => p.id === Number(id));
//     return product?.product_name || "";
//   };

//   // Save New Record
//   const handleSaveNew = async () => {
//     try {
//       setIsSaving(true);

//       if (
//         !newRecordData.product_id ||
//         !newRecordData.renewal_date ||
//         !newRecordData.expiry_date
//       ) {
//         toast({
//           title: "Error",
//           description: "Please fill all required fields",
//           variant: "destructive",
//         });
//         return;
//       }

//       const productName = getProductNameById(newRecordData.product_id);

//       const payload: AddEditSubscription = {
//         record_type: 1,
//         s_id: user?.id || 0,
//         product_id: Number(newRecordData.product_id),
//         product_name: productName,
//         renewal_date: newRecordData.renewal_date,
//         amount: parseFloat(newRecordData.amount) || 0,
//         expiry_date: newRecordData.expiry_date,
//         status: parseInt(newRecordData.status) as 0 | 1,
//         remarks: newRecordData.remarks,
//         remark_id: updatedData.remark_id || null,
//       };

//       const response = await apiService.addRecord(payload);

//       if (response.status) {
//         toast({
//           title: "Success",
//           description: response.message || "Subscription added successfully",
//           variant: "default",
//         });
//         setAddingNew(false);
//         fetchSubscriptions();
//         setNewRecordData({
//           product_id: "",
//           product_name: "",
//           renewal_date: "",
//           amount: "",
//           expiry_date: "",
//           status: "1",
//           remarks: "",
//         });
//       } else {
//         toast({
//           title: "Error",
//           description: response.message || "Failed to add subscription",
//           variant: "destructive",
//         });
//       }
//     } catch (error) {
//       console.error("Error adding subscription:", error);
//       toast({
//         title: "Error",
//         description: "Failed to add subscription",
//         variant: "destructive",
//       });
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   // Handle Edit - Clear previous edit data
//   const handleEdit = (subscription: Subscription) => {
//     console.log(subscription)
//     setEditingId(subscription.id);
//     setEditData({
//       [subscription.id]: {
//         ...subscription,
//         product_id: subscription.product_id || 0,
//         product_name: subscription.product_name || "",
//         remarks: subscription.latest_remark?.remark || "",
//         remark_id: subscription.latest_remark?.id || null,
//       },
//     });
//   };

//   // Handle Save (inline editing)
//   const handleSave = async (id: number) => {
//     try {
//       setIsSaving(true);
//       const updatedData = editData[id];

//       if (!updatedData) return;

//       const productId =
//         updatedData.product_id ||
//         data.find((item) => item.id === id)?.product_id ||
//         0;
//       const productName =
//         updatedData.product_name || getProductNameById(productId);

//       const payload: AddEditSubscription = {
//         record_type: 1,
//         id,
//         s_id: user?.id || 6,
//         product_id: Number(productId),
//         product_name: productName,
//         renewal_date: updatedData.renewal_date || "",
//         amount: updatedData.amount || 0,
//         expiry_date: updatedData.expiry_date || "",
//         status: updatedData.status ?? 1,
//         remarks: updatedData.remarks || "",
//         remark_id: updatedData.remark_id || null,
//       };

//       const response = await apiService.editRecord(payload);

//       if (response.status) {
//         toast({
//           title: "Success",
//           description: response.message || "Subscription updated successfully",
//           variant: "default",
//         });
//         setEditingId(null);
//         setEditData({});
//         fetchSubscriptions();
//       } else {
//         toast({
//           title: "Error",
//           description: response.message || "Failed to update subscription",
//           variant: "destructive",
//         });
//       }
//     } catch (error) {
//       console.error("Error updating subscription:", error);
//       toast({
//         title: "Error",
//         description: "Failed to update subscription",
//         variant: "destructive",
//       });
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   // Cancel Edit
//   const handleCancelEdit = () => {
//     setEditingId(null);
//     setEditData({});
//   };

//   // Handle field change for editing
//   const handleEditChange = (
//     id: number,
//     field: keyof Subscription,
//     value: any,
//   ) => {
//     setEditData((prev) => ({
//       ...prev,
//       [id]: {
//         ...prev[id],
//         [field]: value,
//       },
//     }));
//   };

//   // Handle field change for new record
//   const handleNewRecordChange = (
//     field: keyof typeof newRecordData,
//     value: any,
//   ) => {
//     setNewRecordData((prev) => ({
//       ...prev,
//       [field]: value,
//     }));
//   };

//   // Handle Delete
//   const handleDeleteClick = (id: number) => {
//     setItemToDelete(id);
//     setShowDeleteModal(true);
//   };

//   const handleBulkDeleteClick = () => {
//     if (selectedItems.length === 0) {
//       toast({
//         title: "Error",
//         description: "Please select at least one subscription",
//         variant: "destructive",
//       });
//       return;
//     }
//     setItemToDelete(null);
//     setShowDeleteModal(true);
//   };

//   const confirmDelete = async () => {
//     try {
//       setIsDeleting(true);

//       const idsToDelete = itemToDelete ? [itemToDelete] : selectedItems;

//       const response = await apiService.deleteRecords(idsToDelete, 1);

//       if (response.status) {
//         toast({
//           title: "Success",
//           description: response.message || "Record(s) deleted successfully",
//           variant: "default",
//         });

//         setSelectedItems([]);
//         setItemToDelete(null);
//         fetchSubscriptions();
//       } else {
//         toast({
//           title: "Error",
//           description: response.message || "Failed to delete record(s)",
//           variant: "destructive",
//         });
//       }
//     } catch (error) {
//       console.error("Error deleting:", error);
//       toast({
//         title: "Error",
//         description: "Failed to delete record(s)",
//         variant: "destructive",
//       });
//     } finally {
//       setIsDeleting(false);
//       setShowDeleteModal(false);
//     }
//   };

//   // Handle Select All
//   const handleSelectAll = (checked: boolean) => {
//     if (checked) {
//       setSelectedItems(data.map((item) => item.id));
//     } else {
//       setSelectedItems([]);
//     }
//   };

//   const handleSelectItem = (id: number, checked: boolean) => {
//     if (checked) {
//       setSelectedItems((prev) => [...prev, id]);
//     } else {
//       setSelectedItems((prev) => prev.filter((itemId) => itemId !== id));
//     }
//   };

//   const isAllSelected = data.length > 0 && selectedItems.length === data.length;

//   const getStatusColor = (status: 0 | 1) => {
//     return status === 1 ? "text-green-400" : "text-red-400";
//   };

//   const getStatusText = (status: 0 | 1) => {
//     return status === 1 ? "Active" : "Inactive";
//   };

//   const getStatusIcon = (status: 0 | 1) => {
//     return status === 1 ? (
//       <CheckCircle className="w-4 h-4" />
//     ) : (
//       <XCircle className="w-4 h-4" />
//     );
//   };

//   const formatDate = (dateString: string) => {
//     try {
//       const date = new Date(dateString);
//       return date.toLocaleDateString("en-US", {
//         year: "numeric",
//         month: "short",
//         day: "numeric",
//       });
//     } catch {
//       return dateString;
//     }
//   };

//   const calculateDays = (expiryDate: string) => {
//     try {
//       const today = new Date();
//       const expiry = new Date(expiryDate);
//       const diffTime = expiry.getTime() - today.getTime();
//       const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
//       return diffDays;
//     } catch {
//       return 0;
//     }
//   };

//   const startItem = pagination.page * pagination.rowsPerPage + 1;

//   const handlePageChange = (page: number) => {
//     setPagination((prev) => ({ ...prev, page }));
//   };

//   return (
//     <div className="min-h-screen pb-8">
//       <Header title="Subscription Management" tabs={navigationTabs} />

//       <div className="px-4 sm:px-6 mt-6">
//         <GlassCard className="p-6 backdrop-blur-xl bg-gradient-to-br from-gray-900/80 via-black/80 to-gray-900/80 border border-white/10 shadow-2xl">
//           {/* Header with Search and Add Button */}
//           <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
//             <div>
//               <div className="flex items-center gap-2">
//                 <Package className="w-6 h-6 text-[#BC8969]" />
//                 <h2 className="text-xl font-semibold text-white">
//                   Subscriptions
//                 </h2>
//               </div>
//               <p className="text-sm text-gray-400 mt-1">
//                 Manage your subscriptions and renewals
//               </p>
//             </div>

//             <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
//               <div className="relative flex-1 sm:flex-initial">
//                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
//                 <input
//                   type="text"
//                   placeholder="Search subscriptions..."
//                   value={searchQuery}
//                   onChange={(e) => setSearchQuery(e.target.value)}
//                   className="pl-10 pr-4 py-2 w-full sm:w-64 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/30 backdrop-blur-sm transition-all"
//                 />
//               </div>

//               <div className="flex gap-2">
//                 {selectedItems.length > 0 && (
//                   <GlassButton
//                     variant="danger"
//                     onClick={handleBulkDeleteClick}
//                     className="flex items-center gap-2"
//                     disabled={isDeleting}
//                   >
//                     {isDeleting ? (
//                       <Loader2 className="w-4 h-4 animate-spin" />
//                     ) : (
//                       <Trash2 className="w-4 h-4" />
//                     )}
//                     Delete ({selectedItems.length})
//                   </GlassButton>
//                 )}

//                 {!addingNew && (
//                   <GlassButton
//                     variant="primary"
//                     onClick={handleAddNew}
//                     className="flex items-center gap-2"
//                   >
//                     <Plus className="w-4 h-4" />
//                     Add Subscription
//                   </GlassButton>
//                 )}
//               </div>
//             </div>
//           </div>

//           {/* Table Container */}
//           <div className="overflow-hidden rounded-xl border border-white/10 backdrop-blur-sm">
//             {/* Table */}
//             <div className="overflow-x-auto">
//               <table className="w-full">
//                 <thead>
//              <tr
//   key={item.id}
//   className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer group ${editingId === item.id ? "bg-blue-500/5" : ""}`}
//   onClick={(e) => {
//     if (
//       (e.target as HTMLElement).closest('input[type="checkbox"]') ||
//       (e.target as HTMLElement).closest('button') ||
//       editingId === item.id
//     ) {
//       return;
//     }
//     router.push(`/subscriptions/${item.id}`);
//   }}
// >
//                     <th className="py-3 px-4 text-left w-12">
//                       <input
//                         type="checkbox"
//                         checked={isAllSelected}
//                         onChange={(e) => handleSelectAll(e.target.checked)}
//                         className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500/50 cursor-pointer"
//                       />
//                     </th>
//                     <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 min-w-[80px]">
//                       S.NO
//                     </th>
//                     <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 min-w-[180px]">
//                       Product
//                     </th>
//                     <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 min-w-[140px]">
//                       Renewal Date
//                     </th>
//                     <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 min-w-[120px]">
//                       Amount
//                     </th>
//                     <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 min-w-[140px]">
//                       Expiry Date
//                     </th>
//                     <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 min-w-[100px]">
//                       Days Left
//                     </th>
//                     <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 min-w-[100px]">
//                       Status
//                     </th>
//                     <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 min-w-[180px]">
//                       Remarks
//                     </th>
//                     <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 min-w-[140px]">
//                       Last Updated
//                     </th>
//                     <th className="py-3 px-4 text-right text-sm font-medium text-gray-300 min-w-[140px]">
//                       Actions
//                     </th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {loading ? (
//                     <tr>
//                       <td colSpan={10} className="py-8 text-center">
//                         <div className="flex flex-col items-center justify-center gap-2">
//                           <DashboardLoader label="Fetch Subscriptions..." />
//                         </div>
//                       </td>
//                     </tr>
//                   ) : (
//                     <>
//                       {/* Add New Row */}
//                       {addingNew && (
//                         <tr className="border-b border-white/5 bg-blue-500/5">
//                           <td className="py-3 px-4"></td>
//                           <td className="py-3 px-4 text-sm text-gray-300">
//                             New
//                           </td>
//                           <td className="py-3 px-4">
//                             {loadingProducts ? (
//                               <div className="w-full px-2 py-1 bg-white/5 border border-white/10 rounded text-sm text-gray-400">
//                                 Loading products...
//                               </div>
//                             ) : (
//                               <ApiDropdown
//                                 label=""
//                                 endpoint="get-products"
//                                 value={
//                                   newRecordData.product_id
//                                     ? {
//                                         value: newRecordData.product_id,
//                                         label: newRecordData.product_name,
//                                       }
//                                     : null
//                                 }
//                                 onChange={(option) => {
//                                   handleNewRecordChange(
//                                     "product_id",
//                                     option?.value ?? null,
//                                   );
//                                   handleNewRecordChange(
//                                     "product_name",
//                                     option?.label ?? "",
//                                   );
//                                 }}
//                                 placeholder="Product"
//                               />
//                             )}
//                           </td>
//                           <td className="py-3 px-4">
//                             <input
//                               type="date"
//                               value={newRecordData.renewal_date}
//                               onChange={(e) =>
//                                 handleNewRecordChange(
//                                   "renewal_date",
//                                   e.target.value,
//                                 )
//                               }
//                               className="w-full px-2 py-1 bg-white/5 border border-blue-500/30 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/30 backdrop-blur-sm"
//                               style={{ minHeight: "32px" }}
//                             />
//                           </td>
//                           <td className="py-3 px-4">
//                             <input
//                               type="number"
//                               value={newRecordData.amount}
//                               onChange={(e) =>
//                                 handleNewRecordChange("amount", e.target.value)
//                               }
//                               className="w-full px-2 py-1 bg-white/5 border border-blue-500/30 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/30 backdrop-blur-sm"
//                               style={{ minHeight: "32px" }}
//                               placeholder="0.00"
//                               min="0"
//                               step="0.01"
//                             />
//                           </td>
//                           <td className="py-3 px-4">
//                             <input
//                               type="date"
//                               value={newRecordData.expiry_date}
//                               onChange={(e) =>
//                                 handleNewRecordChange(
//                                   "expiry_date",
//                                   e.target.value,
//                                 )
//                               }
//                               className="w-full px-2 py-1 bg-white/5 border border-blue-500/30 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/30 backdrop-blur-sm"
//                               style={{ minHeight: "32px" }}
//                             />
//                           </td>
//                           <td className="py-3 px-4 text-sm text-gray-300">
//                             --
//                           </td>
//                           <td className="py-3 px-4">
//                             <select
//                               value={newRecordData.status}
//                               onChange={(e) =>
//                                 handleNewRecordChange(
//                                   "status",
//                                   e.target.value as "1" | "0",
//                                 )
//                               }
//                               className="w-full px-2 py-1 bg-white/5 border border-blue-500/30 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/30 backdrop-blur-sm"
//                               style={{ minHeight: "32px" }}
//                             >
//                               <option
//                                 value="1"
//                                 className="bg-gray-900 text-white"
//                               >
//                                 Active
//                               </option>
//                               <option
//                                 value="0"
//                                 className="bg-gray-900 text-white"
//                               >
//                                 Inactive
//                               </option>
//                             </select>
//                           </td>
//                           <td className="py-3 px-4">
//                             <input
//                               type="text"
//                               value={newRecordData.remarks}
//                               onChange={(e) =>
//                                 handleNewRecordChange("remarks", e.target.value)
//                               }
//                               className="w-full px-2 py-1 bg-white/5 border border-blue-500/30 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/30 backdrop-blur-sm"
//                               style={{ minHeight: "32px" }}
//                               placeholder="Remarks"
//                             />
//                           </td>
//                           <td className="py-3 px-4 text-sm text-gray-300">
//                             {newRecordData?.updated_at
//                               ? newRecordData?.updated_at
//                               : "--"}
//                           </td>
//                           <td className="py-3 px-4">
//                             <div className="flex items-center justify-end gap-2">
//                               <GlassButton
//                                 onClick={handleSaveNew}
//                                 disabled={isSaving}
//                                 className="p-1.5 min-w-0 bg-green-500/20 hover:bg-green-500/30"
//                                 title="Save"
//                               >
//                                 {isSaving ? (
//                                   <Loader2 className="w-4 h-4 animate-spin text-green-400" />
//                                 ) : (
//                                   <Save className="w-4 h-4 text-green-400" />
//                                 )}
//                               </GlassButton>
//                               <GlassButton
//                                 onClick={handleCancelAdd}
//                                 disabled={isSaving}
//                                 className="p-1.5 min-w-0 bg-red-500/20 hover:bg-red-500/30"
//                                 title="Cancel"
//                               >
//                                 <X className="w-4 h-4 text-red-400" />
//                               </GlassButton>
//                             </div>
//                           </td>
//                         </tr>
//                       )}

//                       {/* Existing Data Rows */}
//                       {data.length === 0 ? (
//                         <tr>
//                           <td colSpan={10} className="py-8 text-center">
//                             <div className="flex flex-col items-center justify-center gap-2">
//                               <Package className="w-12 h-12 text-gray-400" />
//                               <span className="text-gray-400">
//                                 No subscriptions found
//                               </span>
//                               {searchQuery && (
//                                 <button
//                                   onClick={() => setSearchQuery("")}
//                                   className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
//                                 >
//                                   Clear search
//                                 </button>
//                               )}
//                             </div>
//                           </td>
//                         </tr>
//                       ) : (
//                         data.map((item, index) => (
//                           <tr
//                             key={item.id}
//                             className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors ${
//                               editingId === item.id ? "bg-blue-500/5" : ""
//                             }`}
//                           >
//                             <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
//   <input
//     type="checkbox"
//     checked={selectedItems.includes(item.id)}
//     onChange={(e) => handleSelectItem(item.id, e.target.checked)}
//     className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500/50 cursor-pointer"
//   />
// </td>
//                             <td className="py-3 px-4 text-sm text-gray-300">
//                               {startItem + index}
//                             </td>

//                             {editingId === item.id ? (
//                               <>
//                                 <td className="py-3 px-4">
//                                   {loadingProducts ? (
//                                     <div className="w-full px-2 py-1 bg-white/5 border border-white/10 rounded text-sm text-gray-400">
//                                       Loading products...
//                                     </div>
//                                   ) : (
//                                     <ApiDropdown
//                                       endpoint="get-products"
//                                       value={
//                                         editData[item.id]?.product_id
//                                           ? {
//                                               value:
//                                                 editData[item.id]?.product_id,
//                                               label:
//                                                 editData[item.id]
//                                                   ?.product_name ||
//                                                 getProductNameById(
//                                                   editData[item.id]?.product_id,
//                                                 ),
//                                             }
//                                           : null
//                                       }
//                                       onChange={(option) => {
//                                         handleEditChange(
//                                           item.id,
//                                           "product_id",
//                                           option?.value ?? null,
//                                         );
//                                         handleEditChange(
//                                           item.id,
//                                           "product_name",
//                                           option?.label ?? "",
//                                         );
//                                       }}
//                                       placeholder="Select Product"
//                                     />
//                                   )}
//                                 </td>
//                                 <td className="py-3 px-4">
//                                   <input
//                                     type="date"
//                                     value={
//                                       editData[item.id]?.renewal_date ||
//                                       item.renewal_date
//                                     }
//                                     onChange={(e) =>
//                                       handleEditChange(
//                                         item.id,
//                                         "renewal_date",
//                                         e.target.value,
//                                       )
//                                     }
//                                     className="w-full px-2 py-1 bg-white/5 border border-blue-500/30 rounded text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/30 backdrop-blur-xs"
//                                     style={{ minHeight: "32px" }}
//                                   />
//                                 </td>
//                                 <td className="py-3 px-4">
//                                   <input
//                                     type="number"
//                                     value={
//                                       editData[item.id]?.amount ||
//                                       item.amount ||
//                                       ""
//                                     }
//                                     onChange={(e) =>
//                                       handleEditChange(
//                                         item.id,
//                                         "amount",
//                                         parseFloat(e.target.value) || 0,
//                                       )
//                                     }
//                                     className="w-full px-2 py-1 bg-white/5 border border-blue-500/30 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/30 backdrop-blur-sm"
//                                     style={{ minHeight: "32px" }}
//                                     min="0"
//                                     step="0.01"
//                                   />
//                                 </td>
//                                 <td className="py-3 px-4">
//                                   <input
//                                     type="date"
//                                     value={
//                                       editData[item.id]?.expiry_date ||
//                                       item.expiry_date
//                                     }
//                                     onChange={(e) =>
//                                       handleEditChange(
//                                         item.id,
//                                         "expiry_date",
//                                         e.target.value,
//                                       )
//                                     }
//                                     className="w-full px-2 py-1 bg-white/5 border border-blue-500/30 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/30 backdrop-blur-sm"
//                                     style={{ minHeight: "32px" }}
//                                   />
//                                 </td>
//                               </>
//                             ) : (
//                               <>
//                                 <td className="py-3 px-4">
//                                   <div className="flex items-center gap-2">
//                                     <Package className="w-4 h-4 text-gray-400 flex-shrink-0" />
//                                     <span className="text-sm text-white font-medium">
//                                       {item.product_name}
//                                     </span>
//                                   </div>
//                                 </td>
//                                 <td className="py-3 px-4 text-sm text-gray-300">
//                                   <div className="flex items-center gap-2">
//                                     {/* <Calendar className="w-4 h-4 text-gray-400" /> */}
//                                     {formatDate(item.renewal_date)}
//                                   </div>
//                                 </td>
//                                 <td className="py-3 px-4 text-sm text-gray-300">
//                                   <div className="flex items-center gap-2">
//                                     {item.amount || "0.00"}
//                                   </div>
//                                 </td>
//                                 <td className="py-3 px-4 text-sm text-gray-300">
//                                   {formatDate(item.expiry_date)}
//                                 </td>
//                               </>
//                             )}

//                           <td className="py-3 px-4">
//   <div
//     className={`inline-flex items-center whitespace-nowrap gap-1 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${
//       calculateDays(item.expiry_date) < 0
//         ? "bg-red-500/20 text-red-400 border border-red-500/20"
//         : calculateDays(item.expiry_date) <= 7
//           ? "bg-orange-500/20 text-orange-400 border border-orange-500/20"
//           : "bg-green-500/20 text-green-400 border border-green-500/20"
//     }`}
//   >
//     {calculateDays(item.expiry_date)} days
//   </div>
// </td>
//                             {editingId === item.id ? (
//                               <td className="py-3 px-4">
//                                 <select
//                                   value={
//                                     editData[item.id]?.status?.toString() ||
//                                     item.status.toString()
//                                   }
//                                   onChange={(e) =>
//                                     handleEditChange(
//                                       item.id,
//                                       "status",
//                                       parseInt(e.target.value) as 0 | 1,
//                                     )
//                                   }
//                                   className="w-full px-2 py-1 bg-white/5 border border-blue-500/30 rounded text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/30 backdrop-blur-sm"
//                                   style={{ minHeight: "32px" }}
//                                 >
//                                   <option
//                                     value="1"
//                                     className="bg-gray-900 text-white"
//                                   >
//                                     Active
//                                   </option>
//                                   <option
//                                     value="0"
//                                     className="bg-gray-900 text-white"
//                                   >
//                                     Inactive
//                                   </option>
//                                 </select>
//                               </td>
//                             ) : (
//                               <td className="py-3 px-4">
//                                 <div
//                                   className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm border ${
//                                     item.status === 1
//                                       ? "bg-green-500/20 text-green-400 border-green-500/20"
//                                       : "bg-red-500/20 text-red-400 border-red-500/20"
//                                   }`}
//                                 >
//                                   {getStatusIcon(item.status)}
//                                   {getStatusText(item.status)}
//                                 </div>
//                               </td>
//                             )}

//                             {editingId === item.id ? (
//                               <td className="py-3 px-4">
//                                 <input
//                                   type="text"
//                                   value={
//                                     editData[item.id]?.remarks ||
//                                     item?.latest_remark?.remark
//                                   }
//                                   onChange={(e) =>
//                                     handleEditChange(
//                                       item.id,
//                                       "remarks",
//                                       e.target.value,
//                                     )
//                                   }
//                                   className="w-full px-2 py-1 bg-white/5 border border-blue-500/30 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/30 backdrop-blur-sm"
//                                   style={{ minHeight: "32px" }}
//                                 />
//                               </td>
//                             ) : (
//                               <td className="py-3 px-4">
//                                 <div className="flex items-center gap-2">
//                                   <MessageSquare className="w-4 h-4 text-gray-400 flex-shrink-0" />
//                                   <span className="text-sm text-gray-300 truncate max-w-[180px]">
//                                     {item?.latest_remark?.remark}
//                                   </span>
//                                 </div>
//                               </td>
//                             )}

//                             <td className="py-3 px-4 text-sm text-gray-300">
//                               {item.updated_at}
//                             </td>

//                             <td className="py-3 px-4">
//                               <div className="flex items-center justify-end gap-2">
//                                 {editingId === item.id ? (
//                                   <>
//                                     <GlassButton
//                                       onClick={() => handleSave(item.id)}
//                                       disabled={isSaving}
//                                       className="p-1.5 min-w-0 bg-green-500/20 hover:bg-green-500/30"
//                                       title="Save"
//                                     >
//                                       {isSaving ? (
//                                         <Loader2 className="w-4 h-4 animate-spin text-green-400" />
//                                       ) : (
//                                         <Save className="w-4 h-4 text-green-400" />
//                                       )}
//                                     </GlassButton>
//                                     <GlassButton
//                                       onClick={handleCancelEdit}
//                                       disabled={isSaving}
//                                       className="p-1.5 min-w-0 bg-red-500/20 hover:bg-red-500/30"
//                                       title="Cancel"
//                                     >
//                                       <X className="w-4 h-4 text-red-400" />
//                                     </GlassButton>
//                                   </>
//                                 ) : (
//                                   <>
//                                     <GlassButton
//                                       onClick={() => handleEdit(item)}
//                                       className="p-1.5 min-w-0 hover:bg-white/10"
//                                       title="Edit"
//                                     >
//                                       <Edit className="w-4 h-4 text-gray-300 hover:text-blue-400 transition-colors" />
//                                     </GlassButton>
//                                     <GlassButton
//                                       onClick={() => handleDeleteClick(item.id)}
//                                       className="p-1.5 min-w-0 hover:bg-red-500/20"
//                                       title="Delete"
//                                     >
//                                       <Trash2 className="w-4 h-4 text-gray-300 hover:text-red-400 transition-colors" />
//                                     </GlassButton>
//                                   </>
//                                 )}
//                               </div>
//                             </td>
//                           </tr>
//                         ))
//                       )}
//                     </>
//                   )}
//                 </tbody>
//               </table>
//             </div>

//             {/* Pagination */}
//             {!loading && data.length > 0 && (
//               <Pagination
//                 page={pagination.page}
//                 rowsPerPage={pagination.rowsPerPage}
//                 totalItems={totalItems}
//                 onPageChange={handlePageChange}
//               />
//             )}
//           </div>

//           {/* Selected Items Info */}
//           {selectedItems.length > 0 && (
//             <div className="mt-4 p-3 bg-white/5 rounded-lg border border-white/10 backdrop-blur-sm">
//               <div className="flex items-center justify-between">
//                 <span className="text-sm text-gray-300">
//                   {selectedItems.length} subscription
//                   {selectedItems.length > 1 ? "s" : ""} selected
//                 </span>
//                 <div className="flex gap-2">
//                   <button
//                     onClick={() => setSelectedItems([])}
//                     className="text-sm text-gray-400 hover:text-white transition-colors"
//                   >
//                     Clear selection
//                   </button>
//                   <button
//                     onClick={handleBulkDeleteClick}
//                     disabled={isDeleting}
//                     className="text-sm text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
//                   >
//                     {isDeleting
//                       ? "Deleting..."
//                       : `Delete ${selectedItems.length} items`}
//                   </button>
//                 </div>
//               </div>
//             </div>
//           )}
//         </GlassCard>
//       </div>

//       {/* Delete Confirmation Modal */}
//       <DeleteConfirmationModal
//         isOpen={showDeleteModal}
//         onClose={() => {
//           setShowDeleteModal(false);
//           setItemToDelete(null);
//         }}
//         onConfirm={confirmDelete}
//         itemCount={itemToDelete ? 1 : selectedItems.length}
//         isLoading={isDeleting}
//         title={
//           itemToDelete ? "Delete Subscription" : "Delete Multiple Subscriptions"
//         }
//         message={
//           itemToDelete
//             ? "Are you sure you want to delete this subscription? This action cannot be undone."
//             : "Are you sure you want to delete the selected subscriptions? This action cannot be undone."
//         }
//       />
//        {isOpen && modalData && (
//         <div className="fixed inset-0 z-50 overflow-y-auto">
//           {/* Backdrop */}
//           <div 
//             className="fixed inset-0 bg-black/70 backdrop-blur-sm"
//             onClick={closeDetails}
//           />
          
//           {/* Modal Container */}
//           <div className="relative min-h-screen px-4 py-8 flex items-start justify-center">
//             {/* Modal Content */}
//             <div className="relative w-full max-w-7xl bg-transparent">
//               <DynamicDetailsPage
//                 recordType={modalData.recordType}
//                 recordId={modalData.recordId}
//                 onClose={closeDetails}
//               />
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// // src/app/[role]/subscription/page.tsx
// "use client"

// import { useState, useEffect, useRef } from "react"
// import { Header } from "@/components/layout"
// import { GlassCard, GlassButton } from "@/components/glass"
// import { EditRow } from "@/common/services/EditRow"
// import { DeleteConfirmationModal } from "@/common/services/DeleteConfirmationModal"
// import {
//   Edit,
//   Trash2,
//   Search,
//   Plus,
//   Calendar,
//   DollarSign,
//   Package,
//   MessageSquare,
//   Clock,
//   CheckCircle,
//   XCircle,
//   Loader2,
//   ChevronLeft,
//   ChevronRight,
//   Save,
//   X
// } from "lucide-react"
// import { useAuth } from "@/contexts/AuthContext"
// import { useToast } from "@/hooks/useToast"
// import { useRouter } from "next/navigation"
// import { apiService } from "@/common/services/apiService"
// import Pagination from "@/common/Pagination"
// import DashboardLoader from "@/common/DashboardLoader"
// import { getNavigationByRole } from "@/lib/getNavigationByRole"

// interface Subscription {
//   id: number
//   client_name: string | null
//   domain_name: string | null
//   product_name: string
//   product_id?: number
//   renewal_date: string
//   amount: number | null
//   expiry_date: string
//   days_to_expire_today: number
//   today_date: string
//   status: 0 | 1
//   remarks: string
//   created_at: string
//   updated_at: string
// }

// interface AddEditSubscription {
//   record_type: 1
//   id?: number
//   s_id: number
//   product_id: number
//   renewal_date: string
//   amount: number
//   expiry_date: string
//   status: 0 | 1
//   remarks: string
//   product_name: string
// }

// export default function SubscriptionsPage() {
//  const {user} = useAuth()
// const navigationTabs = getNavigationByRole(user?.role)
//   const { toast } = useToast()
//   const router = useRouter()

//   const [data, setData] = useState<Subscription[]>([])
//   const [loading, setLoading] = useState(true)
//   const [searchQuery, setSearchQuery] = useState("")
//   const [selectedItems, setSelectedItems] = useState<number[]>([])
//   const [editingId, setEditingId] = useState<number | null>(null)
//   const [addingNew, setAddingNew] = useState(false)
//   const [isSaving, setIsSaving] = useState(false)
//   const [isDeleting, setIsDeleting] = useState(false)
//   const [showDeleteModal, setShowDeleteModal] = useState(false)
//   const [itemToDelete, setItemToDelete] = useState<number | null>(null)

//   const [newRecordData, setNewRecordData] = useState({
//     product_name: "",
//     renewal_date: "",
//     amount: "",
//     expiry_date: "",
//     status: "1" as "1" | "0",
//     remarks: ""
//   })

//   const [editData, setEditData] = useState<Record<number, Partial<Subscription>>>({})

//   const [pagination, setPagination] = useState({
//     page: 0,
//     rowsPerPage: 10,
//     orderBy: "id" as "id" | "renewal_date" | "amount" | "product_name",
//     orderDir: "desc" as "asc" | "desc"
//   })

//   const [totalItems, setTotalItems] = useState(0)

//   const productOptions = [
//     { value: 1, label: "Web Hosting" },
//     { value: 2, label: "Domain Registration" },
//     { value: 3, label: "E-commerce Platform" },
//     { value: 4, label: "SSL Certificate" }
//   ]

//   const searchTimeoutRef = useRef<NodeJS.Timeout>()

//   // Fetch subscriptions
//   const fetchSubscriptions = async () => {
//     try {
//       setLoading(true)

//       const response = await apiService.listRecords({
//         record_type: 1,
//         search: searchQuery,
//         page: pagination.page,
//         rowsPerPage: pagination.rowsPerPage,
//         orderBy: pagination.orderBy,
//         orderDir: pagination.orderDir
//       })

//       if (response.status) {
//         setData(response.data || [])
//         setTotalItems(response.total || 0)
//       } else {
//         toast({
//           title: "Error",
//           description: response.message || "Failed to fetch subscriptions",
//           variant: "destructive"
//         })
//       }
//     } catch (error) {
//       console.error("Error fetching subscriptions:", error)
//       toast({
//         title: "Error",
//         description: "Failed to fetch subscriptions",
//         variant: "destructive"
//       })
//     } finally {
//       setLoading(false)
//     }
//   }

//   useEffect(() => {
//     fetchSubscriptions()
//   }, [pagination.page, pagination.orderBy, pagination.orderDir])

//   useEffect(() => {
//     if (searchTimeoutRef.current) {
//       clearTimeout(searchTimeoutRef.current)
//     }

//     searchTimeoutRef.current = setTimeout(() => {
//       setPagination(prev => ({ ...prev, page: 0 }))
//       fetchSubscriptions()
//     }, 300)

//     return () => {
//       if (searchTimeoutRef.current) {
//         clearTimeout(searchTimeoutRef.current)
//       }
//     }
//   }, [searchQuery])

//   // Handle Add New
//   const handleAddNew = () => {
//     setAddingNew(true)
//     setNewRecordData({
//       product_name: "",
//       renewal_date: "",
//       amount: "",
//       expiry_date: "",
//       status: "1",
//       remarks: ""
//     })
//   }

//   // Cancel Add New
//   const handleCancelAdd = () => {
//     setAddingNew(false)
//   }

//   // Save New Record
//   const handleSaveNew = async () => {
//     try {
//       setIsSaving(true)

//       if (!newRecordData.product_name || !newRecordData.renewal_date || !newRecordData.expiry_date) {
//         toast({
//           title: "Error",
//           description: "Please fill all required fields",
//           variant: "destructive"
//         })
//         return
//       }

//       const payload: AddEditSubscription = {
//         record_type: 1,
//         s_id: user?.id || 0,
//         product_name: newRecordData.product_name || "",
//         product_id: Number(newRecordData.product_id || 1),
//         renewal_date: newRecordData.renewal_date,
//         amount: parseFloat(newRecordData.amount) || 0,
//         expiry_date: newRecordData.expiry_date,
//         status: parseInt(newRecordData.status) as 0 | 1,
//         remarks: newRecordData.remarks
//       }
//   console.log("kya gya", payload)
//       const response = await apiService.addRecord(payload)

//       if (response.status) {
//         toast({
//           title: "Success",
//           description: response.message || "Subscription added successfully",
//           variant: "default"
//         })
//         setAddingNew(false)
//         fetchSubscriptions()
//          setNewRecordData({
//       product_name: "",
//       renewal_date: "",
//       amount: "",
//       expiry_date: "",
//       status: "1",
//       remarks: ""
//     })
//       } else {
//         toast({
//           title: "Error",
//           description: response.message || "Failed to add subscription",
//           variant: "destructive"
//         })
//       }
//     } catch (error) {
//       console.error("Error adding subscription:", error)
//       toast({
//         title: "Error",
//         description: "Failed to add subscription",
//         variant: "destructive"
//       })
//     } finally {
//       setIsSaving(false)
//     }
//   }

//   // Handle Edit
//   const handleEdit = (subscription: Subscription) => {
//     setEditingId(subscription.id)
//     setEditData({
//       [subscription.id]: { ...subscription }
//     })
//   }

//   // Handle Save (inline editing)
//   const handleSave = async (id: number) => {
//     try {
//       setIsSaving(true)
//       const updatedData = editData[id]

//       if (!updatedData) return

//       const payload: AddEditSubscription = {
//         record_type: 1,
//         id,
//         s_id: user?.id || 6,
//         product_id: Number(updatedData.product_id || 1),
//         product_name: updatedData.product_name || "",
//         renewal_date: updatedData.renewal_date || "",
//         amount: updatedData.amount || 0,
//         expiry_date: updatedData.expiry_date || "",
//         status: updatedData.status || 1,
//         remarks: updatedData.remarks || ""
//       }

//       const response = await apiService.editRecord(payload)

//       if (response.status) {
//         toast({
//           title: "Success",
//           description: response.message || "Subscription updated successfully",
//           variant: "default"
//         })
//         setEditingId(null)
//         setEditData({})
//         fetchSubscriptions()
//       } else {
//         toast({
//           title: "Error",
//           description: response.message || "Failed to update subscription",
//           variant: "destructive"
//         })
//       }
//     } catch (error) {
//       console.error("Error updating subscription:", error)
//       toast({
//         title: "Error",
//         description: "Failed to update subscription",
//         variant: "destructive"
//       })
//     } finally {
//       setIsSaving(false)
//     }
//   }

//   // Cancel Edit
//   const handleCancelEdit = () => {
//     setEditingId(null)
//     setEditData({})
//   }

//   // Handle field change for editing
//   const handleEditChange = (id: number, field: keyof Subscription, value: any) => {
//     setEditData(prev => ({
//       ...prev,
//       [id]: {
//         ...prev[id],
//         [field]: value
//       }
//     }))
//   }

//   // Handle field change for new record
//   const handleNewRecordChange = (field: keyof typeof newRecordData, value: any) => {
//     setNewRecordData(prev => ({
//       ...prev,
//       [field]: value
//     }))
//   }
//   // Handle Delete
//   const handleDeleteClick = (id: number) => {
//     setItemToDelete(id)
//     setShowDeleteModal(true)
//   }

//   const handleBulkDeleteClick = () => {
//     if (selectedItems.length === 0) {
//       toast({
//         title: "Error",
//         description: "Please select at least one subscription",
//         variant: "destructive"
//       })
//       return
//     }
//     setItemToDelete(null)
//     setShowDeleteModal(true)
//   }

//   const confirmDelete = async () => {
//     try {
//       setIsDeleting(true)

//       const idsToDelete = itemToDelete ? [itemToDelete] : selectedItems

//       const response = await apiService.deleteRecords(idsToDelete, 1)

//       if (response.status) {
//         toast({
//           title: "Success",
//           description: response.message || "Record(s) deleted successfully",
//           variant: "default"
//         })

//         setSelectedItems([])
//         setItemToDelete(null)
//         fetchSubscriptions()
//       } else {
//         toast({
//           title: "Error",
//           description: response.message || "Failed to delete record(s)",
//           variant: "destructive"
//         })
//       }
//     } catch (error) {
//       console.error("Error deleting:", error)
//       toast({
//         title: "Error",
//         description: "Failed to delete record(s)",
//         variant: "destructive"
//       })
//     } finally {
//       setIsDeleting(false)
//       setShowDeleteModal(false)
//     }
//   }

//   // Handle Select All
//   const handleSelectAll = (checked: boolean) => {
//     if (checked) {
//       setSelectedItems(data.map(item => item.id))
//     } else {
//       setSelectedItems([])
//     }
//   }

//   const handleSelectItem = (id: number, checked: boolean) => {
//     if (checked) {
//       setSelectedItems(prev => [...prev, id])
//     } else {
//       setSelectedItems(prev => prev.filter(itemId => itemId !== id))
//     }
//   }

//   const isAllSelected = data.length > 0 && selectedItems.length === data.length

//   const getStatusColor = (status: 0 | 1) => {
//     return status === 1 ? 'text-green-400' : 'text-red-400'
//   }

//   const getStatusText = (status: 0 | 1) => {
//     return status === 1 ? 'Active' : 'Inactive'
//   }

//   const getStatusIcon = (status: 0 | 1) => {
//     return status === 1 ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />
//   }

//   const formatDate = (dateString: string) => {
//     try {
//       const date = new Date(dateString)
//       return date.toLocaleDateString('en-US', {
//         year: 'numeric',
//         month: 'short',
//         day: 'numeric'
//       })
//     } catch {
//       return dateString
//     }
//   }

//   const calculateDays = (expiryDate: string) => {
//     try {
//       const today = new Date()
//       const expiry = new Date(expiryDate)
//       const diffTime = expiry.getTime() - today.getTime()
//       const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
//       return diffDays
//     } catch {
//       return 0
//     }
//   }

//   const startItem = pagination.page * pagination.rowsPerPage + 1

//   const handlePageChange = (page: number) => {
//     setPagination(prev => ({ ...prev, page }))
//   }

//   return (
//     <div className="min-h-screen pb-8">
//       <Header title="Subscription Management" tabs={navigationTabs} />

//       <div className="px-4 sm:px-6 mt-6">
//         <GlassCard className="p-6">
//           {/* Header with Search and Add Button */}
//           <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
//             <div>
//               <div className="flex items-center gap-2">
//                 <Package className="w-6 h-6 text-[#BC8969]" />
//                 <h2 className="text-xl font-semibold text-white">Subscriptions</h2>
//               </div>
//               <p className="text-sm text-gray-400 mt-1">
//                 Manage your subscriptions and renewals
//               </p>
//             </div>

//             <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
//               <div className="relative flex-1 sm:flex-initial">
//                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
//                 <input
//                   type="text"
//                   placeholder="Search subscriptions..."
//                   value={searchQuery}
//                   onChange={(e) => setSearchQuery(e.target.value)}
//                   className="pl-10 pr-4 py-2 w-full sm:w-64 bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.1)] rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                 />
//               </div>

//               <div className="flex gap-2">
//                 {selectedItems.length > 0 && (
//                   <GlassButton
//                     variant="danger"
//                     onClick={handleBulkDeleteClick}
//                     className="flex items-center gap-2"
//                     disabled={isDeleting}
//                   >
//                     {isDeleting ? (
//                       <Loader2 className="w-4 h-4 animate-spin" />
//                     ) : (
//                       <Trash2 className="w-4 h-4" />
//                     )}
//                     Delete ({selectedItems.length})
//                   </GlassButton>
//                 )}

//                 {!addingNew && (
//                   <GlassButton
//                     variant="primary"
//                     onClick={handleAddNew}
//                     className="flex items-center gap-2"
//                   >
//                     <Plus className="w-4 h-4" />
//                     Add Subscription
//                   </GlassButton>
//                 )}
//               </div>
//             </div>
//           </div>

//           {/* Table Container */}
//           <div className="overflow-hidden rounded-lg border border-[rgba(255,255,255,0.1)]">
//             {/* Table */}
//             <div className="overflow-x-auto">
//               <table className="w-full">
//                 <thead>
//                   <tr className="bg-[rgba(255,255,255,0.05)] border-b border-[rgba(255,255,255,0.1)]">
//                     <th className="py-3 px-4 text-left w-12">
//                       <input
//                         type="checkbox"
//                         checked={isAllSelected}
//                         onChange={(e) => handleSelectAll(e.target.checked)}
//                         className="w-4 h-4 rounded border-gray-300 bg-gray-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
//                       />
//                     </th>
//                     <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 min-w-[80px]">
//                       S.NO
//                     </th>
//                     <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 min-w-[180px]">
//                       Product
//                     </th>
//                     <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 min-w-[140px]">
//                       Renewal Date
//                     </th>
//                     <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 min-w-[120px]">
//                       Amount
//                     </th>
//                     <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 min-w-[140px]">
//                       Expiry Date
//                     </th>
//                     <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 min-w-[100px]">
//                       Days Left
//                     </th>
//                     <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 min-w-[100px]">
//                       Status
//                     </th>
//                     <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 min-w-[180px]">
//                       Remarks
//                     </th>
//                     <th className="py-3 px-4 text-right text-sm font-medium text-gray-300 min-w-[140px]">
//                       Actions
//                     </th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {loading ? (
//                     <tr>
//                       <td colSpan={10} className="py-8 text-center">
//                         <div className="flex flex-col items-center justify-center gap-2">
//                           <DashboardLoader label="Fetch Subscriptions..." />
//                         </div>
//                       </td>
//                     </tr>
//                   ) : (
//                     <>
//                       {/* Add New Row */}
//                       {addingNew && (
//                         <tr className="border-b border-[rgba(255,255,255,0.05)] bg-[rgba(59,130,246,0.05)]">
//                           <td className="py-3 px-4"></td>
//                           <td className="py-3 px-4 text-sm text-gray-300">
//                             New
//                           </td>
//                           <td className="py-3 px-4">
//                             <input
//                               type="text"
//                               value={newRecordData.product_name}
//                               onChange={(e) => handleNewRecordChange('product_name', e.target.value)}
//                               className="w-full px-2 py-1 bg-[rgba(255,255,255,var(--ui-opacity-10))] border border-[rgba(59,130,246,0.3)] rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
//                               style={{ minHeight: '32px' }}
//                               placeholder="Product name"
//                             />
//                           </td>
//                           <td className="py-3 px-4">
//                             <input
//                               type="date"
//                               value={newRecordData.renewal_date}
//                               onChange={(e) => handleNewRecordChange('renewal_date', e.target.value)}
//                               className="w-full px-2 py-1 bg-[rgba(255,255,255,var(--ui-opacity-10))] border border-[rgba(59,130,246,0.3)] rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
//                               style={{ minHeight: '32px' }}
//                             />
//                           </td>
//                           <td className="py-3 px-4">
//                             <input
//                               type="number"
//                               value={newRecordData.amount}
//                               onChange={(e) => handleNewRecordChange('amount', e.target.value)}
//                               className="w-full px-2 py-1 bg-[rgba(255,255,255,var(--ui-opacity-10))] border border-[rgba(59,130,246,0.3)] rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
//                               style={{ minHeight: '32px' }}
//                               placeholder="0.00"
//                               min="0"
//                               step="0.01"
//                             />
//                           </td>
//                           <td className="py-3 px-4">
//                             <input
//                               type="date"
//                               value={newRecordData.expiry_date}
//                               onChange={(e) => handleNewRecordChange('expiry_date', e.target.value)}
//                               className="w-full px-2 py-1 bg-[rgba(255,255,255,var(--ui-opacity-10))] border border-[rgba(59,130,246,0.3)] rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
//                               style={{ minHeight: '32px' }}
//                             />
//                           </td>
//                           <td className="py-3 px-4 text-sm text-gray-300">
//                             --
//                           </td>
//                           <td className="py-3 px-4">
//                             <select
//                               value={newRecordData.status}
//                               onChange={(e) => handleNewRecordChange('status', e.target.value as "1" | "0")}
//                               className="w-full px-2 py-1 bg-[rgba(255,255,255,var(--ui-opacity-10))] border border-[rgba(59,130,246,0.3)] rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
//                               style={{ minHeight: '32px' }}
//                             >
//                               <option value="1" className="bg-gray-800 text-white">Active</option>
//                               <option value="0" className="bg-gray-800 text-white">Inactive</option>
//                             </select>
//                           </td>
//                           <td className="py-3 px-4">
//                             <input
//                               type="text"
//                               value={newRecordData.remarks}
//                               onChange={(e) => handleNewRecordChange('remarks', e.target.value)}
//                               className="w-full px-2 py-1 bg-[rgba(255,255,255,var(--ui-opacity-10))] border border-[rgba(59,130,246,0.3)] rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
//                               style={{ minHeight: '32px' }}
//                               placeholder="Remarks"
//                             />
//                           </td>
//                           <td className="py-3 px-4">
//                             <div className="flex items-center justify-end gap-2">
//                               <button
//                                 onClick={handleSaveNew}
//                                 disabled={isSaving}
//                                 className="p-1.5 rounded bg-green-500/20 hover:bg-green-500/30 transition-colors disabled:opacity-50"
//                                 title="Save"
//                               >
//                                 {isSaving ? (
//                                   <Loader2 className="w-4 h-4 animate-spin text-green-400" />
//                                 ) : (
//                                   <Save className="w-4 h-4 text-green-400" />
//                                 )}
//                               </button>
//                               <button
//                                 onClick={handleCancelAdd}
//                                 disabled={isSaving}
//                                 className="p-1.5 rounded bg-red-500/20 hover:bg-red-500/30 transition-colors disabled:opacity-50"
//                                 title="Cancel"
//                               >
//                                 <X className="w-4 h-4 text-red-400" />
//                               </button>
//                             </div>
//                           </td>
//                         </tr>
//                       )}

//                       {/* Existing Data Rows */}
//                       {data.length === 0 ? (
//                         <tr>
//                           <td colSpan={10} className="py-8 text-center">
//                             <div className="flex flex-col items-center justify-center gap-2">
//                               <Package className="w-12 h-12 text-gray-400" />
//                               <span className="text-gray-400">No subscriptions found</span>
//                               {searchQuery && (
//                                 <button
//                                   onClick={() => setSearchQuery("")}
//                                   className="text-sm text-blue-400 hover:text-blue-300"
//                                 >
//                                   Clear search
//                                 </button>
//                               )}
//                             </div>
//                           </td>
//                         </tr>
//                       ) : (
//                         data.map((item, index) => (
//                           <tr
//                             key={item.id}
//                             className={`border-b border-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.02)] transition-colors ${
//                               editingId === item.id ? 'bg-[rgba(59,130,246,0.05)]' : ''
//                             }`}
//                           >
//                             <td className="py-3 px-4">
//                               <input
//                                 type="checkbox"
//                                 checked={selectedItems.includes(item.id)}
//                                 onChange={(e) => handleSelectItem(item.id, e.target.checked)}
//                                 className="w-4 h-4 rounded border-gray-300 bg-gray-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
//                               />
//                             </td>
//                             <td className="py-3 px-4 text-sm text-gray-300">
//                               {startItem + index}
//                             </td>

//                             {editingId === item.id ? (
//                               <>
//                                 <td className="py-3 px-4">
//                                   <input
//                                     type="text"
//                                     value={editData[item.id]?.product_name || item.product_name}
//                                     onChange={(e) => handleEditChange(item.id, 'product_name', e.target.value)}
//                                     className="w-full px-2 py-1 bg-[rgba(255,255,255,var(--ui-opacity-10))] border border-[rgba(59,130,246,0.3)] rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
//                                     style={{ minHeight: '32px' }}
//                                   />
//                                 </td>
//                                 <td className="py-3 px-4">
//                                   <input
//                                     type="date"
//                                     value={editData[item.id]?.renewal_date || item.renewal_date}
//                                     onChange={(e) => handleEditChange(item.id, 'renewal_date', e.target.value)}
//                                     className="w-full px-2 py-1 bg-[rgba(255,255,255,var(--ui-opacity-10))] border border-[rgba(59,130,246,0.3)] rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
//                                     style={{ minHeight: '32px' }}
//                                   />
//                                 </td>
//                                 <td className="py-3 px-4">
//                                   <input
//                                     type="number"
//                                     value={editData[item.id]?.amount || item.amount || ''}
//                                     onChange={(e) => handleEditChange(item.id, 'amount', parseFloat(e.target.value) || 0)}
//                                     className="w-full px-2 py-1 bg-[rgba(255,255,255,var(--ui-opacity-10))] border border-[rgba(59,130,246,0.3)] rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
//                                     style={{ minHeight: '32px' }}
//                                     min="0"
//                                     step="0.01"
//                                   />
//                                 </td>
//                                 <td className="py-3 px-4">
//                                   <input
//                                     type="date"
//                                     value={editData[item.id]?.expiry_date || item.expiry_date}
//                                     onChange={(e) => handleEditChange(item.id, 'expiry_date', e.target.value)}
//                                     className="w-full px-2 py-1 bg-[rgba(255,255,255,var(--ui-opacity-10))] border border-[rgba(59,130,246,0.3)] rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
//                                     style={{ minHeight: '32px' }}
//                                   />
//                                 </td>
//                               </>
//                             ) : (
//                               <>
//                                 <td className="py-3 px-4">
//                                   <div className="flex items-center gap-2">
//                                     <Package className="w-4 h-4 text-gray-400 flex-shrink-0" />
//                                     <span className="text-sm text-white font-medium">
//                                       {item.product_name}
//                                     </span>
//                                   </div>
//                                 </td>
//                                 <td className="py-3 px-4 text-sm text-gray-300">
//                                   <div className="flex items-center gap-2">
//                                     <Calendar className="w-4 h-4 text-gray-400" />
//                                     {formatDate(item.renewal_date)}
//                                   </div>
//                                 </td>
//                                 <td className="py-3 px-4 text-sm text-gray-300">
//                                   <div className="flex items-center gap-2">
//                                     {item.amount}
//                                   </div>
//                                 </td>
//                                 <td className="py-3 px-4 text-sm text-gray-300">
//                                   {formatDate(item.expiry_date)}
//                                 </td>
//                               </>
//                             )}

//                             <td className="py-3 px-4">
//                               <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
//                                 calculateDays(item.expiry_date) < 0
//                                   ? 'bg-red-500/20 text-red-400'
//                                   : calculateDays(item.expiry_date) <= 7
//                                     ? 'bg-yellow-500/20 text-yellow-400'
//                                     : 'bg-green-500/20 text-green-400'
//                               }`}>
//                                 {/* <Clock className="w-3 h-3" /> */}
//                                 {calculateDays(item.expiry_date)} days
//                               </div>
//                             </td>

//                             {editingId === item.id ? (
//                               <td className="py-3 px-4">
//                                 <select
//                                   value={editData[item.id]?.status?.toString() || item.status.toString()}
//                                   onChange={(e) => handleEditChange(item.id, 'status', parseInt(e.target.value) as 0 | 1)}
//                                   className="w-full px-2 py-1 bg-[rgba(255,255,255,var(--ui-opacity-10))] border border-[rgba(59,130,246,0.3)] rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
//                                   style={{ minHeight: '32px' }}
//                                 >
//                                   <option value="1" className="bg-gray-800 text-white">Active</option>
//                                   <option value="0" className="bg-gray-800 text-white">Inactive</option>
//                                 </select>
//                               </td>
//                             ) : (
//                               <td className="py-3 px-4">
//                                 <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(item.status)} bg-opacity-20 ${
//                                   item.status === 1 ? 'bg-green-500/20' : 'bg-red-500/20'
//                                 }`}>
//                                   {getStatusIcon(item.status)}
//                                   {getStatusText(item.status)}
//                                 </div>
//                               </td>
//                             )}

//                             {editingId === item.id ? (
//                               <td className="py-3 px-4">
//                                 <input
//                                   type="text"
//                                   value={editData[item.id]?.remarks || item.remarks}
//                                   onChange={(e) => handleEditChange(item.id, 'remarks', e.target.value)}
//                                   className="w-full px-2 py-1 bg-[rgba(255,255,255,var(--ui-opacity-10))] border border-[rgba(59,130,246,0.3)] rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
//                                   style={{ minHeight: '32px' }}
//                                 />
//                               </td>
//                             ) : (
//                               <td className="py-3 px-4">
//                                 <div className="flex items-center gap-2">
//                                   <MessageSquare className="w-4 h-4 text-gray-400 flex-shrink-0" />
//                                   <span className="text-sm text-gray-300 truncate max-w-[180px]">
//                                     {item.remarks}
//                                   </span>
//                                 </div>
//                               </td>
//                             )}

//                             <td className="py-3 px-4">
//                               <div className="flex items-center justify-end gap-2">
//                                 {editingId === item.id ? (
//                                   <>
//                                     <button
//                                       onClick={() => handleSave(item.id)}
//                                       disabled={isSaving}
//                                       className="p-1.5 rounded bg-green-500/20 hover:bg-green-500/30 transition-colors disabled:opacity-50"
//                                       title="Save"
//                                     >
//                                       {isSaving ? (
//                                         <Loader2 className="w-4 h-4 animate-spin text-green-400" />
//                                       ) : (
//                                         <Save className="w-4 h-4 text-green-400" />
//                                       )}
//                                     </button>
//                                     <button
//                                       onClick={handleCancelEdit}
//                                       disabled={isSaving}
//                                       className="p-1.5 rounded bg-red-500/20 hover:bg-red-500/30 transition-colors disabled:opacity-50"
//                                       title="Cancel"
//                                     >
//                                       <X className="w-4 h-4 text-red-400" />
//                                     </button>
//                                   </>
//                                 ) : (
//                                   <>
//                                     <button
//                                       onClick={() => handleEdit(item)}
//                                       className="p-1.5 rounded hover:bg-[rgba(255,255,255,0.1)] transition-colors"
//                                       title="Edit"
//                                     >
//                                       <Edit className="w-4 h-4 text-gray-400 hover:text-blue-400" />
//                                     </button>
//                                     <button
//                                       onClick={() => handleDeleteClick(item.id)}
//                                       className="p-1.5 rounded hover:bg-red-500/20 transition-colors"
//                                       title="Delete"
//                                     >
//                                       <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-400" />
//                                     </button>
//                                   </>
//                                 )}
//                               </div>
//                             </td>
//                           </tr>
//                         ))
//                       )}
//                     </>
//                   )}
//                 </tbody>
//               </table>
//             </div>

//             {/* Pagination */}
//             {!loading && data.length > 0 && (
//               <Pagination
//                 page={pagination.page}
//                 rowsPerPage={pagination.rowsPerPage}
//                 totalItems={totalItems}
//                 onPageChange={handlePageChange}
//                 />
//             )}
//           </div>

//           {/* Selected Items Info */}
//           {selectedItems.length > 0 && (
//             <div className="mt-4 p-3 bg-[rgba(255,255,255,0.05)] rounded-lg border border-[rgba(255,255,255,0.1)]">
//               <div className="flex items-center justify-between">
//                 <span className="text-sm text-gray-300">
//                   {selectedItems.length} subscription{selectedItems.length > 1 ? 's' : ''} selected
//                 </span>
//                 <div className="flex gap-2">
//                   <button
//                     onClick={() => setSelectedItems([])}
//                     className="text-sm text-gray-400 hover:text-white transition-colors"
//                   >
//                     Clear selection
//                   </button>
//                   <button
//                     onClick={handleBulkDeleteClick}
//                     disabled={isDeleting}
//                     className="text-sm text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
//                   >
//                     {isDeleting ? "Deleting..." : `Delete ${selectedItems.length} items`}
//                   </button>
//                 </div>
//               </div>
//             </div>
//           )}
//         </GlassCard>
//       </div>

//       {/* Delete Confirmation Modal */}
//       <DeleteConfirmationModal
//         isOpen={showDeleteModal}
//         onClose={() => {
//           setShowDeleteModal(false)
//           setItemToDelete(null)
//         }}
//         onConfirm={confirmDelete}
//         itemCount={itemToDelete ? 1 : selectedItems.length}
//         isLoading={isDeleting}
//         title={itemToDelete ? "Delete Subscription" : "Delete Multiple Subscriptions"}
//         message={itemToDelete
//           ? "Are you sure you want to delete this subscription? This action cannot be undone."
//           : "Are you sure you want to delete the selected subscriptions? This action cannot be undone."
//         }
//       />
//     </div>
//   )
// }

// src/app/[role]/subscription/page.tsx

// // src/app/[role]/subscription/page.tsx
// "use client"

// import { useState, useEffect, useRef } from "react"
// import { Header } from "@/components/layout"
// import { GlassCard, GlassButton, GlassModal, GlassInput } from "@/components/glass"
// import { EditRow } from "@/common/services/EditRow"
// import { DeleteConfirmationModal } from "@/common/services/DeleteConfirmationModal"
// import {
//   Edit,
//   Trash2,
//   Search,
//   Plus,
//   Calendar,
//   DollarSign,
//   Package,
//   MessageSquare,
//   Clock,
//   CheckCircle,
//   XCircle,
//   Loader2,
//   ChevronLeft,
//   ChevronRight
// } from "lucide-react"
// import { navigationTabs } from "@/lib/navigation"
// import { useAuth } from "@/contexts/AuthContext"
// import { useToast } from "@/hooks/useToast"
// import { useRouter } from "next/navigation"
// import { apiService } from "@/common/services/apiService"

// interface Subscription {
//   id: number
//   client_name: string | null
//   domain_name: string | null
//   product_name: string
//   renewal_date: string
//   amount: number | null
//   expiry_date: string
//   days_to_expire_today: number
//   today_date: string
//   status: 0 | 1
//   remarks: string
//   created_at: string
//   updated_at: string
// }

// interface AddEditSubscription {
//   record_type: 1
//   id?: number
//   s_id: number
//   product_id: number
//   renewal_date: string
//   amount: number
//   expiry_date: string
//   status: 0 | 1
//   remarks: string
// }

// export default function SubscriptionsPage() {
//   const { user } = useAuth()
//   const { toast } = useToast()
//   const router = useRouter()

//   const [data, setData] = useState<Subscription[]>([])
//   const [loading, setLoading] = useState(true)
//   const [searchQuery, setSearchQuery] = useState("")
//   const [selectedItems, setSelectedItems] = useState<number[]>([])
//   const [isModalOpen, setIsModalOpen] = useState(false)
//   const [editingId, setEditingId] = useState<number | null>(null)
//   const [isDeleting, setIsDeleting] = useState(false)
//   const [showDeleteModal, setShowDeleteModal] = useState(false)
//   const [itemToDelete, setItemToDelete] = useState<number | null>(null)

//   // Pagination state
//   const [pagination, setPagination] = useState({
//     page: 0,
//     rowsPerPage: 10,
//     orderBy: "id" as "id" | "renewal_date" | "amount" | "product_name",
//     orderDir: "desc" as "asc" | "desc"
//   })

//   const [totalItems, setTotalItems] = useState(0)
//   const [formData, setFormData] = useState({
//     product_id: "",
//     renewal_date: "",
//     amount: "",
//     expiry_date: "",
//     status: "1",
//     remarks: ""
//   })

//   // Sample data for dropdowns
//   const productOptions = [
//     { value: 1, label: "Web Hosting" },
//     { value: 2, label: "Domain Registration" },
//     { value: 3, label: "E-commerce Platform" },
//     { value: 4, label: "SSL Certificate" }
//   ]

//   const statusOptions = [
//     { value: "1", label: "Active" },
//     { value: "0", label: "Inactive" }
//   ]

//   const searchTimeoutRef = useRef<NodeJS.Timeout>()

//   // Fetch subscriptions
//   const fetchSubscriptions = async () => {
//     try {
//       setLoading(true)

//       const response = await apiService.listRecords({
//         record_type: 1, // Subscriptions
//         search: searchQuery,
//         page: pagination.page,
//         rowsPerPage: pagination.rowsPerPage,
//         orderBy: pagination.orderBy,
//         orderDir: pagination.orderDir
//       })

//       if (response.status) {
//         setData(response.data || [])
//         setTotalItems(response.total || 0)
//       } else {
//         toast({
//           title: "Error",
//           description: response.message || "Failed to fetch subscriptions",
//           variant: "destructive"
//         })
//       }
//     } catch (error) {
//       console.error("Error fetching subscriptions:", error)
//       toast({
//         title: "Error",
//         description: "Failed to fetch subscriptions",
//         variant: "destructive"
//       })
//     } finally {
//       setLoading(false)
//     }
//   }

//   // Initial fetch
//   useEffect(() => {
//     fetchSubscriptions()
//   }, [pagination.page, pagination.orderBy, pagination.orderDir])

//   // Handle search with debounce
//   useEffect(() => {
//     if (searchTimeoutRef.current) {
//       clearTimeout(searchTimeoutRef.current)
//     }

//     searchTimeoutRef.current = setTimeout(() => {
//       setPagination(prev => ({ ...prev, page: 0 }))
//       fetchSubscriptions()
//     }, 300)

//     return () => {
//       if (searchTimeoutRef.current) {
//         clearTimeout(searchTimeoutRef.current)
//       }
//     }
//   }, [searchQuery])

//   // Handle Add
//   const handleAdd = () => {
//     setFormData({
//       product_id: "",
//       renewal_date: "",
//       amount: "",
//       expiry_date: "",
//       status: "1",
//       remarks: ""
//     })
//     setIsModalOpen(true)
//   }

//   // Handle Edit
//   const handleEdit = (subscription: Subscription) => {
//     setEditingId(subscription.id)
//   }

//   // Handle Save (for inline editing)
//   const handleSave = async (updatedData: Subscription) => {
//     try {
//       const payload: AddEditSubscription = {
//         record_type: 1,
//         id: updatedData.id,
//         s_id: user?.id || 6,
//         product_id: Number(updatedData.product_id || 1),
//         renewal_date: updatedData.renewal_date,
//         amount: updatedData.amount || 0,
//         expiry_date: updatedData.expiry_date,
//         status: updatedData.status,
//         remarks: updatedData.remarks
//       }

//       const response = await apiService.editRecord(payload)

//       if (response.success) {
//         toast({
//           title: "Success",
//           description: response.message || "Subscription updated successfully",
//           variant: "default"
//         })
//         setEditingId(null)
//         fetchSubscriptions()
//       } else {
//         toast({
//           title: "Error",
//           description: response.message || "Failed to update subscription",
//           variant: "destructive"
//         })
//       }
//     } catch (error) {
//       console.error("Error updating subscription:", error)
//       toast({
//         title: "Error",
//         description: "Failed to update subscription",
//         variant: "destructive"
//       })
//     }
//   }

//   // Handle Delete (single)
//   const handleDeleteClick = (id: number) => {
//     setItemToDelete(id)
//     setShowDeleteModal(true)
//   }

//   // Handle Bulk Delete
//   const handleBulkDeleteClick = () => {
//     if (selectedItems.length === 0) {
//       toast({
//         title: "Error",
//         description: "Please select at least one subscription",
//         variant: "destructive"
//       })
//       return
//     }
//     setItemToDelete(null)
//     setShowDeleteModal(true)
//   }

//   // Confirm Delete
//   const confirmDelete = async () => {
//     try {
//       setIsDeleting(true)

//       const idsToDelete = itemToDelete ? [itemToDelete] : selectedItems

//       const response = await apiService.deleteRecords(idsToDelete, 1)

//       if (response.success) {
//         toast({
//           title: "Success",
//           description: response.message || "Record(s) deleted successfully",
//           variant: "default"
//         })

//         // Clear selection
//         setSelectedItems([])
//         setItemToDelete(null)

//         // Refresh data
//         fetchSubscriptions()
//       } else {
//         toast({
//           title: "Error",
//           description: response.message || "Failed to delete record(s)",
//           variant: "destructive"
//         })
//       }
//     } catch (error) {
//       console.error("Error deleting:", error)
//       toast({
//         title: "Error",
//         description: "Failed to delete record(s)",
//         variant: "destructive"
//       })
//     } finally {
//       setIsDeleting(false)
//       setShowDeleteModal(false)
//     }
//   }

//   // Handle Modal Submit
//   const handleModalSubmit = async () => {
//     try {
//       if (!formData.product_id || !formData.renewal_date || !formData.expiry_date) {
//         toast({
//           title: "Error",
//           description: "Please fill all required fields",
//           variant: "destructive"
//         })
//         return
//       }

//       const payload: AddEditSubscription = {
//         record_type: 1,
//         s_id: user?.id || 6,
//         product_id: Number(formData.product_id),
//         renewal_date: formData.renewal_date,
//         amount: parseFloat(formData.amount) || 0,
//         expiry_date: formData.expiry_date,
//         status: parseInt(formData.status) as 0 | 1,
//         remarks: formData.remarks
//       }

//       const response = await apiService.addRecord(payload)

//       if (response.success) {
//         toast({
//           title: "Success",
//           description: response.message || "Subscription added successfully",
//           variant: "default"
//         })
//         setIsModalOpen(false)
//         fetchSubscriptions()
//       } else {
//         toast({
//           title: "Error",
//           description: response.message || "Failed to add subscription",
//           variant: "destructive"
//         })
//       }
//     } catch (error) {
//       console.error("Error adding subscription:", error)
//       toast({
//         title: "Error",
//         description: "Failed to add subscription",
//         variant: "destructive"
//       })
//     }
//   }

//   // Handle Select All
//   const handleSelectAll = (checked: boolean) => {
//     if (checked) {
//       setSelectedItems(data.map(item => item.id))
//     } else {
//       setSelectedItems([])
//     }
//   }

//   const handleSelectItem = (id: number, checked: boolean) => {
//     if (checked) {
//       setSelectedItems(prev => [...prev, id])
//     } else {
//       setSelectedItems(prev => prev.filter(itemId => itemId !== id))
//     }
//   }

//   const isAllSelected = data.length > 0 && selectedItems.length === data.length

//   const getStatusColor = (status: 0 | 1) => {
//     return status === 1 ? 'text-green-400' : 'text-red-400'
//   }

//   const getStatusText = (status: 0 | 1) => {
//     return status === 1 ? 'Active' : 'Inactive'
//   }

//   const getStatusIcon = (status: 0 | 1) => {
//     return status === 1 ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />
//   }

//   const formatDate = (dateString: string) => {
//     try {
//       const date = new Date(dateString)
//       return date.toLocaleDateString('en-US', {
//         year: 'numeric',
//         month: 'short',
//         day: 'numeric'
//       })
//     } catch {
//       return dateString
//     }
//   }

//   const formatCurrency = (amount: number | null) => {
//     if (amount === null) return "$0.00"
//     return new Intl.NumberFormat('en-US', {
//       style: 'currency',
//       currency: 'USD'
//     }).format(amount)
//   }

//   // Calculate days until expiry
//   const calculateDays = (expiryDate: string) => {
//     try {
//       const today = new Date()
//       const expiry = new Date(expiryDate)
//       const diffTime = expiry.getTime() - today.getTime()
//       const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
//       return diffDays
//     } catch {
//       return 0
//     }
//   }

//   const totalPages = Math.ceil(totalItems / pagination.rowsPerPage)
//   const startItem = pagination.page * pagination.rowsPerPage + 1
//   const endItem = Math.min((pagination.page + 1) * pagination.rowsPerPage, totalItems)

//   // Edit fields configuration
//   const editFields = [
//     { name: 'product_name', label: 'Product', type: 'text' as const, required: true },
//     { name: 'renewal_date', label: 'Renewal Date', type: 'date' as const, required: true },
//     { name: 'amount', label: 'Amount', type: 'number' as const, required: true },
//     { name: 'expiry_date', label: 'Expiry Date', type: 'date' as const, required: true },
//     { name: 'remarks', label: 'Remarks', type: 'textarea' as const }
//   ]

//   return (
//     <div className="min-h-screen pb-8">
//       <Header title="Subscription Management" tabs={navigationTabs} />

//       <div className="px-4 sm:px-6 mt-6">
//         <GlassCard className="p-6">
//           {/* Header with Search and Add Button */}
//           <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
//             <div>
//               <div className="flex items-center gap-2">
//                 <Package className="w-6 h-6 text-blue-500" />
//                 <h2 className="text-xl font-semibold text-white">Subscriptions</h2>
//               </div>
//               <p className="text-sm text-gray-400 mt-1">
//                 Manage your subscriptions and renewals
//               </p>
//             </div>

//             <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
//               <div className="relative flex-1 sm:flex-initial">
//                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
//                 <input
//                   type="text"
//                   placeholder="Search subscriptions..."
//                   value={searchQuery}
//                   onChange={(e) => setSearchQuery(e.target.value)}
//                   className="pl-10 pr-4 py-2 w-full sm:w-64 bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.1)] rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                 />
//               </div>

//               <div className="flex gap-2">
//                 {selectedItems.length > 0 && (
//                   <GlassButton
//                     variant="danger"
//                     onClick={handleBulkDeleteClick}
//                     className="flex items-center gap-2"
//                     disabled={isDeleting}
//                   >
//                     {isDeleting ? (
//                       <Loader2 className="w-4 h-4 animate-spin" />
//                     ) : (
//                       <Trash2 className="w-4 h-4" />
//                     )}
//                     Delete ({selectedItems.length})
//                   </GlassButton>
//                 )}

//                 <GlassButton
//                   variant="primary"
//                   onClick={handleAdd}
//                   className="flex items-center gap-2"
//                 >
//                   <Plus className="w-4 h-4" />
//                   Add Subscription
//                 </GlassButton>
//               </div>
//             </div>
//           </div>

//           {/* Table Container */}
//           <div className="overflow-hidden rounded-lg border border-[rgba(255,255,255,0.1)]">
//             {/* Table */}
//             <div className="overflow-x-auto">
//               <table className="w-full">
//                 <thead>
//                   <tr className="bg-[rgba(255,255,255,0.05)] border-b border-[rgba(255,255,255,0.1)]">
//                     <th className="py-3 px-4 text-left w-12">
//                       <input
//                         type="checkbox"
//                         checked={isAllSelected}
//                         onChange={(e) => handleSelectAll(e.target.checked)}
//                         className="w-4 h-4 rounded border-gray-300 bg-gray-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
//                       />
//                     </th>
//                     <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 min-w-[80px]">
//                       S.NO
//                     </th>
//                     <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 min-w-[200px]">
//                       Product
//                     </th>
//                     <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 min-w-[150px]">
//                       Renewal Date
//                     </th>
//                     <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 min-w-[120px]">
//                       Amount
//                     </th>
//                     <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 min-w-[150px]">
//                       Expiry Date
//                     </th>
//                     <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 min-w-[100px]">
//                       Days Left
//                     </th>
//                     <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 min-w-[100px]">
//                       Status
//                     </th>
//                     <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 min-w-[200px]">
//                       Remarks
//                     </th>
//                     <th className="py-3 px-4 text-right text-sm font-medium text-gray-300 min-w-[120px]">
//                       Actions
//                     </th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {loading ? (
//                     <tr>
//                       <td colSpan={10} className="py-8 text-center">
//                         <div className="flex flex-col items-center justify-center gap-2">
//                           <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
//                           <span className="text-gray-400">Loading subscriptions...</span>
//                         </div>
//                       </td>
//                     </tr>
//                   ) : data.length === 0 ? (
//                     <tr>
//                       <td colSpan={10} className="py-8 text-center">
//                         <div className="flex flex-col items-center justify-center gap-2">
//                           <Package className="w-12 h-12 text-gray-400" />
//                           <span className="text-gray-400">No subscriptions found</span>
//                           {searchQuery && (
//                             <button
//                               onClick={() => setSearchQuery("")}
//                               className="text-sm text-blue-400 hover:text-blue-300"
//                             >
//                               Clear search
//                             </button>
//                           )}
//                         </div>
//                       </td>
//                     </tr>
//                   ) : (
//                     data.map((item, index) => (
//                       <>
//                         {editingId === item.id ? (
//                           <tr key={item.id}>
//                             <td colSpan={10} className="p-4">
//                               <EditRow
//                                 record={item}
//                                 onSave={handleSave}
//                                 onCancel={() => setEditingId(null)}
//                                 fields={editFields}
//                               />
//                             </td>
//                           </tr>
//                         ) : (
//                           <tr
//                             key={item.id}
//                             className="border-b border-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.02)] transition-colors"
//                           >
//                             <td className="py-3 px-4">
//                               <input
//                                 type="checkbox"
//                                 checked={selectedItems.includes(item.id)}
//                                 onChange={(e) => handleSelectItem(item.id, e.target.checked)}
//                                 className="w-4 h-4 rounded border-gray-300 bg-gray-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
//                               />
//                             </td>
//                             <td className="py-3 px-4 text-sm text-gray-300">
//                               {startItem + index}
//                             </td>
//                             <td className="py-3 px-4">
//                               <div className="flex items-center gap-2">
//                                 <Package className="w-4 h-4 text-gray-400 flex-shrink-0" />
//                                 <span className="text-sm text-white font-medium">
//                                   {item.product_name}
//                                 </span>
//                               </div>
//                             </td>
//                             <td className="py-3 px-4 text-sm text-gray-300">
//                               <div className="flex items-center gap-2">
//                                 <Calendar className="w-4 h-4 text-gray-400" />
//                                 {formatDate(item.renewal_date)}
//                               </div>
//                             </td>
//                             <td className="py-3 px-4 text-sm text-gray-300">
//                               <div className="flex items-center gap-2">
//                                 <DollarSign className="w-4 h-4 text-gray-400" />
//                                 {formatCurrency(item.amount)}
//                               </div>
//                             </td>
//                             <td className="py-3 px-4 text-sm text-gray-300">
//                               {formatDate(item.expiry_date)}
//                             </td>
//                             <td className="py-3 px-4">
//                               <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
//                                 calculateDays(item.expiry_date) < 0
//                                   ? 'bg-red-500/20 text-red-400'
//                                   : calculateDays(item.expiry_date) <= 7
//                                     ? 'bg-yellow-500/20 text-yellow-400'
//                                     : 'bg-green-500/20 text-green-400'
//                               }`}>
//                                 <Clock className="w-3 h-3" />
//                                 {calculateDays(item.expiry_date)} days
//                               </div>
//                             </td>
//                             <td className="py-3 px-4">
//                               <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(item.status)} bg-opacity-20 ${
//                                 item.status === 1 ? 'bg-green-500/20' : 'bg-red-500/20'
//                               }`}>
//                                 {getStatusIcon(item.status)}
//                                 {getStatusText(item.status)}
//                               </div>
//                             </td>
//                             <td className="py-3 px-4">
//                               <div className="flex items-center gap-2">
//                                 <MessageSquare className="w-4 h-4 text-gray-400 flex-shrink-0" />
//                                 <span className="text-sm text-gray-300 truncate max-w-[200px]">
//                                   {item.remarks}
//                                 </span>
//                               </div>
//                             </td>
//                             <td className="py-3 px-4">
//                               <div className="flex items-center justify-end gap-2">
//                                 <button
//                                   onClick={() => handleEdit(item)}
//                                   className="p-1.5 rounded hover:bg-[rgba(255,255,255,0.1)] transition-colors"
//                                   title="Edit"
//                                 >
//                                   <Edit className="w-4 h-4 text-gray-400 hover:text-blue-400" />
//                                 </button>
//                                 <button
//                                   onClick={() => handleDeleteClick(item.id)}
//                                   className="p-1.5 rounded hover:bg-red-500/20 transition-colors"
//                                   title="Delete"
//                                 >
//                                   <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-400" />
//                                 </button>
//                               </div>
//                             </td>
//                           </tr>
//                         )}
//                       </>
//                     ))
//                   )}
//                 </tbody>
//               </table>
//             </div>

//             {/* Pagination */}
//             {!loading && data.length > 0 && (
//               <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 bg-[rgba(255,255,255,0.05)] border-t border-[rgba(255,255,255,0.1)]">
//                 <div className="text-sm text-gray-400 mb-3 sm:mb-0">
//                   Showing {startItem} to {endItem} of {totalItems} subscriptions
//                 </div>
//                 <div className="flex items-center gap-2">
//                   <button
//                     onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
//                     disabled={pagination.page === 0}
//                     className="p-2 rounded-lg bg-[rgba(255,255,255,0.05)] text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[rgba(255,255,255,0.1)] transition-colors"
//                     title="Previous"
//                   >
//                     <ChevronLeft className="w-4 h-4" />
//                   </button>

//                   <div className="flex items-center gap-1">
//                     {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
//                       let pageNum
//                       if (totalPages <= 5) {
//                         pageNum = i
//                       } else if (pagination.page <= 2) {
//                         pageNum = i
//                       } else if (pagination.page >= totalPages - 3) {
//                         pageNum = totalPages - 5 + i
//                       } else {
//                         pageNum = pagination.page - 2 + i
//                       }

//                       if (pageNum >= totalPages) return null

//                       return (
//                         <button
//                           key={pageNum}
//                           onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
//                           className={`px-3 py-1 rounded text-sm transition-colors ${
//                             pagination.page === pageNum
//                               ? 'bg-blue-600 text-white'
//                               : 'bg-[rgba(255,255,255,0.05)] text-gray-300 hover:bg-[rgba(255,255,255,0.1)]'
//                           }`}
//                         >
//                           {pageNum + 1}
//                         </button>
//                       )
//                     })}
//                   </div>

//                   <button
//                     onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
//                     disabled={pagination.page >= totalPages - 1}
//                     className="p-2 rounded-lg bg-[rgba(255,255,255,0.05)] text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[rgba(255,255,255,0.1)] transition-colors"
//                     title="Next"
//                   >
//                     <ChevronRight className="w-4 h-4" />
//                   </button>
//                 </div>
//               </div>
//             )}
//           </div>

//           {/* Selected Items Info */}
//           {selectedItems.length > 0 && (
//             <div className="mt-4 p-3 bg-[rgba(255,255,255,0.05)] rounded-lg border border-[rgba(255,255,255,0.1)]">
//               <div className="flex items-center justify-between">
//                 <span className="text-sm text-gray-300">
//                   {selectedItems.length} subscription{selectedItems.length > 1 ? 's' : ''} selected
//                 </span>
//                 <div className="flex gap-2">
//                   <button
//                     onClick={() => setSelectedItems([])}
//                     className="text-sm text-gray-400 hover:text-white transition-colors"
//                   >
//                     Clear selection
//                   </button>
//                   <button
//                     onClick={handleBulkDeleteClick}
//                     disabled={isDeleting}
//                     className="text-sm text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
//                   >
//                     {isDeleting ? "Deleting..." : `Delete ${selectedItems.length} items`}
//                   </button>
//                 </div>
//               </div>
//             </div>
//           )}
//         </GlassCard>
//       </div>

//       {/* Add Modal */}
//       <GlassModal
//         isOpen={isModalOpen}
//         onClose={() => setIsModalOpen(false)}
//         title="Add New Subscription"
//         size="lg"
//       >
//         <div className="space-y-4">
//           <div>
//             <label className="block text-[var(--text-tertiary)] text-sm mb-2">Product *</label>
//             <select
//               value={formData.product_id}
//               onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
//               className="w-full px-4 py-2 bg-[rgba(255,255,255,var(--ui-opacity-10))] border border-[rgba(255,255,255,var(--glass-border-opacity))] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent"
//             >
//               <option value="">Select Product</option>
//               {productOptions.map(option => (
//                 <option key={option.value} value={option.value} className="bg-gray-800 text-white">
//                   {option.label}
//                 </option>
//               ))}
//             </select>
//           </div>

//           <div className="grid grid-cols-2 gap-4">
//             <div>
//               <label className="block text-[var(--text-tertiary)] text-sm mb-2">Renewal Date *</label>
//               <GlassInput
//                 type="date"
//                 value={formData.renewal_date}
//                 onChange={(e) => setFormData({ ...formData, renewal_date: e.target.value })}
//               />
//             </div>

//             <div>
//               <label className="block text-[var(--text-tertiary)] text-sm mb-2">Amount</label>
//               <GlassInput
//                 type="number"
//                 placeholder="Enter amount"
//                 value={formData.amount}
//                 onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
//                 min="0"
//                 step="0.01"
//               />
//             </div>
//           </div>

//           <div className="grid grid-cols-2 gap-4">
//             <div>
//               <label className="block text-[var(--text-tertiary)] text-sm mb-2">Expiry Date *</label>
//               <GlassInput
//                 type="date"
//                 value={formData.expiry_date}
//                 onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
//               />
//             </div>

//             <div>
//               <label className="block text-[var(--text-tertiary)] text-sm mb-2">Status</label>
//               <select
//                 value={formData.status}
//                 onChange={(e) => setFormData({ ...formData, status: e.target.value })}
//                 className="w-full px-4 py-2 bg-[rgba(255,255,255,var(--ui-opacity-10))] border border-[rgba(255,255,255,var(--glass-border-opacity))] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent"
//               >
//                 {statusOptions.map(option => (
//                   <option key={option.value} value={option.value} className="bg-gray-800 text-white">
//                     {option.label}
//                   </option>
//                 ))}
//               </select>
//             </div>
//           </div>

//           <div>
//             <label className="block text-[var(--text-tertiary)] text-sm mb-2">Remarks</label>
//             <textarea
//               placeholder="Enter any remarks or notes"
//               value={formData.remarks}
//               onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
//               className="w-full px-4 py-2 bg-[rgba(255,255,255,var(--ui-opacity-10))] border border-[rgba(255,255,255,var(--glass-border-opacity))] rounded-lg text-white placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent resize-none"
//               rows={3}
//             />
//           </div>

//           <div className="flex gap-3 pt-6">
//             <GlassButton
//               variant="ghost"
//               className="flex-1"
//               onClick={() => setIsModalOpen(false)}
//             >
//               Cancel
//             </GlassButton>
//             <GlassButton
//               variant="primary"
//               className="flex-1"
//               onClick={handleModalSubmit}
//               disabled={!formData.product_id || !formData.renewal_date || !formData.expiry_date}
//             >
//               Add Subscription
//             </GlassButton>
//           </div>
//         </div>
//       </GlassModal>

//       {/* Delete Confirmation Modal */}
//       <DeleteConfirmationModal
//         isOpen={showDeleteModal}
//         onClose={() => {
//           setShowDeleteModal(false)
//           setItemToDelete(null)
//         }}
//         onConfirm={confirmDelete}
//         itemCount={itemToDelete ? 1 : selectedItems.length}
//         isLoading={isDeleting}
//         title={itemToDelete ? "Delete Subscription" : "Delete Multiple Subscriptions"}
//         message={itemToDelete
//           ? "Are you sure you want to delete this subscription? This action cannot be undone."
//           : "Are you sure you want to delete the selected subscriptions? This action cannot be undone."
//         }
//       />
//     </div>
//   )
// }

// "use client"

// import { useState, useEffect } from "react"
// import { Header } from "@/components/layout"
// import { GlassCard, GlassButton, GlassInput, GlassModal, GlassSelect } from "@/components/glass"
// import {
//   Edit,
//   Trash2,
//   Search,
//   Plus,
//   Calendar,
//   DollarSign,
//   Package,
//   MessageSquare,
//   Clock,
//   CheckCircle,
//   XCircle,
//   AlertCircle
// } from "lucide-react"
// import { navigationTabs } from "@/lib/navigation"

// interface Subscription {
//   id: number
//   product: string
//   renewalDate: string
//   amount: number
//   remark: string
//   // These fields are calculated/auto-generated
//   nextRenewIn: number
//   todayDate: string
//   status: 'Active' | 'Expired' | 'Pending' | 'Cancelled'
// }

// // Helper function to calculate days between dates
// const calculateDaysBetween = (date1: Date, date2: Date): number => {
//   const diffTime = Math.abs(date2.getTime() - date1.getTime())
//   return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
// }

// // Helper function to get today's date in YYYY-MM-DD format
// const getTodayDate = (): string => {
//   const today = new Date()
//   return today.toISOString().split('T')[0]
// }

// // Calculate status based on renewal date
// const calculateStatus = (renewalDate: string): 'Active' | 'Expired' | 'Pending' | 'Cancelled' => {
//   const today = new Date()
//   const renewal = new Date(renewalDate)
//   const daysUntilRenewal = calculateDaysBetween(today, renewal)

//   if (daysUntilRenewal < 0) return 'Expired'
//   if (daysUntilRenewal <= 7) return 'Pending'
//   if (daysUntilRenewal > 7) return 'Active'
//   return 'Active'
// }

// const initialData: Subscription[] = [
//   {
//     id: 1,
//     product: "Premium Hosting",
//     renewalDate: "2024-12-15",
//     amount: 299.99,
//     remark: "Auto-renew enabled",
//     nextRenewIn: 45,
//     todayDate: getTodayDate(),
//     status: "Active"
//   },
//   {
//     id: 2,
//     product: "Domain Registration",
//     renewalDate: "2024-11-30",
//     amount: 19.99,
//     remark: "Need to confirm",
//     nextRenewIn: 30,
//     todayDate: getTodayDate(),
//     status: "Pending"
//   },
//   {
//     id: 3,
//     product: "SSL Certificate",
//     renewalDate: "2024-10-15",
//     amount: 89.99,
//     remark: "Expired last month",
//     nextRenewIn: -15,
//     todayDate: getTodayDate(),
//     status: "Expired"
//   },
//   {
//     id: 4,
//     product: "Business Email",
//     renewalDate: "2025-01-20",
//     amount: 149.99,
//     remark: "Annual plan",
//     nextRenewIn: 80,
//     todayDate: getTodayDate(),
//     status: "Active"
//   },
//   {
//     id: 5,
//     product: "Cloud Storage",
//     renewalDate: "2024-11-05",
//     amount: 49.99,
//     remark: "Monthly subscription",
//     nextRenewIn: 5,
//     todayDate: getTodayDate(),
//     status: "Pending"
//   }
// ]

// export default function SubscriptionsPage() {
//   const [data, setData] = useState<Subscription[]>(initialData)
//   const [searchQuery, setSearchQuery] = useState("")
//   const [selectedItems, setSelectedItems] = useState<number[]>([])
//   const [isModalOpen, setIsModalOpen] = useState(false)
//   const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null)
//   const [formData, setFormData] = useState({
//     product: "",
//     renewalDate: "",
//     amount: "",
//     remark: ""
//   })

//   // Update todayDate and calculations whenever data changes
//   useEffect(() => {
//     const updatedData = data.map(item => {
//       const today = new Date()
//       const renewal = new Date(item.renewalDate)
//       const nextRenewIn = calculateDaysBetween(today, renewal)
//       const status = calculateStatus(item.renewalDate)

//       return {
//         ...item,
//         todayDate: getTodayDate(),
//         nextRenewIn,
//         status
//       }
//     })
//     setData(updatedData)
//   }, [])

//   const filteredData = data.filter(item =>
//     item.product.toLowerCase().includes(searchQuery.toLowerCase()) ||
//     item.remark.toLowerCase().includes(searchQuery.toLowerCase())
//   )

//   const handleAdd = () => {
//     setEditingSubscription(null)
//     setFormData({
//       product: "",
//       renewalDate: "",
//       amount: "",
//       remark: ""
//     })
//     setIsModalOpen(true)
//   }

//   const handleEdit = (subscription: Subscription) => {
//     setEditingSubscription(subscription)
//     setFormData({
//       product: subscription.product,
//       renewalDate: subscription.renewalDate,
//       amount: subscription.amount.toString(),
//       remark: subscription.remark
//     })
//     setIsModalOpen(true)
//   }

//   const handleDelete = (id: number) => {
//     if (confirm("Are you sure you want to delete this subscription?")) {
//       setData(data.filter(item => item.id !== id))
//       setSelectedItems(selectedItems.filter(selectedId => selectedId !== id))
//     }
//   }

//   const handleSubmit = () => {
//     const today = new Date()
//     const renewal = new Date(formData.renewalDate)
//     const nextRenewIn = calculateDaysBetween(today, renewal)
//     const status = calculateStatus(formData.renewalDate)

//     if (editingSubscription) {
//       setData(data.map(item =>
//         item.id === editingSubscription.id
//           ? {
//               ...item,
//               product: formData.product,
//               renewalDate: formData.renewalDate,
//               amount: parseFloat(formData.amount),
//               remark: formData.remark,
//               todayDate: getTodayDate(),
//               nextRenewIn,
//               status
//             }
//           : item
//       ))
//     } else {
//       const newSubscription: Subscription = {
//         id: Math.max(...data.map(item => item.id)) + 1,
//         product: formData.product,
//         renewalDate: formData.renewalDate,
//         amount: parseFloat(formData.amount),
//         remark: formData.remark,
//         todayDate: getTodayDate(),
//         nextRenewIn,
//         status
//       }
//       setData([...data, newSubscription])
//     }
//     setIsModalOpen(false)
//   }

//   const handleSelectAll = (checked: boolean) => {
//     if (checked) {
//       setSelectedItems(filteredData.map(item => item.id))
//     } else {
//       setSelectedItems([])
//     }
//   }

//   const handleSelectItem = (id: number, checked: boolean) => {
//     if (checked) {
//       setSelectedItems([...selectedItems, id])
//     } else {
//       setSelectedItems(selectedItems.filter(selectedId => selectedId !== id))
//     }
//   }

//   const isAllSelected = filteredData.length > 0 && selectedItems.length === filteredData.length

//   const getStatusColor = (status: Subscription['status']) => {
//     switch (status) {
//       case 'Active': return 'text-green-400'
//       case 'Pending': return 'text-yellow-400'
//       case 'Expired': return 'text-red-400'
//       case 'Cancelled': return 'text-gray-400'
//       default: return 'text-gray-400'
//     }
//   }

//   const getStatusIcon = (status: Subscription['status']) => {
//     switch (status) {
//       case 'Active': return <CheckCircle className="w-4 h-4" />
//       case 'Pending': return <Clock className="w-4 h-4" />
//       case 'Expired': return <XCircle className="w-4 h-4" />
//       case 'Cancelled': return <AlertCircle className="w-4 h-4" />
//       default: return <AlertCircle className="w-4 h-4" />
//     }
//   }

//   const formatCurrency = (amount: number) => {
//     return new Intl.NumberFormat('en-US', {
//       style: 'currency',
//       currency: 'USD'
//     }).format(amount)
//   }

//   return (
//     <div className="min-h-screen pb-8">
//       <Header title="Subscription Management" tabs={navigationTabs} />

//       <div className="px-4 sm:px-6 mt-6">
//         <GlassCard className="p-6">
//           {/* Header with Search and Add Button */}
//           <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
//             <h2 className="text-xl font-semibold text-white">Subscriptions</h2>
//             <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
//               <div className="relative">
//                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
//                 <input
//                   type="text"
//                   placeholder="Search subscriptions..."
//                   value={searchQuery}
//                   onChange={(e) => setSearchQuery(e.target.value)}
//                   className="pl-10 pr-4 py-2 w-full sm:w-auto bg-[rgba(255,255,255,var(--ui-opacity-10))] border border-[rgba(255,255,255,var(--glass-border-opacity))] rounded-lg text-white placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent"
//                 />
//               </div>
//               <GlassButton
//                 variant="primary"
//                 onClick={handleAdd}
//                 className="flex items-center justify-center gap-2"
//               >
//                 <Plus className="w-4 h-4" />
//                 Add Subscription
//               </GlassButton>
//             </div>
//           </div>

//           {/* Table */}
//           <div className="overflow-x-auto">
//             <table className="w-full min-w-[800px]">
//               <thead>
//                 <tr className="border-b border-[rgba(255,255,255,var(--glass-border-opacity))]">
//                   <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-tertiary)]">
//                     <input
//                       type="checkbox"
//                       checked={isAllSelected}
//                       onChange={(e) => handleSelectAll(e.target.checked)}
//                       className="w-4 h-4 rounded border-[rgba(255,255,255,var(--glass-border-opacity))] bg-[rgba(255,255,255,var(--ui-opacity-10))] text-[var(--theme-primary)] focus:ring-[var(--theme-primary)]"
//                     />
//                   </th>
//                   <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-tertiary)] w-[60px]">
//                     S.NO
//                   </th>
//                   <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-tertiary)]">
//                     Product
//                   </th>
//                   <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-tertiary)]">
//                     Renewal Date
//                   </th>
//                   <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-tertiary)]">
//                     Amount
//                   </th>
//                   <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-tertiary)]">
//                     Remark
//                   </th>
//                   <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-tertiary)]">
//                     Next Renew In
//                   </th>
//                   <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-tertiary)]">
//                     Today's Date
//                   </th>
//                   <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-tertiary)]">
//                     Status
//                   </th>
//                   <th className="text-right py-3 px-4 text-sm font-medium text-[var(--text-tertiary)] w-[120px]">
//                     Actions
//                   </th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {filteredData.map((item, index) => (
//                   <tr
//                     key={item.id}
//                     className="border-b border-[rgba(255,255,255,var(--glass-border-opacity))] hover:bg-[rgba(255,255,255,var(--ui-opacity-5))] transition-colors"
//                   >
//                     <td className="py-3 px-4">
//                       <input
//                         type="checkbox"
//                         checked={selectedItems.includes(item.id)}
//                         onChange={(e) => handleSelectItem(item.id, e.target.checked)}
//                         className="w-4 h-4 rounded border-[rgba(255,255,255,var(--glass-border-opacity))] bg-[rgba(255,255,255,var(--ui-opacity-10))] text-[var(--theme-primary)] focus:ring-[var(--theme-primary)]"
//                       />
//                     </td>
//                     <td className="py-3 px-4 text-sm text-[var(--text-secondary)]">
//                       {index + 1}
//                     </td>
//                     <td className="py-3 px-4">
//                       <div className="flex items-center gap-2">
//                         <Package className="w-4 h-4 text-[var(--text-muted)]" />
//                         <span className="text-sm text-white font-medium">{item.product}</span>
//                       </div>
//                     </td>
//                     <td className="py-3 px-4">
//                       <div className="flex items-center gap-2">
//                         <Calendar className="w-4 h-4 text-[var(--text-muted)]" />
//                         <span className="text-sm text-[var(--text-secondary)]">
//                           {new Date(item.renewalDate).toLocaleDateString()}
//                         </span>
//                       </div>
//                     </td>
//                     <td className="py-3 px-4">
//                       <div className="flex items-center gap-2">
//                         <DollarSign className="w-4 h-4 text-[var(--text-muted)]" />
//                         <span className="text-sm text-[var(--text-secondary)]">
//                           {formatCurrency(item.amount)}
//                         </span>
//                       </div>
//                     </td>
//                     <td className="py-3 px-4">
//                       <div className="flex items-center gap-2">
//                         <MessageSquare className="w-4 h-4 text-[var(--text-muted)]" />
//                         <span className="text-sm text-[var(--text-secondary)] max-w-[150px] truncate">
//                           {item.remark}
//                         </span>
//                       </div>
//                     </td>
//                     <td className="py-3 px-4">
//                       <div className="flex items-center gap-2">
//                         <Clock className={`w-4 h-4 ${
//                           item.nextRenewIn < 0 ? 'text-red-400' :
//                           item.nextRenewIn <= 7 ? 'text-yellow-400' :
//                           'text-green-400'
//                         }`} />
//                         <span className={`text-sm font-medium ${
//                           item.nextRenewIn < 0 ? 'text-red-400' :
//                           item.nextRenewIn <= 7 ? 'text-yellow-400' :
//                           'text-green-400'
//                         }`}>
//                           {item.nextRenewIn >= 0 ? `${item.nextRenewIn} days` : `${Math.abs(item.nextRenewIn)} days ago`}
//                         </span>
//                       </div>
//                     </td>
//                     <td className="py-3 px-4">
//                       <span className="text-sm text-[var(--text-secondary)]">
//                         {new Date(item.todayDate).toLocaleDateString()}
//                       </span>
//                     </td>
//                     <td className="py-3 px-4">
//                       <div className="flex items-center gap-2">
//                         <span className={getStatusColor(item.status)}>
//                           {getStatusIcon(item.status)}
//                         </span>
//                         <span className={`text-sm font-medium ${getStatusColor(item.status)}`}>
//                           {item.status}
//                         </span>
//                       </div>
//                     </td>
//                     <td className="py-3 px-4">
//                       <div className="flex items-center justify-end gap-2">
//                         <button
//                           onClick={() => handleEdit(item)}
//                           className="p-2 rounded-lg hover:bg-[rgba(255,255,255,var(--ui-opacity-10))] transition-colors"
//                           title="Edit"
//                         >
//                           <Edit className="w-4 h-4 text-[var(--text-tertiary)]" />
//                         </button>
//                         <button
//                           onClick={() => handleDelete(item.id)}
//                           className="p-2 rounded-lg hover:bg-red-500/20 transition-colors"
//                           title="Delete"
//                         >
//                           <Trash2 className="w-4 h-4 text-red-400" />
//                         </button>
//                       </div>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>

//           {/* Selected Items Info */}
//           {selectedItems.length > 0 && (
//             <div className="mt-4 p-3 bg-[rgba(255,255,255,var(--ui-opacity-5))] rounded-lg border border-[rgba(255,255,255,var(--glass-border-opacity))]">
//               <span className="text-sm text-[var(--text-secondary)]">
//                 {selectedItems.length} subscription{selectedItems.length > 1 ? 's' : ''} selected
//               </span>
//             </div>
//           )}

//           {filteredData.length === 0 && (
//             <div className="text-center py-8">
//               <span className="text-[var(--text-muted)]">No subscriptions found</span>
//             </div>
//           )}
//         </GlassCard>
//       </div>

//       {/* Add/Edit Modal */}
//       <GlassModal
//         isOpen={isModalOpen}
//         onClose={() => setIsModalOpen(false)}
//         title={editingSubscription ? "Edit Subscription" : "Add New Subscription"}
//         size="lg"
//       >
//         <div className="space-y-4">
//           <div>
//             <label className="block text-[var(--text-tertiary)] text-sm mb-2">Product Name</label>
//             <GlassInput
//               placeholder="Enter product name"
//               value={formData.product}
//               onChange={(e) => setFormData({ ...formData, product: e.target.value })}
//             />
//           </div>

//           <div>
//             <label className="block text-[var(--text-tertiary)] text-sm mb-2">Renewal Date</label>
//             <GlassInput
//               type="date"
//               value={formData.renewalDate}
//               onChange={(e) => setFormData({ ...formData, renewalDate: e.target.value })}
//             />
//           </div>

//           <div>
//             <label className="block text-[var(--text-tertiary)] text-sm mb-2">Amount</label>
//             <GlassInput
//               type="number"
//               placeholder="Enter amount"
//               value={formData.amount}
//               onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
//               min="0"
//               step="0.01"
//             />
//           </div>

//           <div>
//             <label className="block text-[var(--text-tertiary)] text-sm mb-2">Remark</label>
//             <textarea
//               placeholder="Enter any remarks or notes"
//               value={formData.remark}
//               onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
//               className="w-full px-4 py-2 bg-[rgba(255,255,255,var(--ui-opacity-10))] border border-[rgba(255,255,255,var(--glass-border-opacity))] rounded-lg text-white placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent resize-none"
//               rows={3}
//             />
//           </div>

//           {/* Display-only fields (not editable in form) */}
//           <div className="pt-4 border-t border-[rgba(255,255,255,var(--glass-border-opacity))]">
//             <h4 className="text-sm font-medium text-[var(--text-tertiary)] mb-3">Auto-generated Information</h4>
//             <div className="grid grid-cols-2 gap-4 text-sm">
//               <div className="space-y-1">
//                 <div className="text-[var(--text-muted)]">Next Renew In</div>
//                 <div className="text-white">
//                   {formData.renewalDate ?
//                     (() => {
//                       const today = new Date()
//                       const renewal = new Date(formData.renewalDate)
//                       const days = calculateDaysBetween(today, renewal)
//                       return days >= 0 ? `${days} days` : `${Math.abs(days)} days ago`
//                     })()
//                     : '-- days'
//                   }
//                 </div>
//               </div>
//               <div className="space-y-1">
//                 <div className="text-[var(--text-muted)]">Today's Date</div>
//                 <div className="text-white">{getTodayDate()}</div>
//               </div>
//               <div className="space-y-1">
//                 <div className="text-[var(--text-muted)]">Status</div>
//                 <div className="text-white">
//                   {formData.renewalDate ?
//                     (() => {
//                       const status = calculateStatus(formData.renewalDate)
//                       return <span className={getStatusColor(status)}>{status}</span>
//                     })()
//                     : '--'
//                   }
//                 </div>
//               </div>
//             </div>
//           </div>

//           <div className="flex gap-3 pt-6">
//             <GlassButton
//               variant="ghost"
//               className="flex-1"
//               onClick={() => setIsModalOpen(false)}
//             >
//               Cancel
//             </GlassButton>
//             <GlassButton
//               variant="primary"
//               className="flex-1"
//               onClick={handleSubmit}
//               disabled={!formData.product || !formData.renewalDate || !formData.amount}
//             >
//               {editingSubscription ? "Save Changes" : "Add Subscription"}
//             </GlassButton>
//           </div>
//         </div>
//       </GlassModal>
//     </div>
//   )
// }
