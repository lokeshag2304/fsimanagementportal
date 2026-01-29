// app/Domain/page.tsx
"use client"

import { useState, useEffect, useRef } from "react"
import { Header } from "@/components/layout"
import { GlassCard, GlassButton } from "@/components/glass"
import {
  Edit,
  Trash2,
  Check,
  X,
  Search,
  Plus,
  Loader2,
  Globe,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import axios from "axios"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/useToast"
import { useRouter } from "next/navigation"
import Pagination from "@/common/Pagination"
import DashboardLoader from "@/common/DashboardLoader"
import {DeleteConfirmationModal} from "@/common/services/DeleteConfirmationModal"
import { getNavigationByRole } from "@/lib/getNavigationByRole"

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://rainbowsolutionandtechnology.com/FSISubscriptionPortal/public/api"

interface Domain {
  id: number
  name: string
  created_at: string
}

interface DomainsResponse {
  rows: Domain[]
  total: number
}

interface ApiResponse {
  success: boolean
  message: string
  domain_id?: number
}

export default function DomainPage() {
  const {user} = useAuth()
 const navigationTabs = getNavigationByRole(user?.role)
  const { toast } = useToast()
  const router = useRouter()
  const [data, setData] = useState<Domain[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editValue, setEditValue] = useState("")
  const [selectedItems, setSelectedItems] = useState<number[]>([])
  const [isAdding, setIsAdding] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [pagination, setPagination] = useState({
    page: 0,
    rowsPerPage: 10,
    order: "desc" as "asc" | "desc",
    orderBy: "id"
  })
  const [totalDomains, setTotalDomains] = useState(0)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<number | null>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout>()
  const isMountedRef = useRef(true)

  // Function to get token from localStorage
  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('authToken')
    }
    return null
  }

  // Fetch domains function
  const fetchDomains = async () => {
    if (!isMountedRef.current) return;
    
    try {
      setLoading(true)
      const token = getAuthToken()
      
      if (!token) {
        toast({
          title: "Error",
          description: "Authentication token not found. Please login again.",
          variant: "destructive"
        })
        router.push('/auth/login')
        return
      }

      const response = await axios.post<DomainsResponse>(
        `${BASE_URL}/secure/Domain/list-domain`,
        {
          page: pagination.page,
          rowsPerPage: pagination.rowsPerPage,
          order: pagination.order,
          orderBy: pagination.orderBy,
          search: searchQuery
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      )

      if (isMountedRef.current) {
        setData(response.data.rows)
        setTotalDomains(response.data.total)
      }
    } catch (error: any) {
      console.error("Error fetching domains:", error)
      
      if (error.response?.status === 401) {
        toast({
          title: "Session Expired",
          description: "Please login again.",
          variant: "destructive"
        })
        router.push('/auth/login')
      } else {
        toast({
          title: "Error",
          description: error.response?.data?.message || "Failed to fetch domains",
          variant: "destructive"
        })
      }
      
      if (isMountedRef.current) {
        setData([])
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }

  // Initial fetch only
  useEffect(() => {
    isMountedRef.current = true
    fetchDomains()
    
    return () => {
      isMountedRef.current = false
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [])

  // Separate effect for pagination and search changes
  useEffect(() => {
    if (!isMountedRef.current) return;
    
    const timeoutId = setTimeout(() => {
      fetchDomains()
    }, 300)
    
    return () => {
      clearTimeout(timeoutId)
    }
  }, [pagination.page, pagination.order, pagination.orderBy, searchQuery])

  // Handle search input
  const handleSearchInput = (value: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      setSearchQuery(value)
      setPagination(prev => ({ ...prev, page: 0 }))
    }, 300)
  }

  // Handle successful operations
  const handleSuccess = (message: string) => {
    toast({
      title: "Success",
      description: message,
      variant: "default"
    })
    setEditingId(null)
    setEditValue("")
    
    // Refresh data after successful operation
    fetchDomains()
  }

  // Handle error
  const handleError = (error: any, defaultMessage: string) => {
    console.error("Error:", error)
    
    if (error.response?.status === 401) {
      toast({
        title: "Session Expired",
        description: "Please login again.",
        variant: "destructive"
      })
      router.push('/auth/login')
    } else {
      toast({
        title: "Error",
        description: error.response?.data?.message || defaultMessage,
        variant: "destructive"
      })
    }
  }

  // Add new domain
  const handleAdd = async () => {
    if (!editValue.trim()) {
      toast({
        title: "Error",
        description: "Please enter a domain name",
        variant: "destructive"
      })
      return
    }

    try {
      setIsAdding(true)
      const token = getAuthToken()
      
      if (!token) {
        toast({
          title: "Error",
          description: "Authentication token not found. Please login again.",
          variant: "destructive"
        })
        router.push('/auth/login')
        return
      }

      const response = await axios.post<ApiResponse>(
        `${BASE_URL}/secure/Domain/add-domain`,
        {
          name: editValue,
          s_id: user?.id || 6
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      )

      if (response.data.success) {
        handleSuccess(response.data.message)
      } else {
        toast({
          title: "Error",
          description: response.data.message,
          variant: "destructive"
        })
      }
    } catch (error: any) {
      handleError(error, "Failed to add domain")
    } finally {
      setIsAdding(false)
    }
  }

  // Update existing domain
  const handleSave = async (id: number) => {
    if (!editValue.trim()) {
      toast({
        title: "Error",
        description: "Please enter a domain name",
        variant: "destructive"
      })
      return
    }

    try {
      setIsSaving(true)
      const token = getAuthToken()
      
      if (!token) {
        toast({
          title: "Error",
          description: "Authentication token not found. Please login again.",
          variant: "destructive"
        })
        router.push('/auth/login')
        return
      }

      const response = await axios.post<ApiResponse>(
        `${BASE_URL}/secure/Domain/update-domain`,
        {
          id: id,
          name: editValue,
          s_id: user?.id || 6
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      )

      if (response.data.success) {
        handleSuccess(response.data.message)
      } else {
        toast({
          title: "Error",
          description: response.data.message,
          variant: "destructive"
        })
      }
    } catch (error: any) {
      handleError(error, "Failed to update domain")
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditValue("")
  }

  // Open delete confirmation modal for single domain
  const handleDeleteClick = (id: number) => {
    setItemToDelete(id)
    setShowDeleteModal(true)
  }

  // Open delete confirmation modal for bulk delete
  const handleBulkDeleteClick = () => {
    if (selectedItems.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one domain",
        variant: "destructive"
      })
      return
    }
    setItemToDelete(null)
    setShowDeleteModal(true)
  }

  // Confirm delete action
  const confirmDelete = async () => {
    const idsToDelete = itemToDelete ? [itemToDelete] : selectedItems
    
    try {
      setIsDeleting(true)
      const token = getAuthToken()
      
      if (!token) {
        toast({
          title: "Error",
          description: "Authentication token not found. Please login again.",
          variant: "destructive"
        })
        router.push('/auth/login')
        return
      }

      const response = await axios.post<ApiResponse>(
        `${BASE_URL}/secure/Domain/delete-domain`,
        {
          ids: idsToDelete,
          s_id: user?.id || 6
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      )

      if (response.data.success) {
        handleSuccess(`${idsToDelete.length} domain(s) deleted successfully`)
        if (itemToDelete) {
          // Remove single item from selected items if it was selected
          setSelectedItems(prev => prev.filter(itemId => itemId !== itemToDelete))
        } else {
          // Clear all selected items for bulk delete
          setSelectedItems([])
        }
      } else {
        toast({
          title: "Error",
          description: response.data.message,
          variant: "destructive"
        })
      }
    } catch (error: any) {
      handleError(error, "Failed to delete domain(s)")
    } finally {
      setIsDeleting(false)
      setShowDeleteModal(false)
      setItemToDelete(null)
    }
  }

  const handleEdit = (item: Domain) => {
    setEditingId(item.id)
    setEditValue(item.name)
  }

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
      setSelectedItems(prev => prev.filter(selectedId => selectedId !== id))
    }
  }

  const handleSort = (column: string) => {
    setPagination(prev => ({
      ...prev,
      orderBy: column,
      order: prev.orderBy === column && prev.order === "desc" ? "asc" : "desc",
      page: 0
    }))
  }

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  const formatDate = (dateString: string) => {
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

  const isAllSelected = data.length > 0 && selectedItems.length === data.length
  const totalPages = Math.ceil(totalDomains / pagination.rowsPerPage)
  const startItem = pagination.page * pagination.rowsPerPage + 1
  const endItem = Math.min((pagination.page + 1) * pagination.rowsPerPage, totalDomains)

  return (
    <div className="min-h-screen pb-8">
      <Header title="Domain Management" tabs={navigationTabs} />

      <div className="px-4 sm:px-6 mt-6">
        <GlassCard className="p-6">
          {/* Header with Search and Add Button */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <Globe className="w-6 h-6 text-[#CB8959]" />
                <h2 className="text-xl font-semibold text-white">Domains</h2>
              </div>
              <p className="text-sm text-gray-400 mt-1">
                Manage your domains and subdomains
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search domains..."
                  defaultValue={searchQuery}
                  onChange={(e) => handleSearchInput(e.target.value)}
                   className="w-full sm:w-64 pl-10 pr-4 py-2 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
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
                
                <GlassButton
                  variant="primary"
                  onClick={() => {
                    setEditingId(-1)
                    setEditValue("")
                  }}
                  className="flex items-center gap-2"
                  disabled={isAdding || editingId === -1}
                >
                  {editingId === -1 ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Add Domain
                    </>
                  )}
                </GlassButton>
              </div>
            </div>
          </div>

          {/* Add Form - Only for adding new domains */}
          {editingId === -1 && (
            <div className="mb-6 p-4 bg-[rgba(255,255,255,0.05)] rounded-lg border border-[rgba(255,255,255,0.1)]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-medium">Add New Domain</h3>
                <button
                  onClick={handleCancel}
                  className="p-1 hover:bg-[rgba(255,255,255,0.1)] rounded transition-colors"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    placeholder="Enter domain name (e.g., example.com)..."
                    className="w-full px-3 py-2 bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.1)] rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAdd()
                      if (e.key === 'Escape') handleCancel()
                    }}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleAdd}
                    disabled={isAdding || !editValue.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isAdding ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        Add Domain
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 bg-[rgba(255,255,255,0.1)] text-white rounded-lg hover:bg-[rgba(255,255,255,0.2)] transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

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
                    <th 
                      className="py-3 px-4 text-left text-sm font-medium text-gray-300 cursor-pointer hover:text-white transition-colors min-w-[200px]"
                      onClick={() => handleSort("name")}
                    >
                      <div className="flex items-center gap-1">
                        Domain Name
                        {pagination.orderBy === "name" && (
                          <span className="text-xs">
                            {pagination.order === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </div>
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 min-w-[150px]">
                      Created At
                    </th>
                    <th className="py-3 px-4 text-right text-sm font-medium text-gray-300 min-w-[120px]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <DashboardLoader label="Loading domains..." />
                        </div>
                      </td>
                    </tr>
                  ) : data.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Globe className="w-12 h-12 text-gray-400" />
                          <span className="text-gray-400">No domains found</span>
                          {searchQuery && (
                            <button
                              onClick={() => {
                                setSearchQuery("")
                                if (searchTimeoutRef.current) {
                                  clearTimeout(searchTimeoutRef.current)
                                }
                              }}
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
                        <td className="py-3 px-4">
                          {editingId === item.id ? (
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="flex-1 px-3 py-1.5 bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.1)] rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSave(item.id)
                                  if (e.key === 'Escape') handleCancel()
                                }}
                              />
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Globe className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              <span className="text-sm text-white font-medium">
                                {item.name}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-300">
                          {formatDate(item.created_at)}
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
                                    <Check className="w-4 h-4 text-green-400" />
                                  )}
                                </button>
                                <button
                                  onClick={handleCancel}
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
                                  disabled={editingId !== null}
                                  className="p-1.5 rounded hover:bg-[rgba(255,255,255,0.1)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Edit"
                                >
                                  <Edit className="w-4 h-4 text-gray-400 hover:text-blue-400" />
                                </button>
                                <button
                                  onClick={() => handleDeleteClick(item.id)}
                                  disabled={editingId !== null}
                                  className="p-1.5 rounded hover:bg-red-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!loading && data.length > 0 && (
              <Pagination
                page={pagination.page}
                rowsPerPage={pagination.rowsPerPage}
                totalItems={totalDomains}
                onPageChange={handlePageChange}
              />
            )}
          </div>

          {/* Selected Items Info */}
          {selectedItems.length > 0 && (
            <div className="mt-4 p-3 bg-[rgba(255,255,255,0.05)] rounded-lg border border-[rgba(255,255,255,0.1)]">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">
                  {selectedItems.length} domain{selectedItems.length > 1 ? 's' : ''} selected
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
        title={itemToDelete ? "Delete Domain" : "Delete Multiple Domains"}
        message={itemToDelete 
          ? "Are you sure you want to delete this domain? This action cannot be undone."
          : "Are you sure you want to delete the selected domains? This action cannot be undone."
        }
      />
    </div>
  )
}











// // app/Domain/page.tsx
// "use client"

// import { useState, useEffect, useRef } from "react"
// import { Header } from "@/components/layout"
// import { GlassCard, GlassButton } from "@/components/glass"
// import {
//   Edit,
//   Trash2,
//   Check,
//   X,
//   Search,
//   Plus,
//   Loader2,
//   Globe,
//   ChevronLeft,
//   ChevronRight
// } from "lucide-react"
// import { navigationTabs } from "@/lib/navigation"
// import axios from "axios"
// import { useAuth } from "@/contexts/AuthContext"
// import { useToast } from "@/hooks/useToast"
// import { useRouter } from "next/navigation"
// import Pagination from "@/common/Pagination"
// import DashboardLoader from "@/common/DashboardLoader"

// const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://rainbowsolutionandtechnology.com/FSISubscriptionPortal/public/api"

// interface Domain {
//   id: number
//   name: string
//   created_at: string
// }

// interface DomainsResponse {
//   rows: Domain[]
//   total: number
// }

// interface ApiResponse {
//   success: boolean
//   message: string
//   domain_id?: number
// }

// export default function DomainPage() {
//   const { user } = useAuth()
//   const { toast } = useToast()
//   const router = useRouter()
//   const [data, setData] = useState<Domain[]>([])
//   const [loading, setLoading] = useState(true)
//   const [searchQuery, setSearchQuery] = useState("")
//   const [editingId, setEditingId] = useState<number | null>(null)
//   const [editValue, setEditValue] = useState("")
//   const [selectedItems, setSelectedItems] = useState<number[]>([])
//   const [isAdding, setIsAdding] = useState(false)
//   const [isSaving, setIsSaving] = useState(false)
//   const [isDeleting, setIsDeleting] = useState(false)
//   const [pagination, setPagination] = useState({
//     page: 0,
//     rowsPerPage: 10,
//     order: "desc" as "asc" | "desc",
//     orderBy: "id"
//   })
//   const [totalDomains, setTotalDomains] = useState(0)
//   const searchTimeoutRef = useRef<NodeJS.Timeout>()
//   const isMountedRef = useRef(true)

//   // Function to get token from localStorage
//   const getAuthToken = () => {
//     if (typeof window !== 'undefined') {
//       return localStorage.getItem('authToken')
//     }
//     return null
//   }

//   // Fetch domains function
//   const fetchDomains = async () => {
//     if (!isMountedRef.current) return;
    
//     try {
//       setLoading(true)
//       const token = getAuthToken()
      
//       if (!token) {
//         toast({
//           title: "Error",
//           description: "Authentication token not found. Please login again.",
//           variant: "destructive"
//         })
//         router.push('/auth/login')
//         return
//       }

//       const response = await axios.post<DomainsResponse>(
//         `${BASE_URL}/secure/Domain/list-domain`,
//         {
//           page: pagination.page,
//           rowsPerPage: pagination.rowsPerPage,
//           order: pagination.order,
//           orderBy: pagination.orderBy,
//           search: searchQuery
//         },
//         {
//           headers: {
//             'Content-Type': 'application/json',
//             'Authorization': `Bearer ${token}`
//           }
//         }
//       )

//       if (isMountedRef.current) {
//         setData(response.data.rows)
//         setTotalDomains(response.data.total)
//       }
//     } catch (error: any) {
//       console.error("Error fetching domains:", error)
      
//       if (error.response?.status === 401) {
//         toast({
//           title: "Session Expired",
//           description: "Please login again.",
//           variant: "destructive"
//         })
//         router.push('/auth/login')
//       } else {
//         toast({
//           title: "Error",
//           description: error.response?.data?.message || "Failed to fetch domains",
//           variant: "destructive"
//         })
//       }
      
//       if (isMountedRef.current) {
//         setData([])
//       }
//     } finally {
//       if (isMountedRef.current) {
//         setLoading(false)
//       }
//     }
//   }

//   // Initial fetch only
//   useEffect(() => {
//     isMountedRef.current = true
//     fetchDomains()
    
//     return () => {
//       isMountedRef.current = false
//       if (searchTimeoutRef.current) {
//         clearTimeout(searchTimeoutRef.current)
//       }
//     }
//   }, [])

//   // Separate effect for pagination and search changes
//   useEffect(() => {
//     if (!isMountedRef.current) return;
    
//     const timeoutId = setTimeout(() => {
//       fetchDomains()
//     }, 300)
    
//     return () => {
//       clearTimeout(timeoutId)
//     }
//   }, [pagination.page, pagination.order, pagination.orderBy, searchQuery])

//   // Handle search input
//   const handleSearchInput = (value: string) => {
//     if (searchTimeoutRef.current) {
//       clearTimeout(searchTimeoutRef.current)
//     }
    
//     searchTimeoutRef.current = setTimeout(() => {
//       setSearchQuery(value)
//       setPagination(prev => ({ ...prev, page: 0 }))
//     }, 300)
//   }

//   // Handle successful operations
//   const handleSuccess = (message: string) => {
//     toast({
//       title: "Success",
//       description: message,
//       variant: "default"
//     })
//     setEditingId(null)
//     setEditValue("")
    
//     // Refresh data after successful operation
//     fetchDomains()
//   }

//   // Handle error
//   const handleError = (error: any, defaultMessage: string) => {
//     console.error("Error:", error)
    
//     if (error.response?.status === 401) {
//       toast({
//         title: "Session Expired",
//         description: "Please login again.",
//         variant: "destructive"
//       })
//       router.push('/auth/login')
//     } else {
//       toast({
//         title: "Error",
//         description: error.response?.data?.message || defaultMessage,
//         variant: "destructive"
//       })
//     }
//   }

//   // Add new domain
//   const handleAdd = async () => {
//     if (!editValue.trim()) {
//       toast({
//         title: "Error",
//         description: "Please enter a domain name",
//         variant: "destructive"
//       })
//       return
//     }

//     try {
//       setIsAdding(true)
//       const token = getAuthToken()
      
//       if (!token) {
//         toast({
//           title: "Error",
//           description: "Authentication token not found. Please login again.",
//           variant: "destructive"
//         })
//         router.push('/auth/login')
//         return
//       }

//       const response = await axios.post<ApiResponse>(
//         `${BASE_URL}/secure/Domain/add-domain`,
//         {
//           name: editValue,
//           s_id: user?.id || 6
//         },
//         {
//           headers: {
//             'Content-Type': 'application/json',
//             'Authorization': `Bearer ${token}`
//           }
//         }
//       )

//       if (response.data.success) {
//         handleSuccess(response.data.message)
//       } else {
//         toast({
//           title: "Error",
//           description: response.data.message,
//           variant: "destructive"
//         })
//       }
//     } catch (error: any) {
//       handleError(error, "Failed to add domain")
//     } finally {
//       setIsAdding(false)
//     }
//   }

//   // Update existing domain
//   const handleSave = async (id: number) => {
//     if (!editValue.trim()) {
//       toast({
//         title: "Error",
//         description: "Please enter a domain name",
//         variant: "destructive"
//       })
//       return
//     }

//     try {
//       setIsSaving(true)
//       const token = getAuthToken()
      
//       if (!token) {
//         toast({
//           title: "Error",
//           description: "Authentication token not found. Please login again.",
//           variant: "destructive"
//         })
//         router.push('/auth/login')
//         return
//       }

//       const response = await axios.post<ApiResponse>(
//         `${BASE_URL}/secure/Domain/update-domain`,
//         {
//           id: id,
//           name: editValue,
//           s_id: user?.id || 6
//         },
//         {
//           headers: {
//             'Content-Type': 'application/json',
//             'Authorization': `Bearer ${token}`
//           }
//         }
//       )

//       if (response.data.success) {
//         handleSuccess(response.data.message)
//       } else {
//         toast({
//           title: "Error",
//           description: response.data.message,
//           variant: "destructive"
//         })
//       }
//     } catch (error: any) {
//       handleError(error, "Failed to update domain")
//     } finally {
//       setIsSaving(false)
//     }
//   }

//   const handleCancel = () => {
//     setEditingId(null)
//     setEditValue("")
//   }

//   // Delete single domain
//   const handleDelete = async (id: number) => {
//     if (!window.confirm("Are you sure you want to delete this domain?")) {
//       return
//     }

//     try {
//       const token = getAuthToken()
      
//       if (!token) {
//         toast({
//           title: "Error",
//           description: "Authentication token not found. Please login again.",
//           variant: "destructive"
//         })
//         router.push('/auth/login')
//         return
//       }

//       const response = await axios.post<ApiResponse>(
//         `${BASE_URL}/secure/Domain/delete-domain`,
//         {
//           ids: [id],
//           s_id: user?.id || 6
//         },
//         {
//           headers: {
//             'Content-Type': 'application/json',
//             'Authorization': `Bearer ${token}`
//           }
//         }
//       )

//       if (response.data.success) {
//         handleSuccess("Domain deleted successfully")
//         // Remove from selected items
//         setSelectedItems(prev => prev.filter(itemId => itemId !== id))
//       } else {
//         toast({
//           title: "Error",
//           description: response.data.message,
//           variant: "destructive"
//         })
//       }
//     } catch (error: any) {
//       handleError(error, "Failed to delete domain")
//     }
//   }

//   // Bulk delete domains
//   const handleBulkDelete = async () => {
//     if (selectedItems.length === 0) {
//       toast({
//         title: "Error",
//         description: "Please select at least one domain",
//         variant: "destructive"
//       })
//       return
//     }

//     if (!window.confirm(`Are you sure you want to delete ${selectedItems.length} domain(s)?`)) {
//       return
//     }

//     try {
//       setIsDeleting(true)
//       const token = getAuthToken()
      
//       if (!token) {
//         toast({
//           title: "Error",
//           description: "Authentication token not found. Please login again.",
//           variant: "destructive"
//         })
//         router.push('/auth/login')
//         return
//       }

//       const response = await axios.post<ApiResponse>(
//         `${BASE_URL}/secure/Domain/delete-domain`,
//         {
//           ids: selectedItems,
//           s_id: user?.id || 6
//         },
//         {
//           headers: {
//             'Content-Type': 'application/json',
//             'Authorization': `Bearer ${token}`
//           }
//         }
//       )

//       if (response.data.success) {
//         handleSuccess(`${selectedItems.length} domain(s) deleted successfully`)
//         setSelectedItems([])
//       } else {
//         toast({
//           title: "Error",
//           description: response.data.message,
//           variant: "destructive"
//         })
//       }
//     } catch (error: any) {
//       handleError(error, "Failed to delete domains")
//     } finally {
//       setIsDeleting(false)
//     }
//   }

//   const handleEdit = (item: Domain) => {
//     setEditingId(item.id)
//     setEditValue(item.name)
//   }

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
//       setSelectedItems(prev => prev.filter(selectedId => selectedId !== id))
//     }
//   }

//   const handleSort = (column: string) => {
//     setPagination(prev => ({
//       ...prev,
//       orderBy: column,
//       order: prev.orderBy === column && prev.order === "desc" ? "asc" : "desc",
//       page: 0
//     }))
//   }

//   const handlePageChange = (newPage: number) => {
//     setPagination(prev => ({ ...prev, page: newPage }))
//   }

//   const formatDate = (dateString: string) => {
//     try {
//       const date = new Date(dateString)
//       return date.toLocaleDateString('en-US', {
//         year: 'numeric',
//         month: 'short',
//         day: 'numeric',
//         hour: '2-digit',
//         minute: '2-digit'
//       })
//     } catch {
//       return dateString
//     }
//   }

//   const isAllSelected = data.length > 0 && selectedItems.length === data.length
//   const totalPages = Math.ceil(totalDomains / pagination.rowsPerPage)
//   const startItem = pagination.page * pagination.rowsPerPage + 1
//   const endItem = Math.min((pagination.page + 1) * pagination.rowsPerPage, totalDomains)

//   return (
//     <div className="min-h-screen pb-8">
//       <Header title="Domain Management" tabs={navigationTabs} />

//       <div className="px-4 sm:px-6 mt-6">
//         <GlassCard className="p-6">
//           {/* Header with Search and Add Button */}
//           <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
//             <div>
//               <div className="flex items-center gap-2">
//                 <Globe className="w-6 h-6 text-[#CB8959]" />
//                 <h2 className="text-xl font-semibold text-white">Domains</h2>
//               </div>
//               <p className="text-sm text-gray-400 mt-1">
//                 Manage your domains and subdomains
//               </p>
//             </div>
            
//             <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
//               <div className="relative flex-1 sm:flex-initial">
//                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
//                 <input
//                   type="text"
//                   placeholder="Search domains..."
//                   defaultValue={searchQuery}
//                   onChange={(e) => handleSearchInput(e.target.value)}
//                   className="pl-10 pr-4 py-2 w-full sm:w-64 bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.1)] rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                 />
//               </div>
              
//               <div className="flex gap-2">
//                 {selectedItems.length > 0 && (
//                   <GlassButton
//                     variant="danger"
//                     onClick={handleBulkDelete}
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
//                   onClick={() => {
//                     setEditingId(-1)
//                     setEditValue("")
//                   }}
//                   className="flex items-center gap-2"
//                   disabled={isAdding || editingId === -1}
//                 >
//                   {editingId === -1 ? (
//                     <>
//                       <Loader2 className="w-4 h-4 animate-spin" />
//                       Adding...
//                     </>
//                   ) : (
//                     <>
//                       <Plus className="w-4 h-4" />
//                       Add Domain
//                     </>
//                   )}
//                 </GlassButton>
//               </div>
//             </div>
//           </div>

//           {/* Add Form - Only for adding new domains */}
//           {editingId === -1 && (
//             <div className="mb-6 p-4 bg-[rgba(255,255,255,0.05)] rounded-lg border border-[rgba(255,255,255,0.1)]">
//               <div className="flex items-center justify-between mb-3">
//                 <h3 className="text-white font-medium">Add New Domain</h3>
//                 <button
//                   onClick={handleCancel}
//                   className="p-1 hover:bg-[rgba(255,255,255,0.1)] rounded transition-colors"
//                 >
//                   <X className="w-4 h-4 text-gray-400" />
//                 </button>
//               </div>
//               <div className="flex flex-col sm:flex-row gap-3">
//                 <div className="flex-1">
//                   <input
//                     type="text"
//                     value={editValue}
//                     onChange={(e) => setEditValue(e.target.value)}
//                     placeholder="Enter domain name (e.g., example.com)..."
//                     className="w-full px-3 py-2 bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.1)] rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                     autoFocus
//                     onKeyDown={(e) => {
//                       if (e.key === 'Enter') handleAdd()
//                       if (e.key === 'Escape') handleCancel()
//                     }}
//                   />
//                 </div>
//                 <div className="flex gap-2">
//                   <button
//                     onClick={handleAdd}
//                     disabled={isAdding || !editValue.trim()}
//                     className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
//                   >
//                     {isAdding ? (
//                       <>
//                         <Loader2 className="w-4 h-4 animate-spin" />
//                         Adding...
//                       </>
//                     ) : (
//                       <>
//                         <Check className="w-4 h-4" />
//                         Add Domain
//                       </>
//                     )}
//                   </button>
//                   <button
//                     onClick={handleCancel}
//                     className="px-4 py-2 bg-[rgba(255,255,255,0.1)] text-white rounded-lg hover:bg-[rgba(255,255,255,0.2)] transition-colors"
//                   >
//                     Cancel
//                   </button>
//                 </div>
//               </div>
//             </div>
//           )}

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
//                     <th 
//                       className="py-3 px-4 text-left text-sm font-medium text-gray-300 cursor-pointer hover:text-white transition-colors min-w-[200px]"
//                       onClick={() => handleSort("name")}
//                     >
//                       <div className="flex items-center gap-1">
//                         Domain Name
//                         {pagination.orderBy === "name" && (
//                           <span className="text-xs">
//                             {pagination.order === "asc" ? "↑" : "↓"}
//                           </span>
//                         )}
//                       </div>
//                     </th>
//                     <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 min-w-[150px]">
//                       Created At
//                     </th>
//                     <th className="py-3 px-4 text-right text-sm font-medium text-gray-300 min-w-[120px]">
//                       Actions
//                     </th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {loading ? (
//                     <tr>
//                       <td colSpan={5} className="py-8 text-center">
//                         <div className="flex flex-col items-center justify-center gap-2">
//                           <DashboardLoader label="Loading domains..." />
//                         </div>
//                       </td>
//                     </tr>
//                   ) : data.length === 0 ? (
//                     <tr>
//                       <td colSpan={5} className="py-8 text-center">
//                         <div className="flex flex-col items-center justify-center gap-2">
//                           <Globe className="w-12 h-12 text-gray-400" />
//                           <span className="text-gray-400">No domains found</span>
//                           {searchQuery && (
//                             <button
//                               onClick={() => {
//                                 setSearchQuery("")
//                                 if (searchTimeoutRef.current) {
//                                   clearTimeout(searchTimeoutRef.current)
//                                 }
//                               }}
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
//                       <tr
//                         key={item.id}
//                         className={`border-b border-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.02)] transition-colors ${
//                           editingId === item.id ? 'bg-[rgba(59,130,246,0.05)]' : ''
//                         }`}
//                       >
//                         <td className="py-3 px-4">
//                           <input
//                             type="checkbox"
//                             checked={selectedItems.includes(item.id)}
//                             onChange={(e) => handleSelectItem(item.id, e.target.checked)}
//                             className="w-4 h-4 rounded border-gray-300 bg-gray-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
//                           />
//                         </td>
//                         <td className="py-3 px-4 text-sm text-gray-300">
//                           {startItem + index}
//                         </td>
//                         <td className="py-3 px-4">
//                           {editingId === item.id ? (
//                             <div className="flex gap-2">
//                               <input
//                                 type="text"
//                                 value={editValue}
//                                 onChange={(e) => setEditValue(e.target.value)}
//                                 className="flex-1 px-3 py-1.5 bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.1)] rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
//                                 autoFocus
//                                 onKeyDown={(e) => {
//                                   if (e.key === 'Enter') handleSave(item.id)
//                                   if (e.key === 'Escape') handleCancel()
//                                 }}
//                               />
//                             </div>
//                           ) : (
//                             <div className="flex items-center gap-2">
//                               <Globe className="w-4 h-4 text-gray-400 flex-shrink-0" />
//                               <span className="text-sm text-white font-medium">
//                                 {item.name}
//                               </span>
//                             </div>
//                           )}
//                         </td>
//                         <td className="py-3 px-4 text-sm text-gray-300">
//                           {formatDate(item.created_at)}
//                         </td>
//                         <td className="py-3 px-4">
//                           <div className="flex items-center justify-end gap-2">
//                             {editingId === item.id ? (
//                               <>
//                                 <button
//                                   onClick={() => handleSave(item.id)}
//                                   disabled={isSaving}
//                                   className="p-1.5 rounded bg-green-500/20 hover:bg-green-500/30 transition-colors disabled:opacity-50"
//                                   title="Save"
//                                 >
//                                   {isSaving ? (
//                                     <Loader2 className="w-4 h-4 animate-spin text-green-400" />
//                                   ) : (
//                                     <Check className="w-4 h-4 text-green-400" />
//                                   )}
//                                 </button>
//                                 <button
//                                   onClick={handleCancel}
//                                   disabled={isSaving}
//                                   className="p-1.5 rounded bg-red-500/20 hover:bg-red-500/30 transition-colors disabled:opacity-50"
//                                   title="Cancel"
//                                 >
//                                   <X className="w-4 h-4 text-red-400" />
//                                 </button>
//                               </>
//                             ) : (
//                               <>
//                                 <button
//                                   onClick={() => handleEdit(item)}
//                                   disabled={editingId !== null}
//                                   className="p-1.5 rounded hover:bg-[rgba(255,255,255,0.1)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
//                                   title="Edit"
//                                 >
//                                   <Edit className="w-4 h-4 text-gray-400 hover:text-blue-400" />
//                                 </button>
//                                 <button
//                                   onClick={() => handleDelete(item.id)}
//                                   disabled={editingId !== null}
//                                   className="p-1.5 rounded hover:bg-red-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
//                                   title="Delete"
//                                 >
//                                   <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-400" />
//                                 </button>
//                               </>
//                             )}
//                           </div>
//                         </td>
//                       </tr>
//                     ))
//                   )}
//                 </tbody>
//               </table>
//             </div>

//             {/* Pagination */}
//             {!loading && data.length > 0 && (
//               <Pagination
//   page={pagination.page}
//   rowsPerPage={pagination.rowsPerPage}
//   totalItems={totalDomains}
//   onPageChange={handlePageChange}
// />
//             )}
//           </div>

//           {/* Selected Items Info */}
//           {selectedItems.length > 0 && (
//             <div className="mt-4 p-3 bg-[rgba(255,255,255,0.05)] rounded-lg border border-[rgba(255,255,255,0.1)]">
//               <div className="flex items-center justify-between">
//                 <span className="text-sm text-gray-300">
//                   {selectedItems.length} domain{selectedItems.length > 1 ? 's' : ''} selected
//                 </span>
//                 <div className="flex gap-2">
//                   <button
//                     onClick={() => setSelectedItems([])}
//                     className="text-sm text-gray-400 hover:text-white transition-colors"
//                   >
//                     Clear selection
//                   </button>
//                   <button
//                     onClick={handleBulkDelete}
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
//     </div>
//   )
// }





// // app/Domain/page.tsx
// "use client"

// import { useState, useEffect } from "react"
// import { Header } from "@/components/layout"
// import { GlassCard, GlassButton } from "@/components/glass"
// import {
//   Edit,
//   Trash2,
//   Check,
//   X,
//   Search,
//   Plus,
//   Loader2,
//   Globe
// } from "lucide-react"
// import { navigationTabs } from "@/lib/navigation"
// import axios from "axios"
// import { useAuth } from "@/contexts/AuthContext"
// import { useToast } from "@/hooks/useToast"
// import { useRouter } from "next/navigation"

// const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://rainbowsolutionandtechnology.com/FSISubscriptionPortal/public/api"

// interface Domain {
//   id: number
//   name: string
//   created_at: string
// }

// interface DomainsResponse {
//   rows: Domain[]
//   total: number
// }

// interface ApiResponse {
//   success: boolean
//   message: string
//   domain_id?: number
// }

// export default function DomainPage() {
//   const { user } = useAuth()
//   const { toast } = useToast()
//   const router = useRouter()
//   const [data, setData] = useState<Domain[]>([])
//   const [loading, setLoading] = useState(true)
//   const [searchQuery, setSearchQuery] = useState("")
//   const [editingId, setEditingId] = useState<number | null>(null)
//   const [editValue, setEditValue] = useState("")
//   const [selectedItems, setSelectedItems] = useState<number[]>([])
//   const [isAdding, setIsAdding] = useState(false)
//   const [isDeleting, setIsDeleting] = useState(false)
//   const [pagination, setPagination] = useState({
//     page: 0,
//     rowsPerPage: 10,
//     order: "desc" as "asc" | "desc",
//     orderBy: "name"
//   })
//   const [totalDomains, setTotalDomains] = useState(0)

//   // Function to get token from localStorage
//   const getAuthToken = () => {
//     if (typeof window !== 'undefined') {
//       return localStorage.getItem('authToken')
//     }
//     return null
//   }

//   // Fetch domains from API
//   const fetchDomains = async () => {
//     try {
//       setLoading(true)
//       const token = getAuthToken()
      
//       if (!token) {
//         toast.error("Authentication token not found. Please login again.")
//         router.push('/auth/login')
//         return
//       }

//       const response = await axios.post<DomainsResponse>(
//         `${BASE_URL}/secure/Domain/list-domain`,
//         {
//           page: pagination.page,
//           rowsPerPage: pagination.rowsPerPage,
//           order: pagination.order,
//           orderBy: pagination.orderBy,
//           search: searchQuery
//         },
//         {
//           headers: {
//             'Content-Type': 'application/json',
//             'Authorization': `Bearer ${token}`
//           }
//         }
//       )

//       setData(response.data.rows)
//       setTotalDomains(response.data.total)
//     } catch (error: any) {
//       console.error("Error fetching domains:", error)
//       if (error.response?.status === 401) {
//         toast.error("Session expired. Please login again.")
//         router.push('/auth/login')
//       } else {
//         toast.error(error.response?.data?.message || "Failed to fetch domains")
//       }
//     } finally {
//       setLoading(false)
//     }
//   }

//   // Initial fetch
//   useEffect(() => {
//     fetchDomains()
//   }, [pagination.page, pagination.order, pagination.orderBy, searchQuery])

//   // Add new domain
//   const handleAdd = async () => {
//     if (!editValue.trim()) {
//       toast.error("Please enter a domain name")
//       return
//     }

//     try {
//       setIsAdding(true)
//       const token = getAuthToken()
      
//       if (!token) {
//         toast.error("Authentication token not found. Please login again.")
//         router.push('/auth/login')
//         return
//       }

//       const response = await axios.post<ApiResponse>(
//         `${BASE_URL}/secure/Domain/add-domain`,
//         {
//           name: editValue,
//           s_id: user?.id || 6
//         },
//         {
//           headers: {
//             'Content-Type': 'application/json',
//             'Authorization': `Bearer ${token}`
//           }
//         }
//       )

//       if (response.data.success) {
//         toast.success(response.data.message)
//         setEditValue("")
//         setEditingId(null)
//         fetchDomains() // Refresh the list
//       } else {
//         toast.error(response.data.message)
//       }
//     } catch (error: any) {
//       console.error("Error adding domain:", error)
//       if (error.response?.status === 401) {
//         toast.error("Session expired. Please login again.")
//         router.push('/auth/login')
//       } else {
//         toast.error(error.response?.data?.message || "Failed to add domain")
//       }
//     } finally {
//       setIsAdding(false)
//     }
//   }

//   // Update existing domain
//   const handleSave = async (id: number) => {
//     if (!editValue.trim()) {
//       toast.error("Please enter a domain name")
//       return
//     }

//     try {
//       const token = getAuthToken()
      
//       if (!token) {
//         toast.error("Authentication token not found. Please login again.")
//         router.push('/auth/login')
//         return
//       }

//       const response = await axios.post<ApiResponse>(
//         `${BASE_URL}/secure/Domain/update-domain`,
//         {
//           id: id,
//           name: editValue,
//           s_id: user?.id || 6
//         },
//         {
//           headers: {
//             'Content-Type': 'application/json',
//             'Authorization': `Bearer ${token}`
//           }
//         }
//       )

//       if (response.data.success) {
//         toast.success(response.data.message)
//         setEditingId(null)
//         setEditValue("")
//         fetchDomains() // Refresh the list
//       } else {
//         toast.error(response.data.message)
//       }
//     } catch (error: any) {
//       console.error("Error updating domain:", error)
//       if (error.response?.status === 401) {
//         toast.error("Session expired. Please login again.")
//         router.push('/auth/login')
//       } else {
//         toast.error(error.response?.data?.message || "Failed to update domain")
//       }
//     }
//   }

//   const handleCancel = () => {
//     setEditingId(null)
//     setEditValue("")
//   }

//   // Delete single domain
//   const handleDelete = async (id: number) => {
//     if (!confirm("Are you sure you want to delete this domain?")) {
//       return
//     }

//     try {
//       const token = getAuthToken()
      
//       if (!token) {
//         toast.error("Authentication token not found. Please login again.")
//         router.push('/auth/login')
//         return
//       }

//       const response = await axios.post<ApiResponse>(
//         `${BASE_URL}/secure/Domain/delete-domain`,
//         {
//           ids: [id],
//           s_id: user?.id || 6
//         },
//         {
//           headers: {
//             'Content-Type': 'application/json',
//             'Authorization': `Bearer ${token}`
//           }
//         }
//       )

//       if (response.data.success) {
//         toast.success("Domain deleted successfully")
//         fetchDomains() // Refresh the list
//         setSelectedItems(selectedItems.filter(selectedId => selectedId !== id))
//       } else {
//         toast.error(response.data.message)
//       }
//     } catch (error: any) {
//       console.error("Error deleting domain:", error)
//       if (error.response?.status === 401) {
//         toast.error("Session expired. Please login again.")
//         router.push('/auth/login')
//       } else {
//         toast.error(error.response?.data?.message || "Failed to delete domain")
//       }
//     }
//   }

//   // Bulk delete domains
//   const handleBulkDelete = async () => {
//     if (selectedItems.length === 0) {
//       toast.error("Please select at least one domain")
//       return
//     }

//     if (!confirm(`Are you sure you want to delete ${selectedItems.length} domain(s)?`)) {
//       return
//     }

//     try {
//       setIsDeleting(true)
//       const token = getAuthToken()
      
//       if (!token) {
//         toast.error("Authentication token not found. Please login again.")
//         router.push('/auth/login')
//         return
//       }

//       const response = await axios.post<ApiResponse>(
//         `${BASE_URL}/secure/Domain/delete-domain`,
//         {
//           ids: selectedItems,
//           s_id: user?.id || 6
//         },
//         {
//           headers: {
//             'Content-Type': 'application/json',
//             'Authorization': `Bearer ${token}`
//           }
//         }
//       )

//       if (response.data.success) {
//         toast.success(`${selectedItems.length} domain(s) deleted successfully`)
//         fetchDomains() // Refresh the list
//         setSelectedItems([])
//       } else {
//         toast.error(response.data.message)
//       }
//     } catch (error: any) {
//       console.error("Error deleting domains:", error)
//       if (error.response?.status === 401) {
//         toast.error("Session expired. Please login again.")
//         router.push('/auth/login')
//       } else {
//         toast.error(error.response?.data?.message || "Failed to delete domains")
//       }
//     } finally {
//       setIsDeleting(false)
//     }
//   }

//   const handleEdit = (item: Domain) => {
//     setEditingId(item.id)
//     setEditValue(item.name)
//   }

//   const handleSelectAll = (checked: boolean) => {
//     if (checked) {
//       setSelectedItems(data.map(item => item.id))
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

//   const handleSort = (column: string) => {
//     setPagination(prev => ({
//       ...prev,
//       orderBy: column,
//       order: prev.orderBy === column && prev.order === "desc" ? "asc" : "desc"
//     }))
//   }

//   const isAllSelected = data.length > 0 && selectedItems.length === data.length

//   return (
//     <div className="min-h-screen pb-8">
//       <Header title="Domain Management" tabs={navigationTabs} />

//       <div className="px-4 sm:px-6 mt-6">
//         <GlassCard className="p-6">
//           {/* Header with Search and Add Button */}
//           <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
//             <div className="flex items-center gap-3">
//               <Globe className="w-6 h-6 text-[var(--theme-primary)]" />
//               <h2 className="text-xl font-semibold text-white">Domains</h2>
//             </div>
            
//             <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
//               <div className="relative flex-1 sm:flex-initial">
//                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
//                 <input
//                   type="text"
//                   placeholder="Search domains..."
//                   value={searchQuery}
//                   onChange={(e) => {
//                     setSearchQuery(e.target.value)
//                     setPagination(prev => ({ ...prev, page: 0 }))
//                   }}
//                   className="pl-10 pr-4 py-2 w-full bg-[rgba(255,255,255,var(--ui-opacity-10))] border border-[rgba(255,255,255,var(--glass-border-opacity))] rounded-lg text-white placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent"
//                 />
//               </div>
              
//               <div className="flex gap-2">
//                 <GlassButton
//                   variant="primary"
//                   onClick={() => {
//                     setEditingId(-1) // Use -1 to indicate new domain
//                     setEditValue("")
//                   }}
//                   className="flex items-center gap-2"
//                   disabled={isAdding}
//                 >
//                   {isAdding ? (
//                     <Loader2 className="w-4 h-4 animate-spin" />
//                   ) : (
//                     <Plus className="w-4 h-4" />
//                   )}
//                   Add Domain
//                 </GlassButton>
                
//                 {selectedItems.length > 0 && (
//                   <GlassButton
//                     variant="danger"
//                     onClick={handleBulkDelete}
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
//               </div>
//             </div>
//           </div>

//           {/* Add/Edit Form */}
//           {(editingId === -1 || editingId !== null) && (
//             <div className="mb-6 p-4 bg-[rgba(255,255,255,var(--ui-opacity-5))] rounded-lg border border-[rgba(255,255,255,var(--glass-border-opacity))]">
//               <h3 className="text-white font-medium mb-3">
//                 {editingId === -1 ? "Add New Domain" : "Edit Domain"}
//               </h3>
//               <div className="flex gap-3">
//                 <input
//                   type="text"
//                   value={editValue}
//                   onChange={(e) => setEditValue(e.target.value)}
//                   placeholder="Enter domain name (e.g., example.com)"
//                   className="flex-1 px-3 py-2 bg-[rgba(255,255,255,var(--ui-opacity-10))] border border-[rgba(255,255,255,var(--glass-border-opacity))] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent"
//                   autoFocus
//                   onKeyDown={(e) => {
//                     if (e.key === 'Enter') {
//                       if (editingId === -1) handleAdd()
//                       else if (editingId) handleSave(editingId)
//                     }
//                     if (e.key === 'Escape') handleCancel()
//                   }}
//                 />
//                 <button
//                   onClick={() => editingId === -1 ? handleAdd() : editingId && handleSave(editingId)}
//                   disabled={isAdding || !editValue.trim()}
//                   className="px-4 py-2 bg-[var(--theme-primary)] text-white rounded-lg hover:bg-[var(--theme-primary-dark)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
//                 >
//                   {isAdding ? (
//                     <>
//                       <Loader2 className="w-4 h-4 animate-spin" />
//                       Saving...
//                     </>
//                   ) : (
//                     <>
//                       <Check className="w-4 h-4" />
//                       {editingId === -1 ? "Add" : "Save"}
//                     </>
//                   )}
//                 </button>
//                 <button
//                   onClick={handleCancel}
//                   className="px-4 py-2 bg-[rgba(255,255,255,var(--ui-opacity-10))] text-white rounded-lg hover:bg-[rgba(255,255,255,var(--ui-opacity-20))] transition-colors"
//                 >
//                   <X className="w-4 h-4" />
//                 </button>
//               </div>
//             </div>
//           )}

//           {/* Table */}
//           <div className="overflow-x-auto">
//             {loading ? (
//               <div className="flex justify-center items-center py-12">
//                 <Loader2 className="w-8 h-8 animate-spin text-[var(--theme-primary)]" />
//               </div>
//             ) : (
//               <>
//                 <table className="w-full">
//                   <thead>
//                     <tr className="border-b border-[rgba(255,255,255,var(--glass-border-opacity))]">
//                       <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-tertiary)]">
//                         <input
//                           type="checkbox"
//                           checked={isAllSelected}
//                           onChange={(e) => handleSelectAll(e.target.checked)}
//                           className="w-4 h-4 rounded border-[rgba(255,255,255,var(--glass-border-opacity))] bg-[rgba(255,255,255,var(--ui-opacity-10))] text-[var(--theme-primary)] focus:ring-[var(--theme-primary)]"
//                         />
//                       </th>
//                       <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-tertiary)] w-[80px]">
//                         S.NO
//                       </th>
//                       <th 
//                         className="text-left py-3 px-4 text-sm font-medium text-[var(--text-tertiary)] cursor-pointer hover:text-white transition-colors"
//                         onClick={() => handleSort("name")}
//                       >
//                         <div className="flex items-center gap-1">
//                           Domain Name
//                           {pagination.orderBy === "name" && (
//                             <span className="text-xs">
//                               {pagination.order === "asc" ? "↑" : "↓"}
//                             </span>
//                           )}
//                         </div>
//                       </th>
//                       <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-tertiary)]">
//                         Created At
//                       </th>
//                       <th className="text-right py-3 px-4 text-sm font-medium text-[var(--text-tertiary)] w-[120px]">
//                         Actions
//                       </th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {data.map((item, index) => (
//                       <tr
//                         key={item.id}
//                         className="border-b border-[rgba(255,255,255,var(--glass-border-opacity))] hover:bg-[rgba(255,255,255,var(--ui-opacity-5))] transition-colors"
//                       >
//                         <td className="py-3 px-4">
//                           <input
//                             type="checkbox"
//                             checked={selectedItems.includes(item.id)}
//                             onChange={(e) => handleSelectItem(item.id, e.target.checked)}
//                             className="w-4 h-4 rounded border-[rgba(255,255,255,var(--glass-border-opacity))] bg-[rgba(255,255,255,var(--ui-opacity-10))] text-[var(--theme-primary)] focus:ring-[var(--theme-primary)]"
//                           />
//                         </td>
//                         <td className="py-3 px-4 text-sm text-[var(--text-secondary)]">
//                           {index + 1 + (pagination.page * pagination.rowsPerPage)}
//                         </td>
//                         <td className="py-3 px-4">
//                           {editingId === item.id ? (
//                             <input
//                               type="text"
//                               value={editValue}
//                               onChange={(e) => setEditValue(e.target.value)}
//                               className="w-full px-3 py-2 bg-[rgba(255,255,255,var(--ui-opacity-10))] border border-[rgba(255,255,255,var(--glass-border-opacity))] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent"
//                               autoFocus
//                               onKeyDown={(e) => {
//                                 if (e.key === 'Enter') handleSave(item.id)
//                                 if (e.key === 'Escape') handleCancel()
//                               }}
//                             />
//                           ) : (
//                             <div className="flex items-center gap-2">
//                               <Globe className="w-4 h-4 text-[var(--text-muted)] flex-shrink-0" />
//                               <span className="text-sm text-white font-medium">
//                                 {item.name}
//                               </span>
//                             </div>
//                           )}
//                         </td>
//                         <td className="py-3 px-4 text-sm text-[var(--text-secondary)]">
//                           {item.created_at}
//                         </td>
//                         <td className="py-3 px-4">
//                           <div className="flex items-center justify-end gap-2">
//                             {editingId === item.id ? (
//                               <>
//                                 <button
//                                   onClick={() => handleSave(item.id)}
//                                   className="p-2 rounded-lg hover:bg-green-500/20 transition-colors"
//                                   title="Save"
//                                 >
//                                   <Check className="w-4 h-4 text-green-400" />
//                                 </button>
//                                 <button
//                                   onClick={handleCancel}
//                                   className="p-2 rounded-lg hover:bg-red-500/20 transition-colors"
//                                   title="Cancel"
//                                 >
//                                   <X className="w-4 h-4 text-red-400" />
//                                 </button>
//                               </>
//                             ) : (
//                               <>
//                                 <button
//                                   onClick={() => handleEdit(item)}
//                                   className="p-2 rounded-lg hover:bg-[rgba(255,255,255,var(--ui-opacity-10))] transition-colors"
//                                   title="Edit"
//                                 >
//                                   <Edit className="w-4 h-4 text-[var(--text-tertiary)]" />
//                                 </button>
//                                 <button
//                                   onClick={() => handleDelete(item.id)}
//                                   className="p-2 rounded-lg hover:bg-red-500/20 transition-colors"
//                                   title="Delete"
//                                 >
//                                   <Trash2 className="w-4 h-4 text-red-400" />
//                                 </button>
//                               </>
//                             )}
//                           </div>
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>

//                 {/* Pagination */}
//                 <div className="flex items-center justify-between mt-4 pt-4 border-t border-[rgba(255,255,255,var(--glass-border-opacity))]">
//                   <div className="text-sm text-[var(--text-muted)]">
//                     Showing {data.length} of {totalDomains} domains
//                   </div>
//                   <div className="flex items-center gap-2">
//                     <button
//                       onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
//                       disabled={pagination.page === 0}
//                       className="px-3 py-1 rounded-lg bg-[rgba(255,255,255,var(--ui-opacity-5))] text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[rgba(255,255,255,var(--ui-opacity-10))] transition-colors"
//                     >
//                       Previous
//                     </button>
//                     <span className="text-sm text-white">
//                       Page {pagination.page + 1}
//                     </span>
//                     <button
//                       onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
//                       disabled={(pagination.page + 1) * pagination.rowsPerPage >= totalDomains}
//                       className="px-3 py-1 rounded-lg bg-[rgba(255,255,255,var(--ui-opacity-5))] text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[rgba(255,255,255,var(--ui-opacity-10))] transition-colors"
//                     >
//                       Next
//                     </button>
//                   </div>
//                 </div>
//               </>
//             )}

//             {!loading && data.length === 0 && (
//               <div className="text-center py-12">
//                 <Globe className="w-12 h-12 mx-auto text-[var(--text-muted)] mb-3" />
//                 <span className="text-[var(--text-muted)]">No domains found</span>
//               </div>
//             )}
//           </div>

//           {/* Selected Items Info */}
//           {selectedItems.length > 0 && (
//             <div className="mt-4 p-3 bg-[rgba(255,255,255,var(--ui-opacity-5))] rounded-lg border border-[rgba(255,255,255,var(--glass-border-opacity))]">
//               <span className="text-sm text-[var(--text-secondary)]">
//                 {selectedItems.length} domain{selectedItems.length > 1 ? 's' : ''} selected
//               </span>
//             </div>
//           )}
//         </GlassCard>
//       </div>
//     </div>
//   )
// }