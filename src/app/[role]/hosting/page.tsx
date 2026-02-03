"use client"

import { useState, useEffect, useRef } from "react"
import { Header } from "@/components/layout"
import { GlassCard, GlassButton } from "@/components/glass"
import { DeleteConfirmationModal } from "@/common/services/DeleteConfirmationModal"
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
import { apiService } from "@/common/services/apiService"
import Pagination from "@/common/Pagination"
import DashboardLoader from "@/common/DashboardLoader"
import { getNavigationByRole } from "@/lib/getNavigationByRole"
import { ApiDropdown, glassSelectStyles } from "@/common/DynamicDropdown"
import { GlassSelect } from "@/components/glass/GlassSelect"

interface HostingRecord {
  id: number
  client_name: string | null
  client_id?: number
  domain_name: string | null
  domain_id?: number
  product_name: string
  product_id?: number
  vender_name: string
  vender_id?: number
  expiry_date: string
  amount: number | null
  days_to_expire_today: number
  today_date: string
  status: 0 | 1 | 2
  remarks: string;
  remark_id: number | null;
  latest_remark?: {
    id: number;
    remark: string;
  };
  created_at: string
  updated_at: string
  deleted_at: string | null // Added deletion date field
  days_to_expired?: number // From API response
  renewal_date?: string // From API response
  next_recurring_date?: string | null // From API response
  quantity?: number | null // From API response
  bill_type?: string | null // From API response
  start_date?: string | null // From API response
  end_date?: string | null // From API response
  counter_count?: number | null // From API response
  valid_till?: string | null // From API response
  updated_at_custom?: string // From API response
}

interface AddEditHosting {
  record_type: 3
  id?: number
  s_id: number
  product_id: number
  vender_id: number
  domain_id: number
  client_id: number
  expiry_date: string
  amount: number
  status: 0 | 1 | 2
  remarks: string
  remark_id: number;
  deleted_at?: string | null;
}

