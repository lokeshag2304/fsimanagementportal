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
  LucideChartColumnStacked
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/useToast"
import { useRouter } from "next/navigation"
import { apiService } from "@/common/services/apiService"
import Pagination from "@/common/Pagination"
import DashboardLoader from "@/common/DashboardLoader"
import { getNavigationByRole } from "@/lib/getNavigationByRole"

interface CounterRecord {
  id: number
  client_name: string | null
  client_id?: number
  product_name: string
  product_id?: number
  count: number
  validity_date: string
  days_to_expire: number
  today_date: string
  status: 0 | 1
  remarks: string
  last_updated: string
  created_at: string
  updated_at: string
}

interface AddEditCounter {
  record_type: 6 // Changed to 6 for Counter
  id?: number
  s_id: number
  product_id: number
  client_id: number
  count: number
  validity_date: string
  status: 0 | 1
  remarks: string
}

export default function CounterPage() {
  const { user } = useAuth()
  const navigationTabs = getNavigationByRole(user?.role);
  const { toast } = useToast()
  const router = useRouter()
  
  const [data, setData] = useState<CounterRecord[]>([])
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
    client_name: "",
    product_name: "",
    count: "",
    validity_date: "",
    status: "1" as "1" | "0",
    remarks: ""
  })
  
  const [editData, setEditData] = useState<Record<number, Partial<CounterRecord>>>({})
  
  const [pagination, setPagination] = useState({
    page: 0,
    rowsPerPage: 10,
    orderBy: "id" as "id" | "validity_date" | "client_name" | "product_name",
    orderDir: "desc" as "asc" | "desc"
  })
  
  const [totalItems, setTotalItems] = useState(0)
  
  // Sample data for dropdowns (fetch from APIs in real implementation)
  const clientOptions = [
    { id: 1, name: "John Smith" },
    { id: 2, name: "Sarah Johnson" },
    { id: 3, name: "Mike Wilson" },
    { id: 4, name: "David Brown" },
    { id: 5, name: "Emma Davis" }
  ]

  const productOptions = [
    { id: 1, name: "Premium API Calls" },
    { id: 2, name: "SMS Credits" },
    { id: 3, name: "Email Quota" },
    { id: 4, name: "Cloud Storage" },
    { id: 5, name: "Database Queries" },
    { id: 6, name: "File Uploads" }
  ]

  const searchTimeoutRef = useRef<NodeJS.Timeout>()
  const isMountedRef = useRef(true)

  // Fetch counter records
  const fetchCounterRecords = async () => {
    if (!isMountedRef.current) return;
    
    try {
      setLoading(true)
      
      const response = await apiService.listRecords({
        record_type: 6, // Counter records
        search: searchQuery,
        page: pagination.page,
        rowsPerPage: pagination.rowsPerPage,
        orderBy: pagination.orderBy,
        orderDir: pagination.orderDir
      })
      
      if (isMountedRef.current) {
        if (response.status) {
          setData(response.data || [])
          setTotalItems(response.total || 0)
        } else {
          // Backend से error message मिला तो उसे दिखाएं
          toast({
            title: "Error",
            description: response.message || "Failed to fetch counter records",
            variant: "destructive"
          })
        }
      }
    } catch (error: any) {
      console.error("Error fetching counter records:", error)
      
      if (isMountedRef.current) {
        toast({
          title: "Error",
          description: error.response?.data?.message || "Failed to fetch counter records",
          variant: "destructive"
        })
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    isMountedRef.current = true
    fetchCounterRecords()
    
    return () => {
      isMountedRef.current = false
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!isMountedRef.current) return;
    
    const timeoutId = setTimeout(() => {
      fetchCounterRecords()
    }, 300)
    
    return () => {
      clearTimeout(timeoutId)
    }
  }, [pagination.page, pagination.orderBy, pagination.orderDir, searchQuery])

  // Handle Add New
  const handleAddNew = () => {
    const today = new Date().toISOString().split('T')[0]
    setAddingNew(true)
    setNewRecordData({
      client_name: "",
      product_name: "",
      count: "",
      validity_date: today,
      status: "1",
      remarks: ""
    })
  }

  // Cancel Add New
  const handleCancelAdd = () => {
    setAddingNew(false)
  }

  // Save New Record
  const handleSaveNew = async () => {
    try {
      setIsSaving(true)
      
      if (!newRecordData.client_name || !newRecordData.product_name || 
          !newRecordData.count || !newRecordData.validity_date) {
        toast({
          title: "Error",
          description: "Please fill all required fields",
          variant: "destructive"
        })
        return
      }

      // Find IDs for selected names
      const selectedClient = clientOptions.find(c => c.name === newRecordData.client_name)
      const selectedProduct = productOptions.find(p => p.name === newRecordData.product_name)

      if (!selectedClient || !selectedProduct) {
        toast({
          title: "Error",
          description: "Please select valid options from the dropdowns",
          variant: "destructive"
        })
        return
      }

      const payload: AddEditCounter = {
        record_type: 6, // Counter
        s_id: user?.id || 6,
        product_id: selectedProduct.id,
        client_id: selectedClient.id,
        count: parseInt(newRecordData.count),
        validity_date: newRecordData.validity_date,
        status: parseInt(newRecordData.status) as 0 | 1,
        remarks: newRecordData.remarks
      }

      const response = await apiService.addRecord(payload as any)
      
      if (response.success) {
        // Backend से message मिला तो उसे दिखाएं, नहीं तो static message
        toast({
          title: "Success",
          description: response.message || "Counter record added successfully",
          variant: "default"
        })
        setAddingNew(false)
        fetchCounterRecords()
      } else {
        // Backend से error message मिला तो उसे दिखाएं
        toast({
          title: "Error",
          description: response.message || "Failed to add counter record",
          variant: "destructive"
        })
      }
    } catch (error: any) {
      console.error("Error adding counter record:", error)
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to add counter record",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Handle Edit
  const handleEdit = (record: CounterRecord) => {
    setEditingId(record.id)
    setEditData({
      [record.id]: { ...record }
    })
  }

  // Handle Save (inline editing)
  const handleSave = async (id: number) => {
    try {
      setIsSaving(true)
      const updatedData = editData[id]
      
      if (!updatedData) return
      
      // Find IDs for selected names
      const selectedClient = clientOptions.find(c => c.name === updatedData.client_name)
      const selectedProduct = productOptions.find(p => p.name === updatedData.product_name)

      if (!selectedClient || !selectedProduct) {
        toast({
          title: "Error",
          description: "Please select valid options from the dropdowns",
          variant: "destructive"
        })
        return
      }

      const payload: AddEditCounter = {
        record_type: 6,
        id,
        s_id: user?.id || 6,
        product_id: selectedProduct.id,
        client_id: selectedClient.id,
        count: updatedData.count || 0,
        validity_date: updatedData.validity_date || "",
        status: updatedData.status || 1,
        remarks: updatedData.remarks || ""
      }

      const response = await apiService.editRecord(payload as any)
      
      if (response.success) {
        // Backend से message मिला तो उसे दिखाएं, नहीं तो static message
        toast({
          title: "Success",
          description: response.message || "Counter record updated successfully",
          variant: "default"
        })
        setEditingId(null)
        setEditData({})
        fetchCounterRecords()
      } else {
        // Backend से error message मिला तो उसे दिखाएं
        toast({
          title: "Error",
          description: response.message || "Failed to update counter record",
          variant: "destructive"
        })
      }
    } catch (error: any) {
      console.error("Error updating counter record:", error)
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update counter record",
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
  const handleEditChange = (id: number, field: keyof CounterRecord, value: any) => {
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
        description: "Please select at least one counter record",
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
      
      const response = await apiService.deleteRecords(idsToDelete, 6) // record_type: 6 for Counter
      
      if (response.success) {
        // Backend से message मिला तो उसे दिखाएं, नहीं तो हमारा custom message
        const successMessage = response.message || 
          (idsToDelete.length === 1 
            ? "Counter record deleted successfully"
            : `${idsToDelete.length} counter record(s) deleted successfully`)
        
        toast({
          title: "Success",
          description: successMessage,
          variant: "default"
        })
        
        setSelectedItems([])
        setItemToDelete(null)
        fetchCounterRecords()
      } else {
        // Backend से error message मिला तो उसे दिखाएं
        toast({
          title: "Error",
          description: response.message || "Failed to delete counter record(s)",
          variant: "destructive"
        })
      }
    } catch (error: any) {
      console.error("Error deleting:", error)
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete counter record(s)",
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
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  // Calculate days until expiry
  const calculateDays = (validityDate: string) => {
    try {
      const today = new Date()
      const expiry = new Date(validityDate)
      const diffTime = expiry.getTime() - today.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays
    } catch {
      return 0
    }
  }

  // Get count color based on value
  const getCountColor = (count: number) => {
    if (count === 0) return 'text-red-400'
    if (count < 10) return 'text-yellow-400'
    return 'text-green-400'
  }

  const totalPages = Math.ceil(totalItems / pagination.rowsPerPage)
  const startItem = pagination.page * pagination.rowsPerPage + 1
  const endItem = Math.min((pagination.page + 1) * pagination.rowsPerPage, totalItems)

  return (
    <div className="min-h-screen pb-8">
      <Header title="Counter Management" tabs={navigationTabs} />

      <div className="px-4 sm:px-6 mt-6">
        <GlassCard className="p-6">
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
                  className="pl-10 pr-4 py-2 w-full sm:w-64 bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.1)] rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-hidden rounded-lg border border-[rgba(255,255,255,0.1)]">
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[rgba(255,255,255,0.05)] border-b border-[rgba(255,255,255,0.1)]">
                    <th className="py-3 px-4 text-left w-12">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 bg-gray-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
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
                        <tr className="border-b border-[rgba(255,255,255,0.05)] bg-[rgba(59,130,246,0.05)]">
                          <td className="py-3 px-4"></td>
                          <td className="py-3 px-4 text-sm text-gray-300">
                            New
                          </td>
                          <td className="py-3 px-4">
                            <select
                              value={newRecordData.client_name}
                              onChange={(e) => handleNewRecordChange('client_name', e.target.value)}
                              className="w-full px-2 py-1 bg-[rgba(255,255,255,var(--ui-opacity-10))] border border-[rgba(59,130,246,0.3)] rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                              style={{ minHeight: '32px' }}
                            >
                              <option value="" className="bg-gray-800 text-white">Select Client</option>
                              {clientOptions.map(option => (
                                <option key={option.id} value={option.name} className="bg-gray-800 text-white">
                                  {option.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-3 px-4">
                            <select
                              value={newRecordData.product_name}
                              onChange={(e) => handleNewRecordChange('product_name', e.target.value)}
                              className="w-full px-2 py-1 bg-[rgba(255,255,255,var(--ui-opacity-10))] border border-[rgba(59,130,246,0.3)] rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                              style={{ minHeight: '32px' }}
                            >
                              <option value="" className="bg-gray-800 text-white">Select Product</option>
                              {productOptions.map(option => (
                                <option key={option.id} value={option.name} className="bg-gray-800 text-white">
                                  {option.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="number"
                              value={newRecordData.count}
                              onChange={(e) => handleNewRecordChange('count', e.target.value)}
                              className="w-full px-2 py-1 bg-[rgba(255,255,255,var(--ui-opacity-10))] border border-[rgba(59,130,246,0.3)] rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                              style={{ minHeight: '32px' }}
                              min="0"
                              placeholder="0"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="date"
                              value={newRecordData.validity_date}
                              onChange={(e) => handleNewRecordChange('validity_date', e.target.value)}
                              className="w-full px-2 py-1 bg-[rgba(255,255,255,var(--ui-opacity-10))] border border-[rgba(59,130,246,0.3)] rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                              style={{ minHeight: '32px' }}
                            />
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-300">
                            {newRecordData.validity_date ? calculateDays(newRecordData.validity_date) : "--"} days
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-300">
                            {formatDate(new Date().toISOString().split('T')[0])}
                          </td>
                          <td className="py-3 px-4">
                            <select
                              value={newRecordData.status}
                              onChange={(e) => handleNewRecordChange('status', e.target.value as "1" | "0")}
                              className="w-full px-2 py-1 bg-[rgba(255,255,255,var(--ui-opacity-10))] border border-[rgba(59,130,246,0.3)] rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                              style={{ minHeight: '32px' }}
                            >
                              <option value="1" className="bg-gray-800 text-white">Active</option>
                              <option value="0" className="bg-gray-800 text-white">Inactive</option>
                            </select>
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="text"
                              value={newRecordData.remarks}
                              onChange={(e) => handleNewRecordChange('remarks', e.target.value)}
                              className="w-full px-2 py-1 bg-[rgba(255,255,255,var(--ui-opacity-10))] border border-[rgba(59,130,246,0.3)] rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                              style={{ minHeight: '32px' }}
                              placeholder="Remarks"
                            />
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-300">
                            {new Date().toLocaleString()}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={handleSaveNew}
                                disabled={isSaving}
                                className="p-1.5 rounded bg-green-500/20 hover:bg-green-500/30 transition-colors disabled:opacity-50"
                                title="Save"
                              >
                                {isSaving ? (
                                  <Loader2 className="w-4 h-4 animate-spin text-green-400" />
                                ) : (
                                  <Save className="w-4 h-4 text-green-400" />
                                )}
                              </button>
                              <button
                                onClick={handleCancelAdd}
                                disabled={isSaving}
                                className="p-1.5 rounded bg-red-500/20 hover:bg-red-500/30 transition-colors disabled:opacity-50"
                                title="Cancel"
                              >
                                <X className="w-4 h-4 text-red-400" />
                              </button>
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
                              <span className="text-gray-400">No counter records found</span>
                              {searchQuery && (
                                <button
                                  onClick={() => setSearchQuery("")}
                                  className="text-sm text-blue-400 hover:text-blue-300"
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
                            className={`border-b border-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.02)] transition-colors ${
                              editingId === item.id ? 'bg-[rgba(59,130,246,0.05)]' : ''
                            }`}
                          >
                            <td className="py-3 px-4">
                              <input
                                type="checkbox"
                                checked={selectedItems.includes(item.id)}
                                onChange={(e) => handleSelectItem(item.id, e.target.checked)}
                                className="w-4 h-4 rounded border-gray-300 bg-gray-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
                              />
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-300">
                              {startItem + index}
                            </td>
                            
                            {editingId === item.id ? (
                              <>
                                <td className="py-3 px-4">
                                  <select
                                    value={editData[item.id]?.client_name || item.client_name || ""}
                                    onChange={(e) => handleEditChange(item.id, 'client_name', e.target.value)}
                                    className="w-full px-2 py-1 bg-[rgba(255,255,255,var(--ui-opacity-10))] border border-[rgba(59,130,246,0.3)] rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                    style={{ minHeight: '32px' }}
                                  >
                                    <option value="" className="bg-gray-800 text-white">Select Client</option>
                                    {clientOptions.map(option => (
                                      <option key={option.id} value={option.name} className="bg-gray-800 text-white">
                                        {option.name}
                                      </option>
                                    ))}
                                  </select>
                                </td>
                                <td className="py-3 px-4">
                                  <select
                                    value={editData[item.id]?.product_name || item.product_name}
                                    onChange={(e) => handleEditChange(item.id, 'product_name', e.target.value)}
                                    className="w-full px-2 py-1 bg-[rgba(255,255,255,var(--ui-opacity-10))] border border-[rgba(59,130,246,0.3)] rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                    style={{ minHeight: '32px' }}
                                  >
                                    <option value="" className="bg-gray-800 text-white">Select Product</option>
                                    {productOptions.map(option => (
                                      <option key={option.id} value={option.name} className="bg-gray-800 text-white">
                                        {option.name}
                                      </option>
                                    ))}
                                  </select>
                                </td>
                                <td className="py-3 px-4">
                                  <input
                                    type="number"
                                    value={editData[item.id]?.count || item.count}
                                    onChange={(e) => handleEditChange(item.id, 'count', parseInt(e.target.value))}
                                    className="w-full px-2 py-1 bg-[rgba(255,255,255,var(--ui-opacity-10))] border border-[rgba(59,130,246,0.3)] rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                    style={{ minHeight: '32px' }}
                                    min="0"
                                  />
                                </td>
                                <td className="py-3 px-4">
                                  <input
                                    type="date"
                                    value={editData[item.id]?.validity_date || item.validity_date}
                                    onChange={(e) => handleEditChange(item.id, 'validity_date', e.target.value)}
                                    className="w-full px-2 py-1 bg-[rgba(255,255,255,var(--ui-opacity-10))] border border-[rgba(59,130,246,0.3)] rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                    style={{ minHeight: '32px' }}
                                  />
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
                                  <div className={`flex items-center gap-2 ${getCountColor(item.count)}`}>
                                    <Hash className="w-4 h-4" />
                                    <span className="text-sm font-bold">
                                      {item.count}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-sm text-gray-300">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-gray-400" />
                                    {formatDate(item.validity_date)}
                                  </div>
                                </td>
                              </>
                            )}
                            
                            <td className="py-3 px-4">
                              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                                calculateDays(item.validity_date) < 0 
                                  ? 'bg-red-500/20 text-red-400' 
                                  : calculateDays(item.validity_date) <= 30 
                                    ? 'bg-yellow-500/20 text-yellow-400'
                                    : 'bg-green-500/20 text-green-400'
                              }`}>
                                <Clock className="w-3 h-3" />
                                {calculateDays(item.validity_date)} days
                              </div>
                            </td>
                            
                            <td className="py-3 px-4 text-sm text-gray-300">
                              {formatDate(item.today_date)}
                            </td>
                            
                            {editingId === item.id ? (
                              <td className="py-3 px-4">
                                <select
                                  value={editData[item.id]?.status?.toString() || item.status.toString()}
                                  onChange={(e) => handleEditChange(item.id, 'status', parseInt(e.target.value) as 0 | 1)}
                                  className="w-full px-2 py-1 bg-[rgba(255,255,255,var(--ui-opacity-10))] border border-[rgba(59,130,246,0.3)] rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                  style={{ minHeight: '32px' }}
                                >
                                  <option value="1" className="bg-gray-800 text-white">Active</option>
                                  <option value="0" className="bg-gray-800 text-white">Inactive</option>
                                </select>
                              </td>
                            ) : (
                              <td className="py-3 px-4">
                                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(item.status)} bg-opacity-20 ${
                                  item.status === 1 ? 'bg-green-500/20' : 'bg-red-500/20'
                                }`}>
                                  {getStatusIcon(item.status)}
                                  {getStatusText(item.status)}
                                </div>
                              </td>
                            )}
                            
                            {editingId === item.id ? (
                              <td className="py-3 px-4">
                                <input
                                  type="text"
                                  value={editData[item.id]?.remarks || item.remarks}
                                  onChange={(e) => handleEditChange(item.id, 'remarks', e.target.value)}
                                  className="w-full px-2 py-1 bg-[rgba(255,255,255,var(--ui-opacity-10))] border border-[rgba(59,130,246,0.3)] rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                  style={{ minHeight: '32px' }}
                                />
                              </td>
                            ) : (
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <AlertCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                  <span className="text-sm text-gray-300 truncate max-w-[180px]">
                                    {item.remarks}
                                  </span>
                                </div>
                              </td>
                            )}
                            
                            <td className="py-3 px-4 text-sm text-gray-300">
                              {formatDate(item.last_updated)}
                            </td>
                            
                            <td className="py-3 px-4">
                              <div className="flex items-center justify-end gap-2">
                                {editingId === item.id ? (
                                  <>
                                    <button
                                      onClick={() => handleSave(item.id)}
                                      disabled={isSaving}
                                      className="p-1.5 rounded bg-green-500/20 hover:bg-green-500/30 transition-colors disabled:opacity-50"
                                      title="Save"
                                    >
                                      {isSaving ? (
                                        <Loader2 className="w-4 h-4 animate-spin text-green-400" />
                                      ) : (
                                        <Save className="w-4 h-4 text-green-400" />
                                      )}
                                    </button>
                                    <button
                                      onClick={handleCancelEdit}
                                      disabled={isSaving}
                                      className="p-1.5 rounded bg-red-500/20 hover:bg-red-500/30 transition-colors disabled:opacity-50"
                                      title="Cancel"
                                    >
                                      <X className="w-4 h-4 text-red-400" />
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => handleEdit(item)}
                                      className="p-1.5 rounded hover:bg-[rgba(255,255,255,0.1)] transition-colors"
                                      title="Edit"
                                    >
                                      <Edit className="w-4 h-4 text-gray-400 hover:text-blue-400" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteClick(item.id)}
                                      className="p-1.5 rounded hover:bg-red-500/20 transition-colors"
                                      title="Delete"
                                    >
                                      <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-400" />
                                    </button>
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
            <div className="mt-4 p-3 bg-[rgba(255,255,255,0.05)] rounded-lg border border-[rgba(255,255,255,0.1)]">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">
                  {selectedItems.length} counter record{selectedItems.length > 1 ? 's' : ''} selected
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
        title={itemToDelete ? "Delete Counter Record" : "Delete Multiple Counter Records"}
        message={itemToDelete 
          ? "Are you sure you want to delete this counter record? This action cannot be undone."
          : "Are you sure you want to delete the selected counter records? This action cannot be undone."
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
//   User,
//   Hash,
//   Package,
//   Clock,
//   CheckCircle,
//   XCircle,
//   AlertCircle,
//   MessageSquare,
//   RefreshCw,
//   LucideChartColumnStacked
// } from "lucide-react"
// import { getNavigationByRole } from "@/lib/getNavigationByRole"
// import { useAuth } from "@/contexts/AuthContext"

// interface Counter {
//   id: number
//   client: string
//   count: number
//   validity: string
//   daysToExpire: number
//   todayDate: string
//   product: string
//   status: 'Active' | 'Expired' | 'Warning' | 'Inactive'
//   remark: string
//   lastUpdated: string
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

// // Helper function to get current date-time for last updated
// const getCurrentDateTime = (): string => {
//   const now = new Date()
//   return now.toLocaleString('en-US', {
//     month: 'short',
//     day: 'numeric',
//     year: 'numeric',
//     hour: '2-digit',
//     minute: '2-digit'
//   })
// }

// // Calculate status based on validity date
// const calculateStatus = (validity: string): 'Active' | 'Expired' | 'Warning' | 'Inactive' => {
//   const today = new Date()
//   const expire = new Date(validity)
//   const daysUntilExpire = calculateDaysBetween(today, expire)
  
//   if (daysUntilExpire < 0) return 'Expired'
//   if (daysUntilExpire <= 7) return 'Warning'
//   if (daysUntilExpire > 7) return 'Active'
//   return 'Inactive'
// }

// // Calculate days until expiration
// const calculateDaysToExpire = (validity: string): number => {
//   const today = new Date()
//   const expire = new Date(validity)
//   return calculateDaysBetween(today, expire)
// }

// // Generate remark based on count and validity
// const generateRemark = (count: number, validity: string): string => {
//   const days = calculateDaysToExpire(validity)
  
//   if (count === 0) return "No counts remaining"
//   if (days < 0) return "Validity expired"
//   if (days <= 7) return `Expiring in ${days} days`
//   if (count < 10) return `Low count: ${count} remaining`
//   if (count > 100) return "High usage account"
  
//   return "Normal usage"
// }

// const initialData: Counter[] = []

// export default function CounterPage() {
//    const {user} = useAuth()
//   const navigationTabs = getNavigationByRole(user?.role)
//   const [data, setData] = useState<Counter[]>(initialData)
//   const [searchQuery, setSearchQuery] = useState("")
//   const [selectedItems, setSelectedItems] = useState<number[]>([])
//   const [isModalOpen, setIsModalOpen] = useState(false)
//   const [editingCounter, setEditingCounter] = useState<Counter | null>(null)
//   const [formData, setFormData] = useState({
//     client: "",
//     count: "",
//     validity: "",
//     product: ""
//   })

//   // Update todayDate and calculations whenever data changes
//   useEffect(() => {
//     const updatedData = data.map(item => {
//       const daysToExpire = calculateDaysToExpire(item.validity)
//       const status = calculateStatus(item.validity)
//       const remark = generateRemark(item.count, item.validity)
      
//       return {
//         ...item,
//         todayDate: getTodayDate(),
//         daysToExpire,
//         status,
//         remark
//       }
//     })
//     setData(updatedData)
//   }, [])

//   const filteredData = data.filter(item =>
//     item.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
//     item.product.toLowerCase().includes(searchQuery.toLowerCase()) ||
//     item.status.toLowerCase().includes(searchQuery.toLowerCase())
//   )

//   const handleAdd = () => {
//     setEditingCounter(null)
//     setFormData({
//       client: "",
//       count: "",
//       validity: "",
//       product: ""
//     })
//     setIsModalOpen(true)
//   }

//   const handleEdit = (counter: Counter) => {
//     setEditingCounter(counter)
//     setFormData({
//       client: counter.client,
//       count: counter.count.toString(),
//       validity: counter.validity,
//       product: counter.product
//     })
//     setIsModalOpen(true)
//   }

//   const handleDelete = (id: number) => {
//     if (confirm("Are you sure you want to delete this counter?")) {
//       setData(data.filter(item => item.id !== id))
//       setSelectedItems(selectedItems.filter(selectedId => selectedId !== id))
//     }
//   }

//   const handleRefresh = (id: number) => {
//     if (confirm("Refresh this counter's data?")) {
//       setData(data.map(item =>
//         item.id === id
//           ? {
//               ...item,
//               lastUpdated: getCurrentDateTime(),
//               todayDate: getTodayDate()
//             }
//           : item
//       ))
//       alert("Counter data refreshed successfully!")
//     }
//   }

//   const handleSubmit = () => {
//     const daysToExpire = calculateDaysToExpire(formData.validity)
//     const status = calculateStatus(formData.validity)
//     const count = parseInt(formData.count)
//     const remark = generateRemark(count, formData.validity)
//     const lastUpdated = getCurrentDateTime()

//     if (editingCounter) {
//       setData(data.map(item =>
//         item.id === editingCounter.id
//           ? {
//               ...item,
//               client: formData.client,
//               count,
//               validity: formData.validity,
//               product: formData.product,
//               todayDate: getTodayDate(),
//               daysToExpire,
//               status,
//               remark,
//               lastUpdated
//             }
//           : item
//       ))
//     } else {
//       const newCounter: Counter = {
//         id: Math.max(...data.map(item => item.id)) + 1,
//         client: formData.client,
//         count,
//         validity: formData.validity,
//         todayDate: getTodayDate(),
//         daysToExpire,
//         product: formData.product,
//         status,
//         remark,
//         lastUpdated
//       }
//       setData([...data, newCounter])
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

//   const getStatusColor = (status: Counter['status']) => {
//     switch (status) {
//       case 'Active': return 'text-green-400'
//       case 'Warning': return 'text-yellow-400'
//       case 'Expired': return 'text-red-400'
//       case 'Inactive': return 'text-gray-400'
//       default: return 'text-gray-400'
//     }
//   }

//   const getStatusIcon = (status: Counter['status']) => {
//     switch (status) {
//       case 'Active': return <CheckCircle className="w-4 h-4" />
//       case 'Warning': return <AlertCircle className="w-4 h-4" />
//       case 'Expired': return <XCircle className="w-4 h-4" />
//       case 'Inactive': return <Clock className="w-4 h-4" />
//       default: return <AlertCircle className="w-4 h-4" />
//     }
//   }

//   // Sample client options
//   const clientOptions = [ ]

//   // Sample product options
//   const productOptions = [ ]

//   return (
//     <div className="min-h-screen pb-8">
//       <Header title="Counter Management" tabs={navigationTabs} />

//       <div className="px-4 sm:px-6 mt-6">
//         <GlassCard className="p-6">
//           {/* Header with Search and Add Button */}
//           <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
//             <div>
//             <div className="flex items-center gap-2">            
//                 <LucideChartColumnStacked className="w-6 h-6 text-[#CB8959]" />
//                 <h2 className="text-xl font-semibold text-white">Counters</h2>
//               </div>
//               <p className="text-sm text-gray-400 mt-1">
//                 Manage your counters and track their usage.
//               </p>
//             </div>
//             <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
//               <div className="relative">
//                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
//                 <input
//                   type="text"
//                   placeholder="Search counters..."
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
//                 Add Counter
//               </GlassButton>
//             </div>
//           </div>

//           {/* Table */}
//           <div className="overflow-x-auto">
//             <table className="w-full min-w-[1200px]">
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
//                     Client
//                   </th>
//                   <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-tertiary)]">
//                     Count
//                   </th>
//                   <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-tertiary)]">
//                     Validity
//                   </th>
//                   <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-tertiary)]">
//                     Days to Expire
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
//                   <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-tertiary)]">
//                     Remark
//                   </th>
//                   <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-tertiary)]">
//                     Last Updated
//                   </th>
//                   <th className="text-right py-3 px-4 text-sm font-medium text-[var(--text-tertiary)] w-[140px]">
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
                       
//                         <span className="text-sm text-white font-medium">{item.client}</span>
//                       </div>
//                     </td>
//                     <td className="py-3 px-4">
//                       <div className={`flex items-center gap-2 ${
//                         item.count === 0 ? 'text-red-400' : 
//                         item.count < 10 ? 'text-yellow-400' : 
//                         'text-green-400'
//                       }`}>
                        
//                         <span className="text-sm font-bold">{item.count}</span>
//                       </div>
//                     </td>
//                     <td className="py-3 px-4">
//                       <div className="flex items-center gap-2">
                        
//                         <span className="text-sm text-[var(--text-secondary)]">
//                           {new Date(item.validity).toLocaleDateString('en-US', {
//                             month: 'short',
//                             day: 'numeric',
//                             year: 'numeric'
//                           })}
//                         </span>
//                       </div>
//                     </td>
//                     <td className="py-3 px-4">
//                       <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
//                         item.daysToExpire < 0 
//                           ? 'bg-red-500/20 text-red-400' 
//                           : item.daysToExpire <= 7 
//                             ? 'bg-yellow-500/20 text-yellow-400'
//                             : 'bg-green-500/20 text-green-400'
//                       }`}>
                      
//                         {item.daysToExpire >= 0 ? `${item.daysToExpire} days` : `${Math.abs(item.daysToExpire)} days ago`}
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
                       
//                         {item.status}
//                       </div>
//                     </td>
//                     <td className="py-3 px-4">
//                       <div className="flex items-center gap-2">
                      
//                         <span className="text-sm text-[var(--text-secondary)] max-w-[150px] truncate">
//                           {item.remark}
//                         </span>
//                       </div>
//                     </td>
//                     <td className="py-3 px-4">
//                       <div className="flex items-center gap-2">
                       
//                         <span className="text-sm text-[var(--text-secondary)]">
//                           {item.lastUpdated}
//                         </span>
//                       </div>
//                     </td>
//                     <td className="py-3 px-4">
//                       <div className="flex items-center justify-end gap-2">
//                         {/* <button
//                           onClick={() => handleRefresh(item.id)}
//                           className="p-2 rounded-lg hover:bg-blue-500/20 transition-colors"
//                           title="Refresh"
//                         >
//                           <RefreshCw className="w-4 h-4 text-blue-400" />
//                         </button> */}
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
//                 {selectedItems.length} counter{selectedItems.length > 1 ? 's' : ''} selected
//               </span>
//             </div>
//           )}

//           {filteredData.length === 0 && (
//             <div className="text-center py-8">
//               <span className="text-[var(--text-muted)]">No counters found</span>
//             </div>
//           )}
//         </GlassCard>
//       </div>

//       {/* Add/Edit Modal */}
//       <GlassModal
//         isOpen={isModalOpen}
//         onClose={() => setIsModalOpen(false)}
//         title={editingCounter ? "Edit Counter" : "Add New Counter"}
//         size="lg"
//       >
//         <div className="space-y-4">
//           <div>
//             <label className="block text-[var(--text-tertiary)] text-sm mb-2">Client</label>
//             <select
//               value={formData.client}
//               onChange={(e) => setFormData({ ...formData, client: e.target.value })}
//               className="w-full px-4 py-2 bg-[rgba(255,255,255,var(--ui-opacity-10))] border border-[rgba(255,255,255,var(--glass-border-opacity))] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent"
//             >
//               <option value="">Select client</option>
//               {clientOptions.map((client, index) => (
//                 <option key={index} value={client} className="bg-gray-800 text-white">
//                   {client}
//                 </option>
//               ))}
//             </select>
//           </div>
          
//           <div className="grid grid-cols-2 gap-4">
//             <div>
//               <label className="block text-[var(--text-tertiary)] text-sm mb-2">Count</label>
//               <GlassInput
//                 type="number"
//                 placeholder="Enter count"
//                 value={formData.count}
//                 onChange={(e) => setFormData({ ...formData, count: e.target.value })}
//                 min="0"
//               />
//             </div>
            
//             <div>
//               <label className="block text-[var(--text-tertiary)] text-sm mb-2">Validity Date</label>
//               <GlassInput
//                 type="date"
//                 value={formData.validity}
//                 onChange={(e) => setFormData({ ...formData, validity: e.target.value })}
//               />
//             </div>
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
//             <div className="grid grid-cols-5 gap-4 text-sm">
//               <div className="space-y-1">
//                 <div className="text-[var(--text-muted)]">Days to Expire</div>
//                 <div className={`font-medium ${
//                   formData.validity 
//                     ? calculateDaysToExpire(formData.validity) < 0 
//                       ? 'text-red-400' 
//                       : calculateDaysToExpire(formData.validity) <= 7 
//                         ? 'text-yellow-400'
//                         : 'text-green-400'
//                     : 'text-white'
//                 }`}>
//                   {formData.validity 
//                     ? (() => {
//                         const days = calculateDaysToExpire(formData.validity)
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
//                 <div className={`font-medium ${formData.validity ? getStatusColor(calculateStatus(formData.validity)) : 'text-white'}`}>
//                   {formData.validity ? calculateStatus(formData.validity) : '--'}
//                 </div>
//               </div>
//               <div className="space-y-1">
//                 <div className="text-[var(--text-muted)]">Remark</div>
//                 <div className="text-white truncate">
//                   {formData.validity && formData.count 
//                     ? generateRemark(parseInt(formData.count), formData.validity) 
//                     : '--'
//                   }
//                 </div>
//               </div>
//               <div className="space-y-1">
//                 <div className="text-[var(--text-muted)]">Last Updated</div>
//                 <div className="text-white">{getCurrentDateTime()}</div>
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
//               disabled={!formData.client || !formData.count || !formData.validity || !formData.product}
//             >
//               {editingCounter ? "Save Changes" : "Add Counter"}
//             </GlassButton>
//           </div>
//         </div>
//       </GlassModal>
//     </div>
//   )
// }   