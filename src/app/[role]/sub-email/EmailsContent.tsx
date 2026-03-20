"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Header } from "@/components/layout";
import { GlassCard, GlassButton } from "@/components/glass";
import { DeleteConfirmationModal } from "@/common/services/DeleteConfirmationModal";
import { ImportModal } from "@/components/ImportModal";
import { HistoryModal } from "@/components/HistoryModal";
import {
  History, Upload,
  Edit,
  Trash2,
  Search,
  Plus,
  Calendar,
  Globe,
  User,
  Package,
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Hash,
  CreditCard,
  Loader2,
  Save,
  X,
  Eye,
  MessageSquare,
  ChevronDown,
} from "lucide-react";
import { RemarkHistory } from "@/components/RemarkHistory";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/useToast";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { apiService } from "@/common/services/apiService";
import Pagination from "@/common/Pagination";
import DashboardLoader, { downloadBase64File } from "@/common/DashboardLoader";
import { getNavigationByRole } from "@/lib/getNavigationByRole";
import { ApiDropdown, glassSelectStyles } from "@/common/DynamicDropdown";
import { GlassSelect } from "@/components/glass/GlassSelect";
import { normalizeEntityPayload } from "@/utils/normalizePayload";
import { emitEntityChange } from "@/lib/entityBus";
import { formatLastUpdated } from "@/utils/dateFormatter";
import { handleDateChangeLogic, getDaysToColor, calculateDueDate, calculateGraceDaysFromDate } from "@/utils/dateCalculations";

interface EmailRecord {
  remark_id?: number | null;

  id: number;
  client_name: string | null;
  client_id?: number;
  domain_name: string | null;
  domain_id?: number;
  product_name: string;
  product_id?: number;
  vendor_name: string;
  vendor_id?: number;
  quantity: number;
  bill_type: string;
  start_date: string;
  end_date: string;
  expiry_date: string;
  days_to_expire_today: number;
  today_date: string;
  status: 0 | 1;
  remarks: string;
  deletion_date?: string | null;
  days_to_delete?: number | null;
  created_at: string;
  updated_at: string;
  grace_period?: number;
  due_date?: string;
  latest_remark?: {
    id: number;
    remark: string;
  };
  has_remark_history?: boolean;
}

interface AddEditEmail {
  record_type: 5;
  id?: number;
  s_id: number;
  product_id: number;
  vendor_id: number;
  domain_id: number;
  client_id: number;
  quantity: number;
  bill_type: string;
  start_date: string;
  end_date: string;
  expiry_date: string;
  status: 0 | 1;
  remarks: string;
  remarks_id?: number;
  deletion_date?: string;
  days_to_delete?: number;
  grace_period?: number;
  due_date?: string;
}

