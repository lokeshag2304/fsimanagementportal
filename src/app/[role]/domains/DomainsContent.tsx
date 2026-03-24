"use client";

import React, { useState, useEffect, useRef } from "react"
import { Header } from "@/components/layout"
import { GlassCard, GlassButton } from "@/components/glass"
import { DeleteConfirmationModal } from "@/common/services/DeleteConfirmationModal"
import { ImportModal } from "@/components/ImportModal";
import { HistoryModal } from "@/components/HistoryModal";
import { History, Upload,
  Edit,
  Trash2,
  Search,
  Plus,
  Calendar,
  Globe,
  User,
  Package,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Save,
  X,
  Lock,
  Eye,
  MessageSquare,
} from "lucide-react"
import { RemarkHistory } from "@/components/RemarkHistory";
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/useToast"
import { useRouter } from "next/navigation"
import api from "@/lib/api"
import Pagination from "@/common/Pagination"
import DashboardLoader, { downloadBase64File } from "@/common/DashboardLoader"
import { getNavigationByRole } from "@/lib/getNavigationByRole"
import { ApiDropdown, glassSelectStyles } from "@/common/DynamicDropdown"
import { CurrencyAmountInput } from "@/common/CurrencyAmountInput"
import { GlassSelect } from "@/components/glass/GlassSelect"
import { apiService } from "@/common/services/apiService";
import { normalizeEntityPayload } from "@/utils/normalizePayload";
import { emitEntityChange } from "@/lib/entityBus";
import { formatLastUpdated } from "@/utils/dateFormatter";
import { handleDateChangeLogic, getDaysToColor, calculateDueDate, calculateGraceDaysFromDate } from "@/utils/dateCalculations";
import { getCurrencySymbol, currencySymbols } from "@/utils/currencies";

interface DomainRecord {
  id: number;
  name: string;
  domain_name: string; // for compatibility
  product_id?: number;
  product_name: string;
  client_id?: number;
  client_name: string | null;
  vendor_id?: number;
  vendor_name: string;
  renewal_date: string;
  days_left: number | string | null;
  deletion_date?: string | null;
  days_to_delete?: number | string | null;
  domain_protected: 0 | 1 | "0" | "1";
  status: 0 | 1 | "0" | "1";
  amount: number | null;
  currency?: string;
  remarks: string;
  remark_id: number | null;
  latest_remark?: {
    id: number;
    remark: string;
  };
  has_remark_history?: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  grace_period?: number;
  due_date?: string | null;
}

interface AddEditDomain {
  record_type: 4
  id?: number
  s_id: number
  vendor_id: number
  product_id: number
  client_id: number
  domain_protected: 0 | 1
  renewal_date: string
  remarks: string
  remark_id: number;
  deleted_at: string;
  deletion_date: string;
  amount: number;
  currency: string;
  grace_period?: number;
  due_date?: string;
}

const currencyOptions = [
  { value: "INR", label: "INR (₹)" },
  { value: "USD", label: "USD ($)" },
  { value: "NGN", label: "NGN (₦)" },
  { value: "CNY", label: "CNY (¥)" },
];


