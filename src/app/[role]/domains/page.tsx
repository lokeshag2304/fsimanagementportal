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
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Save,
  X,
  Lock,
  Eye
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/useToast"
import { useRouter } from "next/navigation"
import { apiService } from "@/common/services/apiService"
import Pagination from "@/common/Pagination"
import DashboardLoader, { downloadBase64File } from "@/common/DashboardLoader"
import { getNavigationByRole } from "@/lib/getNavigationByRole"
import { ApiDropdown, glassSelectStyles } from "@/common/DynamicDropdown"
import { GlassSelect } from "@/components/glass/GlassSelect"

interface DomainRecord {
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
  renewal_date: string
  days_to_expire_today: number
  today_date: string
   domain_protected: "0" | "1";
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

interface AddEditDomain {
  record_type: 4
  id?: number
  s_id: number
  product_id: number
  vendor_id: number
  domain_id: number
  client_id: number
  domain_protected: 0 | 1
  expiry_date: string
  renewal_date: string
  status: 0 | 1
  remarks: string
  remark_id: number;
  deleted_at: string;
}

export default function DomainsPage() {
  const {user, getToken } = useAuth()
  const token = getToken();
  const navigationTabs = getNavigationByRole(user?.role)
  const { toast } = useToast()
  const router = useRouter()
  const [exportLoading, setExportLoading] = useState(false);
  const [data, setData] = useState<DomainRecord[]>([])
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
    product_name: "",
    expiry_date: "",
    renewal_date: "",
    domain_protected: "1" as "1" | "0",
    status: "1" as "1" | "0",
    remarks: "",
    deleted_at: ""
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

  const searchTimeoutRef = useRef<NodeJS.Timeout>()

  // Fetch domain records
  const fetchDomainRecords = async () => {
    try {
      setLoading(true)
      
      const response = await apiService.listRecords({
        record_type: 4, // Domains
        search: searchQuery,
        page: pagination.page,
        rowsPerPage: pagination.rowsPerPage,
        orderBy: pagination.orderBy,
        orderDir: pagination.orderDir
      },
       user,
      token
    )
      
      if (response.status) {
        setData(response.data || [])
        setTotalItems(response.total || 0)
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to fetch domain records",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error fetching domain records:", error)
      toast({
        title: "Error",
        description: "Failed to fetch domain records",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDomainRecords()
  }, [pagination.page, pagination.orderBy, pagination.orderDir])

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      setPagination(prev => ({ ...prev, page: 0 }))
      fetchDomainRecords()
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
      vendor_id: null,
      product_name: "",
      expiry_date: "",
      renewal_date: today,
      domain_protected: "1",
      status: "1",
      remarks: "",
      deleted_at: ""
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
      vendor_id: null,
      product_name: "",
      expiry_date: "",
      renewal_date: "",
      domain_protected: "1",
      status: "1",
      remarks: "",
      deleted_at: ""
    })
  }