export default function EmailsPage() {
  const { user, getToken } = useAuth();
  const token = getToken();
  console.log("Current user role:", user?.role);
  const isClient = user?.role === "ClientAdmin" || user?.login_type === 3;
  const navigationTabs = getNavigationByRole(user?.role);
  const { toast } = useToast();
  const router = useRouter();
  const [exportLoading, setExportLoading] = useState(false);
  const [data, setData] = useState<EmailRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [addingNew, setAddingNew] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [expandedRemarks, setExpandedRemarks] = useState<Set<number>>(new Set());
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);
  const [expandedRemarkId, setExpandedRemarkId] = useState<number | null>(null);

  const toggleRemarkHistory = (id: number) => {
    setExpandedRemarks(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const [highlightedRecordId, setHighlightedRecordId] = useState<number | null>(null);

  const [newRecordData, setNewRecordData] = useState({
    domain_id: null as number | null,
    domain_name: "",
    client_id: null as number | null,
    client_name: "",
    product_id: null as number | null,
    vendor_id: null as number | null,
    vendor_name: "",
    product_name: "",
    quantity: "",
    bill_type: "yearly",
    start_date: "",
    expiry_date: "",
    status: "1" as "1" | "0",
    remarks: "",
    deletion_date: "",
    days_to_delete: "",
    grace_period: "0",
    grace_end_date: "",
    due_date: "",
  });

  const [editData, setEditData] = useState<
    Record<number, Partial<EmailRecord>>
  >({});

  const [pagination, setPagination] = useState({
    page: 0,
    rowsPerPage: 10,
    orderBy: "id" as "id" | "expiry_date" | "domain_name" | "product_name",
    orderDir: "desc" as "asc" | "desc",
  });

  const [totalItems, setTotalItems] = useState(0);

  const billTypeOptions = [
    { value: "yearly", label: "Yearly" },
    { value: "monthly", label: "Monthly" },
    { value: "quarterly", label: "Quarterly" },
    { value: "semi-annual", label: "Semi-Annual" },
    { value: "one-time", label: "One-time" },
  ];

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch email records
  const fetchEmailRecords = async () => {
    try {
      setLoading(true);
      const limit = pagination.rowsPerPage;
      const offset = pagination.page * limit;
      const response = await api.get('secure/emails', {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          search: searchQuery || "",
          limit,
          offset
        }
      });

      const resData = response.data;
      if (resData?.data && Array.isArray(resData.data)) {
        const normalizedData = resData.data.map((item: any) => ({
          ...item,
          expiry_date: item.expiry_date || item.renewal_date || "",
        }));
        setData(normalizedData);
        setTotalItems(resData.total || resData.data.length);
      } else if (Array.isArray(resData)) {
        const normalizedData = resData.map((item: any) => ({
          ...item,
          expiry_date: item.expiry_date || item.renewal_date || "",
        }));
        setData(normalizedData);
        setTotalItems(resData.length);
      } else {
        setData([]);
        setTotalItems(0);
      }
    } catch (error) {
      console.error("Error fetching email records:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmailRecords().catch(err => console.error("Load failed", err));
  }, [pagination.page, pagination.orderBy, pagination.orderDir]);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setPagination((prev) => ({ ...prev, page: 0 }));
      fetchEmailRecords().catch(err => console.error("Load failed", err));
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Handle Add New
  const handleAddNew = () => {
    const today = new Date().toISOString().split("T")[0];
    setAddingNew(true);
    setNewRecordData({
      domain_id: null,
      domain_name: "",
      client_id: isClient && user ? (user.id as any) : null,
      client_name: isClient && user ? (user.name || "") : "",
      product_id: null,
      vendor_id: null,
      vendor_name: "",
      product_name: "",
      quantity: "",
      bill_type: "yearly",
      start_date: today,
      expiry_date: "",
      status: "1",
      remarks: "",
      deletion_date: "",
      days_to_delete: "",
      grace_period: "0",
      grace_end_date: "",
      due_date: "",
    });
  };

  // Cancel Add New

  const handleImportSuccess = async (response?: any) => {
    const inserted = response?.inserted ?? 0;
    const duplicates = response?.duplicates ?? 0;
    const failed = response?.failed ?? 0;
    const errs = response?.errors ?? [];

    await fetchEmailRecords();
    emitEntityChange('email', 'import', null);
    window.scrollTo({ top: 0, behavior: "smooth" });
    setIsImportOpen(false);

    if (inserted > 0) {
      toast({
        title: "Import Successful",
        description: `${inserted} record(s) imported.`,
        variant: "default",
      });
    }

    if (duplicates > 0) {
      toast({
        title: `${duplicates} duplicate(s) skipped`,
        description: "These records already exist in the database.",
        variant: "default",
      });
    }

    if (failed > 0 && errs.length > 0) {
      const preview = errs.slice(0, 3).map((e: any) => e.reason || e.message).join(" • ");
      toast({
        title: `${failed} row(s) failed`,
        description: preview + (errs.length > 3 ? ` …and ${errs.length - 3} more` : ""),
        variant: "destructive",
      });
    }
  };

  const handleCancelAdd = () => {
    setAddingNew(false);
    setNewRecordData({
      domain_id: null,
      domain_name: "",
      client_id: null,
      client_name: "",
      product_id: null,
      vendor_id: null,
      vendor_name: "",
      product_name: "",
      quantity: "",
      bill_type: "yearly",
      start_date: "",
      expiry_date: "",
      status: "1",
      remarks: "",
      deletion_date: "",
      days_to_delete: "",
      grace_period: "0",
      grace_end_date: "",
      due_date: "",
    });
  };

  // Save New Record
  const handleSaveNew = async () => {
    try {
      setIsSaving(true);

      if (
        !newRecordData.domain_id ||
        (user?.role === "SuperAdmin" && !newRecordData.client_id) ||
        !newRecordData.product_id ||
        !newRecordData.quantity ||
        !newRecordData.start_date ||
        !newRecordData.expiry_date
      ) {
        toast({
          title: "Error",
          description: "Please fill all required fields",
          variant: "destructive",
        });
        return;
      }

      const payload = {
        ...normalizeEntityPayload(newRecordData),
        client_id: isClient ? user?.id : newRecordData.client_id,
        record_type: 5,
        s_id: user?.id || 0,
        quantity: parseInt(newRecordData.quantity) || 0,
        bill_type: newRecordData.bill_type,
        start_date: newRecordData.start_date,
      };

      const response = await api.post('secure/emails', payload, { headers: { Authorization: `Bearer ${token}` } });
      if (response.status === 200 || response.status === 201 || response.data?.status === true) {
        toast({
          title: "Success",
          description: response.data?.message || "Email record added successfully",
          variant: "default",
        });
        setAddingNew(false);

        // Use the returned record or build one optimistically
        const newRecord = response.data?.data || {
          ...payload,
          id: response.data?.id || Date.now(),
          domain_name: newRecordData.domain_name,
          client_name: newRecordData.client_name,
          vendor_name: newRecordData.vendor_name,
          product_name: newRecordData.product_name,
          isNewRecord: true,
        };

        setData((prev) => [newRecord, ...prev]);
        emitEntityChange('email', 'create', newRecord);
        setTotalItems((prev) => prev + 1);

        const newId = newRecord.id;
        setHighlightedRecordId(newId);
        window.scrollTo({ top: 0, behavior: "smooth" });

        setTimeout(() => setHighlightedRecordId(null), 2000);
        // Reset form
        setNewRecordData({
          domain_id: null,
          domain_name: "",
          client_id: null,
          client_name: "",
          product_id: null,
          vendor_id: null,
          vendor_name: "",
          product_name: "",
          quantity: "",
          bill_type: "yearly",
          start_date: new Date().toISOString().split("T")[0],
          expiry_date: "",
          status: "1",
          remarks: "",
          deletion_date: "",
          days_to_delete: "",
          grace_period: "0",
          grace_end_date: "",
          due_date: "",
        });
      } else {
        toast({
          title: "Error",
          description: response.data?.message || "Failed to add email record",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error adding email record:", error);
      toast({
        title: "Error",
        description: "Failed to add email record",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Edit
  const handleEdit = (record: EmailRecord) => {
    // Derive grace_end_date from grace_period + expiry_date for backward compat
    let graceEndDate = "";
    if (record.grace_period && record.expiry_date) {
      const rd = new Date(record.expiry_date);
      if (!isNaN(rd.getTime())) {
        rd.setDate(rd.getDate() + Number(record.grace_period));
        graceEndDate = rd.toISOString().split("T")[0];
      }
    }
    setEditingId(record.id);
    setEditData({
      [record.id]: {
        ...record,
        domain_id: record.domain_id,
        client_id: record.client_id,
        product_id: record.product_id,
        vendor_id: record.vendor_id,
        quantity: record.quantity,
        bill_type: record.bill_type,
        start_date: record.start_date,
        expiry_date: record.expiry_date || (record as any).renewal_date || "",
        remarks: record.remarks || "",
        status: record.status,
        deletion_date: record.deletion_date || "",
        days_to_delete: record.days_to_delete ?? undefined,
        remark_id: record?.latest_remark?.id || null,
        grace_end_date: graceEndDate,
      } as any
    });
  };

  // Handle Save (inline editing)
  const handleSave = async (id: number) => {
    try {
      setIsSaving(true);
      const updatedData = editData[id];

      if (!updatedData) return;

      if (
        !updatedData.domain_id ||
        (user?.role === "SuperAdmin" && !updatedData.client_id) ||
        !updatedData.product_id ||
        !updatedData.quantity ||
        !updatedData.start_date ||
        !updatedData.expiry_date
      ) {
        toast({
          title: "Error",
          description: "Please fill all required fields",
          variant: "destructive",
        });
        return;
      }

      const payload = {
        ...normalizeEntityPayload(updatedData),
        record_type: 5,
        id,
        s_id: user?.id || 0,
        quantity: Number(updatedData.quantity) || 0,
        bill_type: updatedData.bill_type,
        start_date: updatedData.start_date,
        remark_id: updatedData.remark_id || null,
      };

      const response = await apiService.editRecord(payload as any, user, token);
      if (response.status || response.success) {
        toast({
          title: "Success",
          description: response.message || "Email record updated successfully",
          variant: "default",
        });
        setEditingId(null);
        setEditData({});
        await fetchEmailRecords();
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to update email record",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating email record:", error);
      toast({
        title: "Error",
        description: "Failed to update email record",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = async () => {
    try {
      setExportLoading(true);

      const payload: any = {
        record_type: 5,
        s_id: user?.id || 0,
      };

      const response = await apiService.exportRecord(payload, user, token);

      if ((response as any).success) {
        toast({
          title: "Success",
          description: response.data?.message || "Email exported successfully",
          variant: "default",
        });
        downloadBase64File(response.data.base64, response.data.filename);
      } else {
        toast({
          title: "Error",
          description: response.data?.message || "Failed to export email",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error exporting email:", error);
      toast({
        title: "Error",
        description: "Failed to export email",
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

  // Handle field change for new record
  const handleNewRecordChange = (
    field: keyof typeof newRecordData | "grace_end_date",
    value: any,
  ) => {
    let extraData: any = {};
    if (field === "expiry_date" || field === "deletion_date") {
      const currentRenewal = field === "expiry_date" ? value : newRecordData.expiry_date;
      const currentDeletion = field === "deletion_date" ? value : newRecordData.deletion_date;
      extraData = handleDateChangeLogic(field === "expiry_date" ? "renewal_date" : "deletion_date", value, currentRenewal, currentDeletion, toast) || {};
      // Recompute grace if grace_end_date already set
      if (field === "expiry_date" && (newRecordData as any).grace_end_date) {
        const graceDays = calculateGraceDaysFromDate((newRecordData as any).grace_end_date, value);
        extraData.grace_period = String(graceDays);
        extraData.due_date = calculateDueDate(value, graceDays);
      }
    }

    if (field === "grace_end_date") {
      const graceDays = calculateGraceDaysFromDate(value, newRecordData.expiry_date);
      extraData.grace_period = String(graceDays);
      extraData.due_date = calculateDueDate(newRecordData.expiry_date, graceDays);
    }

    setNewRecordData((prev) => ({
      ...prev,
      [field]: value,
      ...extraData,
    } as any));
  };

  // Handle field change for editing
  const handleEditChange = (
    id: number,
    field: keyof EmailRecord | "grace_end_date",
    value: any,
  ) => {
    let extraData: any = {};
    if (field === "expiry_date" || field === "deletion_date") {
      const currentRow = editData[id] || {};
      const actualRow = data.find((d) => d.id === id) || ({} as any);
      const currentRenewal = field === "expiry_date" ? value : (currentRow.expiry_date ?? actualRow.expiry_date);
      const currentDeletion = field === "deletion_date" ? value : (currentRow.deletion_date ?? actualRow.deletion_date);
      extraData = handleDateChangeLogic(field === "expiry_date" ? "renewal_date" : "deletion_date", value, currentRenewal, currentDeletion, toast) || {};
      // Recompute grace when expiry changes
      if (field === "expiry_date") {
        const existingGraceEnd = (currentRow as any).grace_end_date ?? "";
        if (existingGraceEnd) {
          const graceDays = calculateGraceDaysFromDate(existingGraceEnd, value);
          extraData.grace_period = graceDays;
          extraData.due_date = calculateDueDate(value, graceDays);
        }
      }
    }

    if (field === "grace_end_date") {
      const currentRow = editData[id] || {};
      const actualRow = data.find((d) => d.id === id) || ({} as any);
      const expiryDate = (currentRow as any).expiry_date ?? actualRow.expiry_date ?? "";
      const graceDays = calculateGraceDaysFromDate(value, expiryDate);
      extraData.grace_period = graceDays;
      extraData.due_date = calculateDueDate(expiryDate, graceDays);
    }

    setEditData((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
        ...extraData,
      },
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
        description: "Please select at least one email record",
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
        5,
        user,
        token,
      );

      if (response.status || response.success) {
        toast({
          title: "Success",
          description: response.message || "Record(s) deleted successfully",
          variant: "default",
        });

        const idsToDelete = itemToDelete ? [itemToDelete] : selectedItems;
        setData((prev) => prev.filter((item) => !idsToDelete.includes(item.id)));
        setTotalItems((prev) => prev - idsToDelete.length);
        setSelectedItems([]);
        setItemToDelete(null);
        emitEntityChange('email', 'delete', idsToDelete);
      } else {
        toast({
          title: "Error",
          description: response.data?.message || "Failed to delete record(s)",
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

  const getBillTypeColor = (billType: string) => {
    if (!billType) return "text-gray-400";
    switch (billType.toLowerCase()) {
      case "yearly":
        return "text-blue-400";
      case "monthly":
        return "text-purple-400";
      case "quarterly":
        return "text-yellow-400";
      case "semi-annual":
        return "text-pink-400";
      case "one-time":
        return "text-green-400";
      default:
        return "text-gray-400";
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "numeric",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  // Calculate days until expiry
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

  const handleViewDetails = (item: any) => {
    setExpandedRowId((prev) => (prev === item.id ? null : item.id));
  };

  return (
    <div className="min-h-screen pb-8">
      <Header title="Email Management" tabs={navigationTabs} />

      <div className="px-4 sm:px-6 mt-6">
        <GlassCard className="p-6 backdrop-blur-xl bg-gradient-to-br from-gray-900/80 via-black/80 to-gray-900/80 border border-white/10 shadow-2xl">
          {/* Header with Search and Add Button */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <Mail className="w-6 h-6 text-[#CB8959]" />
                <h2 className="text-xl font-semibold text-white">
                  Email Accounts
                </h2>
              </div>
              <p className="text-sm text-gray-400 mt-1">
                Manage your email accounts and subscriptions
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search email accounts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full sm:w-64 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/30 backdrop-blur-sm transition-all"
                />
              </div>

              <div className="flex gap-2">
                {selectedItems.length > 0 && user?.role === "SuperAdmin" && (
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

                {!addingNew && user?.role === "SuperAdmin" && (
                  <GlassButton
                    variant="primary"
                    onClick={handleAddNew}
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Email Account
                  </GlassButton>
                )}
                <GlassButton
                  variant="primary"
                  onClick={handleExport}
                  className="flex items-center gap-2"
                  disabled={exportLoading}
                >
                  {exportLoading ? ("Exporting...") : (" Export")}
                </GlassButton>
                {user?.role === "SuperAdmin" && (
                  <>
                    <GlassButton
                      variant="primary"
                      onClick={() => setIsImportOpen(true)}
                      className="flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      Import
                    </GlassButton>
                    <button
                      onClick={() => setIsHistoryOpen(true)}
                      className="px-4 py-2 bg-gray-800 text-white rounded flex items-center gap-2 transition-colors hover:bg-gray-700 font-medium text-sm"
                    >
                      <History className="w-4 h-4" />
                      History
                    </button>
                    <ImportModal recordType={5} title="Import Emails" isOpen={isImportOpen} setIsOpen={setIsImportOpen} onSuccess={handleImportSuccess} module="emails" />
                    <HistoryModal isOpen={isHistoryOpen} setIsOpen={setIsHistoryOpen} entity="email" />
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-hidden rounded-xl border border-white/10 backdrop-blur-sm">
            {/* Table */}
            <div className="overflow-x-auto">
              <table className={`w-full table-fixed ${isClient ? 'min-w-[1000px]' : 'min-w-[2000px]'}`}>
                <thead>
                  <tr className="bg-white/5 border-b border-white/10">
                    {user?.role === "SuperAdmin" && (
                      <th className="py-3 px-4 text-left w-[50px]">
                        <input
                          type="checkbox"
                          checked={isAllSelected}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500/50 cursor-pointer"
                        />
                      </th>
                    )}
                    <th className={`py-3 px-4 text-left text-sm font-medium text-gray-300 ${isClient ? 'w-[80px]' : 'w-[70px]'}`}>
                      S.NO
                    </th>
                    <th className={`py-3 px-4 text-left text-sm font-medium text-gray-300 ${isClient ? 'w-[220px]' : 'w-[200px]'}`}>
                      {isClient ? 'Domain' : 'Domain Name'}
                    </th>
                    {user?.role === "SuperAdmin" && (
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 w-[180px]">
                        Client
                      </th>
                    )}
                    <th className={`py-3 px-4 text-left text-sm font-medium text-gray-300 ${isClient ? 'w-[200px]' : 'w-[180px]'}`}>
                      Product
                    </th>
                    {user?.role === "SuperAdmin" && (
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 w-[150px]">
                        Vendor
                      </th>
                    )}
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 w-[100px]">
                      Quantity
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 w-[140px]">
                      Bill Type
                    </th>
                    {user?.role === "SuperAdmin" && (
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 w-[140px]">
                        Start Date
                      </th>
                    )}
                    <th className={`py-3 px-4 text-left text-sm font-medium text-gray-300 ${isClient ? 'w-[160px]' : 'w-[140px]'}`}>
                      {isClient ? 'Renewal' : 'Renewal Date'}
                    </th>
                    {user?.role === "SuperAdmin" && (
                      <th className={`py-3 px-4 text-left text-sm font-medium text-gray-300 ${isClient ? 'w-[140px]' : 'w-[120px]'}`}>
                        Days to Expire
                      </th>
                    )}
                    {user?.role === "SuperAdmin" && (
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 w-[140px]">
                        Deletion Date
                      </th>
                    )}
                    {user?.role === "SuperAdmin" && (
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 w-[120px]">
                        Days to Delete
                      </th>
                    )}
                    {user?.role === "SuperAdmin" && (
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 w-[120px]">
                        Grace Period
                      </th>
                    )}
                    {user?.role === "SuperAdmin" && (
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 w-[140px]">
                        Due Date
                      </th>
                    )}
                    <th className={`py-3 px-4 text-center text-sm font-medium text-gray-300 ${isClient ? 'w-[120px]' : 'w-[120px]'}`}>
                      Status
                    </th>
                    {user?.role === "SuperAdmin" && (
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 w-[200px]">
                        Remarks
                      </th>
                    )}
                    {user?.role === "SuperAdmin" && (
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 w-[180px]">
                        Last Updated
                      </th>
                    )}
                    {user?.role === "SuperAdmin" && (
                      <th className="py-3 px-4 text-right text-sm font-medium text-gray-300 w-[120px]">
                        Action
                      </th>
                    )}

                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={isClient ? 6 : (user?.role === "SuperAdmin" ? 17 : 16)} className="py-8 text-center text-gray-400 font-medium text-sm">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <DashboardLoader label="Loading email records..." />
                        </div>
                      </td>
                    </tr>
                  ) : (<React.Fragment>
                      {/* Add New Row */}
                      {addingNew && (
                        <tr key="new-row" className="border-b border-white/5 bg-blue-500/5">
                          {user?.role === "SuperAdmin" && <td className="py-3 px-4"></td>}
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
                              placeholder="Select Domain"
                              className="min-h-[32px]"
                            />
                          </td>
                          {user?.role === "SuperAdmin" && (
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
                                placeholder="Select Client"
                                className="min-h-[32px]"
                              />
                            </td>
                          )}
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
                          {user?.role === "SuperAdmin" && (
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
                                placeholder="Vendor"
                                className="min-h-[32px]"
                              />
                            </td>
                          )}
                          <td className="py-3 px-4">
                            <input
                              type="number"
                              value={newRecordData.quantity}
                              onChange={(e) =>
                                handleNewRecordChange(
                                  "quantity",
                                  e.target.value,
                                )
                              }
                              className="w-full px-2 py-1 bg-white/5 border border-blue-500/30 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/30 backdrop-blur-sm"
                              style={{ minHeight: "32px" }}
                              min="1"
                              placeholder="1"
                            />
                          </td>
                          <td className="py-1 px-2">
                            <div className="w-40">
                              <GlassSelect
                                options={billTypeOptions}
                                value={
                                  billTypeOptions.find(
                                    (opt) =>
                                      opt.value === newRecordData.bill_type,
                                  ) || null
                                }
                                onChange={(selected: any) =>
                                  handleNewRecordChange(
                                    "bill_type",
                                    selected?.value,
                                  )
                                }
                                isSearchable={false}
                                styles={glassSelectStyles}
                              />
                            </div>
                          </td>
                          {user?.role === "SuperAdmin" && (
                            <td className="py-3 px-4">
                              <input
                                type="date"
                                value={newRecordData.start_date}
                                onChange={(e) =>
                                  handleNewRecordChange(
                                    "start_date",
                                    e.target.value,
                                  )
                                }
                                className="w-full px-2 py-1 bg-white/5 border border-blue-500/30 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/30 backdrop-blur-sm"
                                style={{ minHeight: "32px" }}
                              />
                            </td>
                          )}
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
                          {user?.role === "SuperAdmin" && (
                            <td className="py-3 px-4">
                              <input
                                type="number"
                                value={String(calculateDays(newRecordData.expiry_date)) === "NaN" ? "" : calculateDays(newRecordData.expiry_date)}
                                readOnly
                                className="w-full px-2 py-1 bg-white/10 border border-white/10 rounded text-gray-400 text-xs cursor-not-allowed"
                                style={{ minHeight: "32px" }}
                              />
                            </td>
                          )}
                          {user?.role === "SuperAdmin" && (
                            <td className="py-3 px-4">
                              <input
                                type="date"
                                value={newRecordData.deletion_date}
                                onChange={(e) => handleNewRecordChange("deletion_date", e.target.value)}
                                className="w-full px-2 py-1 bg-white/5 border border-blue-500/30 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/30 backdrop-blur-sm"
                                style={{ minHeight: "32px" }}
                              />
                            </td>
                          )}
                          {user?.role === "SuperAdmin" && (
                            <td className="py-2 px-4 whitespace-nowrap">
                              <input
                                type="number"
                                value={newRecordData.days_to_delete}
                                readOnly
                                className={`w-20 px-3 py-1.5 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded text-sm outline-none focus:ring-0 cursor-not-allowed ${getDaysToColor(newRecordData.days_to_delete)}`}
                              />
                            </td>
                          )}
                          {user?.role === "SuperAdmin" && (
                            <td className="py-3 px-4">
                              {/* Grace End Date — identical to Deletion Date picker */}
                              <input
                                type="date"
                                value={(newRecordData as any).grace_end_date || ""}
                                onChange={(e) => handleNewRecordChange("grace_end_date" as any, e.target.value)}
                                min={newRecordData.expiry_date || undefined}
                                className="w-full px-2 py-1 bg-white/5 border border-blue-500/30 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/30 backdrop-blur-sm"
                                style={{ minHeight: "32px" }}
                              />
                            </td>
                          )}
                          {user?.role === "SuperAdmin" && (
                            <td className="py-3 px-4">
                              {/* Due Date → X days pill */}
                              {newRecordData.grace_period && Number(newRecordData.grace_period) > 0 ? (
                                <div className={`px-2 py-1 rounded-md text-xs font-medium border inline-flex items-center justify-center bg-blue-500/10 border-blue-500/20 ${getDaysToColor(newRecordData.grace_period)}`}>
                                  {newRecordData.grace_period} days
                                </div>
                              ) : (
                                <span className="text-gray-500 text-xs">--</span>
                              )}
                            </td>
                          )}
                          {user?.role === "SuperAdmin" && (
                            <td className="py-1 px-2">
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
                                  styles={glassSelectStyles}
                                />
                              </div>
                            </td>
                          )}
                          {user?.role === "SuperAdmin" && (
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
                          )}
                          {user?.role === "SuperAdmin" && (
                            <td className="py-3 px-4 text-sm text-gray-300">
                              {"- -"}
                            </td>
                          )}
                          {user?.role === "SuperAdmin" && (
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
                          )}

                        </tr>
                      )}

                      {/* Existing Data Rows */}
                      {data.length === 0 && !addingNew ? (
                        <tr key="empty-row">
                          <td colSpan={isClient ? 6 : (user?.role === "SuperAdmin" ? 17 : 16)} className="py-8 text-center text-gray-400">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <Mail className="w-12 h-12 text-gray-400" />
                              <span>No email records found</span>
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
                          <React.Fragment key={`wrap-${item.id}`}>
                            <tr
                              className={`border-b border-white/5 transition-all duration-1000 ${highlightedRecordId === item.id
                                ? "bg-blue-500/20 shadow-[inset_0_0_10px_rgba(59,130,246,0.3)]"
                                : editingId === item.id
                                  ? "bg-blue-500/5 hover:bg-white/[0.02]"
                                  : "hover:bg-white/[0.02]"
                                }`}
                            >
                            {user?.role === "SuperAdmin" && (
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
                            )}
                            <td className="py-3 px-4 text-sm text-gray-300 whitespace-nowrap">
                              {startItem + index}
                              {(item as any).isNewRecord && (
                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                  New
                                </span>
                              )}
                            </td>

                            {editingId === item.id ? (
                              <>
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
                                    placeholder="Select Domain"
                                    className="min-h-[32px]"
                                  />
                                </td>
                                {user?.role === "SuperAdmin" && (
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
                                      placeholder="Select Client"
                                      className="min-h-[32px]"
                                    />
                                  </td>
                                )}
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
                                {user?.role === "SuperAdmin" && (
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
                                )}
                                <td className="py-3 px-4">
                                  <input
                                    type="number"
                                    value={
                                      editData[item.id]?.quantity ||
                                      item.quantity ||
                                      ""
                                    }
                                    onChange={(e) =>
                                      handleEditChange(
                                        item.id,
                                        "quantity",
                                        parseInt(e.target.value),
                                      )
                                    }
                                    className="w-full px-2 py-1 bg-white/5 border border-blue-500/30 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/30 backdrop-blur-sm"
                                    style={{ minHeight: "32px" }}
                                    min="1"
                                  />
                                </td>
                                <td className="py-1 px-2">
                                  <div className="w-40">
                                    <GlassSelect
                                      options={billTypeOptions}
                                      value={
                                        billTypeOptions.find(
                                          (opt) =>
                                            opt.value ===
                                            String(
                                              editData[item.id]?.bill_type ||
                                              item.bill_type,
                                            ),
                                        ) || null
                                      }
                                      onChange={(selected: any) =>
                                        handleEditChange(
                                          item.id,
                                          "bill_type",
                                          selected?.value || null,
                                        )
                                      }
                                      isSearchable={false}
                                      styles={glassSelectStyles}
                                    />
                                  </div>
                                </td>
                                {user?.role === "SuperAdmin" && (
                                  <td className="py-3 px-4">
                                    <input
                                      type="date"
                                      value={
                                        editData[item.id]?.start_date ||
                                        item.start_date ||
                                        ""
                                      }
                                      onChange={(e) =>
                                        handleEditChange(
                                          item.id,
                                          "start_date",
                                          e.target.value,
                                        )
                                      }
                                      className="w-full px-2 py-1 bg-white/5 border border-blue-500/30 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/30 backdrop-blur-sm"
                                      style={{ minHeight: "32px" }}
                                    />
                                  </td>
                                )}
                                <td className="py-3 px-4">
                                  <input
                                    type="date"
                                    value={
                                      editData[item.id]?.expiry_date ||
                                      item.expiry_date ||
                                      ""
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
                                {user?.role === "SuperAdmin" && (
                                  <td className="py-3 px-4">
                                    <input
                                      type="number"
                                      value={String(calculateDays(editData[item.id]?.expiry_date || item.expiry_date)) === "NaN" ? "" : calculateDays(editData[item.id]?.expiry_date || item.expiry_date)}
                                      readOnly
                                      className="w-full px-2 py-1 bg-white/10 border border-white/10 rounded text-gray-400 text-sm cursor-not-allowed"
                                      style={{ minHeight: "32px" }}
                                    />
                                  </td>
                                )}
                                {user?.role === "SuperAdmin" && (
                                  <td className="py-3 px-4">
                                    <input
                                      type="date"
                                      value={editData[item.id]?.deletion_date ?? item.deletion_date ?? ""}
                                      onChange={(e) => handleEditChange(item.id, "deletion_date", e.target.value)}
                                      className="w-full px-2 py-1 bg-white/5 border border-blue-500/30 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/30 backdrop-blur-sm"
                                      style={{ minHeight: "32px" }}
                                    />
                                  </td>
                                )}
                                {user?.role === "SuperAdmin" && (
                                  <td className="py-2 px-4 whitespace-nowrap">
                                    <input
                                      type="number"
                                      value={editData[item.id]?.days_to_delete ?? item.days_to_delete ?? ""}
                                      readOnly
                                      className={`w-20 px-3 py-1 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded text-sm outline-none focus:ring-0 cursor-not-allowed ${getDaysToColor(editData[item.id]?.days_to_delete ?? item.days_to_delete)}`}
                                    />
                                  </td>
                                )}
                                 {user?.role === "SuperAdmin" && (
                                   <td className="py-3 px-4">
                                     {/* Grace End Date - identical to Deletion Date picker */}
                                     <input
                                       type="date"
                                       value={(editData[item.id] as any)?.grace_end_date || ""}
                                       onChange={(e) => handleEditChange(item.id, "grace_end_date" as any, e.target.value)}
                                       min={editData[item.id]?.expiry_date || item.expiry_date || undefined}
                                       className="w-full px-2 py-1 bg-white/5 border border-blue-500/30 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/30 backdrop-blur-sm"
                                       style={{ minHeight: "32px" }}
                                     />
                                   </td>
                                 )}
                                {user?.role === "SuperAdmin" && (
                                  <td className="py-3 px-4">
                                    {/* Due Date → X days pill */}
                                    {(() => {
                                      const gp = editData[item.id]?.grace_period ?? item.grace_period ?? 0;
                                      return Number(gp) > 0 ? (
                                        <div className={`px-2 py-1 rounded-md text-xs font-medium border inline-flex items-center justify-center bg-blue-500/10 border-blue-500/20 ${getDaysToColor(gp)}`}>
                                          {gp} days
                                        </div>
                                      ) : (
                                        <span className="text-gray-500 text-xs">--</span>
                                      );
                                    })()}
                                  </td>
                                )}
                                {user?.role === "SuperAdmin" && (
                                  <td className="py-3 px-4 text-sm text-gray-300">
                                    {formatDate(editData[item.id]?.due_date || item.due_date || "") || '-'}
                                  </td>
                                )}
                                {user?.role === "SuperAdmin" && (
                                  <td className="py-1 px-2">
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
                                              String(
                                                editData[item.id]?.status ||
                                                item.status,
                                              ),
                                          ) || null
                                        }
                                        onChange={(selected: any) =>
                                          handleEditChange(
                                            item.id,
                                            "status",
                                            selected?.value || null,
                                          )
                                        }
                                        isSearchable={false}
                                        styles={glassSelectStyles}
                                      />
                                    </div>
                                  </td>
                                )}
                                {user?.role === "SuperAdmin" && (
                                  <td className="py-3 px-4">
                                    <input
                                      type="text"
                                      value={
                                        editData[item.id]?.remarks ||
                                        (item.latest_remark?.remark as string) ||
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
                                )}
                                {user?.role === "SuperAdmin" && (
                                  <td className="py-3 px-4 text-sm text-gray-300">
                                    {"- -"}
                                  </td>
                                )}
                              </>
                            ) : (
                              <>
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-2">
                                    <Globe className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                    <span className="text-sm text-white font-medium">
                                      {item.domain_name || "N/A"}
                                    </span>
                                  </div>
                                </td>
                                {user?.role === "SuperAdmin" && (
                                  <td className="py-3 px-4">
                                    <div className="flex items-center gap-2">
                                      <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                      <span className="text-sm text-white font-medium">
                                        {item.client_name || "N/A"}
                                      </span>
                                    </div>
                                  </td>
                                )}
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-2">
                                    <Package className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                    <span className="text-sm text-white font-medium">
                                      {item.product_name}
                                    </span>
                                  </div>
                                </td>
                                {user?.role === "SuperAdmin" && (
                                  <td className="py-3 px-4">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm text-white font-medium">
                                        {item.vendor_name}
                                      </span>
                                    </div>
                                  </td>
                                )}
                                 <td className="py-3 px-4">
                                   <div className="flex items-center gap-2">
                                     <Hash className="w-4 h-4 text-gray-400" />
                                     <span className="text-sm text-white font-medium">
                                       {item.quantity || 1}
                                     </span>
                                   </div>
                                 </td>
                                 <td className="py-3 px-4">
                                   <div
                                     className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm border ${getBillTypeColor(item.bill_type || "Monthly")} ${item.bill_type?.toLowerCase() === "yearly"
                                       ? "bg-blue-500/20 border-blue-500/20"
                                       : (item.bill_type || "Monthly").toLowerCase() ===
                                         "monthly"
                                         ? "bg-purple-500/20 border-purple-500/20"
                                         : item.bill_type?.toLowerCase() ===
                                           "quarterly"
                                           ? "bg-yellow-500/20 border-yellow-500/20"
                                           : "bg-gray-500/20 border-gray-500/20"
                                       }`}
                                   >
                                     {item.bill_type ? (item.bill_type.charAt(0).toUpperCase() + item.bill_type.slice(1)) : "Monthly"}
                                   </div>
                                 </td>
                                {user?.role === "SuperAdmin" && (
                                  <td className="py-3 px-4 text-xs text-gray-300">
                                    <div className="flex items-center gap-2">
                                      <Calendar className="w-4 h-4 text-gray-400" />
                                      {formatDate(item.start_date)}
                                    </div>
                                  </td>
                                )}
                                <td className="py-3 px-4 text-xs text-gray-300">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-gray-400" />
                                    {formatDate(item.expiry_date)}
                                  </div>
                                </td>
                                                                 {user?.role === "SuperAdmin" && (
                                   <td className="py-3 px-4">
                                  <div
                                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm border ${calculateDays(item.expiry_date) < 0
                                      ? "bg-red-500/20 text-red-400 border-red-500/20"
                                      : calculateDays(item.expiry_date) <= 30
                                                                                   ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/20"
                                        : "bg-green-500/20 text-green-400 border-green-500/20"
                                      }`}
                                  >
                                    {calculateDays(item.expiry_date)} days
                                  </div>
                                                                 </td>
                               )}
                                {user?.role === "SuperAdmin" && (
                                  <td className="py-3 px-4 text-sm text-gray-300">
                                    {item.deletion_date ? formatDate(item.deletion_date) : "--"}
                                  </td>
                                )}
                                {user?.role === "SuperAdmin" && (
                                  <td className="py-3 px-4 whitespace-nowrap">
                                    <span className={`text-sm ${getDaysToColor(item.days_to_delete)}`}>
                                      {item.days_to_delete !== null && item.days_to_delete !== undefined ? item.days_to_delete : "--"}
                                    </span>
                                  </td>
                                )}
                                {user?.role === "SuperAdmin" && (
                                  <td className="py-3 px-4 text-sm text-gray-300">
                                    {item.grace_period ? `${item.grace_period} days` : "0 days"}
                                  </td>
                                )}
                                {user?.role === "SuperAdmin" && (
                                  <td className="py-3 px-4 text-sm text-gray-300">
                                    {/* Grace End Date view */}
                                    {(() => {
                                      if (!item.grace_period || !item.expiry_date) return <span className="text-gray-500">--</span>;
                                      const rd = new Date(item.expiry_date);
                                      if (isNaN(rd.getTime())) return <span className="text-gray-500">--</span>;
                                      rd.setDate(rd.getDate() + Number(item.grace_period));
                                      return formatDate(rd.toISOString().split("T")[0]);
                                    })()}
                                  </td>
                                )}
                                {user?.role === "SuperAdmin" && (
                                  <td className="py-3 px-4 text-sm text-gray-300">
                                    {item.due_date ? formatDate(item.due_date) : "--"}
                                  </td>
                                )}
                                <td className="py-3 px-4 text-center">
                                  <div
                                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm border ${getStatusColor(item.status)} ${item.status === 1
                                      ? "bg-green-500/20 border-green-500/20"
                                      : "bg-red-500/20 border-red-500/20"
                                      }`}
                                  >
                                    {getStatusIcon(item.status)}
                                    {getStatusText(item.status)}
                                  </div>
                                </td>
                                {user?.role === "SuperAdmin" && (
                                   <td className="py-3 px-4">
                                     <div className="flex items-center gap-2">
                                       <span className="text-sm text-gray-300 truncate max-w-[150px]">
                                         {item.remarks || "--"}
                                       </span>
                                       {item.has_remark_history && (
                                         <button
                                           onClick={() => setExpandedRemarkId(expandedRemarkId === item.id ? null : item.id)}
                                           className={`p-1 rounded-full transition-all duration-300 flex-shrink-0 ml-1 ${expandedRemarkId === item.id
                                             ? "bg-blue-500/30 text-blue-300 rotate-180"
                                             : "hover:bg-blue-500/20 text-blue-400 hover:text-blue-300"
                                             }`}
                                           title="Remark History"
                                         >
                                           <History className="w-3.5 h-3.5" />
                                         </button>
                                       )}
                                     </div>
                                   </td>
                                 )}
                                {user?.role === "SuperAdmin" && (
                                  <td className="py-3 px-4 text-sm text-gray-300 whitespace-nowrap">
                                    {(item as any).last_updated || formatLastUpdated(item.updated_at)}
                                  </td>
                                )}
                              </>
                            )}

                            {user?.role === "SuperAdmin" && (
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
                                        <Edit className="w-4 h-4 text-white hover:text-blue-400 transition-colors" />
                                      </GlassButton>
                                      <GlassButton
                                        onClick={() => handleDeleteClick(item.id)}
                                        className="p-1.5 min-w-0 hover:bg-red-500/20"
                                        title="Delete"
                                      >
                                        <Trash2 className="w-4 h-4 text-red-400 hover:text-red-300 transition-colors" />
                                      </GlassButton>
                                    </>
                                  )}
                                </div>
                              </td>
                            )}

                          </tr>
                          {/* Expansion Row for Details */}
                          {expandedRowId === item.id && (
                             <tr className="bg-white/5 animate-in fade-in slide-in-from-top-4 duration-300">
                               <td colSpan={isClient ? 6 : (user?.role === "SuperAdmin" ? 17 : 16)} className="py-4 px-6">
                                 <div className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-black/20 p-4 rounded-xl border border-white/5 shadow-inner">
                                   <div><span className="block text-xs text-gray-400 mb-1 text-left">Domain Name</span><span className="block text-sm text-gray-200 font-medium text-left">{item.domain_name || "--"}</span></div>
                                   <div><span className="block text-xs text-gray-400 mb-1 text-left">Client Name</span><span className="block text-sm text-gray-200 font-medium text-left">{item.client_name || "--"}</span></div>
                                   <div><span className="block text-xs text-gray-400 mb-1 text-left">Product</span><span className="block text-sm text-gray-200 font-medium text-left">{item.product_name || "--"}</span></div>
                                   <div><span className="block text-xs text-gray-400 mb-1 text-left">Vendor</span><span className="block text-sm text-gray-200 font-medium text-left">{item.vendor_name || "--"}</span></div>
                                   <div><span className="block text-xs text-gray-400 mb-1 text-left">Quantity</span><span className="block text-sm text-gray-200 font-medium text-left">{(item as any).quantity !== undefined ? (item as any).quantity : "--"}</span></div>
                                   <div><span className="block text-xs text-gray-400 mb-1 text-left">Renewal Date</span><span className="block text-sm text-gray-200 font-medium text-left">{formatDate((item as any).expiry_date)}</span></div>
                                   <div><span className="block text-xs text-gray-400 mb-1 text-left">Deletion Date</span><span className="block text-sm text-gray-200 font-medium text-left">{formatDate((item as any).deletion_date)}</span></div>
                                   <div><span className="block text-xs text-gray-400 mb-1 text-left">Remarks</span><span className="block text-sm text-gray-200 font-medium text-left">{item.remarks || "--"}</span></div>
                                 </div>
                               </td>
                             </tr>
                           )}

                           {/* Remark History Row */}
                           {expandedRemarkId === item.id && (
                             <tr key={`history-row-${item.id}`} className="bg-blue-500/5 animate-in fade-in slide-in-from-top-4 duration-500">
                               <td colSpan={isClient ? 6 : (user?.role === "SuperAdmin" ? 17 : 16)} className="py-0 px-4">
                                 <div className="border-t border-blue-500/20 py-4 pb-6 ml-12 mr-12">
                                   <RemarkHistory key={`history-${item.id}-${item.updated_at}`} module="Email" recordId={item.id} />
                                 </div>
                               </td>
                             </tr>
                           )}
                        </React.Fragment>
                        ))
                      )}
                    </React.Fragment>)}
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
                  {selectedItems.length} email record
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
          itemToDelete ? "Delete Email Record" : "Delete Multiple Email Records"
        }
        message={
          itemToDelete
            ? "Are you sure you want to delete this email record? This action cannot be undone."
            : "Are you sure you want to delete the selected email records? This action cannot be undone."
        }
      />
    </div>
  );
}
