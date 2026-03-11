"use client"
import { ReactNode } from 'react';
import React, { useState, useEffect, useRef } from "react"
import { Header } from "@/components/layout"
import { GlassCard, GlassButton } from "@/components/glass"
import { normalizeEntityPayload } from "@/utils/normalizePayload";
import { emitEntityChange } from "@/lib/entityBus";
import { formatLastUpdated } from "@/utils/dateFormatter";
import { handleDateChangeLogic, getDaysToColor } from "@/utils/dateCalculations";
import { DeleteConfirmationModal } from "@/common/services/DeleteConfirmationModal"
import { getCurrencySymbol, currencySymbols } from "@/utils/currencies";
import {
  Edit,
  Trash2,
  Search,
  Plus,
  Calendar,
  Globe,
  User,
  Package,
  Server,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Save,
  X,
  DollarSign,
  Eye
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/useToast"
import { useRouter } from "next/navigation"
import api from "@/lib/api"
import { apiService } from "@/common/services/apiService"
import Pagination from "@/common/Pagination"
import DashboardLoader, { downloadBase64File } from "@/common/DashboardLoader"
import { getNavigationByRole } from "@/lib/getNavigationByRole"
import { ApiDropdown, glassSelectStyles } from "@/common/DynamicDropdown"
import { CurrencyAmountInput } from "@/common/CurrencyAmountInput"
import { GlassSelect } from "@/components/glass/GlassSelect"

interface HostingRecord {
  deleted_at?: string;
  id: number
  client_name: string | null
  client_id?: number
  domain_name: string | null
  domain_id?: number
  product_name: string
  product_id?: number
  vendor_name: string
  vendor_id?: number
  expiry_date: string
  amount: number | null
  currency?: string
  days_to_expire_today: number
  deletion_date?: string | null;
  days_to_delete?: number | null;
  today_date: string
  status: 0 | 1
  remarks: string;
  remark_id: number | null;
  latest_remark?: {
    id: number;
    remark: string;
  };
  created_at: string;
  updated_at: string;

}

interface AddEditHosting {
  record_type: 3
  id?: number
  s_id: number
  product_id: number
  vendor_id: number
  domain_id: number
  client_id: number
  expiry_date: string
  amount: number
  currency?: string
  status: 0 | 1
  remarks: string
  remark_id: number;
  deleted_at: string;
  deletion_date?: string;
  days_to_delete?: number;
}

const currencyOptions = [
  { value: "INR", label: "INR (₹)" },
  { value: "USD", label: "USD ($)" },
  { value: "NGN", label: "NGN (₦)" },
  { value: "CNY", label: "CNY (¥)" },
];


export default function HostingPage() {
  const { user, getToken } = useAuth()
  const token = getToken();
  const isClient = user?.role === "ClientAdmin" || user?.login_type === 3;

  const navigationTabs = getNavigationByRole(user?.role)
  const { toast } = useToast()
  const router = useRouter()
  const [exportLoading, setExportLoading] = useState(false);
  const [data, setData] = useState<HostingRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedItems, setSelectedItems] = useState<number[]>([])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [addingNew, setAddingNew] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<number | null>(null)

  const [newRecordData, setNewRecordData] = useState({
    domain_id: null as number | null,
    domain_name: "",
    client_id: null as number | null,
    client_name: "",
    product_id: null as number | null,
    vendor_id: null as number | null,
    vendor_name: "",
    product_name: "",
    expiry_date: "",
    amount: "",
    currency: "INR",
    status: "1" as "1" | "0",
    remarks: "",
    deleted_at: "",
    deletion_date: "",
    days_to_delete: ""
  })

  const [editData, setEditData] = useState<Record<number, Partial<HostingRecord>>>({})
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null)

  const [pagination, setPagination] = useState({
    page: 0,
    rowsPerPage: 10,
    orderBy: "id" as "id" | "expiry_date" | "domain_name" | "product_name",
    orderDir: "desc" as "asc" | "desc"
  })

  const [totalItems, setTotalItems] = useState(0)

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch hosting records
  const fetchHostingRecords = async () => {
    try {
      setLoading(true)
      const limit = pagination.rowsPerPage;
      const offset = pagination.page * limit;
      const response = await api.get('secure/hostings', {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          search: searchQuery,
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
      console.error("Error fetching hosting records:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHostingRecords()
  }, [pagination.page, pagination.orderBy, pagination.orderDir])

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(() => {
      setPagination(prev => ({ ...prev, page: 0 }))
      fetchHostingRecords()
    }, 300)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchQuery])

  const handleAddNew = () => {
    const today = new Date().toISOString().split('T')[0]
    setAddingNew(true)
    setNewRecordData({
      domain_id: null,
      domain_name: "",
      client_id: null,
      client_name: "",
      product_id: null,
      vendor_id: null,
      vendor_name: "",
      product_name: "",
      expiry_date: "",
      amount: "",
      currency: "INR",
      status: "1",
      remarks: "",
      deleted_at: "",
      deletion_date: "",
      days_to_delete: ""
    })
  }

  const handleCancelAdd = () => {
    setAddingNew(false)
    setNewRecordData({
      domain_id: null,
      domain_name: "",
      client_id: null,
      client_name: "",
      product_id: null,
      vendor_id: null,
      vendor_name: "",
      product_name: "",
      expiry_date: "",
      amount: "",
      currency: "INR",
      status: "1",
      remarks: "",
      deleted_at: "",
      deletion_date: "",
      days_to_delete: ""
    })
  }

  const handleImportSuccess = async (response?: any) => {
    const inserted = response?.inserted ?? 0;
    const duplicates = response?.duplicates ?? 0;
    const failed = response?.failed ?? 0;
    const errs = response?.errors ?? [];

    await fetchHostingRecords();
    emitEntityChange('hosting', 'import', null);
    window.scrollTo({ top: 0, behavior: "smooth" });

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

  const handleExport = async () => {
    try {
      setExportLoading(true);

      const payload: Record<string, any> = {
        record_type: 3,
        s_id: user?.id || 0,
      };

      const response = await apiService.exportRecord(payload, user, token);

      if ((response as any).success) {
        toast({
          title: "Success",
          description: response.message || "Hosting exported successfully",
          variant: "default",
        });
        downloadBase64File(response.data.base64, response.data.filename);
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to export hosting",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error exporting hosting:", error);
      toast({
        title: "Error",
        description: "Failed to export hosting",
        variant: "destructive",
      });
    } finally {
      setExportLoading(false);
    }
  };

  // Save New Record
  const handleSaveNew = async () => {
    try {
      setIsSaving(true)

      if (!newRecordData.domain_id || !newRecordData.client_id ||
        !newRecordData.product_id || !newRecordData.vendor_id || !newRecordData.expiry_date) {
        toast({
          title: "Error",
          description: "Please fill all required fields",
          variant: "destructive"
        })
        return
      }

      const payload: any = {
        record_type: 3,
        s_id: user?.id || 6,
        product_id: newRecordData.product_id!,
        vendor_id: newRecordData.vendor_id!,
        domain_id: newRecordData.domain_id!,
        client_id: isClient ? user?.id : (newRecordData.client_id!),
        expiry_date: newRecordData.expiry_date,
        amount: parseFloat(newRecordData.amount) || 0,
        currency: newRecordData.currency || "INR",
        deletion_date: newRecordData.deletion_date || null,
        days_to_delete: newRecordData.days_to_delete ? parseInt(newRecordData.days_to_delete) : null,
        status: parseInt(newRecordData.status) as 0 | 1,
        remarks: newRecordData.remarks,
        deleted_at: newRecordData.deleted_at
      }

      const response = await apiService.addRecord(payload as any, user, token)

      if (response.status) {
        toast({
          title: "Success",
          description: response.message || "Hosting record added successfully",
          variant: "default"
        })
        setAddingNew(false)
        fetchHostingRecords()
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
          expiry_date: "",
          amount: "",
          currency: "INR",
          status: "1",
          remarks: "",
          deleted_at: "",
          deletion_date: "",
          days_to_delete: ""
        })
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to add hosting record",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error adding hosting record:", error)
      toast({
        title: "Error",
        description: "Failed to add hosting record",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Handle Edit
  const handleEdit = (record: HostingRecord) => {
    setEditingId(record.id)
    setEditData({
      [record.id]: {
        ...record,
        domain_id: record.domain_id || undefined,
        client_id: record.client_id || undefined,
        product_id: record.product_id || undefined,
        vendor_id: record.vendor_id || undefined,
        amount: record.amount || 0,
        currency: record.currency || "INR",
        remarks: record.remarks || "",
        deleted_at: record.deleted_at || "",
        deletion_date: record.deletion_date || null,
        days_to_delete: record.days_to_delete ?? null,
        remark_id: record?.latest_remark?.id || null
      }
    })
  }

  // Handle Save (inline editing)
  const handleSave = async (id: number) => {
    try {
      setIsSaving(true)
      const updatedData = editData[id]

      if (!updatedData) return

      if (!updatedData.domain_id || !updatedData.client_id ||
        !updatedData.product_id || !updatedData.vendor_id || !updatedData.expiry_date ||
        updatedData.amount === undefined) {
        toast({
          title: "Error",
          description: "Please fill all required fields",
          variant: "destructive"
        })
        return
      }

      const payload: any = {
        record_type: 3,
        id,
        s_id: user?.id || 6,
        product_id: updatedData.product_id!,
        vendor_id: updatedData.vendor_id!,
        domain_id: updatedData.domain_id!,
        client_id: updatedData.client_id!,
        expiry_date: updatedData.expiry_date!,
        amount: updatedData.amount ?? data.find((item) => item.id === id)?.amount ?? 0,
        currency: updatedData.currency || data.find((item) => item.id === id)?.currency || "INR",
        status: parseInt(updatedData.status as any),
        remarks: updatedData.remarks || "",
        remark_id: updatedData.remark_id || null,
        deleted_at: updatedData.deleted_at,
        deletion_date: updatedData.deletion_date || null,
        days_to_delete: updatedData.days_to_delete !== undefined && updatedData.days_to_delete !== null ? Number(updatedData.days_to_delete) : null
      }

      const response = await apiService.editRecord(payload as any, user, token)

      if (response.status) {
        toast({
          title: "Success",
          description: response.message || "Hosting record updated successfully",
          variant: "default"
        })
        setEditingId(null)
        setEditData({})
        fetchHostingRecords()
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to update hosting record",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error updating hosting record:", error)
      toast({
        title: "Error",
        description: "Failed to update hosting record",
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

  // Handle field change for editing
  const handleEditChange = (id: number, field: keyof HostingRecord, value: any) => {
    setEditData(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value
      }
    }))
  }

  // Handle field change for new record
  const handleNewRecordChange = (field: keyof typeof newRecordData, value: any) => {
    setNewRecordData(prev => ({
      ...prev,
      [field]: value
    }))
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
        description: "Please select at least one hosting record",
        variant: "destructive"
      })
      return
    }
    setItemToDelete(null)
    setShowDeleteModal(true)
  }

  const handleViewDetails = (item: HostingRecord) => {
    setExpandedRowId((prev) => (prev === item.id ? null : item.id));
  };

  const confirmDelete = async () => {
    try {
      setIsDeleting(true)

      const idsToDelete = itemToDelete ? [itemToDelete] : selectedItems

      const response = await apiService.deleteRecords(idsToDelete, 3, user, token)

      if (response.status) {
        toast({
          title: "Success",
          description: response.message || "Record(s) deleted successfully",
          variant: "default"
        })

        setSelectedItems([])
        setItemToDelete(null)
        fetchHostingRecords()
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to delete record(s)",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error deleting:", error)
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

  const getStatusColor = (status: 0 | 1) => {
    return status === 1 ? 'text-green-400' : 'text-red-400'
  }

  const getStatusText = (status: 0 | 1) => {
    return status === 1 ? 'Active' : 'Inactive'
  }

  const getStatusIcon = (status: 0 | 1) => {
    return status === 1 ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />
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

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
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
      <Header title="Hosting Management" tabs={navigationTabs} />

      <div className="px-4 sm:px-6 mt-6">
        <GlassCard className="p-6 backdrop-blur-xl bg-gradient-to-br from-gray-900/80 via-black/80 to-gray-900/80 border border-white/10 shadow-2xl">
          {/* Header with Search and Add Button */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <Server className="w-6 h-6 text-[#CB8969]" />
                <h2 className="text-xl font-semibold text-white">Hosting</h2>
              </div>
              <p className="text-sm text-gray-400 mt-1">
                Manage your hosting services and expiration dates
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search hosting..."
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
                    Add Hosting
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
                    {!isClient && (
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
                      Domain Name
                    </th>
                    {!isClient && (
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 w-[180px]">
                        Client
                      </th>
                    )}
                    <th className={`py-3 px-4 text-left text-sm font-medium text-gray-300 ${isClient ? 'w-[200px]' : 'w-[180px]'}`}>
                      Product
                    </th>
                    {!isClient && (
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 w-[150px]">
                        Vendor
                      </th>
                    )}
                    <th className={`py-3 px-4 text-left text-sm font-medium text-gray-300 ${isClient ? 'w-[160px]' : 'w-[140px]'}`}>
                      Renewal Date
                    </th>
                    {!isClient && (
                      <th className="py-3 px-4 text-center text-sm font-medium text-gray-300 w-[220px]">
                        Amount
                      </th>
                    )}
                    <th className={`py-3 px-4 text-left text-sm font-medium text-gray-300 ${isClient ? 'w-[140px]' : 'w-[120px]'}`}>
                      Days to Expire
                    </th>
                    {!isClient && (
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 w-[140px]">
                        Deletion Date
                      </th>
                    )}
                    {!isClient && (
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 w-[120px]">
                        Days to Delete
                      </th>
                    )}
                    <th className={`py-3 px-4 text-center text-sm font-medium text-gray-300 ${isClient ? 'w-[120px]' : 'w-[150px]'}`}>
                      Status
                    </th>
                    {!isClient && (
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 w-[200px]">
                        Remarks
                      </th>
                    )}
                    {!isClient && (
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 w-[140px]">
                        Deleted Date
                      </th>
                    )}
                    {!isClient && (
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 w-[180px]">
                        Last Updated
                      </th>
                    )}
                    <th className={`py-3 px-4 text-right text-sm font-medium text-gray-300 ${isClient ? 'w-[100px]' : 'w-[140px]'}`}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={isClient ? 7 : 16} className="py-8 text-center">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <DashboardLoader label="Fetching Hosting....." />
                        </div>
                      </td>
                    </tr>
                  ) : (<React.Fragment>
                      {/* Add New Row */}
                      {addingNew && (
                        <tr key="new-row" className="border-b border-white/5 bg-blue-500/5">
                          {!isClient && <td className="py-3 px-4"></td>}
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
                          {!isClient && (
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
                          )}
                          {!isClient && (
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
                          )}
                          {!isClient && (
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
                              type="date"
                              value={newRecordData.expiry_date}
                              onChange={(e) => handleNewRecordChange('expiry_date', e.target.value)}
                              className="w-full px-2 py-1 bg-white/5 border border-blue-500/30 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/30 backdrop-blur-sm"
                              style={{ minHeight: '32px' }}
                            />
                          </td>
                          {!isClient && (
                            <td className="py-3 px-4">
                              <CurrencyAmountInput
                                currency={newRecordData.currency || "INR"}
                                amount={newRecordData.amount}
                                onCurrencyChange={(curr) => handleNewRecordChange("currency", curr)}
                                onAmountChange={(val) => handleNewRecordChange("amount", val)}
                              />
                            </td>
                          )}
                          <td className="py-3 px-4">
                            <input
                              type="number"
                              value={String(calculateDays(newRecordData.expiry_date)) === "NaN" ? "" : calculateDays(newRecordData.expiry_date)}
                              readOnly
                              className="w-full px-2 py-1 bg-white/10 border border-white/10 rounded text-gray-400 text-sm cursor-not-allowed"
                              style={{ minHeight: '32px' }}
                            />
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="date"
                              value={newRecordData.deletion_date}
                              onChange={(e) => handleNewRecordChange("deletion_date", e.target.value)}
                              className="w-full px-2 py-1 bg-white/5 border border-blue-500/30 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/30 backdrop-blur-sm"
                              style={{ minHeight: "32px" }}
                            />
                          </td>
                          {!isClient && (
                            <td className="py-3 px-4">
                              <input
                                type="number"
                                value={newRecordData.days_to_delete}
                                onChange={(e) => handleNewRecordChange("days_to_delete", e.target.value)}
                                className="w-full px-2 py-1 bg-white/5 border border-blue-500/30 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/30 backdrop-blur-sm"
                                style={{ minHeight: "32px" }}
                                min="0"
                              />
                            </td>
                          )}
                          {!isClient && (
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
                                    ].find(opt => opt.value === newRecordData.status) || null
                                  }
                                  onChange={(selected: any) =>
                                    handleNewRecordChange(
                                      "status",
                                      selected?.value as "1" | "0"
                                    )
                                  }
                                  placeholder="Status"
                                  isSearchable={false}
                                  styles={glassSelectStyles}
                                />
                              </div>
                            </td>
                          )}
                          {!isClient && (
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
                          {!isClient && (
                            <td className="py-3 px-4 text-sm text-gray-300">
                              <input
                                type="date"
                                value={newRecordData.deleted_at}
                                onChange={(e) => handleNewRecordChange('deleted_at', e.target.value)}
                                className="w-full px-2 py-1 bg-white/5 border border-blue-500/30 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/30 backdrop-blur-sm"
                                style={{ minHeight: '32px' }}
                              />
                            </td>
                          )}
                          {!isClient && (
                            <td className="py-3 px-4 text-sm text-gray-300">
                              {"- -"}
                            </td>
                          )}
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
                        <tr key="empty-row">
                          <td colSpan={isClient ? 7 : 16} className="py-8 text-center">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <Server className="w-12 h-12 text-gray-400" />
                              <span className="text-gray-400">No hosting records found</span>
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
                              className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors ${editingId === item.id ? 'bg-blue-500/5' : ''
                                }`}
                            >
                            {!isClient && (
                              <td className="py-3 px-4">
                                <input
                                  type="checkbox"
                                  checked={selectedItems.includes(item.id)}
                                  onChange={(e) => handleSelectItem(item.id, e.target.checked)}
                                  className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500/50 cursor-pointer"
                                />
                              </td>
                            )}
                            <td className="py-3 px-4 text-sm text-gray-300">
                              {startItem + index}
                            </td>

                            {editingId === item.id ? (
                              <>
                                <td className="py-3 px-4">
                                  <ApiDropdown
                                    endpoint="get-domains"
                                    value={
                                      editData[item.id]?.domain_id
                                        ? {
                                          value: editData[item.id]?.domain_id!,
                                          label: editData[item.id]?.domain_name || "",
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
                                {!isClient && (
                                  <td className="py-3 px-4">
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
                                )}
                                <td className="py-3 px-4">
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
                                {!isClient && (
                                  <td className="py-3 px-4">
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
                                    type="date"
                                    value={editData[item.id]?.expiry_date || item.expiry_date || ""}
                                    onChange={(e) => handleEditChange(item.id, 'expiry_date', e.target.value)}
                                    className="w-full px-2 py-1 bg-white/5 border border-blue-500/30 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/30 backdrop-blur-sm"
                                    style={{ minHeight: '32px' }}
                                  />
                                </td>
                                {!isClient && (
                                  <td className="py-3 px-4">
                                    <CurrencyAmountInput
                                      currency={editData[item.id]?.currency || item.currency || "INR"}
                                      amount={editData[item.id]?.amount ?? item.amount ?? ""}
                                      onCurrencyChange={(curr) => handleEditChange(item.id, "currency", curr)}
                                      onAmountChange={(val) => handleEditChange(item.id, "amount", parseFloat(val) || 0)}
                                    />
                                  </td>
                                )}
                                <td className="py-3 px-4">
                                  <input
                                    type="number"
                                    value={String(calculateDays(editData[item.id]?.expiry_date || item.expiry_date)) === "NaN" ? "" : calculateDays(editData[item.id]?.expiry_date || item.expiry_date)}
                                    readOnly
                                    className="w-full px-2 py-1 bg-white/10 border border-white/10 rounded text-gray-400 text-sm cursor-not-allowed"
                                    style={{ minHeight: '32px' }}
                                  />
                                </td>
                                <td className="py-1 px-2">
                                  <div className="w-full mx-auto">
                                    <GlassSelect
                                      options={[
                                        { value: "1", label: "Active" },
                                        { value: "0", label: "Inactive" },
                                      ]}
                                      value={
                                        [
                                          { value: "1", label: "Active" },
                                          { value: "0", label: "Inactive" },
                                        ].find(opt => opt.value === String(editData[item.id]?.status || item.status)) || null
                                      }
                                      onChange={(selected: any) =>
                                        handleEditChange(
                                          item.id,
                                          "status",
                                          selected?.value || null
                                        )
                                      }
                                      placeholder="Status"
                                      isSearchable={false}
                                      styles={glassSelectStyles}
                                    />
                                  </div>
                                </td>
                                {!isClient && (
                                  <td className="py-3 px-4">
                                    <input
                                      type="text"
                                      value={editData[item.id]?.remarks || (item?.latest_remark?.remark as string) || ''}
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
                                )}
                                {!isClient && (
                                  <td className="py-3 px-4 text-sm text-gray-300">
                                    <input
                                      type="date"
                                      value={editData[item.id]?.deleted_at || item.deleted_at || ""}
                                      onChange={(e) => handleEditChange(item.id, 'deleted_at', e.target.value)}
                                      className="w-full px-2 py-1 bg-white/5 border border-blue-500/30 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/30 backdrop-blur-sm"
                                      style={{ minHeight: '32px' }}
                                    />
                                  </td>
                                )}
                                {!isClient && (
                                  <td className="py-3 px-4 text-sm text-gray-300 whitespace-nowrap">
                                    {(item as any).last_updated || formatLastUpdated(item.updated_at)}
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
                                {!isClient && (
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
                                {!isClient && (
                                  <td className="py-3 px-4">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm text-white font-medium">
                                        {item.vendor_name}
                                      </span>
                                    </div>
                                  </td>
                                )}
                                {!isClient && (
                                  <td className="py-3 px-4 text-sm text-gray-300">
                                    <div className="flex items-center justify-center gap-1 font-medium text-white">
                                      <span className="text-[#BC8969]">{getCurrencySymbol(item.currency)}</span>
                                      {item.amount || "0.00"}
                                    </div>
                                  </td>
                                )}
                                <td className="py-3 px-4">
                                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm border ${calculateDays(item.expiry_date) < 0
                                    ? 'bg-red-500/20 text-red-400 border-red-500/20'
                                    : calculateDays(item.expiry_date) <= 30
                                      ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/20'
                                      : 'bg-green-500/20 text-green-400 border-green-500/20'
                                    }`}>
                                    {calculateDays(item.expiry_date)} days
                                  </div>
                                </td>
                                {!isClient && (
                                  <td className="py-3 px-4 text-sm text-gray-300">
                                    {item.deletion_date ? formatDate(item.deletion_date) : "--"}
                                  </td>
                                )}
                                {!isClient && (
                                  <td className="py-3 px-4 text-sm text-gray-300">
                                    {calculateDays(item.deletion_date as string)}
                                  </td>
                                )}
                                <td className="py-3 px-4 text-center">
                                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm border ${getStatusColor(item.status)} ${item.status === 1 ? 'bg-green-500/20 border-green-500/20' : 'bg-red-500/20 border-red-500/20'
                                    }`}>
                                    {getStatusIcon(item.status)}
                                    {getStatusText(item.status)}
                                  </div>
                                </td>
                                {!isClient && (
                                  <td className="py-3 px-4">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm text-gray-300 truncate max-w-[180px]">
                                        {(item?.latest_remark?.remark as string) || ''}
                                      </span>
                                    </div>
                                  </td>
                                )}
                                {!isClient && (
                                  <td className="py-3 px-4 text-sm text-gray-300">
                                    {(item.deleted_at)}
                                  </td>
                                )}
                                {!isClient && (
                                  <td className="py-3 px-4 text-sm text-gray-300 whitespace-nowrap">
                                    {(item as any).last_updated || formatLastUpdated(item.updated_at)}
                                  </td>
                                )}
                              </>
                            )}

                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-2 whitespace-nowrap">
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
                                    {!isClient && (
                                      <>
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
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>

                          {/* Expansion Row for Details */}
                          {expandedRowId === item.id && (
                            <tr className="bg-white/5 animate-in fade-in slide-in-from-top-4 duration-300">
                              <td colSpan={isClient ? 7 : 16} className="py-4 px-6">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-black/20 p-4 rounded-xl border border-white/5 shadow-inner">
                                  <div><span className="block text-xs text-gray-400 mb-1 text-left">Domain Name</span><span className="block text-sm text-gray-200 font-medium text-left">{item.domain_name || "--"}</span></div>
                                  <div><span className="block text-xs text-gray-400 mb-1 text-left">Client Name</span><span className="block text-sm text-gray-200 font-medium text-left">{item.client_name || "--"}</span></div>
                                  <div><span className="block text-xs text-gray-400 mb-1 text-left">Product</span><span className="block text-sm text-gray-200 font-medium text-left">{item.product_name || "--"}</span></div>
                                  <div><span className="block text-xs text-gray-400 mb-1 text-left">Vendor</span><span className="block text-sm text-gray-200 font-medium text-left">{item.vendor_name || "--"}</span></div>
                                  <div><span className="block text-xs text-gray-400 mb-1 text-left">Amount</span><span className="block text-sm text-gray-200 font-medium text-left">{getCurrencySymbol(item.currency)}{item.amount || "--"}</span></div>
                                  <div><span className="block text-xs text-gray-400 mb-1 text-left">Renewal Date</span><span className="block text-sm text-gray-200 font-medium text-left">{formatDate((item as any).renewal_date)}</span></div>
                                  <div><span className="block text-xs text-gray-400 mb-1 text-left">Deletion Date</span><span className="block text-sm text-gray-200 font-medium text-left">{formatDate((item as any).deletion_date)}</span></div>
                                  <div><span className="block text-xs text-gray-400 mb-1 text-left">Remarks</span><span className="block text-sm text-gray-200 font-medium text-left">{(item?.latest_remark?.remark as string) || "--"}</span></div>
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
                  {selectedItems.length} hosting record{selectedItems.length > 1 ? 's' : ''} selected
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
        title={itemToDelete ? "Delete Hosting Record" : "Delete Multiple Hosting Records"}
        message={itemToDelete
          ? "Are you sure you want to delete this hosting record? This action cannot be undone."
          : "Are you sure you want to delete the selected hosting records? This action cannot be undone."
        }
      />
    </div>
  )
}

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
//   Globe,
//   User,
//   Package,
//   Clock,
//   CheckCircle,
//   XCircle,
//   AlertCircle
// } from "lucide-react"
// import { navigationTabs } from "@/lib/navigation"

// interface SSL {
//   id: number
//   domainName: string
//   client: string
//   expireDate: string
//   daysOfExpire: number
//   todayDate: string
//   products: string
//   status: 'Active' | 'Expired' | 'Warning' | 'Inactive'
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
// const calculateStatus = (expireDate: string): 'Active' | 'Expired' | 'Warning' | 'Inactive' => {
//   const today = new Date()
//   const expire = new Date(expireDate)
//   const daysUntilExpire = calculateDaysBetween(today, expire)

//   if (daysUntilExpire < 0) return 'Expired'
//   if (daysUntilExpire <= 30) return 'Warning'
//   if (daysUntilExpire > 30) return 'Active'
//   return 'Inactive'
// }

// // Calculate days until expiration
// const calculateDaysOfExpire = (expireDate: string): number => {
//   const today = new Date()
//   const expire = new Date(expireDate)
//   return calculateDaysBetween(today, expire)
// }

// const initialData: SSL[] = [
//   {
//     id: 1,
//     domainName: "example.com",
//     client: "John Smith",
//     expireDate: "2024-12-31",
//     daysOfExpire: 60,
//     todayDate: getTodayDate(),
//     products: "Wildcard SSL",
//     status: "Active"
//   },
//   {
//     id: 2,
//     domainName: "myshop.com",
//     client: "Sarah Johnson",
//     expireDate: "2024-11-15",
//     daysOfExpire: 15,
//     todayDate: getTodayDate(),
//     products: "EV SSL Certificate",
//     status: "Warning"
//   },
//   {
//     id: 3,
//     domainName: "blog-site.org",
//     client: "Mike Wilson",
//     expireDate: "2024-10-01",
//     daysOfExpire: -10,
//     todayDate: getTodayDate(),
//     products: "Standard SSL",
//     status: "Expired"
//   },
//   {
//     id: 4,
//     domainName: "api-service.net",
//     client: "David Brown",
//     expireDate: "2025-03-20",
//     daysOfExpire: 150,
//     todayDate: getTodayDate(),
//     products: "Multi-domain SSL",
//     status: "Active"
//   },
//   {
//     id: 5,
//     domainName: "store-app.io",
//     client: "Emma Davis",
//     expireDate: "2024-12-05",
//     daysOfExpire: 35,
//     todayDate: getTodayDate(),
//     products: "Code Signing SSL",
//     status: "Active"
//   }
// ]

// export default function SSLPage() {
//   const [data, setData] = useState<SSL[]>(initialData)
//   const [searchQuery, setSearchQuery] = useState("")
//   const [selectedItems, setSelectedItems] = useState<number[]>([])
//   const [isModalOpen, setIsModalOpen] = useState(false)
//   const [editingSSL, setEditingSSL] = useState<SSL | null>(null)
//   const [formData, setFormData] = useState({
//     domainName: "",
//     client: "",
//     expireDate: "",
//     products: ""
//   })

//   // Update todayDate and calculations whenever data changes
//   useEffect(() => {
//     const updatedData = data.map(item => {
//       const daysOfExpire = calculateDaysOfExpire(item.expireDate)
//       const status = calculateStatus(item.expireDate)

//       return {
//         ...item,
//         todayDate: getTodayDate(),
//         daysOfExpire,
//         status
//       }
//     })
//     setData(updatedData)
//   }, [])

//   const filteredData = data.filter(item =>
//     item.domainName.toLowerCase().includes(searchQuery.toLowerCase()) ||
//     item.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
//     item.products.toLowerCase().includes(searchQuery.toLowerCase())
//   )

//   const handleAdd = () => {
//     setEditingSSL(null)
//     setFormData({
//       domainName: "",
//       client: "",
//       expireDate: "",
//       products: ""
//     })
//     setIsModalOpen(true)
//   }

//   const handleEdit = (ssl: SSL) => {
//     setEditingSSL(ssl)
//     setFormData({
//       domainName: ssl.domainName,
//       client: ssl.client,
//       expireDate: ssl.expireDate,
//       products: ssl.products
//     })
//     setIsModalOpen(true)
//   }

//   const handleDelete = (id: number) => {
//     if (confirm("Are you sure you want to delete this SSL record?")) {
//       setData(data.filter(item => item.id !== id))
//       setSelectedItems(selectedItems.filter(selectedId => selectedId !== id))
//     }
//   }

//   const handleSubmit = () => {
//     const daysOfExpire = calculateDaysOfExpire(formData.expireDate)
//     const status = calculateStatus(formData.expireDate)

//     if (editingSSL) {
//       setData(data.map(item =>
//         item.id === editingSSL.id
//           ? {
//               ...item,
//               domainName: formData.domainName,
//               client: formData.client,
//               expireDate: formData.expireDate,
//               products: formData.products,
//               todayDate: getTodayDate(),
//               daysOfExpire,
//               status
//             }
//           : item
//       ))
//     } else {
//       const newSSL: SSL = {
//         id: Math.max(...data.map(item => item.id)) + 1,
//         domainName: formData.domainName,
//         client: formData.client,
//         expireDate: formData.expireDate,
//         products: formData.products,
//         todayDate: getTodayDate(),
//         daysOfExpire,
//         status
//       }
//       setData([...data, newSSL])
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

//   const getStatusColor = (status: SSL['status']) => {
//     switch (status) {
//       case 'Active': return 'text-green-400'
//       case 'Warning': return 'text-yellow-400'
//       case 'Expired': return 'text-red-400'
//       case 'Inactive': return 'text-gray-400'
//       default: return 'text-gray-400'
//     }
//   }

//   const getStatusIcon = (status: SSL['status']) => {
//     switch (status) {
//       case 'Active': return <CheckCircle className="w-4 h-4" />
//       case 'Warning': return <AlertCircle className="w-4 h-4" />
//       case 'Expired': return <XCircle className="w-4 h-4" />
//       case 'Inactive': return <Clock className="w-4 h-4" />
//       default: return <AlertCircle className="w-4 h-4" />
//     }
//   }

//   // Sample client data for dropdown (you can fetch this from API)
//   const clientOptions = [
//     "John Smith",
//     "Sarah Johnson",
//     "Mike Wilson",
//     "David Brown",
//     "Emma Davis",
//     "Robert Taylor",
//     "Lisa Anderson"
//   ]

//   // Sample product options
//   const productOptions = [
//     "Standard SSL",
//     "Wildcard SSL",
//     "EV SSL Certificate",
//     "Multi-domain SSL",
//     "Code Signing SSL",
//     "OV SSL Certificate"
//   ]

//   return (
//     <div className="min-h-screen pb-8">
//       <Header title="Hosting Management" tabs={navigationTabs} />

//       <div className="px-4 sm:px-6 mt-6">
//         <GlassCard className="p-6">
//           {/* Header with Search and Add Button */}
//           <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
//             <h2 className="text-xl font-semibold text-white">Hosting</h2>
//             <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
//               <div className="relative">
//                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
//                 <input
//                   type="text"
//                   placeholder="Search hosting..."
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
//                 Add Hosting
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
//                     Domain Name
//                   </th>
//                   <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-tertiary)]">
//                     Client
//                   </th>
//                   <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-tertiary)]">
//                     Expire Date
//                   </th>
//                   <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-tertiary)]">
//                     Days to Expire
//                   </th>
//                   <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-tertiary)]">
//                     Today's Date
//                   </th>
//                   <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-tertiary)]">
//                     Products
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
//                         <span className="text-sm text-white font-medium">{item.domainName}</span>
//                       </div>
//                     </td>
//                     <td className="py-3 px-4">
//                       <div className="flex items-center gap-2">
//                         <User className="w-4 h-4 text-[var(--text-muted)]" />
//                         <span className="text-sm text-[var(--text-secondary)]">{item.client}</span>
//                       </div>
//                     </td>
//                     <td className="py-3 px-4">
//                       <div className="flex items-center gap-2">
//                         <Calendar className="w-4 h-4 text-[var(--text-muted)]" />
//                         <span className="text-sm text-[var(--text-secondary)]">
//                           {new Date(item.expireDate).toLocaleDateString('en-US', {
//                             year: 'numeric',
//                             month: 'short',
//                             day: 'numeric'
//                           })}
//                         </span>
//                       </div>
//                     </td>
//                     <td className="py-3 px-4">
//                       <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
//                         item.daysOfExpire < 0
//                           ? 'bg-red-500/20 text-red-400'
//                           : item.daysOfExpire <= 30
//                             ? 'bg-yellow-500/20 text-yellow-400'
//                             : 'bg-green-500/20 text-green-400'
//                       }`}>
//                         <Clock className="w-3 h-3" />
//                         {item.daysOfExpire >= 0 ? `${item.daysOfExpire} days` : `${Math.abs(item.daysOfExpire)} days ago`}
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
//                         <span className="text-sm text-[var(--text-secondary)]">{item.products}</span>
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
//                 {selectedItems.length} SSL certificate{selectedItems.length > 1 ? 's' : ''} selected
//               </span>
//             </div>
//           )}

//           {filteredData.length === 0 && (
//             <div className="text-center py-8">
//               <span className="text-[var(--text-muted)]">No SSL certificates found</span>
//             </div>
//           )}
//         </GlassCard>
//       </div>

//       {/* Add/Edit Modal */}
//       <GlassModal
//         isOpen={isModalOpen}
//         onClose={() => setIsModalOpen(false)}
//         title={editingSSL ? "Edit SSL Certificate" : "Add New SSL Certificate"}
//         size="lg"
//       >
//         <div className="space-y-4">
//           <div>
//             <label className="block text-[var(--text-tertiary)] text-sm mb-2">Domain Name</label>
//             <GlassInput
//               placeholder="Enter domain name (e.g., example.com)"
//               value={formData.domainName}
//               onChange={(e) => setFormData({ ...formData, domainName: e.target.value })}
//             />
//           </div>

//           <div>
//             <label className="block text-[var(--text-tertiary)] text-sm mb-2">Client</label>
//             <select
//               value={formData.client}
//               onChange={(e) => setFormData({ ...formData, client: e.target.value })}
//               className="w-full px-4 py-2 bg-[rgba(255,255,255,var(--ui-opacity-10))] border border-[rgba(255,255,255,var(--glass-border-opacity))] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent"
//             >
//               <option value="">Select a client</option>
//               {clientOptions.map((client, index) => (
//                 <option key={index} value={client} className="bg-gray-800 text-white">
//                   {client}
//                 </option>
//               ))}
//             </select>
//           </div>

//           <div>
//             <label className="block text-[var(--text-tertiary)] text-sm mb-2">Expiration Date</label>
//             <GlassInput
//               type="date"
//               value={formData.expireDate}
//               onChange={(e) => setFormData({ ...formData, expireDate: e.target.value })}
//             />
//           </div>

//           <div>
//             <label className="block text-[var(--text-tertiary)] text-sm mb-2">SSL Product</label>
//             <select
//               value={formData.products}
//               onChange={(e) => setFormData({ ...formData, products: e.target.value })}
//               className="w-full px-4 py-2 bg-[rgba(255,255,255,var(--ui-opacity-10))] border border-[rgba(255,255,255,var(--glass-border-opacity))] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent"
//             >
//               <option value="">Select SSL product</option>
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
//                   formData.expireDate
//                     ? calculateDaysOfExpire(formData.expireDate) < 0
//                       ? 'text-red-400'
//                       : calculateDaysOfExpire(formData.expireDate) <= 30
//                         ? 'text-yellow-400'
//                         : 'text-green-400'
//                     : 'text-white'
//                 }`}>
//                   {formData.expireDate
//                     ? (() => {
//                         const days = calculateDaysOfExpire(formData.expireDate)
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
//                 <div className={`font-medium ${formData.expireDate ? getStatusColor(calculateStatus(formData.expireDate)) : 'text-white'}`}>
//                   {formData.expireDate ? calculateStatus(formData.expireDate) : '--'}
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
//               disabled={!formData.domainName || !formData.client || !formData.expireDate || !formData.products}
//             >
//               {editingSSL ? "Save Changes" : "Add Hosting "}
//             </GlassButton>
//           </div>
//         </div>
//       </GlassModal>
//     </div>
//   )
// }