export default function DomainsPage() {
  const {user, getToken } = useAuth()
  const token = getToken();
  const isClient = user?.role === "ClientAdmin" || user?.login_type === 3;
  const navigationTabs = getNavigationByRole(user?.role)

  const { toast } = useToast()
  const router = useRouter()
  const [exportLoading, setExportLoading] = useState(false);
  const [data, setData] = useState<DomainRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedItems, setSelectedItems] = useState<number[]>([])
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null)
  const [addingNew, setAddingNew] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [expandedRemarks, setExpandedRemarks] = useState<Set<number>>(new Set());
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);

  const toggleRemarkHistory = (id: number) => {
    setExpandedRemarks(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const [highlightedRecordId, setHighlightedRecordId] = useState<number | null>(null)
  console.log("Current user role:", user?.role);
  
  const [newRecordData, setNewRecordData] = useState({
    name: "",
    product_id: 46 as number | null, // Default to 46 if it's the standard domain registration product
    product_name: "Domain Registration",
    client_id: null as number | null,
    client_name: "",
    vendor_id: null as number | null,
    vendor_name: "",
    renewal_date: "",
    days_left: "" as number | string,
    deletion_date: "",
    days_to_delete: "" as number | string,
    domain_protected: "1" as "1" | "0",
    status: "1" as "1" | "0",
    amount: "" as string | number,
    currency: "INR",
    remarks: "",
    grace_period: "0",
    grace_end_date: "",
    due_date: "",
  })
  
  const [editData, setEditData] = useState<Record<number, Partial<DomainRecord>>>({})
  
  const [pagination, setPagination] = useState({
    page: 0,
    rowsPerPage: 10,
    orderBy: "id" as "id" | "expiry_date" | "domain_name" | "product_name",
    orderDir: "desc" as "asc" | "desc"
  })
  
  const [totalItems, setTotalItems] = useState(0)
  
  const domainProtectOptions = [
    { value: "1", label: "Yes" },
    { value: "0", label: "No" }
  ]

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch domain records
  const fetchDomainRecords = async () => {
    try {
      setLoading(true)
      const limit = pagination.rowsPerPage;
      const offset = pagination.page * limit;
      const response = await api.get('secure/domains', {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          search: searchQuery,
          limit,
          offset
        }
      })
      const resData = response.data
      if (resData?.data && Array.isArray(resData.data)) {
        setData(resData.data)
        setTotalItems(resData.total || resData.data.length)
      } else if (Array.isArray(resData)) {
        setData(resData)
        setTotalItems(resData.length)
      } else {
        setData([])
        setTotalItems(0)
      }
    } catch (error) {
      console.error("Error fetching domain records:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDomainRecords().catch(err => console.error("Load failed", err));
  }, [pagination.page, pagination.orderBy, pagination.orderDir])

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      setPagination(prev => ({ ...prev, page: 0 }))
      fetchDomainRecords().catch(err => console.error("Load failed", err));
    }, 300)
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchQuery])

  // Handle Add New
  const handleAddNew = () => {
    const today = new Date().toISOString().split('T')[0]
    setAddingNew(true)
    setNewRecordData({
      name: "",
      product_id: 46,
      product_name: "Domain Registration",
      client_id: isClient ? user?.id : null,
      client_name: isClient ? user?.name : "",
      vendor_id: null,
      vendor_name: "",
      renewal_date: today,
      days_left: "0",
      deletion_date: "",
      days_to_delete: "",
      domain_protected: "1",
      status: "1",
      amount: "",
      currency: "INR",
      remarks: "",
      grace_period: "0",
      grace_end_date: "",
      due_date: "",
    })
  }

  // Cancel Add New
  
  const handleImportSuccess = async (response?: any) => {
    const inserted = response?.inserted ?? 0;
    const duplicates = response?.duplicates ?? 0;
    const failed = response?.failed ?? 0;
    const errs = response?.errors ?? [];

    await fetchDomainRecords();
    emitEntityChange('domain', 'import', null);
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
    setAddingNew(false)
    setNewRecordData({
      name: "",
      product_id: null,
      product_name: "",
      client_id: null,
      client_name: "",
      vendor_id: null,
      vendor_name: "",
      renewal_date: "",
      days_left: "",
      deletion_date: "",
      days_to_delete: "",
      domain_protected: "1",
      status: "1",
      amount: "",
      currency: "INR",
      remarks: "",
      grace_period: "0",
      grace_end_date: "",
      due_date: "",
    })
  }

      const handleViewDetails = (item: DomainRecord) => {
    setExpandedRowId((prev) => (prev === item.id ? null : item.id));
  };
  // Save New Record
  const handleSaveNew = async () => {
    try {
      setIsSaving(true)
      
      const clientId = isClient ? user?.id : newRecordData.client_id;

      if (!newRecordData.name || !newRecordData.product_id || !clientId || 
          !newRecordData.vendor_id || !newRecordData.renewal_date) {
        toast({
          title: "Error",
          description: "Please fill all required fields (Domain Name, Product, Client, Vendor, Renewal Date)",
          variant: "destructive"
        })
        return
      }

      const payload = {
        ...normalizeEntityPayload(newRecordData),
        client_id: isClient ? user?.id : newRecordData.client_id,
        record_type: 4,
        s_id: user?.id || 0,
        domain_protected: parseInt(newRecordData.domain_protected as string) as 0 | 1,
        status: parseInt(newRecordData.status as string) as 0 | 1,
        deletion_date: newRecordData.deletion_date || null,
        days_left: newRecordData.days_left || null,
        days_to_delete: newRecordData.days_to_delete || null,
        amount: parseFloat(newRecordData.amount as string) || 0,
        currency: newRecordData.currency || "INR",
      }

      const response = await api.post('secure/domains', payload, { headers: { Authorization: `Bearer ${token}` } })
      if (response.status === 200 || response.status === 201 || response.data?.status === true) {
        toast({
          title: "Success",
          description: response.data?.message || "Domain record added successfully",
          variant: "default"
        })
        setAddingNew(false)
        
        // Use the returned record or build one optimistically
        const newRecord = response.data?.data || {
          ...payload,
          id: response.data?.id || Date.now(),
          product_name: newRecordData.product_name,
          client_name: newRecordData.client_name,
          vendor_name: newRecordData.vendor_name,
          isNewRecord: true,
        };

        setData((prev) => [newRecord, ...prev]);
        emitEntityChange('domain', 'create', newRecord);
        setTotalItems((prev) => prev + 1);

        const newId = newRecord.id;
        setHighlightedRecordId(newId);
        window.scrollTo({ top: 0, behavior: "smooth" });

        setTimeout(() => setHighlightedRecordId(null), 2000);
        // Reset form
        setNewRecordData({
          name: "",
          product_id: null,
          product_name: "",
          client_id: null,
          client_name: "",
          vendor_id: null,
          vendor_name: "",
          renewal_date: new Date().toISOString().split('T')[0],
          deletion_date: "",
          days_to_delete: "",
          days_left: "0",
          domain_protected: "1",
          status: "1",
          amount: "",
          currency: "INR",
          remarks: "",
          grace_period: "0",
          grace_end_date: "",
          due_date: "",
        })
      } else {
        toast({
          title: "Error",
          description: response.data?.message || "Failed to add domain record. Please check the data.",
          variant: "destructive"
        })
      }
    } catch (error: any) {
      console.warn("Backend Error:", error?.response?.data?.message || error?.message)
      const errorMsg = error.response?.data?.message || error.message || "An unexpected error occurred.";
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Handle Edit
  const handleEdit = (record: DomainRecord) => {
    let graceEndDate = "";
    if (record.grace_period && record.renewal_date) {
      const date = new Date(record.renewal_date);
      if (!isNaN(date.getTime())) {
        date.setDate(date.getDate() + Number(record.grace_period));
        graceEndDate = date.toISOString().split('T')[0];
      }
    }

    setEditingId(record.id)
    setEditData({
      [record.id]: { 
        ...record,
        product_id: record.product_id || undefined,
        client_id: record.client_id || undefined,
        vendor_id: record.vendor_id || undefined,
        renewal_date: record.renewal_date || "",
        remarks: record.remarks || "",
        remark_id: record?.latest_remark?.id || null,
        domain_protected: (record.domain_protected ?? "1").toString() as "0" | "1",
        deletion_date: record.deletion_date || null,
        days_to_delete: record.days_to_delete ?? null,
        amount: record.amount ?? 0,
        currency: record.currency || "INR",
        ...(graceEndDate ? { grace_end_date: graceEndDate } : {}) as any
      }
    })
  }

  // Handle Save (inline editing)
  const handleSave = async (id: number) => {
    try {
      setIsSaving(true)
      const updatedData = editData[id]
      
      if (!updatedData) return
      
      if (!updatedData.product_id || !updatedData.client_id || 
          !updatedData.vendor_id || !updatedData.renewal_date) {
        toast({
          title: "Error",
          description: "Please fill all required fields (Domain Name, Client, Vendor, Renewal Date)",
          variant: "destructive"
        })
        return
      }

      const originalRecord = data.find(item => item.id === id);
      
      // Calculate which fields actually changed
      const changedFields: any = {};
      Object.keys(updatedData).forEach(key => {
        const k = key as keyof DomainRecord;
        if (updatedData[k] !== originalRecord?.[k]) {
          changedFields[k] = updatedData[k];
        }
      });

      const payload: any = {
        id,
        s_id: user?.id || 0,
        record_type: 4,
        ...normalizeEntityPayload(changedFields),
      }

      // Ensure essential fields for the backend logic are present if they were changed or are needed
      if (updatedData.domain_protected !== undefined) {
          payload.domain_protected = parseInt(updatedData.domain_protected as any) as 0 | 1;
      }
      if (updatedData.status !== undefined) {
          payload.status = parseInt(updatedData.status as any) as 0 | 1;
      }
      if (updatedData.amount !== undefined) payload.amount = updatedData.amount;
      if (updatedData.currency !== undefined) payload.currency = updatedData.currency;
      if (updatedData.renewal_date !== undefined) payload.renewal_date = updatedData.renewal_date;

      console.log("Domain Update Request (Changed Fields Only):", { url: `domains/${id}`, payload });

      const response = await api.put(`domains/${id}`, payload, { headers: { Authorization: `Bearer ${token}` } })
      
      console.log("Domain Update Response:", response.data);

      if (response.status === 200 || response.status === 201 || response.data?.status === true) {
        toast({
          title: "Success",
          description: response.data?.message || "Domain record updated successfully",
          variant: "default"
        })
        setEditingId(null)
        setEditData({})
        await fetchDomainRecords()
      } else {
        toast({
          title: "Error",
          description: response.data?.message || "Failed to update domain record",
          variant: "destructive"
        })
      }
    } catch (error: any) {
      console.error("Domain Update API Error:", error);
      console.warn("Backend Error:", error?.response?.data?.message || error?.message)
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to update domain record",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Cancel Edit
  const handleCancelEdit = () => {
    setEditingId(null)
    setEditData({})
  }

  const handleExport = async () => {
    try {
      setExportLoading(true);

      const payload: any = {
        record_type: 4,
        s_id: user?.id || 0,
      };

      const response = await apiService.exportRecord(payload, user, token);

      if ((response as any).success) {
        toast({
          title: "Success",
          description: response.data?.message || "Domain exported successfully",
          variant: "default",
        });
        downloadBase64File(response.data.base64, response.data.filename);
      } else {
        toast({
          title: "Error",
          description: response.data?.message || "Failed to export domain",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error exporting domain:", error);
      toast({
        title: "Error",
        description: "Failed to export domain",
        variant: "destructive",
      });
    } finally {
      setExportLoading(false);
    }
  };

  // Handle field change for editing
  const handleEditChange = (id: number, field: keyof DomainRecord | "grace_end_date", value: any) => {
    let extraData: any = {};
    if (field === "renewal_date" || field === "deletion_date") {
      const currentRow = editData[id] || {};
      const actualRow = data.find((d) => d.id === id) || ({} as any);
      const currentRenewal = field === "renewal_date" ? value : (currentRow.renewal_date ?? actualRow.renewal_date);
      const currentDeletion = field === "deletion_date" ? value : (currentRow.deletion_date ?? actualRow.deletion_date);
      
      extraData = handleDateChangeLogic(field as any, value, currentRenewal, currentDeletion, toast) || {};
    }

    setEditData(prev => {
      const currentEntry = prev[id] || {};
      const actualRow = data.find((d) => d.id === id) || ({} as any);
      
      const newData = {
        ...currentEntry,
        [field]: value,
        ...extraData
      };

      if (field === "renewal_date" || field === "grace_end_date") {
        const renewalDate = field === "renewal_date" ? value : (newData.renewal_date ?? actualRow.renewal_date);
        const graceEnd = field === "grace_end_date" ? value : (newData as any).grace_end_date;
        const gp = calculateGraceDaysFromDate(renewalDate, graceEnd);
        newData.grace_period = gp;
        newData.due_date = calculateDueDate(renewalDate, gp) || "";
      }

      return {
        ...prev,
        [id]: newData
      };
    })
  }

  // Handle field change for new record
  const handleNewRecordChange = (field: keyof typeof newRecordData | "grace_end_date", value: any) => {
    let extraData: any = {};
    if (field === "renewal_date" || field === "deletion_date") {
      const currentRenewal = field === "renewal_date" ? value : newRecordData.renewal_date;
      const currentDeletion = field === "deletion_date" ? value : newRecordData.deletion_date;
      extraData = handleDateChangeLogic(field as any, value, currentRenewal, currentDeletion, toast) || {};
    }

    setNewRecordData(prev => {
      const newData = { ...prev, [field]: value, ...extraData };
      if (field === "renewal_date" || field === "grace_end_date") {
        const currentGraceEnd = field === "grace_end_date" ? value : (newData as any).grace_end_date;
        const gp = calculateGraceDaysFromDate(newData.renewal_date, currentGraceEnd);
        newData.grace_period = String(gp);
        newData.due_date = calculateDueDate(newData.renewal_date, gp) || "";
      }
      return newData;
    })
  }

  // Handle Delete
  const handleDeleteClick = (id: number) => {
    setItemToDelete(id)
    setShowDeleteModal(true)
  }

  const handleBulkDeleteClick = () => {
    if (selectedItems.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one domain record",
        variant: "destructive"
      })
      return
    }
    setItemToDelete(null)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    try {
      setIsDeleting(true)
      const idsToDelete = itemToDelete ? [itemToDelete] : selectedItems
      let deleteSuccessCount = 0
      let deleteErrorMsg = ""
      for (const delId of idsToDelete) {
        try {
          const res = await api.delete(`domains/${delId}`, { headers: { Authorization: `Bearer ${token}` } })
          if (res.data?.status || res.status === 200 || res.status === 204) deleteSuccessCount++
        } catch (e: any) {
          deleteErrorMsg = e.response?.data?.message || "Error deleting"
        }
      }
      if (deleteSuccessCount > 0) {
        toast({
          title: "Success",
          description: `Successfully deleted ${deleteSuccessCount} record(s)`,
          variant: "default"
        })
        setSelectedItems([])
        setItemToDelete(null)
        await fetchDomainRecords()
      } else {
        toast({
          title: "Error",
          description: deleteErrorMsg || "Failed to delete record(s)",
          variant: "destructive"
        })
      }
    } catch (error: any) {
      console.warn("Backend Error:", error?.response?.data?.message || error?.message)
      toast({
        title: "Error",
        description: "Failed to delete record(s)",
        variant: "destructive"
      })
    } finally {
      setIsDeleting(false)
      setShowDeleteModal(false)
    }
  }

    const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  // Handle Select All
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(data.map(item => item.id))
    } else {
      setSelectedItems([])
    }
  }

  const handleSelectItem = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedItems(prev => [...prev, id])
    } else {
      setSelectedItems(prev => prev.filter(itemId => itemId !== id))
    }
  }

  const isAllSelected = data.length > 0 && selectedItems.length === data.length

  const getStatusColor = (status: 0 | 1 | "0" | "1") => {
    return Number(status) === 1 ? 'text-green-400' : 'text-red-400'
  }

  const getStatusText = (status: 0 | 1 | "0" | "1") => {
    return Number(status) === 1 ? 'Active' : 'Inactive'
  }

  const getStatusIcon = (status: 0 | 1 | "0" | "1") => {
    return Number(status) === 1 ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />
  }

  const getDomainProtectColor = (protectedStatus: 0 | 1 | "0" | "1") => {
    return Number(protectedStatus) === 1 ? 'text-green-400' : 'text-yellow-400'
  }

  const getDomainProtectText = (protectedStatus: 0 | 1 | "0" | "1") => {
    return Number(protectedStatus) === 1 ? 'Yes' : 'No'
  }

  const getDomainProtectIcon = (protectedStatus: 0 | 1 | "0" | "1") => {
    return Number(protectedStatus) === 1 ? <Lock className="w-4 h-4" /> : <Shield className="w-4 h-4" />
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  // Calculate days until expiry
  const calculateDays = (expiryDate: string) => {
    try {
      const today = new Date()
      const expiry = new Date(expiryDate)
      const diffTime = expiry.getTime() - today.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays
    } catch {
      return 0
    }
  }

  const startItem = pagination.page * pagination.rowsPerPage + 1

  return (
    <div className="min-h-screen pb-8">
      <Header title="Domain Management" tabs={navigationTabs} />

      <div className="px-4 sm:px-6 mt-6">
        <GlassCard className="p-6 backdrop-blur-xl bg-gradient-to-br from-gray-900/80 via-black/80 to-gray-900/80 border border-white/10 shadow-2xl">
          {/* Header with Search and Add Button */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <Globe className="w-6 h-6 text-[#CB8959]" />
                <h2 className="text-xl font-semibold text-white">Domains</h2>
              </div>
              <p className="text-sm text-gray-400 mt-1">
                Manage your domain registrations and expiration dates
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search domains..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-64 pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/30 backdrop-blur-sm transition-all"
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
                    Add Domain
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
                <ImportModal recordType={4} title="Import Domains" isOpen={isImportOpen} setIsOpen={setIsImportOpen} onSuccess={handleImportSuccess} module="domains" />
                <HistoryModal isOpen={isHistoryOpen} setIsOpen={setIsHistoryOpen} entity="domain" />
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-hidden rounded-xl border border-white/10 backdrop-blur-sm">
            {/* Table */}
            <div className="overflow-x-auto">
              <table className={`w-full ${isClient ? 'min-w-[1000px]' : 'min-w-[2000px]'}`}>
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
                    <th className={`py-3 px-4 text-left text-sm font-medium text-gray-300 ${isClient ? 'w-[300px]' : 'w-[300px]'}`}>
                      {isClient ? 'Domain' : 'Domain Name'}
                    </th>
                    <th className={`py-3 px-4 text-left text-sm font-medium text-gray-300 ${isClient ? 'w-[300px]' : 'w-[300px]'}`}>
                      Product
                    </th>
                    {user?.role === "SuperAdmin" && (
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 w-[250px]">
                        Client
                      </th>
                    )}
                    {user?.role === "SuperAdmin" && (
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 w-[220px]">
                        Vendor
                      </th>
                    )}
                    {user?.role === "SuperAdmin" && (
                      <th className="py-3 px-4 text-center text-sm font-medium text-gray-300 w-[120px]">
                        Amount
                      </th>
                    )}
                    <th className={`py-3 px-4 text-center text-sm font-medium text-gray-300 ${isClient ? 'w-[140px]' : 'w-[140px]'}`}>
                      Renewal Date
                    </th>
                    <th className={`py-3 px-4 text-center text-sm font-medium text-gray-300 ${isClient ? 'w-[120px]' : 'w-[120px]'}`}>
                      Days to Expire
                    </th>
                    {user?.role === "SuperAdmin" && (
                      <th className="py-3 px-4 text-center text-sm font-medium text-gray-300 w-[140px]">
                        Deletion Date
                      </th>
                    )}
                    {user?.role === "SuperAdmin" && (
                      <th className="py-3 px-4 text-center text-sm font-medium text-gray-300 w-[120px]">
                        Days to Delete
                      </th>
                    )}
                    {user?.role === "SuperAdmin" && (
                      <>
                        <th className="py-3 px-4 text-center text-sm font-medium text-gray-300 w-[130px]">
                          Grace Period
                        </th>
                        <th className="py-3 px-4 text-center text-sm font-medium text-gray-300 w-[160px] grace-period-column">
                          Due Date
                        </th>
                      </>
                    )}
                    <th className={`py-3 px-4 text-center text-sm font-medium text-gray-300 ${isClient ? 'w-[150px]' : 'w-[150px]'}`}>
                      Domain Protect
                    </th>
                    {user?.role === "SuperAdmin" && (
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 w-[160px] remarks-column">
                        Remarks
                      </th>
                    )}
                    {user?.role === "SuperAdmin" && (
                      <th className="py-3 px-4 text-center text-sm font-medium text-gray-300 w-[180px]">
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
                      <td colSpan={isClient ? 6 : (user?.role === "SuperAdmin" ? 15 : 14)} className="py-8 text-center text-gray-400 font-medium text-sm">
                        <div className="flex flex-col items-center justify-center gap-2">
                         <DashboardLoader label="Loading domain records..." />
                        </div>
                      </td>
                    </tr>
                  ) : (<React.Fragment>
                      {/* Add New Row */}
                      {addingNew && (
                        <tr key="new-row" className="border-b border-white/5 bg-blue-500/5">
                          {user?.role === "SuperAdmin" && <td className="py-3 px-4 overflow-hidden"></td>}
                          <td className="py-3 px-4 text-sm text-gray-300">
                            New
                          </td>
                          <td className="py-3 px-4 overflow-hidden">
                            <input
                              type="text"
                              value={newRecordData.name}
                              onChange={(e) => handleNewRecordChange("name", e.target.value)}
                              placeholder="Domain Name (e.g. google.com)"
                              className="w-full px-2 py-1 bg-white/5 border border-blue-500/30 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/30 backdrop-blur-sm"
                              style={{ minHeight: "32px" }}
                            />
                          </td>
                          {user?.role === "SuperAdmin" && (
                            <td className="py-3 px-4 overflow-hidden">
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
                          )}
                          {user?.role === "SuperAdmin" && (
                            <td className="py-3 px-4 overflow-hidden">
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
                          )}
                          {user?.role === "SuperAdmin" && (
                            <td className="py-3 px-4 overflow-hidden">
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
                          {user?.role === "SuperAdmin" && (
                            <td className="py-3 px-4 overflow-hidden pr-[50px]">
                              <CurrencyAmountInput
                                currency={newRecordData.currency || "INR"}
                                amount={newRecordData.amount}
                                onCurrencyChange={(curr) => handleNewRecordChange("currency", curr)}
                                onAmountChange={(val) => handleNewRecordChange("amount", val)}
                              />
                            </td>
                          )}
                          <td className="py-3 px-4 overflow-hidden">
                            <input
                              type="date"
                              value={newRecordData.renewal_date}
                              onChange={(e) => handleNewRecordChange('renewal_date', e.target.value)}
                              className="w-full px-2 py-1 bg-white/5 border border-blue-500/30 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/30 backdrop-blur-sm"
                              style={{ minHeight: '32px' }}
                            />
                          </td>
                          <td className="py-3 px-4 overflow-hidden">
                            <input
                              type="text"
                              value={newRecordData.days_left ?? ""}
                              readOnly
                              className={`w-full px-2 py-1 bg-white/10 border border-white/10 rounded text-sm cursor-not-allowed ${getDaysToColor(newRecordData.days_left)}`}
                              style={{ minHeight: '32px' }}
                            />
                          </td>
                          <td className="py-3 px-4 overflow-hidden">
                            <input
                              type="date"
                              value={newRecordData.deletion_date}
                              onChange={(e) => handleNewRecordChange("deletion_date", e.target.value)}
                              className="w-full px-2 py-1 bg-white/5 border border-blue-500/30 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/30 backdrop-blur-sm"
                              style={{ minHeight: "32px" }}
                            />
                          </td>
                          {user?.role === "SuperAdmin" && (
                            <td className="py-2 px-4 whitespace-nowrap">
                              <input
                                type="text"
                                value={newRecordData.days_to_delete ?? ""}
                                readOnly
                                className={`w-20 px-3 py-1 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded text-sm outline-none focus:ring-0 cursor-not-allowed ${getDaysToColor(newRecordData.days_to_delete)}`}
                              />
                            </td>
                          )}
                          {user?.role === "SuperAdmin" && (
                            <>
                              <td className="py-3 px-4 overflow-hidden">
                                <input
                                  type="date"
                                  value={(newRecordData as any).grace_end_date || ""}
                                  onChange={(e) => handleNewRecordChange("grace_end_date" as any, e.target.value)}
                                  min={newRecordData.renewal_date || undefined}
                                  className="w-full px-2 py-1 bg-white/5 border border-blue-500/30 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/30 backdrop-blur-sm"
                                  style={{ minHeight: "32px" }}
                                />
                              </td>
                              <td className="py-3 px-4 overflow-hidden grace-period-column">
                                {newRecordData.grace_period && Number(newRecordData.grace_period) > 0 ? (
                                  <div className={`px-2 py-1 rounded-md text-xs font-medium border inline-flex items-center justify-center bg-blue-500/10 border-blue-500/20 ${getDaysToColor(newRecordData.grace_period)}`}>
                                    {newRecordData.grace_period} days
                                  </div>
                                ) : (
                                  <span className="text-gray-500 text-xs">--</span>
                                )}
                              </td>
                            </>
                          )}
                          <td className="py-1 px-2">
                            <div className="w-40">
                              <GlassSelect
                                options={domainProtectOptions}
                                value={
                                  domainProtectOptions.find(opt => opt.value === newRecordData.domain_protected) || null
                                }
                                onChange={(selected: any) =>
                                  handleNewRecordChange(
                                    "domain_protected",
                                    selected?.value as "1" | "0"
                                  )
                                }
                                isSearchable={false}
                                placeholder="Protect Status"
                                styles={glassSelectStyles}
                              />
                            </div>
                          </td>
                          {user?.role === "SuperAdmin" && (
                            <td className="py-3 px-4 overflow-hidden remarks-column">
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
                            <td className="py-3 px-4 text-sm text-gray-400">
                              - -
                            </td>
                          )}
                          {user?.role === "SuperAdmin" && (
                            <td className="py-3 px-4 overflow-hidden text-ellipsis whitespace-nowrap">
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
                      {data.length === 0 ? (
                        <tr key="empty-row">
                          <td colSpan={isClient ? 6 : (user?.role === "SuperAdmin" ? 14 : 13)} className="py-8 text-center">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <Globe className="w-12 h-12 text-gray-400" />
                              <span className="text-gray-400">No domain records found</span>
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
                           <React.Fragment key={item.id}>
                             <tr
                            key={item.id}
                            className={`border-b border-white/5 transition-all duration-1000 ${
                              highlightedRecordId === item.id
                                ? "bg-blue-500/20 shadow-[inset_0_0_10px_rgba(59,130,246,0.3)]"
                                : editingId === item.id 
                                  ? "bg-blue-500/5 hover:bg-white/[0.02]"
                                  : "hover:bg-white/[0.02]"
                            }`}
                          >
                            {user?.role === "SuperAdmin" && (
                              <td className="py-3 px-4 overflow-hidden text-ellipsis whitespace-nowrap">
                                <input
                                  type="checkbox"
                                  checked={selectedItems.includes(item.id)}
                                  onChange={(e) => handleSelectItem(item.id, e.target.checked)}
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
                                <td className="py-3 px-4 overflow-hidden text-ellipsis whitespace-nowrap">
                                  <input
                                    type="text"
                                    value={editData[item.id]?.name ?? item.name ?? ""}
                                    onChange={(e) => handleEditChange(item.id, "name", e.target.value)}
                                    className="w-full px-2 py-1 bg-white/5 border border-blue-500/30 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/30 backdrop-blur-sm"
                                    style={{ minHeight: "32px" }}
                                  />
                                </td>
                                <td className="py-3 px-4 overflow-hidden text-ellipsis whitespace-nowrap">
                                  <ApiDropdown
                                    endpoint="get-products"
                                    value={
                                      editData[item.id]?.product_id
                                        ? {
                                            value: editData[item.id]?.product_id!,
                                            label: editData[item.id]?.product_name || "",
                                          }
                                        : null
                                    }
                                    onChange={(option) => {
                                      handleEditChange(item.id, "product_id", option?.value ?? null);
                                      handleEditChange(item.id, "product_name", option?.label ?? "");
                                    }}
                                    placeholder="Product"
                                    className="min-h-[32px]"
                                  />
                                </td>
                                  {user?.role === "SuperAdmin" && (
                                    <td className="py-3 px-4 overflow-hidden text-ellipsis whitespace-nowrap">
                                      <ApiDropdown
                                        endpoint="get-clients"
                                        value={
                                          editData[item.id]?.client_id
                                            ? {
                                                value: editData[item.id]?.client_id!,
                                                label: editData[item.id]?.client_name || "",
                                              }
                                            : null
                                        }
                                        onChange={(option) => {
                                          handleEditChange(item.id, "client_id", option?.value ?? null);
                                          handleEditChange(item.id, "client_name", option?.label ?? "");
                                        }}
                                        placeholder="Client"
                                        className="min-h-[32px]"
                                      />
                                    </td>
                                  )}
                                {user?.role === "SuperAdmin" && (
                                  <td className="py-3 px-4 overflow-hidden text-ellipsis whitespace-nowrap">
                                    <ApiDropdown
                                      endpoint="get-venders"
                                      value={
                                        editData[item.id]?.vendor_id
                                          ? {
                                              value: editData[item.id]?.vendor_id!,
                                              label: editData[item.id]?.vendor_name || "",
                                            }
                                          : null
                                      }
                                      onChange={(option) => {
                                        handleEditChange(item.id, "vendor_id", option?.value ?? null);
                                        handleEditChange(item.id, "vendor_name", option?.label ?? "");
                                      }}
                                      placeholder="Vendor"
                                      className="min-h-[32px]"
                                    />
                                  </td>
                                )}
                                {user?.role === "SuperAdmin" && (
                                  <td className="py-3 px-4 overflow-hidden text-ellipsis whitespace-nowrap pr-[50px]">
                                    <CurrencyAmountInput
                                      currency={editData[item.id]?.currency || item.currency || "INR"}
                                      amount={editData[item.id]?.amount ?? item.amount ?? ""}
                                      onCurrencyChange={(curr) => handleEditChange(item.id, "currency", curr)}
                                      onAmountChange={(val) => handleEditChange(item.id, "amount", parseFloat(val) || 0)}
                                    />
                                  </td>
                                )}
                                <td className="py-3 px-4 overflow-hidden text-ellipsis whitespace-nowrap">
                                  <input
                                    type="date"
                                    value={editData[item.id]?.renewal_date || item.renewal_date || ""}
                                    onChange={(e) => handleEditChange(item.id, 'renewal_date', e.target.value)}
                                    className="w-full px-2 py-1 bg-white/5 border border-blue-500/30 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/30 backdrop-blur-sm"
                                    style={{ minHeight: "32px" }}
                                  />
                                </td>
                                <td className="py-3 px-4 overflow-hidden text-ellipsis whitespace-nowrap">
                                  <input
                                    type="text"
                                    value={editData[item.id]?.days_left ?? item.days_left ?? ""}
                                    readOnly
                                    className={`w-full px-2 py-1 bg-white/10 border border-white/10 rounded text-sm cursor-not-allowed ${getDaysToColor(editData[item.id]?.days_left ?? item.days_left)}`}
                                    style={{ minHeight: '32px' }}
                                  />
                                </td>
                                {user?.role === "SuperAdmin" && (
                                  <td className="py-3 px-4 overflow-hidden text-ellipsis whitespace-nowrap">
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
                                      type="text"
                                      value={editData[item.id]?.days_to_delete ?? item.days_to_delete ?? ""}
                                      readOnly
                                      className={`w-20 px-3 py-1 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded text-sm outline-none focus:ring-0 cursor-not-allowed ${getDaysToColor(editData[item.id]?.days_to_delete ?? item.days_to_delete)}`}
                                    />
                                  </td>
                                )}
                                {user?.role === "SuperAdmin" && (
                                  <>
                                    <td className="py-3 px-4 overflow-hidden text-ellipsis whitespace-nowrap">
                                      <input
                                        type="date"
                                        value={(editData[item.id] as any)?.grace_end_date || ""}
                                        onChange={(e) => handleEditChange(item.id, "grace_end_date" as any, e.target.value)}
                                        min={editData[item.id]?.renewal_date || item.renewal_date || undefined}
                                        className="w-full px-2 py-1 bg-white/5 border border-blue-500/30 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/30 backdrop-blur-sm"
                                        style={{ minHeight: "32px" }}
                                      />
                                    </td>
                                    <td className="py-3 px-4 overflow-hidden text-ellipsis whitespace-nowrap grace-period-column">
                                      {(() => {
                                        const gp = editData[item.id]?.grace_period ?? item.grace_period ?? 0;
                                        return Number(gp) > 0 ? (
                                          <div className={`px-[10px] py-[6px] min-w-[110px] rounded-md text-xs font-medium border inline-flex items-center justify-center bg-blue-500/10 border-blue-500/20 ${getDaysToColor(gp)}`}>
                                            {gp} days
                                          </div>
                                        ) : (
                                          <span className="text-gray-500 text-xs">--</span>
                                        );
                                      })()}
                                    </td>
                                  </>
                                )}
                                <td className="py-1 px-2">
                                  <div className="w-full">
                                    <GlassSelect
                                      options={domainProtectOptions}
                                      value={domainProtectOptions.find(opt => opt.value === String(editData[item.id]?.domain_protected ?? item.domain_protected)) || null}
                                      onChange={(selected: any) => handleEditChange(item.id, "domain_protected", selected?.value as "1" | "0")}
                                      isSearchable={false}
                                      placeholder="Protect Status"
                                      styles={glassSelectStyles}
                                    />
                                  </div>
                                </td>
                                  <td className="py-3 px-4 overflow-hidden text-ellipsis whitespace-nowrap remarks-column">
                                    <input
                                      type="text"
                                      value={editData[item.id]?.remarks || (item?.latest_remark?.remark as string) || ''}
                                      onChange={(e) => handleEditChange(item.id, "remarks", e.target.value)}
                                      className="w-full px-2 py-1 bg-white/5 border border-blue-500/30 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/30 backdrop-blur-sm"
                                      style={{ minHeight: "32px" }}
                                    />
                                  </td>
                                {user?.role === "SuperAdmin" && (
                                  <td className="py-3 px-4 text-sm text-gray-300 whitespace-nowrap">
                                    {(item as any).last_updated || formatLastUpdated(item.updated_at)}
                                  </td>
                                )}
                              </>
                            ) : (
                              <>
                                <td className="py-3 px-4 overflow-hidden text-ellipsis whitespace-nowrap">
                                  <div className="flex items-center gap-2">
                                    <Globe className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                    <span className="text-sm text-white font-medium">
                                      {item.name || item.domain_name || "N/A"}
                                    </span>
                                  </div>
                                </td>
                                 <td className="py-3 px-4 overflow-hidden text-ellipsis whitespace-nowrap">
                                   <div className="flex items-center gap-2">
                                     <Package className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                     <span className="text-sm text-white font-medium">
                                       {item.product_name || "N/A"}
                                     </span>
                                   </div>
                                 </td>
                                {user?.role === "SuperAdmin" && (
                                  <td className="py-3 px-4 text-sm text-gray-300">
                                    {item.client_name || "--"}
                                  </td>
                                )}
                                {user?.role === "SuperAdmin" && (
                                  <td className="py-3 px-4 text-sm text-gray-300">
                                    {item.vendor_name || "--"}
                                  </td>
                                )}
                                {user?.role === "SuperAdmin" && (
                                  <td className="py-3 px-4 text-center overflow-hidden text-ellipsis whitespace-nowrap">
                                    <div className="inline-flex items-center justify-center gap-[6px] font-medium text-white">
                                      <span className="text-[#BC8969]">{getCurrencySymbol(item.currency)}</span>
                                      {item.amount || "0.00"}
                                    </div>
                                  </td>
                                )}
                                <td className="py-3 px-4 text-center overflow-hidden text-ellipsis whitespace-nowrap">
                                  {item.renewal_date ? formatDate(item.renewal_date) : "--"}
                                </td>
                                <td className="py-3 px-4 text-center overflow-hidden text-ellipsis whitespace-nowrap">
                                  <div className={`inline-flex items-center justify-center px-[10px] py-[6px] min-w-[110px] rounded-full text-xs font-medium backdrop-blur-sm border ${getDaysToColor(item.days_left)}`}>
                                    {item.days_left ?? "--"}
                                  </div>
                                </td>
                                 {user?.role === "SuperAdmin" && (
                                   <td className="py-3 px-4 text-center overflow-hidden text-ellipsis whitespace-nowrap">
                                     {item.deletion_date ? formatDate(item.deletion_date) : "--"}
                                   </td>
                                 )}
                                {user?.role === "SuperAdmin" && (
                                  <td className="py-3 px-4 text-center whitespace-nowrap">
                                    <span className={`text-sm ${getDaysToColor(item.days_to_delete)}`}>
                                      {item.days_to_delete ?? "--"}
                                    </span>
                                  </td>
                                )}
                                {user?.role === "SuperAdmin" && (
                                  <>
                                    <td className="py-3 px-4 text-center overflow-hidden text-ellipsis whitespace-nowrap">
                                      {(() => {
                                        if (!item.renewal_date || !item.grace_period) return "--";
                                        const date = new Date(item.renewal_date);
                                        if (isNaN(date.getTime())) return "--";
                                        date.setDate(date.getDate() + Number(item.grace_period));
                                        return formatDate(date.toISOString().split('T')[0]);
                                      })()}
                                    </td>
                                    <td className="py-3 px-4 overflow-hidden whitespace-nowrap">
                                      {item.grace_period && Number(item.grace_period) > 0 ? (
                                        <div className={`px-[10px] py-[6px] min-w-[110px] rounded-md text-xs font-medium border inline-flex items-center justify-center bg-blue-500/10 border-blue-500/20 ${getDaysToColor(item.grace_period)}`}>
                                          {item.grace_period} days
                                        </div>
                                      ) : (
                                        <span className="text-gray-500 text-xs">--</span>
                                      )}
                                    </td>
                                  </>
                                )}
                                 <td className="py-3 px-4 text-center">
                                   <div className={`inline-flex items-center justify-center px-[10px] py-[6px] min-w-[110px] rounded-full text-xs font-medium backdrop-blur-sm border ${
                                     Number(item.domain_protected) === 1 ? 'bg-green-500/20 text-green-400 border-green-500/20' : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/20'
                                   }`}>
                                     {getDomainProtectText(item.domain_protected)}
                                   </div>
                                 </td>
                                {user?.role === "SuperAdmin" && (
                                  <td className="py-3 px-4 overflow-hidden text-ellipsis whitespace-nowrap">
                                    <div className="flex items-center justify-between gap-2 overflow-hidden">
                                      <span className="text-sm text-gray-300 truncate max-w-[150px]">
                                        {(item?.latest_remark?.remark as string) || (item.remarks as string) || '--'}
                                      </span>
                                      {item.has_remark_history && (
                                        <button
                                          onClick={() => toggleRemarkHistory(item.id)}
                                          className={`p-1 rounded-full transition-all duration-300 ${
                                            expandedRemarks.has(item.id) 
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
                              <td className="py-3 px-4 text-right">
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
                              <td colSpan={isClient ? 6 : (user?.role === "SuperAdmin" ? 14 : 13)} className="py-4 px-6">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-black/20 p-4 rounded-xl border border-white/5 shadow-inner">
                                  <div><span className="block text-xs text-gray-400 mb-1 text-left">Domain Name</span><span className="block text-sm text-gray-200 font-medium text-left">{item.domain_name || "--"}</span></div>
                                  <div><span className="block text-xs text-gray-400 mb-1 text-left">Client Name</span><span className="block text-sm text-gray-200 font-medium text-left">{item.client_name || "--"}</span></div>
                                  <div><span className="block text-xs text-gray-400 mb-1 text-left">Product</span><span className="block text-sm text-gray-200 font-medium text-left">{item.product_name || "--"}</span></div>
                                  <div><span className="block text-xs text-gray-400 mb-1 text-left">Vendor</span><span className="block text-sm text-gray-200 font-medium text-left">{item.vendor_name || "--"}</span></div>
                                  <div><span className="block text-xs text-gray-400 mb-1 text-left">Amount</span><span className="block text-sm text-gray-200 font-medium text-left">{(item as any).amount !== undefined ? (item as any).amount : "--"}</span></div>
                                  <div><span className="block text-xs text-gray-400 mb-1 text-left">Renewal Date</span><span className="block text-sm text-gray-200 font-medium text-left">{formatDate((item as any).renewal_date)}</span></div>
                                   <div><span className="block text-xs text-gray-400 mb-1 text-left">Deletion Date</span><span className="block text-sm text-gray-200 font-medium text-left">{formatDate((item as any).deletion_date)}</span></div>
                                  {user?.role === "SuperAdmin" && (
                                    <>
                                      <div><span className="block text-xs text-gray-400 mb-1 text-left">Grace Period</span><span className="block text-sm text-gray-200 font-medium text-left">
                                        {item.grace_period && Number(item.grace_period) > 0 ? (
                                          <div className={`px-2 py-1 mt-1 rounded-md text-xs font-medium border inline-flex items-center justify-center bg-blue-500/10 border-blue-500/20 ${getDaysToColor(item.grace_period)}`}>
                                            {item.grace_period} days
                                          </div>
                                        ) : (
                                          <span className="text-gray-500 text-xs">--</span>
                                        )}
                                      </span></div>
                                      <div><span className="block text-xs text-gray-400 mb-1 text-left">Due Date</span><span className="block text-sm text-gray-200 font-medium text-left">
                                        {(() => {
                                          if (!item.renewal_date || !item.grace_period) return "--";
                                          const date = new Date(item.renewal_date);
                                          if (isNaN(date.getTime())) return "--";
                                          date.setDate(date.getDate() + Number(item.grace_period));
                                          return formatDate(date.toISOString());
                                        })()}
                                      </span></div>
                                    </>
                                  )}
                                  <div><span className="block text-xs text-gray-400 mb-1 text-left">Remarks</span><span className="block text-sm text-gray-200 font-medium text-left">{(item as any).remarks || "--"}</span></div>
                                </div>
                              </td>
                            </tr>
                          )}
                          {/* Expanded Remark History - Inline Stack Style */}
                          {expandedRemarks.has(item.id) && (
                            <tr key={`history-${item.id}`} className="bg-blue-500/5 animate-in fade-in slide-in-from-top-4 duration-500">
                              <td colSpan={isClient ? 6 : (user?.role === "SuperAdmin" ? 14 : 13)} className="py-0 px-4">
                                <div className="border-t border-blue-500/20 py-4 pb-6 ml-12 mr-12">
                                  <RemarkHistory module="Domains" recordId={item.id} />
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
                  {selectedItems.length} domain record{selectedItems.length > 1 ? 's' : ''} selected
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
                    {isDeleting ? "Deleting..." : `Delete ${selectedItems.length} items`}
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
          setShowDeleteModal(false)
          setItemToDelete(null)
        }}
        onConfirm={confirmDelete}
        itemCount={itemToDelete ? 1 : selectedItems.length}
        isLoading={isDeleting}
        title={itemToDelete ? "Delete Domain Record" : "Delete Multiple Domain Records"}
        message={itemToDelete 
          ? "Are you sure you want to delete this domain record? This action cannot be undone."
          : "Are you sure you want to delete the selected domain records? This action cannot be undone."
        }
      />
    </div>
  )
}












// "use client"

// import { useState, useEffect } from "react"
// import { Header } from "@/components/layout"
// import { GlassCard, GlassButton, GlassInput, GlassModal } from "@/components/glass"
// import {
//   Edit,
//   Trash2,
//   Search,
//   Plus,
//   Calendar,
//   Globe,
//   Shield,
//   Package,
//   Clock,
//   CheckCircle,
//   XCircle,
//   AlertCircle
// } from "lucide-react"
// import { navigationTabs } from "@/lib/navigation"

// interface Domain {
//   id: number
//   domain: string
//   expiryDate: string
//   dateToExpire: number
//   domainProtect: boolean
//   todayDate: string
//   product: string
//   status: 'Active' | 'Expired' | 'Warning' | 'Suspended'
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

// // Calculate status based on expiration date
// const calculateStatus = (expiryDate: string): 'Active' | 'Expired' | 'Warning' | 'Suspended' => {
//   const today = new Date()
//   const expire = new Date(expiryDate)
//   const daysUntilExpire = calculateDaysBetween(today, expire)
  
//   if (daysUntilExpire < 0) return 'Expired'
//   if (daysUntilExpire <= 30) return 'Warning'
//   if (daysUntilExpire > 30) return 'Active'
//   return 'Suspended'
// }

// // Calculate days until expiration
// const calculateDateToExpire = (expiryDate: string): number => {
//   const today = new Date()
//   const expire = new Date(expiryDate)
//   return calculateDaysBetween(today, expire)
// }

// const initialData: Domain[] = [
//   {
//     id: 1,
//     domain: "example.com",
//     expiryDate: "2024-12-31",
//     dateToExpire: 60,
//     domainProtect: true,
//     todayDate: getTodayDate(),
//     product: "Premium Domain",
//     status: "Active"
//   },
//   {
//     id: 2,
//     domain: "myshop.com",
//     expiryDate: "2024-11-15",
//     dateToExpire: 15,
//     domainProtect: false,
//     todayDate: getTodayDate(),
//     product: "Business Domain",
//     status: "Warning"
//   },
//   {
//     id: 3,
//     domain: "blog-site.org",
//     expiryDate: "2024-10-01",
//     dateToExpire: -10,
//     domainProtect: true,
//     todayDate: getTodayDate(),
//     product: "Personal Domain",
//     status: "Expired"
//   },
//   {
//     id: 4,
//     domain: "api-service.net",
//     expiryDate: "2025-03-20",
//     dateToExpire: 150,
//     domainProtect: true,
//     todayDate: getTodayDate(),
//     product: "Enterprise Domain",
//     status: "Active"
//   },
//   {
//     id: 5,
//     domain: "store-app.io",
//     expiryDate: "2024-12-05",
//     dateToExpire: 35,
//     domainProtect: false,
//     todayDate: getTodayDate(),
//     product: "Startup Domain",
//     status: "Active"
//   },
//   {
//     id: 6,
//     domain: "portfolio.me",
//     expiryDate: "2024-09-20",
//     dateToExpire: -20,
//     domainProtect: true,
//     todayDate: getTodayDate(),
//     product: "Personal Domain",
//     status: "Suspended"
//   }
// ]

// export default function DomainsPage() {
//   const [data, setData] = useState<Domain[]>(initialData)
//   const [searchQuery, setSearchQuery] = useState("")
//   const [selectedItems, setSelectedItems] = useState<number[]>([])
//   const [isModalOpen, setIsModalOpen] = useState(false)
//   const [editingDomain, setEditingDomain] = useState<Domain | null>(null)
//   const [formData, setFormData] = useState({
//     domain: "",
//     expiryDate: "",
//     domainProtect: "true",
//     product: ""
//   })

//   // Update todayDate and calculations whenever data changes
//   useEffect(() => {
//     const updatedData = data.map(item => {
//       const dateToExpire = calculateDateToExpire(item.expiryDate)
//       const status = calculateStatus(item.expiryDate)
      
//       return {
//         ...item,
//         todayDate: getTodayDate(),
//         dateToExpire,
//         status
//       }
//     })
//     setData(updatedData)
//   }, [])

//   const filteredData = data.filter(item =>
//     item.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
//     item.product.toLowerCase().includes(searchQuery.toLowerCase()) ||
//     item.status.toLowerCase().includes(searchQuery.toLowerCase())
//   )

//   const handleAdd = () => {
//     setEditingDomain(null)
//     setFormData({
//       domain: "",
//       expiryDate: "",
//       domainProtect: "true",
//       product: ""
//     })
//     setIsModalOpen(true)
//   }

//   const handleEdit = (domain: Domain) => {
//     setEditingDomain(domain)
//     setFormData({
//       domain: domain.domain,
//       expiryDate: domain.expiryDate,
//       domainProtect: domain.domainProtect ? "true" : "false",
//       product: domain.product
//     })
//     setIsModalOpen(true)
//   }

//   const handleDelete = (id: number) => {
//     if (confirm("Are you sure you want to delete this domain?")) {
//       setData(data.filter(item => item.id !== id))
//       setSelectedItems(selectedItems.filter(selectedId => selectedId !== id))
//     }
//   }

//   const handleSubmit = () => {
//     const dateToExpire = calculateDateToExpire(formData.expiryDate)
//     const status = calculateStatus(formData.expiryDate)
//     const domainProtect = formData.domainProtect === "true"

//     if (editingDomain) {
//       setData(data.map(item =>
//         item.id === editingDomain.id
//           ? {
//               ...item,
//               domain: formData.domain,
//               expiryDate: formData.expiryDate,
//               domainProtect,
//               product: formData.product,
//               todayDate: getTodayDate(),
//               dateToExpire,
//               status
//             }
//           : item
//       ))
//     } else {
//       const newDomain: Domain = {
//         id: Math.max(...data.map(item => item.id)) + 1,
//         domain: formData.domain,
//         expiryDate: formData.expiryDate,
//         domainProtect,
//         product: formData.product,
//         todayDate: getTodayDate(),
//         dateToExpire,
//         status
//       }
//       setData([...data, newDomain])
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

//   const getStatusColor = (status: Domain['status']) => {
//     switch (status) {
//       case 'Active': return 'text-green-400'
//       case 'Warning': return 'text-yellow-400'
//       case 'Expired': return 'text-red-400'
//       case 'Suspended': return 'text-gray-400'
//       default: return 'text-gray-400'
//     }
//   }

//   const getStatusIcon = (status: Domain['status']) => {
//     switch (status) {
//       case 'Active': return <CheckCircle className="w-4 h-4" />
//       case 'Warning': return <AlertCircle className="w-4 h-4" />
//       case 'Expired': return <XCircle className="w-4 h-4" />
//       case 'Suspended': return <Shield className="w-4 h-4" />
//       default: return <AlertCircle className="w-4 h-4" />
//     }
//   }

//   // Sample product options
//   const productOptions = [
//     "Premium Domain",
//     "Business Domain",
//     "Personal Domain",
//     "Enterprise Domain",
//     "Startup Domain",
//     "E-commerce Domain",
//     "Blog Domain",
//     "Portfolio Domain"
//   ]

//   return (
//     <div className="min-h-screen pb-8">
//       <Header title="Domains Management" tabs={navigationTabs} />

//       <div className="px-4 sm:px-6 mt-6">
//         <GlassCard className="p-6">
//           {/* Header with Search and Add Button */}
//           <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
//             <h2 className="text-xl font-semibold text-white">Domains</h2>
//             <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
//               <div className="relative">
//                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
//                 <input
//                   type="text"
//                   placeholder="Search domains..."
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
//                 Add Domain
//               </GlassButton>
//             </div>
//           </div>

//           {/* Table */}
//           <div className="overflow-x-auto">
//             <table className="w-full min-w-[1000px]">
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
//                     Domain
//                   </th>
//                   <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-tertiary)]">
//                     Expiry Date
//                   </th>
//                   <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-tertiary)]">
//                     Days to Expire
//                   </th>
//                   <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-tertiary)]">
//                     Domain Protect
//                   </th>
//                   <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-tertiary)]">
//                     Today's Date
//                   </th>
//                   <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-tertiary)]">
//                     Product
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
//                         <Globe className="w-4 h-4 text-[var(--text-muted)]" />
//                         <span className="text-sm text-white font-medium">{item.domain}</span>
//                       </div>
//                     </td>
//                     <td className="py-3 px-4">
//                       <div className="flex items-center gap-2">
//                         <Calendar className="w-4 h-4 text-[var(--text-muted)]" />
//                         <span className="text-sm text-[var(--text-secondary)]">
//                           {new Date(item.expiryDate).toLocaleDateString('en-US', {
//                             year: 'numeric',
//                             month: 'short',
//                             day: 'numeric'
//                           })}
//                         </span>
//                       </div>
//                     </td>
//                     <td className="py-3 px-4">
//                       <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
//                         item.dateToExpire < 0 
//                           ? 'bg-red-500/20 text-red-400' 
//                           : item.dateToExpire <= 30 
//                             ? 'bg-yellow-500/20 text-yellow-400'
//                             : 'bg-green-500/20 text-green-400'
//                       }`}>
//                         <Clock className="w-3 h-3" />
//                         {item.dateToExpire >= 0 ? `${item.dateToExpire} days` : `${Math.abs(item.dateToExpire)} days ago`}
//                       </div>
//                     </td>
//                     <td className="py-3 px-4">
//                       <div className="flex items-center gap-2">
//                         <Shield className={`w-4 h-4 ${item.domainProtect ? 'text-green-400' : 'text-gray-400'}`} />
//                         <span className={`text-sm ${item.domainProtect ? 'text-green-400' : 'text-gray-400'}`}>
//                           {item.domainProtect ? 'Enabled' : 'Disabled'}
//                         </span>
//                       </div>
//                     </td>
//                     <td className="py-3 px-4">
//                       <span className="text-sm text-[var(--text-secondary)]">
//                         {new Date(item.todayDate).toLocaleDateString('en-US', {
//                           month: 'short',
//                           day: 'numeric',
//                           year: 'numeric'
//                         })}
//                       </span>
//                     </td>
//                     <td className="py-3 px-4">
//                       <div className="flex items-center gap-2">
//                         <Package className="w-4 h-4 text-[var(--text-muted)]" />
//                         <span className="text-sm text-[var(--text-secondary)]">{item.product}</span>
//                       </div>
//                     </td>
//                     <td className="py-3 px-4">
//                       <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(item.status)} bg-opacity-20 ${
//                         item.status === 'Active' ? 'bg-green-500/20' :
//                         item.status === 'Warning' ? 'bg-yellow-500/20' :
//                         item.status === 'Expired' ? 'bg-red-500/20' :
//                         'bg-gray-500/20'
//                       }`}>
//                         {getStatusIcon(item.status)}
//                         {item.status}
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
//                 {selectedItems.length} domain{selectedItems.length > 1 ? 's' : ''} selected
//               </span>
//             </div>
//           )}

//           {filteredData.length === 0 && (
//             <div className="text-center py-8">
//               <span className="text-[var(--text-muted)]">No domains found</span>
//             </div>
//           )}
//         </GlassCard>
//       </div>

//       {/* Add/Edit Modal */}
//       <GlassModal
//         isOpen={isModalOpen}
//         onClose={() => setIsModalOpen(false)}
//         title={editingDomain ? "Edit Domain" : "Add New Domain"}
//         size="lg"
//       >
//         <div className="space-y-4">
//           <div>
//             <label className="block text-[var(--text-tertiary)] text-sm mb-2">Domain Name</label>
//             <GlassInput
//               placeholder="Enter domain name (e.g., example.com)"
//               value={formData.domain}
//               onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
//             />
//           </div>
          
//           <div>
//             <label className="block text-[var(--text-tertiary)] text-sm mb-2">Expiry Date</label>
//             <GlassInput
//               type="date"
//               value={formData.expiryDate}
//               onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
//             />
//           </div>
          
//           <div>
//             <label className="block text-[var(--text-tertiary)] text-sm mb-2">Domain Protection</label>
//             <select
//               value={formData.domainProtect}
//               onChange={(e) => setFormData({ ...formData, domainProtect: e.target.value })}
//               className="w-full px-4 py-2 bg-[rgba(255,255,255,var(--ui-opacity-10))] border border-[rgba(255,255,255,var(--glass-border-opacity))] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent"
//             >
//               <option value="true">Enabled</option>
//               <option value="false">Disabled</option>
//             </select>
//           </div>
          
//           <div>
//             <label className="block text-[var(--text-tertiary)] text-sm mb-2">Product</label>
//             <select
//               value={formData.product}
//               onChange={(e) => setFormData({ ...formData, product: e.target.value })}
//               className="w-full px-4 py-2 bg-[rgba(255,255,255,var(--ui-opacity-10))] border border-[rgba(255,255,255,var(--glass-border-opacity))] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent"
//             >
//               <option value="">Select product</option>
//               {productOptions.map((product, index) => (
//                 <option key={index} value={product} className="bg-gray-800 text-white">
//                   {product}
//                 </option>
//               ))}
//             </select>
//           </div>
          
//           {/* Display-only fields (not editable in form) */}
//           <div className="pt-4 border-t border-[rgba(255,255,255,var(--glass-border-opacity))]">
//             <h4 className="text-sm font-medium text-[var(--text-tertiary)] mb-3">Auto-generated Information</h4>
//             <div className="grid grid-cols-3 gap-4 text-sm">
//               <div className="space-y-1">
//                 <div className="text-[var(--text-muted)]">Days to Expire</div>
//                 <div className={`font-medium ${
//                   formData.expiryDate 
//                     ? calculateDateToExpire(formData.expiryDate) < 0 
//                       ? 'text-red-400' 
//                       : calculateDateToExpire(formData.expiryDate) <= 30 
//                         ? 'text-yellow-400'
//                         : 'text-green-400'
//                     : 'text-white'
//                 }`}>
//                   {formData.expiryDate 
//                     ? (() => {
//                         const days = calculateDateToExpire(formData.expiryDate)
//                         return days >= 0 ? `${days} days` : `${Math.abs(days)} days ago`
//                       })() 
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
//                 <div className={`font-medium ${formData.expiryDate ? getStatusColor(calculateStatus(formData.expiryDate)) : 'text-white'}`}>
//                   {formData.expiryDate ? calculateStatus(formData.expiryDate) : '--'}
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
//               disabled={!formData.domain || !formData.expiryDate || !formData.product}
//             >
//               {editingDomain ? "Save Changes" : "Add Domain"}
//             </GlassButton>
//           </div>
//         </div>
//       </GlassModal>
//     </div>




