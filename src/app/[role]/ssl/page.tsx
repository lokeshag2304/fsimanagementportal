// src/app/[role]/ssl/page.tsx
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
  Globe,
  User,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Save,
  X,
  Shield,
  DollarSign,
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

interface SSLRecord {
  id: number;
  s_id: number;
  expiry_date: string;
  days_to_expire_today: number;
  today_date: string;
  status: 0 | 1;
  updated_at_custom: string;
  created_at: string;
  updated_at: string;
  domain_id: number | null;
  domain_name: string;
  client_id: number | null;
  client_name: string;
  product_id: number | null;
  vendor_id: number | null;
  vendor_name: string;
  product_name: string;
  renewal_date: string;
  amount: number | null;
  remarks: string;
  remark_id: number | null;
  latest_remark?: {
    id: number;
    remark: string;
  };
}

interface AddEditSSL {
  record_type: 2;
  id?: number;
  s_id: number;
  product_id: number;
  vendor_id: number;
  domain_id: number;
  client_id: number;
  amount: number;
  renewal_date: string;
  expiry_date: string;
  status: 0 | 1;
  updated_at_custom: string;
  remarks: string;
  remark_id: number;
}

function useDebounce<T>(value: T, delay = 400): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

export default function SSLPage() {
  const { user, getToken } = useAuth();
  const token = getToken();
  const [exportLoading, setExportLoading] = useState(false);
  const navigationTabs = getNavigationByRole(user?.role);
  const { toast } = useToast();
  const router = useRouter();

  const [data, setData] = useState<SSLRecord[]>([]);
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
    domain_id: null as number | null,
    domain_name: "",
    client_id: null as number | null,
    client_name: "",
    product_id: null as number | null,
    vendor_id: null as number | null,
    product_name: "",
    amount: "",
    renewal_date: "",
    expiry_date: "",
    status: "1" as "1" | "0",
    remarks: "",
    updated_at_custom: new Date().toISOString().split("T")[0],
  });

  const [editData, setEditData] = useState<Record<number, Partial<SSLRecord>>>(
    {},
  );

  const [pagination, setPagination] = useState({
    page: 0,
    rowsPerPage: 10,
    orderBy: "id" as "id" | "expiry_date" | "domain_name" | "product_name",
    orderDir: "desc" as "asc" | "desc",
  });

  const debouncedSearchQuery = useDebounce(searchQuery, 400);
  const [totalItems, setTotalItems] = useState(0);

  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Fetch SSL records
  const fetchSSLRecords = async () => {
    try {
      setLoading(true);

      const response = await apiService.listRecords(
        {
          record_type: 2, // SSL
          search: debouncedSearchQuery,
          page: pagination.page,
          rowsPerPage: pagination.rowsPerPage,
          orderBy: pagination.orderBy,
          orderDir: pagination.orderDir,
        },
        user,
        token,
      );

      if (response.status) {
        setData(response.data || []);
        setTotalItems(response.total || 0);
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to fetch SSL records",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching SSL records:", error);
      toast({
        title: "Error",
        description: "Failed to fetch SSL records",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSSLRecords();
  }, [
    pagination.page,
    pagination.orderBy,
    pagination.orderDir,
    debouncedSearchQuery,
  ]);

  // Handle Add New
  const handleAddNew = () => {
    setAddingNew(true);
    setNewRecordData({
      domain_id: null,
      domain_name: "",
      client_id: null,
      client_name: "",
      product_id: null,
      vendor_id: null,
      product_name: "",
      amount: "",
      renewal_date: "",
      expiry_date: "",
      status: "1",
      remarks: "",
      updated_at_custom: new Date().toISOString().split("T")[0],
    });
  };

  // Cancel Add New
  const handleCancelAdd = () => {
    setAddingNew(false);
  };

  // Save New Record
  const handleSaveNew = async () => {
    try {
      setIsSaving(true);

      if (
        !newRecordData.domain_id ||
        !newRecordData.client_id ||
        !newRecordData.product_id ||
        !newRecordData.vendor_id ||
        // !newRecordData.renewal_date ||
        !newRecordData.expiry_date
      ) {
        toast({
          title: "Error",
          description: "Please fill all required fields",
          variant: "destructive",
        });
        return;
      }

      const payload: AddEditSSL = {
        record_type: 2,
        s_id: user?.id || 0,
        product_id: newRecordData.product_id!,
        vendor_id: newRecordData.vendor_id!,
        domain_id: newRecordData.domain_id!,
        client_id: newRecordData.client_id!,
        amount: parseFloat(newRecordData.amount) || 0,
        renewal_date: newRecordData.renewal_date,
        expiry_date: newRecordData.expiry_date,
        status: parseInt(newRecordData.status) as 0 | 1,
        remarks: newRecordData.remarks,
        updated_at_custom: newRecordData.updated_at_custom,
      };

      const response = await apiService.addRecord(payload as any, user, token);

      if (response.status) {
        toast({
          title: "Success",
          description: response.message || "SSL record added successfully",
          variant: "default",
        });
        setAddingNew(false);
        fetchSSLRecords();
        // Reset form
        setNewRecordData({
          domain_id: null,
          domain_name: "",
          client_id: null,
          client_name: "",
          product_id: null,
          vendor_id: null,
          product_name: "",
          amount: "",
          renewal_date: "",
          expiry_date: "",
          status: "1",
          remarks: "",
          updated_at_custom: new Date().toISOString().split("T")[0],
        });
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to add SSL record",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error adding SSL record:", error);
      toast({
        title: "Error",
        description: "Failed to add SSL record",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Edit
  const handleEdit = (record: SSLRecord) => {
    setEditingId(record.id);
    setEditData({
      [record.id]: {
        ...record,
        renewal_date: record.renewal_date || "",
        amount: record.amount || 0,
        remark_id: record?.latest_remark?.id || null,
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
        !updatedData.domain_id ||
        !updatedData.client_id ||
        !updatedData.product_id ||
        !updatedData.vendor_id ||
        // !updatedData.renewal_date ||
        !updatedData.expiry_date
      ) {
        toast({
          title: "Error",
          description: "Please fill all required fields",
          variant: "destructive",
        });
        return;
      }

      const payload: AddEditSSL = {
        record_type: 2,
        id,
        s_id: user?.id || 0,
        product_id: updatedData.product_id!,
        vendor_id: updatedData.vendor_id!,
        domain_id: updatedData.domain_id!,
        client_id: updatedData.client_id!,
        amount: updatedData.amount || 0,
        renewal_date: updatedData.renewal_date!,
        expiry_date: updatedData.expiry_date!,
        status: updatedData.status ?? 1,
        remarks: updatedData.remarks || "",
        remark_id: updatedData.remark_id || null,
        updated_at_custom: new Date().toISOString().split("T")[0], // Auto-update timestamp
      };

      const response = await apiService.editRecord(payload as any, user, token);

      if (response.status) {
        toast({
          title: "Success",
          description: response.message || "SSL record updated successfully",
          variant: "default",
        });
        setEditingId(null);
        setEditData({});
        fetchSSLRecords();
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to update SSL record",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating SSL record:", error);
      toast({
        title: "Error",
        description: "Failed to update SSL record",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

    const handleExport = async () => {
      try {
        setExportLoading(true);
  
        const payload: AddEditSSL = {
          record_type: 2,
          s_id: user?.id || 0,
        };
  
        const response = await apiService.exportRecord(payload,user,token);
  
        if (response.success) {
          toast({
            title: "Success",
            description: response.message || "SSL exported successfully",
            variant: "default",
          });
          downloadBase64File(response.data.base64, response.data.filename);
        } else {
          toast({
            title: "Error",
            description: response.message || "Failed to export ssl",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error exporting ssl:", error);
        toast({
          title: "Error",
          description: "Failed to export ssl",
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
  const handleEditChange = (id: number, field: keyof SSLRecord, value: any) => {
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
        description: "Please select at least one SSL record",
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
        2,
        user,
        token,
      );

      if (response.status) {
        toast({
          title: "Success",
          description: response.message || "Record(s) deleted successfully",
          variant: "default",
        });

        setSelectedItems([]);
        setItemToDelete(null);
        fetchSSLRecords();
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

  const handleViewDetails = (item: SSLRecord) => {
    if (!item.id) {
      toast({
        title: "Error",
        description: "Product ID not found",
        variant: "destructive",
      });
      return;
    }

    // Redirect to details page with recordType and recordId
    router.push(`/${user?.role}/categaries-details/${item.id}?recordType=2`);
  };

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const getExpiryStatus = (days: number) => {
    if (days < 0)
      return { color: "text-red-400", bg: "bg-red-500/20", text: "Expired" };
    if (days <= 30)
      return {
        color: "text-yellow-400",
        bg: "bg-yellow-500/20",
        text: "Warning",
      };
    return { color: "text-green-400", bg: "bg-green-500/20", text: "Active" };
  };

  const startItem = pagination.page * pagination.rowsPerPage + 1;

  const statusOptions = [
    { value: "1", label: "Active" },
    { value: "0", label: "Inactive" },
  ];

  const getSelectedStatusOption = () => {
    return (
      statusOptions.find((option) => option.value === newRecordData.status) ||
      null
    );
  };

  const handleStatusSelect = (selected: any) => {
    handleNewRecordChange("status", selected?.value as "1" | "0");
  };

  const getEditSelectedStatusOption = (id: number) => {
    const status =
      editData[id]?.status ?? data.find((d) => d.id === id)?.status;
    return statusOptions.find((opt) => opt.value === String(status)) || null;
  };

  const handleEditStatusSelect = (id: number, selected: any) => {
    handleEditChange(id, "status", selected ? Number(selected.value) : 1);
  };

  return (
    <div className="min-h-screen pb-8">
      <Header title="SSL Certificate Management" tabs={navigationTabs} />

      <div className="px-4 sm:px-6 mt-6">
        <GlassCard className="p-6 backdrop-blur-xl bg-gradient-to-br from-gray-900/80 via-black/80 to-gray-900/80 border border-white/10 shadow-2xl">
          {/* Header with Search and Add Button */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <Shield className="w-6 h-6 text-[#BA8969]" />
                <h2 className="text-xl font-semibold text-white">
                  SSL Certificates
                </h2>
              </div>
              <p className="text-sm text-gray-400 mt-1">
                Manage your SSL certificates and expiration dates
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search SSL certificates..."
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
                    Add SSL Certificate
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
                      Domain Name
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
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 min-w-[180px]">
                      Amount
                    </th>
                    {/* <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 min-w-[140px]">
                      Renewal Date
                    </th> */}
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 min-w-[140px]">
                      Renewal Date
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 min-w-[120px]">
                      Days to Expire
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 min-w-[120px]">
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
                      <td colSpan={13} className="py-8 text-center">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <DashboardLoader label="Fetching SSL Certificates..." />
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
                              endpoint="get-domains"
                              value={
                                newRecordData.domain_id
                                  ? {
                                      value: newRecordData.domain_id,
                                      label: newRecordData.domain_name,
                                    }
                                  : null
                              }
                              onChange={(option) => {
                                handleNewRecordChange(
                                  "domain_id",
                                  option?.value ?? null,
                                );
                                handleNewRecordChange(
                                  "domain_name",
                                  option?.label ?? "",
                                );
                              }}
                              placeholder="Domain"
                              className="min-h-[32px]"
                            />
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
                              placeholder="vendor"
                              className="min-h-[32px]"
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
                          {/* <td className="py-3 px-4">
                            <input
                              type="date"
                              value={newRecordData.renewal_date}
                              onChange={(e) =>
                                handleNewRecordChange(
                                  "renewal_date",
                                  e.target.value,
                                )
                              }
                              className="w-full px-2 py-1 bg-white/5 border border-blue-500/30 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/30 backdrop-blur-sm"
                              style={{ minHeight: "32px" }}
                            />
                          </td> */}
                          <td className="py-3 px-4">
                            <input
                              type="date"
                              value={newRecordData.expiry_date}
                              onChange={(e) =>
                                handleNewRecordChange(
                                  "expiry_date",
                                  e.target.value,
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
                              style={{ minHeight: "32px" }}
                            />
                          </td>
                          <td className="py-3 px-4">
                            <div className="w-40">
                              <GlassSelect
                                options={statusOptions}
                                value={getSelectedStatusOption()}
                                onChange={handleStatusSelect}
                                placeholder="Status"
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
                            {newRecordData?.updated_at
                              ? newRecordData?.updated_at
                              : "--"}
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
                          <td colSpan={13} className="py-8 text-center">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <Shield className="w-12 h-12 text-gray-400" />
                              <span className="text-gray-400">
                                No SSL certificates found
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

                            {/* Edit Mode */}
                            {editingId === item.id ? (
                              <>
                                {/* Domain */}
                                <td className="py-3 px-4">
                                  <ApiDropdown
                                    endpoint="get-domains"
                                    value={
                                      editData[item.id]?.domain_id
                                        ? {
                                            value:
                                              editData[item.id]?.domain_id!,
                                            label:
                                              editData[item.id]?.domain_name ||
                                              "",
                                          }
                                        : null
                                    }
                                    onChange={(option) => {
                                      handleEditChange(
                                        item.id,
                                        "domain_id",
                                        option?.value ?? null,
                                      );
                                      handleEditChange(
                                        item.id,
                                        "domain_name",
                                        option?.label ?? "",
                                      );
                                    }}
                                    placeholder="Domain"
                                    className="min-h-[32px]"
                                  />
                                </td>

                                {/* Client */}
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

                                {/* Product */}
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
                                    placeholder="Vendor"
                                    className="min-h-[32px]"
                                  />
                                </td>

                                {/* Amount */}
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
                                        parseFloat(e.target.value) || 0,
                                      )
                                    }
                                    className="w-full px-2 py-1 bg-white/5 border border-blue-500/30 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/30 backdrop-blur-sm"
                                    style={{ minHeight: "32px" }}
                                    min="0"
                                    step="0.01"
                                  />
                                </td>

                                {/* Renewal Date */}
                                {/* <td className="py-3 px-4">
                                  <input
                                    type="date"
                                    value={editData[item.id]?.renewal_date || item.renewal_date || ""}
                                    onChange={(e) =>
                                      handleEditChange(
                                        item.id,
                                        "renewal_date",
                                        e.target.value,
                                      )
                                    }
                                    className="w-full px-2 py-1 bg-white/5 border border-blue-500/30 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/30 backdrop-blur-sm"
                                    style={{ minHeight: "32px" }}
                                  />
                                </td> */}

                                {/* Expiry Date */}
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
                                        e.target.value,
                                      )
                                    }
                                    className="w-full px-2 py-1 bg-white/5 border border-blue-500/30 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/30 backdrop-blur-sm"
                                    style={{ minHeight: "32px" }}
                                  />
                                </td>

                                {/* Days to Expire (Read-only in edit mode) */}
                                <td className="py-3 px-4 text-xs text-gray-300">
                                  <div
                                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm border ${
                                      calculateDays(
                                        editData[item.id]?.expiry_date ||
                                          item.expiry_date,
                                      ) < 0
                                        ? "bg-red-500/20 text-red-400 border-red-500/20"
                                        : calculateDays(
                                              editData[item.id]?.expiry_date ||
                                                item.expiry_date,
                                            ) <= 30
                                          ? "bg-orange-500/20 text-orange-400 border-orange-500/20"
                                          : "bg-green-500/20 text-green-400 border-green-500/20"
                                    }`}
                                  >
                                    {calculateDays(
                                      editData[item.id]?.expiry_date ||
                                        item.expiry_date,
                                    )}{" "}
                                    days
                                  </div>
                                </td>

                                {/* Status */}
                                <td className="py-3 px-4">
                                  <div className="w-40">
                                    <GlassSelect
                                      options={statusOptions}
                                      value={getEditSelectedStatusOption(
                                        item.id,
                                      )}
                                      onChange={(selected) =>
                                        handleEditStatusSelect(
                                          item.id,
                                          selected,
                                        )
                                      }
                                      placeholder="Status"
                                      isSearchable={false}
                                      isClearable
                                      styles={glassSelectStyles}
                                    />
                                  </div>
                                </td>

                                {/* Remarks */}
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
                                        e.target.value,
                                      )
                                    }
                                    className="w-full px-2 py-1 bg-white/5 border border-blue-500/30 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/30 backdrop-blur-sm"
                                    style={{ minHeight: "32px" }}
                                  />
                                </td>

                                {/* Last Updated (Read-only) */}
                                <td className="py-3 px-4 text-sm text-gray-300">
                                  {item.updated_at}
                                </td>
                              </>
                            ) : (
                              /* View Mode */
                              <>
                                {/* Domain */}
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-2">
                                    <Globe className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                    <span className="text-sm text-white font-medium">
                                      {item.domain_name || "N/A"}
                                    </span>
                                  </div>
                                </td>

                                {/* Client */}
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-2">
                                    <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                    <span className="text-sm text-white font-medium">
                                      {item.client_name || "N/A"}
                                    </span>
                                  </div>
                                </td>

                                {/* Product */}
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
                                    <Package className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                    <span className="text-sm text-white font-medium">
                                      {item.vendor_name}
                                    </span>
                                  </div>
                                </td>

                                {/* Amount */}
                                <td className="py-3 px-4 text-sm text-gray-300">
                                  <div className="flex items-center gap-2">
                                    {item.amount || "0.00"}
                                  </div>
                                </td>

                                {/* Renewal Date */}
                                {/* <td className="py-3 px-4 text-sm text-gray-300">
                                  <div className="flex items-center gap-2">
                                    {item.renewal_date ? formatDate(item.renewal_date) : "N/A"}
                                  </div>
                                </td> */}

                                {/* Expiry Date */}
                                <td className="py-3 px-4 text-sm text-gray-300">
                                  <div className="flex items-center gap-2">
                                    {/* <Calendar className="w-4 h-4 text-gray-400" /> */}
                                    {formatDate(item.expiry_date)}
                                  </div>
                                </td>

                                {/* Days to Expire */}
                                <td className="py-3 px-4">
                                  <div
                                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm border ${
                                      calculateDays(item.expiry_date) < 0
                                        ? "bg-red-500/20 text-red-400 border-red-500/20"
                                        : calculateDays(item.expiry_date) <= 30
                                          ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/20"
                                          : "bg-green-500/20 text-green-400 border-green-500/20"
                                    }`}
                                  >
                                    {/* <Clock className="w-3 h-3" /> */}
                                    {calculateDays(item.expiry_date)} days
                                  </div>
                                </td>

                                {/* Status */}
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

                                {/* Remarks */}
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-2">
                                    {/* <AlertCircle className="w-4 h-4 text-gray-400 flex-shrink-0" /> */}
                                    <span className="text-sm text-gray-300 truncate max-w-[180px]">
                                      {item?.latest_remark?.remark}
                                    </span>
                                  </div>
                                </td>

                                {/* Last Updated */}
                                <td className="py-3 px-4 text-sm text-gray-300 whitespace-nowrap">
                                  {item.updated_at}
                                </td>
                              </>
                            )}

                            {/* Actions */}
                            <td className="py-3 px-4">
                              <div className="flex items-center justify-end gap-2">
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
                  {selectedItems.length} SSL certificate
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
            ? "Delete SSL Certificate"
            : "Delete Multiple SSL Certificates"
        }
        message={
          itemToDelete
            ? "Are you sure you want to delete this SSL certificate? This action cannot be undone."
            : "Are you sure you want to delete the selected SSL certificates? This action cannot be undone."
        }
      />
    </div>
  );
}