      const handleViewDetails = (item: DomainRecord) => {
    if (!item.id) {
      toast({
        title: "Error",
        description: "Product ID not found",
        variant: "destructive",
      });
      return;
    }
    
    // Redirect to details page with recordType and recordId
    router.push(`/${user?.role}/categaries-details/${item.id}?recordType=4`);
  };
  // Save New Record
  const handleSaveNew = async () => {
    try {
      setIsSaving(true)
      
      if (!newRecordData.domain_id || !newRecordData.client_id || 
          !newRecordData.product_id || !newRecordData.expiry_date || 
          !newRecordData.vendor_id || !newRecordData.renewal_date) {
        toast({
          title: "Error",
          description: "Please fill all required fields",
          variant: "destructive"
        })
        return
      }

      const payload: AddEditDomain = {
        record_type: 4,
        s_id: user?.id || 6,
        product_id: newRecordData.product_id!,
        vendor_id: newRecordData.vendor_id!,
        domain_id: newRecordData.domain_id!,
        client_id: newRecordData.client_id!,
        domain_protected: parseInt(newRecordData.domain_protected) as 0 | 1,
        expiry_date: newRecordData.expiry_date,
        renewal_date: newRecordData.renewal_date,
        status: parseInt(newRecordData.status) as 0 | 1,
        remarks: newRecordData.remarks,
        deleted_at: newRecordData.deleted_at
      }

      const response = await apiService.addRecord(payload as any,user,token)
      
      if (response.status) {
        toast({
          title: "Success",
          description: response.message || "Domain record added successfully",
          variant: "default"
        })
        setAddingNew(false)
        fetchDomainRecords()
        // Reset form
        setNewRecordData({
          domain_id: null,
          domain_name: "",
          client_id: null,
          client_name: "",
          product_id: null,
          vendor_id: null,
          product_name: "",
          expiry_date: "",
          renewal_date: new Date().toISOString().split('T')[0],
          domain_protected: "1",
          status: "1",
          remarks: "",
          deleted_at: ""
        })
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to add domain record",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error adding domain record:", error)
      toast({
        title: "Error",
        description: "Failed to add domain record",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Handle Edit
  const handleEdit = (record: DomainRecord) => {
    setEditingId(record.id)
    setEditData({
      [record.id]: { 
        ...record,
        domain_id: record.domain_id || undefined,
        client_id: record.client_id || undefined,
        product_id: record.product_id || undefined,
        vendor_id: record.vendor_id || undefined,
        renewal_date: record.renewal_date || "",
        remarks: record.remarks || "",
        remark_id: record?.latest_remark?.id || null,
        domain_protected: record.domain_protected?.toString() as "0" | "1",
        deleted_at: record.deleted_at || ""
      }
    })
  }

      const handleExport = async () => {
        try {
          setExportLoading(true);
    
          const payload: AddEditDomain = {
            record_type: 4,
            s_id: user?.id || 0,
          };
    
          const response = await apiService.exportRecord(payload,user,token);
    
          if (response.success) {
            toast({
              title: "Success",
              description: response.message || "Domains exported successfully",
              variant: "default",
            });
            downloadBase64File(response.data.base64, response.data.filename);
          } else {
            toast({
              title: "Error",
              description: response.message || "Failed to export domains",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error("Error exporting domains:", error);
          toast({
            title: "Error",
            description: "Failed to export domains",
            variant: "destructive",
          });
        } finally {
          setExportLoading(false);
        }
      };

  // Handle Save (inline editing)
  const handleSave = async (id: number) => {
    try {
      setIsSaving(true)
      const updatedData = editData[id]
      
      if (!updatedData) return
      
      if (!updatedData.domain_id || !updatedData.client_id || 
          !updatedData.product_id || !updatedData.expiry_date || 
          !updatedData.vendor_id || !updatedData.renewal_date) {
        toast({
          title: "Error",
          description: "Please fill all required fields",
          variant: "destructive"
        })
        return
      }

      const payload: AddEditDomain = {
        record_type: 4,
        id,
        s_id: user?.id || 6,
        product_id: updatedData.product_id!,
        vendor_id: updatedData.vendor_id!,
        domain_id: updatedData.domain_id!,
        client_id: updatedData.client_id!,
          domain_protected: parseInt(
    updatedData.domain_protected as "0" | "1"
  ) as 0 | 1,
        expiry_date: updatedData.expiry_date!,
        renewal_date: updatedData.renewal_date!,
        status: updatedData.status ?? 1,
        remarks: updatedData.remarks || "",
        remark_id: updatedData.remark_id || null,
        deleted_at: updatedData.deleted_at
      }

      const response = await apiService.editRecord(payload as any,user,token)
      
      if (response.status) {
        toast({
          title: "Success",
          description: response.message || "Domain record updated successfully",
          variant: "default"
        })
        setEditingId(null)
        setEditData({})
        fetchDomainRecords()
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to update domain record",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error updating domain record:", error)
      toast({
        title: "Error",
        description: "Failed to update domain record",
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
  const handleEditChange = (id: number, field: keyof DomainRecord, value: any) => {
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
      
      const response = await apiService.deleteRecords(idsToDelete, 4,user,token)
      
      if (response.status) {
        toast({
          title: "Success",
          description: response.message || "Record(s) deleted successfully",
          variant: "default"
        })
        
        setSelectedItems([])
        setItemToDelete(null)
        fetchDomainRecords()
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

  const getStatusColor = (status: 0 | 1) => {
    return status === 1 ? 'text-green-400' : 'text-red-400'
  }

  const getStatusText = (status: 0 | 1) => {
    return status === 1 ? 'Active' : 'Inactive'
  }

  const getStatusIcon = (status: 0 | 1) => {
    return status === 1 ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />
  }

  const getDomainProtectColor = (protectedStatus: 0 | 1) => {
    return protectedStatus == 1 ? 'text-green-400' : 'text-yellow-400'
  }

  const getDomainProtectText = (protectedStatus: 0 | 1) => {
    return protectedStatus == 1 ? 'Yes' : 'No'
  }

  const getDomainProtectIcon = (protectedStatus: 0 | 1) => {
    return protectedStatus == 1 ? <Lock className="w-4 h-4" /> : <Shield className="w-4 h-4" />
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
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 min-w-[140px]">
                      Renewal Date
                    </th>
                    {/* <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 min-w-[140px]">
                      Renewal Date
                    </th> */}
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 min-w-[120px]">
                      Days to Expire
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 min-w-[140px]">
                      Domain Protect
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 min-w-[120px]">
                      Status
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 min-w-[180px]">
                      Remarks
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 min-w-[120px]">
                      Deleted Date
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 min-w-[120px]">
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
                         <DashboardLoader label="Loading domain records..." />
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
                              placeholder="Vendor"
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
                          {/* <td className="py-3 px-4">
                            <input
                              type="date"
                              value={newRecordData.renewal_date}
                              onChange={(e) => handleNewRecordChange('renewal_date', e.target.value)}
                              className="w-full px-2 py-1 bg-white/5 border border-blue-500/30 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/30 backdrop-blur-sm"
                              style={{ minHeight: '32px' }}
                            />
                          </td> */}
                          <td className="py-3 px-4">
                            <input
                              type="number"
                              value={calculateDays(newRecordData.expiry_date)}
                              readOnly
                              className="w-full px-2 py-1 bg-white/10 border border-white/10 rounded text-gray-400 text-sm cursor-not-allowed"
                              style={{ minHeight: '32px' }}
                            />
                          </td>
                          <td className="py-1 px-2">
                           <div className="w-40">
  <GlassSelect
    options={domainProtectOptions}
    value={
      domainProtectOptions.find(
        (opt) => opt.value === newRecordData.domain_protected
      ) || null
    }
    onChange={(selected: any) =>
      handleNewRecordChange(
        "domain_protected",
        selected?.value as "1" | "0"
      )
    }
    isSearchable={false}
    isClearable
    styles={glassSelectStyles}
  />
</div>

                          </td>
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
    isSearchable={false}
    isClearable
    placeholder="Status"
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
                             <input
                              type="date"
                              value={newRecordData.deleted_at}
                              onChange={(e) => handleNewRecordChange('deleted_at', e.target.value)}
                              className="w-full px-2 py-1 bg-white/5 border border-blue-500/30 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/30 backdrop-blur-sm"
                              style={{ minHeight: '32px' }}
                            />
                          </td>
                          <td className="py-3 px-4">
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
                          <td colSpan={11} className="py-8 text-center">
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
                          <tr
                            key={item.id}
                            className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors ${
                              editingId === item.id ? 'bg-blue-500/5' : ''
                            }`}
                          >
                            <td className="py-3 px-4">
                              <input
                                type="checkbox"
                                checked={selectedItems.includes(item.id)}
                                onChange={(e) => handleSelectItem(item.id, e.target.checked)}
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
                                <td className="py-3 px-4">
                                  <input
                                    type="date"
                                    value={editData[item.id]?.expiry_date || item.expiry_date}
                                    onChange={(e) => handleEditChange(item.id, 'expiry_date', e.target.value)}
                                    className="w-full px-2 py-1 bg-white/5 border border-blue-500/30 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/30 backdrop-blur-sm"
                                    style={{ minHeight: '32px' }}
                                  />
                                </td>
                                {/* <td className="py-3 px-4">
                                  <input
                                    type="date"
                                    value={editData[item.id]?.renewal_date || item.renewal_date || ""}
                                    onChange={(e) => handleEditChange(item.id, 'renewal_date', e.target.value)}
                                    className="w-full px-2 py-1 bg-white/5 border border-blue-500/30 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/30 backdrop-blur-sm"
                                    style={{ minHeight: '32px' }}
                                  />
                                </td> */}
                                <td className="py-3 px-4">
                                  <input
                                    type="number"
                                    value={calculateDays(editData[item.id]?.expiry_date || item.expiry_date)}
                                    readOnly
                                    className="w-full px-2 py-1 bg-white/10 border border-white/10 rounded text-gray-400 text-sm cursor-not-allowed"
                                    style={{ minHeight: '32px' }}
                                  />
                                </td>
                                <td className="py-3 px-4">
                                  <td className="py-1 px-2">
                           <div className="w-40">
  <GlassSelect
    options={domainProtectOptions}
    value={
      domainProtectOptions.find(
        (opt) => opt.value === newRecordData.domain_protected
      ) || null
    }
    onChange={(selected: any) =>
      handleNewRecordChange(
        "domain_protected",
        selected?.value as "1" | "0"
      )
    }
    isSearchable={false}
    isClearable
    styles={glassSelectStyles}
  />
</div>

                          </td>  

                                </td>
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
    isSearchable={false}
    isClearable
    placeholder="Status"
    styles={glassSelectStyles}
  />
</div>

                          </td>
                                <td className="py-3 px-4">
                                  <input
                                    type="text"
                                    value={editData[item.id]?.remarks || item?.latest_remark?.remark}
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
                                 <td className="py-3 px-4 text-sm text-gray-300">
                                  <input
                              type="date"
                              value={editData[item.id]?.deleted_at}
                              onChange={(e) => handleEditChange(item.id, "deleted_at", e.target.value)}
                              className="w-full px-2 py-1 bg-white/5 border border-blue-500/30 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/30 backdrop-blur-sm"
                              style={{ minHeight: '32px' }}
                            />
                                </td>
                                <td className="py-3 px-4 text-sm text-gray-300 whitespace-nowrap">
                                  {(item.updated_at)}
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
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-2">
                                    {/* <Package className="w-4 h-4 text-gray-400 flex-shrink-0" /> */}
                                    <span className="text-sm text-white font-medium">
                                      {item.vendor_name}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-sm text-gray-300">
                                  <div className="flex items-center gap-2">
                                    {/* <Calendar className="w-4 h-4 text-gray-400" /> */}
                                    {formatDate(item.expiry_date)}
                                  </div>
                                </td>
                                {/* <td className="py-3 px-4 text-sm text-gray-300">
                                  <div className="flex items-center gap-2">
                                    {item.renewal_date ? formatDate(item.renewal_date) : "N/A"}
                                  </div>
                                </td> */}
                                <td className="py-3 px-4">
                                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm border ${
                                    calculateDays(item.expiry_date) < 0 
                                      ? 'bg-red-500/20 text-red-400 border-red-500/20' 
                                      : calculateDays(item.expiry_date) <= 30 
                                        ? 'bg-orange-500/20 text-orange-400 border-orange-500/20'
                                        : 'bg-green-500/20 text-green-400 border-green-500/20'
                                  }`}>
                                    {/* <Clock className="w-3 h-3" /> */}
                                    {calculateDays(item.expiry_date)} days
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm border ${getDomainProtectColor(item.domain_protected)} ${
                                    item.domain_protected == 1 ? 'bg-green-500/20 border-green-500/20' : 'bg-yellow-500/20 border-yellow-500/20'
                                  }`}>
                                    {/* {getDomainProtectIcon(item.domain_protected)} */}
                                    {getDomainProtectText(item.domain_protected)}
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm border ${getStatusColor(item.status)} ${
                                    item.status === 1 ? 'bg-green-500/20 border-green-500/20' : 'bg-red-500/20 border-red-500/20'
                                  }`}>
                                    {getStatusIcon(item.status)}
                                    {getStatusText(item.status)}
                                  </div>
                                </td>
                                 <td className="py-3 px-4">
                                  <div className="flex items-center gap-2">
                                    {/* <AlertCircle className="w-4 h-4 text-gray-400 flex-shrink-0" /> */}
                                    <span className="text-sm text-gray-300 truncate max-w-[180px]">
                                      {item?.latest_remark?.remark}
                                    </span>
                                  </div>
                                </td>
                                 <td className="py-3 px-4 text-sm text-gray-300">
                                  {(item.deleted_at)}
                                </td>
                                <td className="py-3 px-4 text-sm text-gray-300 whitespace-nowrap">
                                  {(item.updated_at)}
                                </td>
                              </>
                            )}
                            
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
//   )
// }















