"use client";

import { useState, useEffect, useRef } from "react";
import { Header } from "@/components/layout";
import { GlassCard, GlassButton } from "@/components/glass";
import { DeleteConfirmationModal } from "@/common/services/DeleteConfirmationModal";
import { useDetailsModal } from "@/hooks/useDetailsModal";
import DynamicDetailsPage from "../categaries-details/[id]/page";
import {
  Edit,
  Trash2,
  Search,
  Plus,
  Calendar,
  User,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Hash,
  Save,
  X,
  Loader2,
  LucideChartColumnStacked,
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

interface CounterRecord {
  id: number;
  client_name: string | null;
  client_id?: number;
  product_name: string;
  product_id?: number;
  vendor_name: string;
  vendor_id?: number;
  counter_count: number;
  valid_till: string;
  days_to_expire: number;
  today_date: string;
  status: 0 | 1;
  remarks: string;
  updated_at: string;
  created_at: string;
  latest_remark?: {
    id: number;
    remark: string;
  };
}

interface AddEditCounter {
  record_type: 6;
  id?: number;
  s_id: number;
  product_id: number;
  vendor_id: number;
  client_id: number;
  counter_count: number;
  valid_till: string;
  status: 0 | 1;
  remarks: string;
  remark_id: number;
}

export default function CounterPage() {
  const { user, getToken } = useAuth();
  const token = getToken();
  const navigationTabs = getNavigationByRole(user?.role);
  const { toast } = useToast();
  const router = useRouter();
  const { isOpen, modalData, openDetails, closeDetails } = useDetailsModal();
  const [exportLoading, setExportLoading] = useState(false);
  const [data, setData] = useState<CounterRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [addingNew, setAddingNew] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);

  const [newRecordData, setNewRecordData] = useState({
    client_id: null as number | null,
    client_name: "",
    product_id: null as number | null,
    vendor_id: null as number | null,
    product_name: "",
    counter_count: "",
    valid_till: "",
    status: "1" as "1" | "0",
    remarks: "",
  });

  const [editData, setEditData] = useState<
    Record<number, Partial<CounterRecord>>
  >({});
  // const {user, getToken } = useAuth()
  // const token = getToken();
  const [pagination, setPagination] = useState({
    page: 0,
    rowsPerPage: 10,
    orderBy: "id" as "id" | "valid_till" | "client_name" | "product_name",
    orderDir: "desc" as "asc" | "desc",
  });

  const [totalItems, setTotalItems] = useState(0);

  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const isMountedRef = useRef(true);

  // Handle row click to open details modal
  const handleRowClick = (e: React.MouseEvent, item: CounterRecord) => {
    // Prevent click if clicking on checkbox, button, or editing
    if (
      (e.target as HTMLElement).closest('input[type="checkbox"]') ||
      (e.target as HTMLElement).closest("button") ||
      editingId === item.id
    ) {
      return;
    }

    // Check if we have the necessary data for opening details
    if (!item.product_id) {
      // Try to find product_id from the item or use item.id as fallback
      if (!item.id) {
        toast({
          title: "Error",
          description: "Product ID not found",
          variant: "destructive",
        });
        return;
      }

      // Open details modal with product/category ID
      // For counters, you might want to use a different recordType
      // Assuming recordType 1 is for products/categories, adjust if needed
      openDetails(1, item.id, item.product_name || "Counter");
    } else {
      // Open details modal with product/category ID
      openDetails(1, item.product_id, item.product_name);
    }
  };

  // Fetch counter records
  const fetchCounterRecords = async () => {
    if (!isMountedRef.current) return;

    try {
      setLoading(true);

      const response = await apiService.listRecords(
        {
          record_type: 6, // Counter records
          search: searchQuery,
          page: pagination.page,
          rowsPerPage: pagination.rowsPerPage,
          orderBy: pagination.orderBy,
          orderDir: pagination.orderDir,
        },
        user,
        token,
      );

      if (isMountedRef.current) {
        if (response.status) {
          setData(response.data || []);
          setTotalItems(response.total || 0);
        } else {
          toast({
            title: "Error",
            description: response.message || "Failed to fetch counter records",
            variant: "destructive",
          });
        }
      }
    } catch (error: any) {
      console.error("Error fetching counter records:", error);

      if (isMountedRef.current) {
        toast({
          title: "Error",
          description:
            error.response?.data?.message || "Failed to fetch counter records",
          variant: "destructive",
        });
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    fetchCounterRecords();

    return () => {
      isMountedRef.current = false;
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isMountedRef.current) return;

    const timeoutId = setTimeout(() => {
      fetchCounterRecords();
    }, 300);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [pagination.page, pagination.orderBy, pagination.orderDir, searchQuery]);

  // Handle Add New
  const handleAddNew = () => {
    const today = new Date().toISOString().split("T")[0];
    setAddingNew(true);
    setNewRecordData({
      client_id: null,
      client_name: "",
      product_id: null,
      vendor_id: null,
      product_name: "",
      counter_count: "",
      valid_till: today,
      status: "1",
      remarks: "",
    });
  };

  // Cancel Add New
  const handleCancelAdd = () => {
    setAddingNew(false);
    setNewRecordData({
      client_id: null,
      client_name: "",
      product_id: null,
      vendor_id: null,
      product_name: "",
      counter_count: "",
      valid_till: "",
      status: "1",
      remarks: "",
    });
  };

  // Save New Record
  const handleSaveNew = async () => {
    try {
      setIsSaving(true);

      if (
        !newRecordData.client_id ||
        !newRecordData.product_id ||
        !newRecordData.counter_count ||
        !newRecordData.vendor_id ||
        !newRecordData.valid_till
      ) {
        toast({
          title: "Error",
          description: "Please fill all required fields",
          variant: "destructive",
        });
        return;
      }

      const payload: AddEditCounter = {
        record_type: 6,
        s_id: user?.id,
        product_id: newRecordData.product_id!,
        vendor_id: newRecordData.vendor_id!,
        client_id: newRecordData.client_id!,
        counter_count: parseInt(newRecordData.counter_count),
        valid_till: newRecordData.valid_till,
        status: parseInt(newRecordData.status) as 0 | 1,
        remarks: newRecordData.remarks,
      };
      (user, token);

      const response = await apiService.addRecord(payload as any, user, token);

      if (response.status) {
        toast({
          title: "Success",
          description: response.message || "Counter record added successfully",
          variant: "default",
        });
        setAddingNew(false);
        fetchCounterRecords();
        // Reset form
        setNewRecordData({
          client_id: null,
          client_name: "",
          product_id: null,
          vendor_id: null,
          product_name: "",
          counter_count: "",
          valid_till: new Date().toISOString().split("T")[0],
          status: "1",
          remarks: "",
        });
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to add counter record",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error adding counter record:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to add counter record",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Edit
  const handleEdit = (record: CounterRecord) => {
    setEditingId(record.id);
    setEditData({
      [record.id]: {
        ...record,
        client_id: record.client_id || undefined,
        product_id: record.product_id || undefined,
        vendor_id: record.vendor_id || undefined,
        counter_count: record.counter_count || 0,
        valid_till: record.valid_till || "",
        remarks: record.remarks || "",
        remark_id: record.latest_remark?.id || null,
        status: record.status?.toString() || "1",
      },
    });
  };

  // Handle Save (inline editing)
  const handleSave = async (id: number) => {
    try {
      setIsSaving(true);
      const updatedData = editData[id];

      if (!updatedData) return;
      console.log(updatedData);
      if (
        !updatedData.client_id ||
        !updatedData.product_id ||
        !updatedData.counter_count ||
        !updatedData.vendor_id ||
        !updatedData.valid_till
      ) {
        toast({
          title: "Error",
          description: "Please fill all required fields",
          variant: "destructive",
        });
        return;
      }

      const payload: AddEditCounter = {
        record_type: 6,
        id,
        s_id: user?.id || 6,
        product_id: updatedData.product_id!,
        vendor_id: updatedData.vendor_id!,
        client_id: updatedData.client_id!,
        counter_count: updatedData.counter_count || 0,
        valid_till: updatedData.valid_till!,
        status: updatedData.status ?? 1,
        remarks: updatedData.remarks || "",
        remark_id: updatedData.remark_id || null,
      };

      const response = await apiService.editRecord(payload as any, user, token);

      if (response.success || response.status) {
        toast({
          title: "Success",
          description:
            response.message || "Counter record updated successfully",
          variant: "default",
        });
        setEditingId(null);
        setEditData({});
        fetchCounterRecords();
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to update counter record",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error updating counter record:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to update counter record",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

      const handleExport = async () => {
        try {
          setExportLoading(true);
    
          const payload: AddEditCounter = {
            record_type: 6,
            s_id: user?.id || 0,
          };
    
          const response = await apiService.exportRecord(payload,user,token);
    
          if (response.success) {
            toast({
              title: "Success",
              description: response.message || "Counter exported successfully",
              variant: "default",
            });
            downloadBase64File(response.data.base64, response.data.filename);
          } else {
            toast({
              title: "Error",
              description: response.message || "Failed to export counter",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error("Error exporting counter:", error);
          toast({
            title: "Error",
            description: "Failed to export counter",
            variant: "destructive",
          });
        } finally {
          setExportLoading(false);
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
    field: keyof CounterRecord,
    value: any,
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
    value: any,
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
        description: "Please select at least one counter record",
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

      const response = await apiService.deleteRecords(
        idsToDelete,
        6,
        user,
        token,
      );

      if (response.success || response.status) {
        const successMessage =
          response.message ||
          (idsToDelete.length === 1
            ? "Counter record deleted successfully"
            : `${idsToDelete.length} counter record(s) deleted successfully`);

        toast({
          title: "Success",
          description: successMessage,
          variant: "default",
        });

        setSelectedItems([]);
        setItemToDelete(null);
        fetchCounterRecords();
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to delete counter record(s)",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error deleting:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to delete counter record(s)",
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

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  // Calculate days until expiry
  const calculateDays = (validityDate: string) => {
    try {
      const today = new Date();
      const expiry = new Date(validityDate);
      const diffTime = expiry.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch {
      return 0;
    }
  };

  const handleViewDetails = (item: CounterRecord) => {
    if (!item.id) {
      toast({
        title: "Error",
        description: "Product ID not found",
        variant: "destructive",
      });
      return;
    }

    // Redirect to details page with recordType and recordId
    router.push(`/${user?.role}/categaries-details/${item.id}?recordType=6`);
  };

  // Get count color based on value
  const getCountColor = (count: number) => {
    if (count === 0) return "text-red-400";
    if (count < 10) return "text-yellow-400";
    return "text-green-400";
  };

  const startItem = pagination.page * pagination.rowsPerPage + 1;

  return (
    <div className="min-h-screen pb-8">
      <Header title="Counter Management" tabs={navigationTabs} />

      <div className="px-4 sm:px-6 mt-6">
        <GlassCard className="p-6 backdrop-blur-xl bg-gradient-to-br from-gray-900/80 via-black/80 to-gray-900/80 border border-white/10 shadow-2xl">
          {/* Header with Search and Add Button */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <LucideChartColumnStacked className="w-6 h-6 text-[#CB8959]" />
                <h2 className="text-xl font-semibold text-white">Counters</h2>
              </div>
              <p className="text-sm text-gray-400 mt-1">
                Manage your counters and track their usage
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search counters..."
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
                    Add Counter
                  </GlassButton>
                )}
                 <GlassButton
                    variant="primary"
                    onClick={handleExport}
                    className="flex items-center gap-2"
                    disabled={exportLoading}
                  >
                    Export
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
                      Client
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 min-w-[180px]">
                      Product
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 min-w-[180px]">
                      Vendor
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 min-w-[100px]">
                      Count
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 min-w-[140px]">
                      Validity Date
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 min-w-[140px]">
                      Days to Expire
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 min-w-[140px]">
                      Today's Date
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 min-w-[120px]">
                      Status
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 min-w-[180px]">
                      Remarks
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 min-w-[180px]">
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
                      <td colSpan={12} className="text-center">
                        <div className="flex flex-col items-center justify-center">
                          <DashboardLoader label="Loading counter records..." />
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
                            <ApiDropdown
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
                                  option?.value ?? null,
                                );
                                handleNewRecordChange(
                                  "client_name",
                                  option?.label ?? "",
                                );
                              }}
                              placeholder="Client"
                              className="min-h-[32px]"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <ApiDropdown
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
                                  option?.value ?? null,
                                );
                                handleNewRecordChange(
                                  "product_name",
                                  option?.label ?? "",
                                );
                              }}
                              placeholder="Product"
                              className="min-h-[32px]"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <ApiDropdown
                              endpoint="get-venders"
                              value={
                                newRecordData.vendor_id
                                  ? {
                                      value: newRecordData.vendor_id,
                                      label: newRecordData.vendor_name,
                                    }
                                  : null
                              }
                              onChange={(option) => {
                                handleNewRecordChange(
                                  "vendor_id",
                                  option?.value ?? null,
                                );
                                handleNewRecordChange(
                                  "vendor_name",
                                  option?.label ?? "",
                                );
                              }}
                              placeholder="Vender"
                              className="min-h-[32px]"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="number"
                              value={newRecordData.counter_count}
                              onChange={(e) =>
                                handleNewRecordChange(
                                  "counter_count",
                                  e.target.value,
                                )
                              }
                              className="w-full px-2 py-1 bg-white/5 border border-blue-500/30 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/30 backdrop-blur-sm"
                              style={{ minHeight: "32px" }}
                              min="0"
                              placeholder="0"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="date"
                              value={newRecordData.valid_till}
                              onChange={(e) =>
                                handleNewRecordChange(
                                  "valid_till",
                                  e.target.value,
                                )
                              }
                              className="w-full px-2 py-1 bg-white/5 border border-blue-500/30 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/30 backdrop-blur-sm"
                              style={{ minHeight: "32px" }}
                            />
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="number"
                              value={calculateDays(newRecordData.valid_till)}
                              readOnly
                              className="w-full px-2 py-1 bg-white/10 border border-white/10 rounded text-gray-400 text-xs cursor-not-allowed"
                              style={{ minHeight: "32px" }}
                            />
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-300">
                            <input
                              type="date"
                              value={new Date().toISOString().split("T")[0]}
                              readOnly
                              className="w-full px-2 py-1 bg-white/10 border border-white/10 rounded text-gray-400 text-sm cursor-not-allowed"
                              style={{ minHeight: "32px" }}
                            />
                          </td>
                          <td className="py-3 px-4">
                            <div className="w-40">
                              <GlassSelect
                                options={[
                                  { value: "1", label: "Active" },
                                  { value: "0", label: "Inactive" },
                                ]}
                                value={
                                  [
                                    { value: "1", label: "Active" },
                                    { value: "0", label: "Inactive" },
                                  ].find(
                                    (opt) => opt.value === newRecordData.status,
                                  ) || null
                                }
                                onChange={(selected: any) =>
                                  handleNewRecordChange(
                                    "status",
                                    selected?.value as "1" | "0",
                                  )
                                }
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
                            {"- -"}
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
                          <td colSpan={12} className="py-8 text-center">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <LucideChartColumnStacked className="w-12 h-12 text-gray-400" />
                              <span className="text-gray-400">
                                No counter records found
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
                                  <ApiDropdown
                                    endpoint="get-clients"
                                    value={
                                      editData[item.id]?.client_id
                                        ? {
                                            value:
                                              editData[item.id]?.client_id!,
                                            label:
                                              editData[item.id]?.client_name ||
                                              "",
                                          }
                                        : null
                                    }
                                    onChange={(option) => {
                                      handleEditChange(
                                        item.id,
                                        "client_id",
                                        option?.value ?? null,
                                      );
                                      handleEditChange(
                                        item.id,
                                        "client_name",
                                        option?.label ?? "",
                                      );
                                    }}
                                    placeholder="Client"
                                    className="min-h-[32px]"
                                  />
                                </td>
                                <td className="py-3 px-4">
                                  <ApiDropdown
                                    endpoint="get-products"
                                    value={
                                      editData[item.id]?.product_id
                                        ? {
                                            value:
                                              editData[item.id]?.product_id!,
                                            label:
                                              editData[item.id]?.product_name ||
                                              "",
                                          }
                                        : null
                                    }
                                    onChange={(option) => {
                                      handleEditChange(
                                        item.id,
                                        "product_id",
                                        option?.value ?? null,
                                      );
                                      handleEditChange(
                                        item.id,
                                        "product_name",
                                        option?.label ?? "",
                                      );
                                    }}
                                    placeholder="Product"
                                    className="min-h-[32px]"
                                  />
                                </td>
                                <td className="py-3 px-4">
                                  <ApiDropdown
                                    endpoint="get-venders"
                                    value={
                                      editData[item.id]?.vendor_id
                                        ? {
                                            value:
                                              editData[item.id]?.vendor_id!,
                                            label:
                                              editData[item.id]?.vendor_name ||
                                              "",
                                          }
                                        : null
                                    }
                                    onChange={(option) => {
                                      handleEditChange(
                                        item.id,
                                        "vendor_id",
                                        option?.value ?? null,
                                      );
                                      handleEditChange(
                                        item.id,
                                        "vendor_name",
                                        option?.label ?? "",
                                      );
                                    }}
                                    placeholder="Vender"
                                    className="min-h-[32px]"
                                  />
                                </td>
                                <td className="py-3 px-4">
                                  <input
                                    type="number"
                                    value={
                                      editData[item.id]?.counter_count ||
                                      item.counter_count
                                    }
                                    onChange={(e) =>
                                      handleEditChange(
                                        item.id,
                                        "counter_count",
                                        parseInt(e.target.value),
                                      )
                                    }
                                    className="w-full px-2 py-1 bg-white/5 border border-blue-500/30 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/30 backdrop-blur-sm"
                                    style={{ minHeight: "32px" }}
                                    min="0"
                                  />
                                </td>
                                <td className="py-3 px-4">
                                  <input
                                    type="date"
                                    value={
                                      editData[item.id]?.valid_till ||
                                      item.valid_till
                                    }
                                    onChange={(e) =>
                                      handleEditChange(
                                        item.id,
                                        "valid_till",
                                        e.target.value,
                                      )
                                    }
                                    className="w-full px-2 py-1 bg-white/5 border border-blue-500/30 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/30 backdrop-blur-sm"
                                    style={{ minHeight: "32px" }}
                                  />
                                </td>
                                <td className="py-3 px-4">
                                  <input
                                    type="number"
                                    value={calculateDays(
                                      editData[item.id]?.valid_till ||
                                        item.valid_till,
                                    )}
                                    readOnly
                                    className="w-full px-2 py-1 bg-white/10 border border-white/10 rounded text-gray-400 text-xs cursor-not-allowed"
                                    style={{ minHeight: "32px" }}
                                  />
                                </td>
                                <td className="py-3 px-4 text-sm text-gray-300">
                                  <input
                                    type="date"
                                    value={
                                      item.today_date ||
                                      new Date().toISOString().split("T")[0]
                                    }
                                    readOnly
                                    className="w-full px-2 py-1 bg-white/10 border border-white/10 rounded text-gray-400 text-sm cursor-not-allowed"
                                    style={{ minHeight: "32px" }}
                                  />
                                </td>
                                <td className="py-3 px-4">
                                  <div className="w-40">
                                    <GlassSelect
                                      options={[
                                        { value: "1", label: "Active" },
                                        { value: "0", label: "Inactive" },
                                      ]}
                                      value={
                                        [
                                          { value: "1", label: "Active" },
                                          { value: "0", label: "Inactive" },
                                        ].find(
                                          (opt) =>
                                            opt.value ===
                                            editData[item.id]?.status,
                                        ) || null
                                      }
                                      onChange={(selected: any) =>
                                        handleEditChange(
                                          item.id,
                                          "status",
                                          selected?.value as "1" | "0",
                                        )
                                      }
                                      isSearchable={false}
                                      isClearable
                                      styles={glassSelectStyles}
                                    />
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <input
                                    type="text"
                                    value={
                                      editData[item.id]?.remarks ||
                                      item?.latest_remark?.remark ||
                                      ""
                                    }
                                    onChange={(e) =>
                                      handleEditChange(
                                        item.id,
                                        "remarks",
                                        e.target.value,
                                      )
                                    }
                                    className="w-full px-2 py-1 bg-white/5 border border-blue-500/30 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/30 backdrop-blur-sm"
                                    style={{ minHeight: "32px" }}
                                    placeholder="Add remarks"
                                  />
                                </td>
                                <td className="py-3 px-4 text-sm text-gray-300">
                                  {item?.updated_at}
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-2">
                                    <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                    <span className="text-sm text-white font-medium">
                                      {item.client_name || "N/A"}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-2">
                                    <Package className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                    <span className="text-sm text-white font-medium">
                                      {item.product_name}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-white font-medium">
                                      {item.vendor_name}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <div
                                    className={`flex items-center gap-2 ${getCountColor(item.counter_count)}`}
                                  >
                                    <Hash className="w-4 h-4" />
                                    <span className="text-sm font-bold">
                                      {item.counter_count}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-sm text-gray-300">
                                  <div className="flex items-center gap-2">
                                    {formatDate(item.valid_till)}
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <div
                                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm border ${
                                      calculateDays(item.valid_till) < 0
                                        ? "bg-red-500/20 text-red-400 border-red-500/20"
                                        : calculateDays(item.valid_till) <= 30
                                          ? "bg-orange-500/20 text-orange-400 border-orange-500/20"
                                          : "bg-green-500/20 text-green-400 border-green-500/20"
                                    }`}
                                  >
                                    {calculateDays(item.valid_till)} days
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-sm text-gray-300">
                                  {formatDate(item.today_date)}
                                </td>
                                <td className="py-3 px-4">
                                  <div
                                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm border ${getStatusColor(item.status)} ${
                                      item.status === 1
                                        ? "bg-green-500/20 border-green-500/20"
                                        : "bg-red-500/20 border-red-500/20"
                                    }`}
                                  >
                                    {getStatusIcon(item.status)}
                                    {getStatusText(item.status)}
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-300 truncate max-w-[180px]">
                                      {item?.latest_remark?.remark ||
                                        "No remarks"}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-sm text-gray-300 whitespace-nowrap">
                                  {item.updated_at}
                                </td>
                              </>
                            )}

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
                  {selectedItems.length} counter record
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
          itemToDelete
            ? "Delete Counter Record"
            : "Delete Multiple Counter Records"
        }
        message={
          itemToDelete
            ? "Are you sure you want to delete this counter record? This action cannot be undone."
            : "Are you sure you want to delete the selected counter records? This action cannot be undone."
        }
      />

      {/* Details Modal */}
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