export default function HostingPage() {
  const { user } = useAuth()
  const navigationTabs = getNavigationByRole(user?.role)
  const { toast } = useToast()
  const router = useRouter()
  
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
  const [showDeleted, setShowDeleted] = useState(false) // Toggle for showing deleted records
  
  const [newRecordData, setNewRecordData] = useState({
    domain_id: null as number | null,
    domain_name: "",
    client_id: null as number | null,
    client_name: "",
    product_id: null as number | null,
    vender_id: null as number | null,
    product_name: "",
    expiry_date: "",
    amount: "",
    status: "2" as "1" | "0" | "2", // Updated to include 2
    remarks: "",
    deleted_at: null as string | null // Added deletion date field
  })
  
  const [editData, setEditData] = useState<Record<number, Partial<HostingRecord>>>({})
  
  const [pagination, setPagination] = useState({
    page: 0,
    rowsPerPage: 10,
    orderBy: "id" as "id" | "expiry_date" | "domain_name" | "product_name",
    orderDir: "desc" as "asc" | "desc"
  })
  
  const [totalItems, setTotalItems] = useState(0)

  const searchTimeoutRef = useRef<NodeJS.Timeout>()

  // Helper function to get current date-time in datetime-local format
  const getCurrentDateTimeLocal = (): string => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  // Helper function to format datetime-local to database format
  const formatToDatabaseDateTime = (dateTimeLocal: string | null): string | null => {
    if (!dateTimeLocal) return null
    
    try {
      const date = new Date(dateTimeLocal)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      const seconds = String(date.getSeconds()).padStart(2, '0')
      
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
    } catch {
      return dateTimeLocal.replace('T', ' ') + ':00'
    }
  }

  // Fetch hosting records
  const fetchHostingRecords = async () => {
    try {
      setLoading(true)
      
      const response = await apiService.listRecords({
        record_type: 3, // Hosting
        search: searchQuery,
        page: pagination.page,
        rowsPerPage: pagination.rowsPerPage,
        orderBy: pagination.orderBy,
        orderDir: pagination.orderDir
      })
      
      if (response.status) {
        // Log the response to see what's coming
        console.log("Hosting API Response:", response.data)
        
        // Transform API response to match HostingRecord interface
        const transformedData: HostingRecord[] = response.data.map((item: any) => ({
          id: item.id,
          client_name: item.client_name || null,
          client_id: item.client_id,
          domain_name: item.domain_name || null,
          domain_id: item.domain_id,
          product_name: item.product_name,
          product_id: item.product_id,
          vender_name: item.vender_name || "N/A",
          vender_id: item.vender_id,
          expiry_date: item.expiry_date,
          amount: item.amount,
          days_to_expire_today: item.days_to_expire_today || item.days_to_expired || 0,
          today_date: item.today_date,
          status: item.status as 0 | 1 | 2,
          remarks: item.remarks || "",
          remark_id: item.latest_remark?.id || null,
          latest_remark: item.latest_remark,
          created_at: item.created_at,
          updated_at: item.updated_at,
          deleted_at: item.deleted_at, // This is now properly mapped
          days_to_expired: item.days_to_expired,
          renewal_date: item.renewal_date,
          next_recurring_date: item.next_recurring_date,
          quantity: item.quantity,
          bill_type: item.bill_type,
          start_date: item.start_date,
          end_date: item.end_date,
          counter_count: item.counter_count,
          valid_till: item.valid_till,
          updated_at_custom: item.updated_at_custom
        }))
        
        setData(transformedData)
        setTotalItems(response.total || 0)
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to fetch hosting records",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error fetching hosting records:", error)
      toast({
        title: "Error",
        description: "Failed to fetch hosting records",
        variant: "destructive"
      })
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

  // Handle Add New
  const handleAddNew = () => {
    const today = new Date().toISOString().split('T')[0]
    setAddingNew(true)
    setNewRecordData({
      domain_id: null,
      domain_name: "",
      client_id: null,
      client_name: "",
      product_id: null,
      vender_id: null,
      product_name: "",
      expiry_date: "",
      amount: "",
      status: "2",
      remarks: "",
      deleted_at: null
    })
  }

  // Cancel Add New
  const handleCancelAdd = () => {
    setAddingNew(false)
    setNewRecordData({
      domain_id: null,
      domain_name: "",
      client_id: null,
      client_name: "",
      product_id: null,
      vender_id: null,
      product_name: "",
      expiry_date: "",
      amount: "",
      status: "2",
      remarks: "",
      deleted_at: null
    })
  }

  // Save New Record
  const handleSaveNew = async () => {
    try {
      setIsSaving(true)
      
      if (!newRecordData.domain_id || !newRecordData.client_id || 
          !newRecordData.product_id || !newRecordData.vender_id || !newRecordData.expiry_date ){
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
        vender_id: newRecordData.vender_id!,
        domain_id: newRecordData.domain_id!,
        client_id: newRecordData.client_id!,
        expiry_date: newRecordData.expiry_date,
        amount: parseFloat(newRecordData.amount) || 0,
        status: parseInt(newRecordData.status) as 0 | 1 | 2,
        remarks: newRecordData.remarks
      }

      // Add deleted_at if provided
      if (newRecordData.deleted_at) {
        payload.deleted_at = formatToDatabaseDateTime(newRecordData.deleted_at)
      }

      const response = await apiService.addRecord(payload)
      
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
          vender_id: null,
          product_name: "",
          expiry_date: "",
          amount: "",
          status: "2",
          remarks: "",
          deleted_at: null
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
        vender_id: record.vender_id || undefined,
        amount: record.amount || 0,
        remarks: record.remarks || "",
        remark_id: record?.latest_remark?.id || null,
        deleted_at: record.deleted_at // Include deleted_at in edit data
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
          !updatedData.product_id || !updatedData.vender_id || !updatedData.expiry_date || 
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
        vender_id: updatedData.vender_id!,
        domain_id: updatedData.domain_id!,
        client_id: updatedData.client_id!,
        expiry_date: updatedData.expiry_date!,
        amount: updatedData.amount || 0,
        status: updatedData.status ?? 2,
        remarks: updatedData.remarks || "",
        remark_id: updatedData.remark_id || null,
      }

      // Add deleted_at if editing and record has deletion date
      if (updatedData.deleted_at !== undefined) {
        payload.deleted_at = updatedData.deleted_at
      }

      const response = await apiService.editRecord(payload)
      
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

  const confirmDelete = async () => {
    try {
      setIsDeleting(true)
      
      const idsToDelete = itemToDelete ? [itemToDelete] : selectedItems
      
      const response = await apiService.deleteRecords(idsToDelete, 3)
      
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

    const handleViewDetails = (item: HostingRecord) => {
    if (!item.id) {
      toast({
        title: "Error",
        description: "Product ID not found",
        variant: "destructive",
      });
      return;
    }
    
    // Redirect to details page with recordType and recordId
    router.push(`/${user?.role}/categaries-details/${item.id}?recordType=3`);
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  // Filter data based on showDeleted state
  const filteredData = data.filter(item => {
    if (showDeleted) {
      return item.deleted_at !== null
    } else {
      return item.deleted_at === null
    }
  })

  const startItem = pagination.page * pagination.rowsPerPage + 1

  // Handle Select All
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(filteredData.filter(item => !item.deleted_at).map(item => item.id))
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

  const isAllSelected = filteredData.length > 0 && 
    selectedItems.length === filteredData.filter(item => !item.deleted_at).length

  const getStatusColor = (status: 0 | 1 | 2) => {
    if (status === 1) return 'text-green-400'
    if (status === 0) return 'text-red-400'
    return 'text-orange-400' // For status 2 (Expired)
  }

  const getStatusText = (status: 0 | 1 | 2) => {
    if (status === 1) return 'Active'
    if (status === 0) return 'Inactive'
    return 'Expired' // For status 2
  }

  const getStatusIcon = (status: 0 | 1 | 2) => {
    if (status === 1) return <CheckCircle className="w-4 h-4" />
    if (status === 0) return <XCircle className="w-4 h-4" />
    return <Clock className="w-4 h-4" /> // For status 2 (Expired)
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  // Format date with time for deleted_at
  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return "Not Set"
    
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateString
    }
  }

  // Format for datetime-local input
  const formatToDateTimeLocal = (dateString: string | null): string => {
    if (!dateString) return ""
    
    try {
      const date = new Date(dateString)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      
      return `${year}-${month}-${day}T${hours}:${minutes}`
    } catch {
      return dateString.replace(' ', 'T').substring(0, 16)
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
              
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowDeleted(!showDeleted)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                      showDeleted 
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                        : 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {showDeleted ? (
                      <>
                        <CheckCircle className="w-3 h-3" />
                        Show Active
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-3 h-3" />
                        Show Deleted
                      </>
                    )}
                  </button>
                  {showDeleted && (
                    <span className="text-xs text-gray-400">
                      {filteredData.length} deleted records
                    </span>
                  )}
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
                  
                  {!addingNew && !showDeleted && (
                    <GlassButton
                      variant="primary"
                      onClick={handleAddNew}
                      className="flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Hosting
                    </GlassButton>
                  )}
                </div>
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
                        checked={isAllSelected && filteredData.length > 0}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500/50 cursor-pointer"
                        disabled={showDeleted}
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
                      Vender
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 min-w-[140px]">
                      Expiry Date
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 min-w-[120px]">
                      Amount
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
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 min-w-[160px]">
                      Deletion Date
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 min-w=[140px]">
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
                      <td colSpan={14} className="py-8 text-center">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <DashboardLoader label="Fetching Hosting....." />
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <>
                      {/* Add New Row */}
                      {addingNew && !showDeleted && (
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
                                newRecordData.vender_id
                                  ? {
                                      value: newRecordData.vender_id,
                                      label: newRecordData.vender_name,
                                    }
                                  : null
                              }
                              onChange={(option) => {
                                handleNewRecordChange(
                                  "vender_id",
                                  option?.value ?? null,
                                );
                                handleNewRecordChange(
                                  "vender_name",
                                  option?.label ?? "",
                                );
                              }}
                              placeholder="Vender"
                              className="min-h-[32px]"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="date"
                              value={newRecordData.expiry_date}
                              onChange={(e) => handleNewRecordChange('expiry_date', e.target.value)}
                              className="w-full px-2 py-1 bg-white/5 border border-blue-500/30 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/30 backdrop-blur-sm"
                              style={{ minHeight: '32px' }}
                            />
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="number"
                              value={newRecordData.amount}
                              onChange={(e) => handleNewRecordChange('amount', e.target.value)}
                              className="w-full px-2 py-1 bg-white/5 border border-blue-500/30 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/30 backdrop-blur-sm"
                              style={{ minHeight: '32px' }}
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="number"
                              value={calculateDays(newRecordData.expiry_date)}
                              readOnly
                              className="w-full px-2 py-1 bg-white/10 border border-white/10 rounded text-gray-400 text-xs cursor-not-allowed"
                              style={{ minHeight: '32px' }}
                            />
                          </td>
                          <td className="py-1 px-2">
                           <div className="w-40">
  <GlassSelect
    options={[
      { value: "1", label: "Active" },
      { value: "0", label: "Inactive" },
      { value: "2", label: "Expired" },
    ]}
    value={
      [
        { value: "1", label: "Active" },
        { value: "0", label: "Inactive" },
        { value: "2", label: "Expired" },
      ].find(
        (opt) => opt.value === newRecordData.status
      ) || null
    }
    onChange={(selected: any) =>
      handleNewRecordChange(
        "status",
        selected?.value as "1" | "0" | "2"
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
                          <td className="py-3 px-4">
                          <div className="flex flex-col gap-2">
  <div className="flex items-center gap-2">
    <input
      type="date"
      value={newRecordData.deleted_at || ''}
      onChange={(e) => handleNewRecordChange('deleted_at', e.target.value)}
      className="w-full px-2 py-1 bg-white/5 border border-gray-500/30 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/30 backdrop-blur-sm"
      style={{ minHeight: '32px' }}
    />
  </div>
</div>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-300">
                            {new Date().toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
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
                      {filteredData.length === 0 ? (
                        <tr>
                          <td colSpan={14} className="py-8 text-center">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <Server className="w-12 h-12 text-gray-400" />
                              <span className="text-gray-400">
                                {showDeleted ? "No deleted hosting records found" : "No hosting records found"}
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
                        filteredData.map((item, index) => {
                          // Debug: Log each item's deleted_at
                          console.log(`Hosting Item ${item.id}:`, {
                            deleted_at: item.deleted_at,
                            hasDeletedAt: !!item.deleted_at
                          })
                          
                          return (
                            <tr
                              key={item.id}
                              className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors ${
                                editingId === item.id ? 'bg-blue-500/5' : ''
                              } ${item.deleted_at ? 'bg-red-500/5' : ''}`}
                            >
                              <td className="py-3 px-4">
                                {!item.deleted_at && (
                                  <input
                                    type="checkbox"
                                    checked={selectedItems.includes(item.id)}
                                    onChange={(e) => handleSelectItem(item.id, e.target.checked)}
                                    className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500/50 cursor-pointer"
                                  />
                                )}
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-300">
                                {startItem + index}
                              </td>
                              
                              {editingId === item.id && !item.deleted_at ? (
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
                                  <td className="py-3 px-4">
                                    <ApiDropdown
                                      endpoint="get-venders"
                                      value={
                                        editData[item.id]?.vender_id
                                          ? {
                                              value: editData[item.id]?.vender_id!,
                                              label: editData[item.id]?.vender_name || "",
                                            }
                                          : null
                                      }
                                      onChange={(option) => {
                                        handleEditChange(
                                          item.id,
                                          "vender_id",
                                          option?.value ?? null,
                                        );
                                        handleEditChange(
                                          item.id,
                                          "vender_name",
                                          option?.label ?? "",
                                        );
                                      }}
                                      placeholder="Vender"
                                      className="min-h-[32px]"
                                    />
                                  </td>
                                  <td className="py-3 px-4">
                                    <input
                                      type="date"
                                      value={editData[item.id]?.expiry_date || item.expiry_date}
                                      onChange={(e) => handleEditChange(item.id, 'expiry_date', e.target.value)}
                                      className="w-full px-2 py-1 bg-white/5 border border-blue-500/30 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/30 backdrop-blur-sm"
                                      style={{ minHeight: '32px' }}
                                    />
                                  </td>
                                  <td className="py-3 px-4">
                                    <input
                                      type="number"
                                      value={editData[item.id]?.amount || item.amount || ""}
                                      onChange={(e) => handleEditChange(item.id, 'amount', parseFloat(e.target.value) || 0)}
                                      className="w-full px-2 py-1 bg-white/5 border border-blue-500/30 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/30 backdrop-blur-sm"
                                      style={{ minHeight: '32px' }}
                                      min="0"
                                      step="0.01"
                                    />
                                  </td>
                                  <td className="py-3 px-4">
                                    <input
                                      type="number"
                                      value={calculateDays(editData[item.id]?.expiry_date || item.expiry_date)}
                                      readOnly
                                      className="w-full px-2 py-1 bg-white/10 border border-white/10 rounded text-gray-400 text-sm cursor-not-allowed"
                                      style={{ minHeight: '32px' }}
                                    />
                                  </td>
                                  <td className="py-1 px-2">
                                     <div className="w-40">
  <GlassSelect
    options={[
      { value: "1", label: "Active" },
      { value: "0", label: "Inactive" },
      { value: "2", label: "Expired" },
    ]}
    value={
      [
        { value: "1", label: "Active" },
        { value: "0", label: "Inactive" },
        { value: "2", label: "Expired" },
      ].find(
        (opt) => opt.value === newRecordData.status
      ) || null
    }
    onChange={(selected: any) =>
      handleNewRecordChange(
        "status",
        selected?.value as "1" | "0" | "2"
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
                                      value={editData[item.id]?.remarks || item?.latest_remark?.remark || ""}
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
                                  <td className="py-3 px-4">
                                  <div className="flex flex-col gap-2">
  <div className="flex items-center gap-2">
    <input
      type="date"
      value={newRecordData.deleted_at || ''}
      onChange={(e) => handleNewRecordChange('deleted_at', e.target.value)}
      className="w-full px-2 py-1 bg-white/5 border border-gray-500/30 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/30 backdrop-blur-sm"
      style={{ minHeight: '32px' }}
    />
  </div>
</div>
                                  </td>
                                  <td className="py-3 px-4 text-sm text-gray-300">
                                    {formatDateTime(item.updated_at)}
                                  </td>
                                </>
                              ) : (
                                <>
                                  <td className="py-3 px-4">
                                    <div className="flex items-center gap-2">
                                      <Globe className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                      <span className={`text-sm font-medium ${
                                        item.deleted_at ? 'text-gray-500 line-through' : 'text-white'
                                      }`}>
                                        {item.domain_name || "N/A"}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4">
                                    <div className="flex items-center gap-2">
                                      <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                      <span className={`text-sm font-medium ${
                                        item.deleted_at ? 'text-gray-500 line-through' : 'text-white'
                                      }`}>
                                        {item.client_name || "N/A"}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4">
                                    <div className="flex items-center gap-2">
                                      <Package className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                      <span className={`text-sm font-medium ${
                                        item.deleted_at ? 'text-gray-500 line-through' : 'text-white'
                                      }`}>
                                        {item.product_name}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4">
                                    <div className="flex items-center gap-2">
                                      <span className={`text-sm font-medium ${
                                        item.deleted_at ? 'text-gray-500 line-through' : 'text-white'
                                      }`}>
                                        {item.vender_name || "N/A"}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4 text-sm text-gray-300">
                                    <div className="flex items-center gap-2">
                                      {formatDate(item.expiry_date)}
                                    </div>
                                  </td>
                                  <td className="py-3 px-4 text-sm text-gray-300">
                                    <div className="flex items-center gap-2">
                                      <DollarSign className="w-4 h-4 text-gray-400" />
                                      {item.amount || "0.00"}
                                    </div>
                                  </td>
                                  <td className="py-3 px-4">
                                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm border ${
                                      (item.days_to_expired || calculateDays(item.expiry_date)) < 0 
                                        ? 'bg-red-500/20 text-red-400 border-red-500/20' 
                                        : (item.days_to_expired || calculateDays(item.expiry_date)) <= 30 
                                          ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/20'
                                          : 'bg-green-500/20 text-green-400 border-green-500/20'
                                    }`}>
                                      {item.days_to_expired || calculateDays(item.expiry_date)} days
                                    </div>
                                  </td>
                                  <td className="py-3 px-4">
                                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm border ${getStatusColor(item.status)} ${
                                      item.status === 1 ? 'bg-green-500/20 border-green-500/20' : 
                                      item.status === 0 ? 'bg-red-500/20 border-red-500/20' :
                                      'bg-orange-500/20 border-orange-500/20'
                                    }`}>
                                      {getStatusIcon(item.status)}
                                      {getStatusText(item.status)}
                                    </div>
                                  </td>
                                  <td className="py-3 px-4">
                                    <div className="flex items-center gap-2">
                                      <span className={`text-sm truncate max-w-[180px] ${
                                        item.deleted_at ? 'text-gray-500' : 'text-gray-300'
                                      }`}>
                                        {item?.latest_remark?.remark || ""}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4">
                                    <div className={`text-sm ${
                                      item.deleted_at 
                                        ? 'text-red-400 font-medium' 
                                        : 'text-gray-400'
                                    }`}>
                                      {item.deleted_at ? (
                                        <div className="flex flex-col gap-1">
                                          <div className="flex items-center gap-2">
                                            <Trash2 className="w-3 h-3" />
                                            <span>{formatDateTime(item.deleted_at)}</span>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="flex flex-col gap-1">
                                          <div className="flex items-center gap-2">
                                            <span>{formatDateTime(item.deleted_at)}</span>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                  <td className="py-3 px-4 text-sm text-gray-300">
                                    {formatDateTime(item.updated_at)}
                                  </td>
                                </>
                              )}
                              
                              <td className="py-3 px-4">
                                <div className="flex items-center justify-end gap-2">
                                  {editingId === item.id && !item.deleted_at ? (
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
                                  ) : !item.deleted_at ? (
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
                                  ) : (
                                    <span className="text-xs text-gray-500">No actions</span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!loading && filteredData.length > 0 && (
              <Pagination
                page={pagination.page}
                rowsPerPage={pagination.rowsPerPage}
                totalItems={totalItems}
                onPageChange={handlePageChange}
              />
            )}
          </div>

          {/* Selected Items Info */}
          {selectedItems.length > 0 && !showDeleted && (
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

// import { useState, useEffect, useRef } from "react"
// import { Header } from "@/components/layout"
// import { GlassCard, GlassButton } from "@/components/glass"
// import { DeleteConfirmationModal } from "@/common/services/DeleteConfirmationModal"
// import {
//   Edit,
//   Trash2,
//   Search,
//   Plus,
//   Calendar,
//   Globe,
//   User,
//   Package,
//   Server,
//   Clock,
//   CheckCircle,
//   XCircle,
//   AlertCircle,
//   Loader2,
//   Save,
//   X,
//   DollarSign
// } from "lucide-react"
// import { useAuth } from "@/contexts/AuthContext"
// import { useToast } from "@/hooks/useToast"
// import { useRouter } from "next/navigation"
// import { apiService } from "@/common/services/apiService"
// import Pagination from "@/common/Pagination"
// import DashboardLoader from "@/common/DashboardLoader"
// import { getNavigationByRole } from "@/lib/getNavigationByRole"
// import { ApiDropdown } from "@/common/DynamicDropdown"

// interface HostingRecord {
//   deleted_at: ReactNode
//   id: number
//   client_name: string | null
//   client_id?: number
//   domain_name: string | null
//   domain_id?: number
//   product_name: string
//   product_id?: number
//   vender_name: string
//   vender_id?: number
//   expiry_date: string
//   amount: number | null
//   days_to_expire_today: number
//   today_date: string
//   status: 0 | 1  
//   remarks: string;
//   remark_id: number | null;
//   latest_remark?: {
//     id: number;
//     remark: string;
//   };
//   created_at: string
//   updated_at: string
// }

// interface AddEditHosting {
//   record_type: 3
//   id?: number
//   s_id: number
//   product_id: number
//   vender_id: number
//   domain_id: number
//   client_id: number
//   expiry_date: string
//   amount: number
//   status: 0 | 1
//   remarks: string
//   remark_id: number;
// }

// export default function HostingPage() {
//    const {user} = useAuth()
//   const navigationTabs = getNavigationByRole(user?.role)
//   const { toast } = useToast()
//   const router = useRouter()
  
//   const [data, setData] = useState<HostingRecord[]>([])
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
//     domain_id: null as number | null,
//     domain_name: "",
//     client_id: null as number | null,
//     client_name: "",
//     product_id: null as number | null,
//     vender_id: null as number | null,
//     product_name: "",
//     expiry_date: "",
//     amount: "",
//     status: "1" as "1" | "0",
//     remarks: ""
//   })
  
//   const [editData, setEditData] = useState<Record<number, Partial<HostingRecord>>>({})
  
//   const [pagination, setPagination] = useState({
//     page: 0,
//     rowsPerPage: 10,
//     orderBy: "id" as "id" | "expiry_date" | "domain_name" | "product_name",
//     orderDir: "desc" as "asc" | "desc"
//   })
  
//   const [totalItems, setTotalItems] = useState(0)

//   const searchTimeoutRef = useRef<NodeJS.Timeout>()

//   // Fetch hosting records
//   const fetchHostingRecords = async () => {
//     try {
//       setLoading(true)
      
//       const response = await apiService.listRecords({
//         record_type: 3, // Hosting
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
//           description: response.message || "Failed to fetch hosting records",
//           variant: "destructive"
//         })
//       }
//     } catch (error) {
//       console.error("Error fetching hosting records:", error)
//       toast({
//         title: "Error",
//         description: "Failed to fetch hosting records",
//         variant: "destructive"
//       })
//     } finally {
//       setLoading(false)
//     }
//   }

//   useEffect(() => {
//     fetchHostingRecords()
//   }, [pagination.page, pagination.orderBy, pagination.orderDir])

//   useEffect(() => {
//     if (searchTimeoutRef.current) {
//       clearTimeout(searchTimeoutRef.current)
//     }
    
//     searchTimeoutRef.current = setTimeout(() => {
//       setPagination(prev => ({ ...prev, page: 0 }))
//       fetchHostingRecords()
//     }, 300)
    
//     return () => {
//       if (searchTimeoutRef.current) {
//         clearTimeout(searchTimeoutRef.current)
//       }
//     }
//   }, [searchQuery])

//   // Handle Add New
//   const handleAddNew = () => {
//     const today = new Date().toISOString().split('T')[0]
//     setAddingNew(true)
//     setNewRecordData({
//       domain_id: null,
//       domain_name: "",
//       client_id: null,
//       client_name: "",
//       product_id: null,
//       vender_id: null,
//       product_name: "",
//       expiry_date: "",
//       amount: "",
//       status: "1",
//       remarks: ""
//     })
//   }

//   // Cancel Add New
//   const handleCancelAdd = () => {
//     setAddingNew(false)
//     setNewRecordData({
//       domain_id: null,
//       domain_name: "",
//       client_id: null,
//       client_name: "",
//       product_id: null,
//       vender_id: null,
//       product_name: "",
//       expiry_date: "",
//       amount: "",
//       status: "1",
//       remarks: ""
//     })
//   }

//   // Save New Record
//   const handleSaveNew = async () => {
//     try {
//       setIsSaving(true)
      
//       if (!newRecordData.domain_id || !newRecordData.client_id || 
//           !newRecordData.product_id || !newRecordData.vender_id || !newRecordData.expiry_date ){
//         toast({
//           title: "Error",
//           description: "Please fill all required fields",
//           variant: "destructive"
//         })
//         return
//       }

//       const payload: AddEditHosting = {
//         record_type: 3,
//         s_id: user?.id || 6,
//         product_id: newRecordData.product_id!,
//         vender_id: newRecordData.vender_id!,
//         domain_id: newRecordData.domain_id!,
//         client_id: newRecordData.client_id!,
//         expiry_date: newRecordData.expiry_date,
//         amount: parseFloat(newRecordData.amount) || 0,
//         status: parseInt(newRecordData.status) as 0 | 1,
//         remarks: newRecordData.remarks
//       }

//       const response = await apiService.addRecord(payload as any)
      
//       if (response.status) {
//         toast({
//           title: "Success",
//           description: response.message || "Hosting record added successfully",
//           variant: "default"
//         })
//         setAddingNew(false)
//         fetchHostingRecords()
//         // Reset form
//         setNewRecordData({
//           domain_id: null,
//           domain_name: "",
//           client_id: null,
//           client_name: "",
//           product_id: null,
//           vender_id: null,
//           product_name: "",
//           expiry_date: "",
//           amount: "",
//           status: "1",
//           remarks: ""
//         })
//       } else {
//         toast({
//           title: "Error",
//           description: response.message || "Failed to add hosting record",
//           variant: "destructive"
//         })
//       }
//     } catch (error) {
//       console.error("Error adding hosting record:", error)
//       toast({
//         title: "Error",
//         description: "Failed to add hosting record",
//         variant: "destructive"
//       })
//     } finally {
//       setIsSaving(false)
//     }
//   }

//   // Handle Edit
//   const handleEdit = (record: HostingRecord) => {
//     setEditingId(record.id)
//     setEditData({
//       [record.id]: { 
//         ...record,
//         domain_id: record.domain_id || undefined,
//         client_id: record.client_id || undefined,
//         product_id: record.product_id || undefined,
//         vender_id: record.vender_id || undefined,
//         amount: record.amount || 0,
//         remarks: record.remarks || "",
//         remark_id: record?.latest_remark?.id || null
//       }
//     })
//   }

//   // Handle Save (inline editing)
//   const handleSave = async (id: number) => {
//     try {
//       setIsSaving(true)
//       const updatedData = editData[id]
      
//       if (!updatedData) return
      
//       if (!updatedData.domain_id || !updatedData.client_id || 
//           !updatedData.product_id || !updatedData.vender_id || !updatedData.expiry_date || 
//            updatedData.amount === undefined) {
//         toast({
//           title: "Error",
//           description: "Please fill all required fields",
//           variant: "destructive"
//         })
//         return
//       }

//       const payload: AddEditHosting = {
//         record_type: 3,
//         id,
//         s_id: user?.id || 6,
//         product_id: updatedData.product_id!,
//         vender_id: updatedData.vender_id!,
//         domain_id: updatedData.domain_id!,
//         client_id: updatedData.client_id!,
//         expiry_date: updatedData.expiry_date!,
//         amount: updatedData.amount || 0,
//         status: updatedData.status ?? 1,
//         remarks: updatedData.remarks || "",
//         remark_id: updatedData.remark_id || null,
//       }

//       const response = await apiService.editRecord(payload as any)
      
//       if (response.status) {
//         toast({
//           title: "Success",
//           description: response.message || "Hosting record updated successfully",
//           variant: "default"
//         })
//         setEditingId(null)
//         setEditData({})
//         fetchHostingRecords()
//       } else {
//         toast({
//           title: "Error",
//           description: response.message || "Failed to update hosting record",
//           variant: "destructive"
//         })
//       }
//     } catch (error) {
//       console.error("Error updating hosting record:", error)
//       toast({
//         title: "Error",
//         description: "Failed to update hosting record",
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
//   const handleEditChange = (id: number, field: keyof HostingRecord, value: any) => {
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
//         description: "Please select at least one hosting record",
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
      
//       const response = await apiService.deleteRecords(idsToDelete, 3)
      
//       if (response.status) {
//         toast({
//           title: "Success",
//           description: response.message || "Record(s) deleted successfully",
//           variant: "default"
//         })
        
//         setSelectedItems([])
//         setItemToDelete(null)
//         fetchHostingRecords()
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

//   const handlePageChange = (newPage: number) => {
//     setPagination(prev => ({ ...prev, page: newPage }))
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

//   const startItem = pagination.page * pagination.rowsPerPage + 1

//   return (
//     <div className="min-h-screen pb-8">
//       <Header title="Hosting Management" tabs={navigationTabs} />

//       <div className="px-4 sm:px-6 mt-6">
//         <GlassCard className="p-6 backdrop-blur-xl bg-gradient-to-br from-gray-900/80 via-black/80 to-gray-900/80 border border-white/10 shadow-2xl">
//           {/* Header with Search and Add Button */}
//           <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
//             <div>
//               <div className="flex items-center gap-2">
//                 <Server className="w-6 h-6 text-[#CB8969]" />
//                 <h2 className="text-xl font-semibold text-white">Hosting</h2>
//               </div>
//               <p className="text-sm text-gray-400 mt-1">
//                 Manage your hosting services and expiration dates
//               </p>
//             </div>
            
//             <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
//               <div className="relative flex-1 sm:flex-initial">
//                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
//                 <input
//                   type="text"
//                   placeholder="Search hosting..."
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
//                     Add Hosting
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
//                   <tr className="bg-white/5 border-b border-white/10">
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
//                       Domain Name
//                     </th>
//                     <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 min-w-[180px]">
//                       Client
//                     </th>
//                     <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 min-w-[180px]">
//                        Product 
//                     </th>
//                     <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 min-w-[180px]">
//                        Vender 
//                     </th>
//                     <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 min-w-[140px]">
//                       Renewal Date
//                     </th>
//                     <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 min-w-[120px]">
//                       Amount
//                     </th>
//                     <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 min-w-[120px]">
//                       Days to Expire
//                     </th>
//                     <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 min-w-[120px]">
//                       Status
//                     </th>
//                     <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 min-w-[180px]">
//                       Remarks
//                     </th>
//                     <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 min-w-[120px]">
//                       Deleted Date
//                     </th>
//                     <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 min-w-[120px]">
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
//                       <td colSpan={11} className="py-8 text-center">
//                         <div className="flex flex-col items-center justify-center gap-2">
//                           <DashboardLoader label="Fetching Hosting....." />
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
//                             <ApiDropdown
//                               endpoint="get-domains"
//                               value={
//                                 newRecordData.domain_id
//                                   ? {
//                                       value: newRecordData.domain_id,
//                                       label: newRecordData.domain_name,
//                                     }
//                                   : null
//                               }
//                               onChange={(option) => {
//                                 handleNewRecordChange(
//                                   "domain_id",
//                                   option?.value ?? null,
//                                 );
//                                 handleNewRecordChange(
//                                   "domain_name",
//                                   option?.label ?? "",
//                                 );
//                               }}
//                               placeholder="Domain"
//                               className="min-h-[32px]"
//                             />
//                           </td>
//                           <td className="py-3 px-4">
//                             <ApiDropdown
//                               endpoint="get-clients"
//                               value={
//                                 newRecordData.client_id
//                                   ? {
//                                       value: newRecordData.client_id,
//                                       label: newRecordData.client_name,
//                                     }
//                                   : null
//                               }
//                               onChange={(option) => {
//                                 handleNewRecordChange(
//                                   "client_id",
//                                   option?.value ?? null,
//                                 );
//                                 handleNewRecordChange(
//                                   "client_name",
//                                   option?.label ?? "",
//                                 );
//                               }}
//                               placeholder="Client"
//                               className="min-h-[32px]"
//                             />
//                           </td>
//                           <td className="py-3 px-4">
//                             <ApiDropdown
//                               endpoint="get-products"
//                               value={
//                                 newRecordData.product_id
//                                   ? {
//                                       value: newRecordData.product_id,
//                                       label: newRecordData.product_name,
//                                     }
//                                   : null
//                               }
//                               onChange={(option) => {
//                                 handleNewRecordChange(
//                                   "product_id",
//                                   option?.value ?? null,
//                                 );
//                                 handleNewRecordChange(
//                                   "product_name",
//                                   option?.label ?? "",
//                                 );
//                               }}
//                               placeholder="Product"
//                               className="min-h-[32px]"
//                             />
//                           </td>
//                           <td className="py-3 px-4">
//                             <ApiDropdown
//                               endpoint="get-venders"
//                               value={
//                                 newRecordData.vender_id
//                                   ? {
//                                       value: newRecordData.vender_id,
//                                       label: newRecordData.vender_name,
//                                     }
//                                   : null
//                               }
//                               onChange={(option) => {
//                                 handleNewRecordChange(
//                                   "vender_id",
//                                   option?.value ?? null,
//                                 );
//                                 handleNewRecordChange(
//                                   "vender_name",
//                                   option?.label ?? "",
//                                 );
//                               }}
//                               placeholder="Vender"
//                               className="min-h-[32px]"
//                             />
//                           </td>
//                           <td className="py-3 px-4">
//                             <input
//                               type="date"
//                               value={newRecordData.expiry_date}
//                               onChange={(e) => handleNewRecordChange('expiry_date', e.target.value)}
//                               className="w-full px-2 py-1 bg-white/5 border border-blue-500/30 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/30 backdrop-blur-sm"
//                               style={{ minHeight: '32px' }}
//                             />
//                           </td>
//                           <td className="py-3 px-4">
//                             <input
//                               type="number"
//                               value={newRecordData.amount}
//                               onChange={(e) => handleNewRecordChange('amount', e.target.value)}
//                               className="w-full px-2 py-1 bg-white/5 border border-blue-500/30 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/30 backdrop-blur-sm"
//                               style={{ minHeight: '32px' }}
//                               min="0"
//                               step="0.01"
//                               placeholder="0.00"
//                             />
//                           </td>
//                           <td className="py-3 px-4">
//                             <input
//                               type="number"
//                               value={calculateDays(newRecordData.expiry_date)}
//                               readOnly
//                               className="w-full px-2 py-1 bg-white/10 border border-white/10 rounded text-gray-400 text-sm cursor-not-allowed"
//                               style={{ minHeight: '32px' }}
//                             />
//                           </td>
//                           <td className="py-3 px-4">
//                             <select
//                               value={newRecordData.status}
//                               onChange={(e) => handleNewRecordChange('status', e.target.value as "1" | "0")}
//                               className="w-full px-2 py-1 bg-white/5 border border-blue-500/30 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/30 backdrop-blur-sm"
//                               style={{ minHeight: '32px' }}
//                             >
//                               <option value="1" className="bg-gray-900 text-white">Active</option>
//                               <option value="0" className="bg-gray-900 text-white">Inactive</option>
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
//                            <td className="py-3 px-4 text-sm text-gray-300">
//                                   {"- -"}
//                                 </td>
//                            <td className="py-3 px-4 text-sm text-gray-300">
//                                   {"- -"}
//                                 </td>
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
//                           <td colSpan={11} className="py-8 text-center">
//                             <div className="flex flex-col items-center justify-center gap-2">
//                               <Server className="w-12 h-12 text-gray-400" />
//                               <span className="text-gray-400">No hosting records found</span>
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
//                               editingId === item.id ? 'bg-blue-500/5' : ''
//                             }`}
//                           >
//                             <td className="py-3 px-4">
//                               <input
//                                 type="checkbox"
//                                 checked={selectedItems.includes(item.id)}
//                                 onChange={(e) => handleSelectItem(item.id, e.target.checked)}
//                                 className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500/50 cursor-pointer"
//                               />
//                             </td>
//                             <td className="py-3 px-4 text-sm text-gray-300">
//                               {startItem + index}
//                             </td>
                            
//                             {editingId === item.id ? (
//                               <>
//                                 <td className="py-3 px-4">
//                                   <ApiDropdown
//                                     endpoint="get-domains"
//                                     value={
//                                       editData[item.id]?.domain_id
//                                         ? {
//                                             value: editData[item.id]?.domain_id!,
//                                             label: editData[item.id]?.domain_name || "",
//                                           }
//                                         : null
//                                     }
//                                     onChange={(option) => {
//                                       handleEditChange(
//                                         item.id,
//                                         "domain_id",
//                                         option?.value ?? null,
//                                       );
//                                       handleEditChange(
//                                         item.id,
//                                         "domain_name",
//                                         option?.label ?? "",
//                                       );
//                                     }}
//                                     placeholder="Domain"
//                                     className="min-h-[32px]"
//                                   />
//                                 </td>
//                                 <td className="py-3 px-4">
//                                   <ApiDropdown
//                                     endpoint="get-clients"
//                                     value={
//                                       editData[item.id]?.client_id
//                                         ? {
//                                             value: editData[item.id]?.client_id!,
//                                             label: editData[item.id]?.client_name || "",
//                                           }
//                                         : null
//                                     }
//                                     onChange={(option) => {
//                                       handleEditChange(
//                                         item.id,
//                                         "client_id",
//                                         option?.value ?? null,
//                                       );
//                                       handleEditChange(
//                                         item.id,
//                                         "client_name",
//                                         option?.label ?? "",
//                                       );
//                                     }}
//                                     placeholder="Client"
//                                     className="min-h-[32px]"
//                                   />
//                                 </td>
//                                 <td className="py-3 px-4">
//                                   <ApiDropdown
//                                     endpoint="get-products"
//                                     value={
//                                       editData[item.id]?.product_id
//                                         ? {
//                                             value: editData[item.id]?.product_id!,
//                                             label: editData[item.id]?.product_name || "",
//                                           }
//                                         : null
//                                     }
//                                     onChange={(option) => {
//                                       handleEditChange(
//                                         item.id,
//                                         "product_id",
//                                         option?.value ?? null,
//                                       );
//                                       handleEditChange(
//                                         item.id,
//                                         "product_name",
//                                         option?.label ?? "",
//                                       );
//                                     }}
//                                     placeholder="Product"
//                                     className="min-h-[32px]"
//                                   />
//                                 </td>
//                                 <td className="py-3 px-4">
//                                   <ApiDropdown
//                                     endpoint="get-venders"
//                                     value={
//                                       editData[item.id]?.vendor_id
//                                         ? {
//                                             value: editData[item.id]?.vendor_id!,
//                                             label: editData[item.id]?.vendor_name || "",
//                                           }
//                                         : null
//                                     }
//                                     onChange={(option) => {
//                                       handleEditChange(
//                                         item.id,
//                                         "vendor_id",
//                                         option?.value ?? null,
//                                       );
//                                       handleEditChange(
//                                         item.id,
//                                         "vendor_name",
//                                         option?.label ?? "",
//                                       );
//                                     }}
//                                     placeholder="Vendor"
//                                     className="min-h-[32px]"
//                                   />
//                                 </td>
//                                 <td className="py-3 px-4">
//                                   <input
//                                     type="date"
//                                     value={editData[item.id]?.expiry_date || item.expiry_date}
//                                     onChange={(e) => handleEditChange(item.id, 'expiry_date', e.target.value)}
//                                     className="w-full px-2 py-1 bg-white/5 border border-blue-500/30 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/30 backdrop-blur-sm"
//                                     style={{ minHeight: '32px' }}
//                                   />
//                                 </td>
//                                 <td className="py-3 px-4">
//                                   <input
//                                     type="number"
//                                     value={editData[item.id]?.amount || item.amount || ""}
//                                     onChange={(e) => handleEditChange(item.id, 'amount', parseFloat(e.target.value) || 0)}
//                                     className="w-full px-2 py-1 bg-white/5 border border-blue-500/30 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/30 backdrop-blur-sm"
//                                     style={{ minHeight: '32px' }}
//                                     min="0"
//                                     step="0.01"
//                                   />
//                                 </td>
//                                 <td className="py-3 px-4">
//                                   <input
//                                     type="number"
//                                     value={calculateDays(editData[item.id]?.expiry_date || item.expiry_date)}
//                                     readOnly
//                                     className="w-full px-2 py-1 bg-white/10 border border-white/10 rounded text-gray-400 text-sm cursor-not-allowed"
//                                     style={{ minHeight: '32px' }}
//                                   />
//                                 </td>
//                                 <td className="py-3 px-4">
//                                   <select
//                                     value={editData[item.id]?.status?.toString() || item.status.toString()}
//                                     onChange={(e) => handleEditChange(item.id, 'status', parseInt(e.target.value) as 0 | 1)}
//                                     className="w-full px-2 py-1 bg-white/5 border border-blue-500/30 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/30 backdrop-blur-sm"
//                                     style={{ minHeight: '32px' }}
//                                   >
//                                     <option value="1" className="bg-gray-900 text-white">Active</option>
//                                     <option value="0" className="bg-gray-900 text-white">Inactive</option>
//                                   </select>
//                                 </td>
//                                 <td className="py-3 px-4">
//                                   <input
//                                     type="text"
//                                     value={editData[item.id]?.remarks || item?.latest_remark?.remark}
//                                     onChange={(e) =>
//                                       handleEditChange(
//                                         item.id,
//                                         "remarks",
//                                         e.target.value,
//                                       )
//                                     }
//                                     className="w-full px-2 py-1 bg-white/5 border border-blue-500/30 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/30 backdrop-blur-sm"
//                                     style={{ minHeight: "32px" }}
//                                   />
//                                 </td>
//                                  <td className="py-3 px-4 text-sm text-gray-300">
//                                   {(item.deleted_at)}
//                                 </td>
//                                  <td className="py-3 px-4 text-sm text-gray-300">
//                                   {(item.updated_at)}
//                                 </td>
//                               </>
//                             ) : (
//                               <>
//                                 <td className="py-3 px-4">
//                                   <div className="flex items-center gap-2">
//                                     <Globe className="w-4 h-4 text-gray-400 flex-shrink-0" />
//                                     <span className="text-sm text-white font-medium">
//                                       {item.domain_name || "N/A"}
//                                     </span>
//                                   </div>
//                                 </td>
//                                 <td className="py-3 px-4">
//                                   <div className="flex items-center gap-2">
//                                     <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
//                                     <span className="text-sm text-white font-medium">
//                                       {item.client_name || "N/A"}
//                                     </span>
//                                   </div>
//                                 </td>
//                                 <td className="py-3 px-4">
//                                   <div className="flex items-center gap-2">
//                                     <Package className="w-4 h-4 text-gray-400 flex-shrink-0" />
//                                     <span className="text-sm text-white font-medium">
//                                       {item.product_name}
//                                     </span>
//                                   </div>
//                                 </td>
//                                 <td className="py-3 px-4">
//                                   <div className="flex items-center gap-2">
//                                     {/* <Package className="w-4 h-4 text-gray-400 flex-shrink-0" /> */}
//                                     <span className="text-sm text-white font-medium">
//                                       {item.vender_name}
//                                     </span>
//                                   </div>
//                                 </td>
//                                 <td className="py-3 px-4 text-sm text-gray-300">
//                                   <div className="flex items-center gap-2">
//                                     {/* <Calendar className="w-4 h-4 text-gray-400" /> */}
//                                     {formatDate(item.expiry_date)}
//                                   </div>
//                                 </td>
//                                 <td className="py-3 px-4 text-sm text-gray-300">
//                                   <div className="flex items-center gap-2">
//                                     {/* <DollarSign className="w-4 h-4 text-gray-400" /> */}
//                                     {item.amount || "0.00"}
//                                   </div>
//                                 </td>
//                                 <td className="py-3 px-4">
//                                   <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm border ${
//                                     calculateDays(item.expiry_date) < 0 
//                                       ? 'bg-red-500/20 text-red-400 border-red-500/20' 
//                                       : calculateDays(item.expiry_date) <= 30 
//                                         ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/20'
//                                         : 'bg-green-500/20 text-green-400 border-green-500/20'
//                                   }`}>
//                                     {/* <Clock className="w-3 h-3" /> */}
//                                     {calculateDays(item.expiry_date)} days
//                                   </div>
//                                 </td>
//                                 <td className="py-3 px-4">
//                                   <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm border ${getStatusColor(item.status)} ${
//                                     item.status === 1 ? 'bg-green-500/20 border-green-500/20' : 'bg-red-500/20 border-red-500/20'
//                                   }`}>
//                                     {getStatusIcon(item.status)}
//                                     {getStatusText(item.status)}
//                                   </div>
//                                 </td>
//                                  <td className="py-3 px-4">
//                                   <div className="flex items-center gap-2">
//                                     {/* <AlertCircle className="w-4 h-4 text-gray-400 flex-shrink-0" /> */}
//                                     <span className="text-sm text-gray-300 truncate max-w-[180px]">
//                                       {item?.latest_remark?.remark}
//                                     </span>
//                                   </div>
//                                 </td>
//                                 <td className="py-3 px-4 text-sm text-gray-300">
//                                   {(item.deleted_at)}
//                                 </td>
//                                  <td className="py-3 px-4 text-sm text-gray-300">
//                                   {(item.updated_at)}
//                                 </td>
//                               </>
//                             )}
                            
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
//                   {selectedItems.length} hosting record{selectedItems.length > 1 ? 's' : ''} selected
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
//         title={itemToDelete ? "Delete Hosting Record" : "Delete Multiple Hosting Records"}
//         message={itemToDelete 
//           ? "Are you sure you want to delete this hosting record? This action cannot be undone."
//           : "Are you sure you want to delete the selected hosting records? This action cannot be undone."
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