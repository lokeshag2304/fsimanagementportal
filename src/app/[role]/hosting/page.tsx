// src/app/[role]/hosting/page.tsx
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
  ChevronLeft,
  ChevronRight,
  Save,
  X
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/useToast"
import { useRouter } from "next/navigation"
import { apiService } from "@/common/services/apiService"
import Pagination from "@/common/Pagination"
import DashboardLoader from "@/common/DashboardLoader"
import { getNavigationByRole } from "@/lib/getNavigationByRole"

interface HostingRecord {
  id: number
  client_name: string | null
  client_id?: number
  domain_name: string | null
  domain_id?: number
  product_name: string
  product_id?: number
  expiry_date: string
  days_to_expire_today: number
  today_date: string
  status: 0 | 1
  remarks: string
  created_at: string
  updated_at: string
}

interface AddEditHosting {
  record_type: 3
  id?: number
  s_id: number
  product_id: number
  domain_id: number
  client_id: number
  expiry_date: string
  status: 0 | 1
  remarks: string
}

export default function HostingPage() {
   const {user} = useAuth()
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
  
  const [newRecordData, setNewRecordData] = useState({
    domain_name: "",
    client_name: "",
    product_name: "",
    expiry_date: "",
    status: "1" as "1" | "0",
    remarks: ""
  })
  
  const [editData, setEditData] = useState<Record<number, Partial<HostingRecord>>>({})
  
  const [pagination, setPagination] = useState({
    page: 0,
    rowsPerPage: 10,
    orderBy: "id" as "id" | "expiry_date" | "domain_name" | "product_name",
    orderDir: "desc" as "asc" | "desc"
  })
  
  const [totalItems, setTotalItems] = useState(0)
  
  // Sample data for dropdowns (you should fetch these from APIs)
  const clientOptions = [
    { id: 1, name: "John Smith" },
    { id: 2, name: "Sarah Johnson" },
    { id: 3, name: "Mike Wilson" },
    { id: 4, name: "David Brown" },
    { id: 5, name: "Emma Davis" }
  ]

  const domainOptions = [
    { id: 1, name: "example.com" },
    { id: 2, name: "myshop.com" },
    { id: 3, name: "blog-site.org" },
    { id: 4, name: "api-service.net" },
    { id: 5, name: "store-app.io" }
  ]

  const productOptions = [
    { id: 1, name: "Basic Hosting" },
    { id: 2, name: "Business Hosting" },
    { id: 3, name: "Premium Hosting" },
    { id: 4, name: "Enterprise Hosting" },
    { id: 5, name: "WordPress Hosting" },
    { id: 6, name: "Cloud Hosting" },
    { id: 7, name: "VPS Hosting" }
  ]

  const searchTimeoutRef = useRef<NodeJS.Timeout>()

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
        setData(response.data || [])
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
    setAddingNew(true)
    setNewRecordData({
      domain_name: "",
      client_name: "",
      product_name: "",
      expiry_date: "",
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
      
      if (!newRecordData.domain_name || !newRecordData.client_name || !newRecordData.product_name || !newRecordData.expiry_date) {
        toast({
          title: "Error",
          description: "Please fill all required fields",
          variant: "destructive"
        })
        return
      }

      // Find IDs for selected names
      const selectedClient = clientOptions.find(c => c.name === newRecordData.client_name)
      const selectedDomain = domainOptions.find(d => d.name === newRecordData.domain_name)
      const selectedProduct = productOptions.find(p => p.name === newRecordData.product_name)

      if (!selectedClient || !selectedDomain || !selectedProduct) {
        toast({
          title: "Error",
          description: "Please select valid options from the dropdowns",
          variant: "destructive"
        })
        return
      }

      const payload: AddEditHosting = {
        record_type: 3,
        s_id: user?.id || 6,
        product_id: selectedProduct.id,
        domain_id: selectedDomain.id,
        client_id: selectedClient.id,
        expiry_date: newRecordData.expiry_date,
        status: parseInt(newRecordData.status) as 0 | 1,
        remarks: newRecordData.remarks
      }

      const response = await apiService.addRecord(payload as any)
      
      if (response.status) {
        toast({
          title: "Success",
          description: response.message || "Hosting record added successfully",
          variant: "default"
        })
        setAddingNew(false)
        fetchHostingRecords()
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
      const selectedDomain = domainOptions.find(d => d.name === updatedData.domain_name)
      const selectedProduct = productOptions.find(p => p.name === updatedData.product_name)

      if (!selectedClient || !selectedDomain || !selectedProduct) {
        toast({
          title: "Error",
          description: "Please select valid options from the dropdowns",
          variant: "destructive"
        })
        return
      }

      const payload: AddEditHosting = {
        record_type: 3,
        id,
        s_id: user?.id || 6,
        product_id: selectedProduct.id,
        domain_id: selectedDomain.id,
        client_id: selectedClient.id,
        expiry_date: updatedData.expiry_date || "",
        status: updatedData.status || 1,
        remarks: updatedData.remarks || ""
      }

      const response = await apiService.editRecord(payload as any)
      
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

  const totalPages = Math.ceil(totalItems / pagination.rowsPerPage)
  const startItem = pagination.page * pagination.rowsPerPage + 1
  const endItem = Math.min((pagination.page + 1) * pagination.rowsPerPage, totalItems)

  return (
    <div className="min-h-screen pb-8">
      <Header title="Hosting Management" tabs={navigationTabs} />

      <div className="px-4 sm:px-6 mt-6">
        <GlassCard className="p-6">
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
                    Add Hosting
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
                      Domain Name
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 min-w-[180px]">
                      Client
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 min-w-[180px]">
                      Hosting Plan
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 min-w-[140px]">
                      Expiry Date
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
                    <th className="py-3 px-4 text-right text-sm font-medium text-gray-300 min-w-[140px]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <DashboardLoader label="Fetching Hosting....." />
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
                              value={newRecordData.domain_name}
                              onChange={(e) => handleNewRecordChange('domain_name', e.target.value)}
                              className="w-full px-2 py-1 bg-[rgba(255,255,255,var(--ui-opacity-10))] border border-[rgba(59,130,246,0.3)] rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                              style={{ minHeight: '32px' }}
                            >
                              <option value="" className="bg-gray-800 text-white">Select Domain</option>
                              {domainOptions.map(option => (
                                <option key={option.id} value={option.name} className="bg-gray-800 text-white">
                                  {option.name}
                                </option>
                              ))}
                            </select>
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
                              <option value="" className="bg-gray-800 text-white">Select Hosting Plan</option>
                              {productOptions.map(option => (
                                <option key={option.id} value={option.name} className="bg-gray-800 text-white">
                                  {option.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="date"
                              value={newRecordData.expiry_date}
                              onChange={(e) => handleNewRecordChange('expiry_date', e.target.value)}
                              className="w-full px-2 py-1 bg-[rgba(255,255,255,var(--ui-opacity-10))] border border-[rgba(59,130,246,0.3)] rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                              style={{ minHeight: '32px' }}
                            />
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-300">
                            --
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
                          <td colSpan={10} className="py-8 text-center">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <Server className="w-12 h-12 text-gray-400" />
                              <span className="text-gray-400">No hosting records found</span>
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
                                    value={editData[item.id]?.domain_name || item.domain_name || ""}
                                    onChange={(e) => handleEditChange(item.id, 'domain_name', e.target.value)}
                                    className="w-full px-2 py-1 bg-[rgba(255,255,255,var(--ui-opacity-10))] border border-[rgba(59,130,246,0.3)] rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                    style={{ minHeight: '32px' }}
                                  >
                                    <option value="" className="bg-gray-800 text-white">Select Domain</option>
                                    {domainOptions.map(option => (
                                      <option key={option.id} value={option.name} className="bg-gray-800 text-white">
                                        {option.name}
                                      </option>
                                    ))}
                                  </select>
                                </td>
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
                                    <option value="" className="bg-gray-800 text-white">Select Hosting Plan</option>
                                    {productOptions.map(option => (
                                      <option key={option.id} value={option.name} className="bg-gray-800 text-white">
                                        {option.name}
                                      </option>
                                    ))}
                                  </select>
                                </td>
                                <td className="py-3 px-4">
                                  <input
                                    type="date"
                                    value={editData[item.id]?.expiry_date || item.expiry_date}
                                    onChange={(e) => handleEditChange(item.id, 'expiry_date', e.target.value)}
                                    className="w-full px-2 py-1 bg-[rgba(255,255,255,var(--ui-opacity-10))] border border-[rgba(59,130,246,0.3)] rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                    style={{ minHeight: '32px' }}
                                  />
                                </td>
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
                                <td className="py-3 px-4 text-sm text-gray-300">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-gray-400" />
                                    {formatDate(item.expiry_date)}
                                  </div>
                                </td>
                              </>
                            )}
                            
                            <td className="py-3 px-4">
                              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                                calculateDays(item.expiry_date) < 0 
                                  ? 'bg-red-500/20 text-red-400' 
                                  : calculateDays(item.expiry_date) <= 30 
                                    ? 'bg-yellow-500/20 text-yellow-400'
                                    : 'bg-green-500/20 text-green-400'
                              }`}>
                                <Clock className="w-3 h-3" />
                                {calculateDays(item.expiry_date)} days
                              </div>
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
              // <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 bg-[rgba(255,255,255,0.05)] border-t border-[rgba(255,255,255,0.1)]">
              //   <div className="text-sm text-gray-400 mb-3 sm:mb-0">
              //     Showing {startItem} to {endItem} of {totalItems} hosting records
              //   </div>
              //   <div className="flex items-center gap-2">
              //     <button
              //       onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              //       disabled={pagination.page === 0}
              //       className="p-2 rounded-lg bg-[rgba(255,255,255,0.05)] text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[rgba(255,255,255,0.1)] transition-colors"
              //       title="Previous"
              //     >
              //       <ChevronLeft className="w-4 h-4" />
              //     </button>
                  
              //     <div className="flex items-center gap-1">
              //       {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              //         let pageNum
              //         if (totalPages <= 5) {
              //           pageNum = i
              //         } else if (pagination.page <= 2) {
              //           pageNum = i
              //         } else if (pagination.page >= totalPages - 3) {
              //           pageNum = totalPages - 5 + i
              //         } else {
              //           pageNum = pagination.page - 2 + i
              //         }
                      
              //         if (pageNum >= totalPages) return null
                      
              //         return (
              //           <button
              //             key={pageNum}
              //             onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
              //             className={`px-3 py-1 rounded text-sm transition-colors ${
              //               pagination.page === pageNum
              //                 ? 'bg-blue-600 text-white'
              //                 : 'bg-[rgba(255,255,255,0.05)] text-gray-300 hover:bg-[rgba(255,255,255,0.1)]'
              //             }`}
              //           >
              //             {pageNum + 1}
              //           </button>
              //         )
              //       })}
              //     </div>
                  
              //     <button
              //       onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              //       disabled={pagination.page >= totalPages - 1}
              //       className="p-2 rounded-lg bg-[rgba(255,255,255,0.05)] text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[rgba(255,255,255,0.1)] transition-colors"
              //       title="Next"
              //     >
              //       <ChevronRight className="w-4 h-4" />
              //     </button>
              //   </div>
              // </div>
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