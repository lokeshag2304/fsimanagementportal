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
import api from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/useToast"
import { useRouter } from "next/navigation"
import Pagination from "@/common/Pagination"
import DashboardLoader from "@/common/DashboardLoader"
import { DeleteConfirmationModal } from "@/common/services/DeleteConfirmationModal"
import { getNavigationByRole } from "@/lib/getNavigationByRole"

interface Domain {
  id: number
  domain_name: string
  name: string
  renewal_date: string
  deletion_date: string
  days_left: number | null
  days_to_delete: number | null
  amount: number
  status: number
  remarks: string
  grace_period?: number
  due_date?: string
  last_updated: string
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
  const { user, getToken } = useAuth();
  const token = getToken();
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
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isMountedRef = useRef(true)

  // Fetch domains function
  const fetchDomains = async () => {
    if (!isMountedRef.current) return;

    try {
      setLoading(true)

      if (!token) {
        toast({
          title: "Error",
          description: "Authentication token not found. Please login again.",
          variant: "destructive"
        })
        router.push('/auth/login')
        return
      }

      const response = await api.post<DomainsResponse>(
        `/secure/Domain/list-domain`,
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
    fetchDomains().catch(err => console.error("Load failed", err));

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
      fetchDomains().catch(err => console.error("Load failed", err));
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
    fetchDomains().catch(err => console.error("Load failed", err));
  }

  // Handle error
  const handleError = (error: any, defaultMessage: string) => {
    console.warn("API Request Failed:", error?.response?.data?.message || error?.message)

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

      if (!token) {
        toast({
          title: "Error",
          description: "Authentication token not found. Please login again.",
          variant: "destructive"
        })
        router.push('/auth/login')
        return
      }

      const response = await api.post<any>(
        `/secure/domains`,
        {
          domain_name: editValue,
          status: 1,
          domain_protected: 1,
          amount: 0
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      )

      if (response.status === 200 || response.status === 201 || response.data?.success) {
        handleSuccess(response.data?.message || "Domain added successfully")
      } else {
        toast({
          title: "Error",
          description: response.data?.message || "Failed to add domain",
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

      if (!token) {
        toast({
          title: "Error",
          description: "Authentication token not found. Please login again.",
          variant: "destructive"
        })
        router.push('/auth/login')
        return
      }

      const response = await api.put<any>(
        `/secure/domains/${id}`,
        {
          name: editValue
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      )

      if (response.status === 200 || response.status === 201 || response.data?.success) {
        handleSuccess(response.data?.message || "Domain updated successfully")
      } else {
        toast({
          title: "Error",
          description: response.data?.message || "Failed to update domain",
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

      if (!token) {
        toast({
          title: "Error",
          description: "Authentication token not found. Please login again.",
          variant: "destructive"
        })
        router.push('/auth/login')
        return
      }

      let deleteSuccessCount = 0;
      let deleteErrorMsg = "";

      for (const delId of idsToDelete) {
        try {
          const res = await api.delete(`/secure/domains/${delId}`, {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });
          if (res.status === 200 || res.status === 204 || res.data?.success) {
            deleteSuccessCount++;
          }
        } catch (e: any) {
          deleteErrorMsg = e.response?.data?.message || "Error deleting";
        }
      }

      if (deleteSuccessCount > 0) {
        handleSuccess(`${deleteSuccessCount} domain(s) deleted successfully`)
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
          description: deleteErrorMsg || "Failed to delete domain(s)",
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
      return date.toLocaleString('en-GB', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: true
      }).toLowerCase()
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
                    variant="default"
                    onClick={handleBulkDeleteClick}
                    className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-500 border border-red-500/50"
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
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 min-w-[60px]">S.NO</th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 min-w-[160px]">Domain Name</th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 min-w-[140px]">Renewal Date</th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 min-w-[100px]">Days Left</th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 min-w-[100px]">Status</th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 min-w-[160px]">Last Updated</th>
                    <th className="py-3 px-4 text-right text-sm font-medium text-gray-300 min-w-[100px]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center">
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
                        className={`border-b border-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.02)] transition-colors ${editingId === item.id ? 'bg-[rgba(59,130,246,0.05)]' : ''
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
                          <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-[#CB8959] flex-shrink-0" />
                            <span className="text-sm text-white font-medium">
                              {item.domain_name || item.name || '-'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-300">
                          {item.renewal_date ? new Date(item.renewal_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '-'}
                        </td>
                        <td className="py-3 px-4">
                          {item.days_left !== null && item.days_left !== undefined ? (
                            <span className={`text-sm font-medium ${item.days_left < 0 ? 'text-red-400' :
                              item.days_left <= 30 ? 'text-yellow-400' :
                                'text-green-400'
                              }`}>
                              {item.days_left < 0 ? `${Math.abs(item.days_left)}d expired` : `${item.days_left}d`}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-500">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`text-xs px-2 py-1 rounded-full ${item.status === 1 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                            }`}>
                            {item.status === 1 ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-300">
                          {item.last_updated || '-'}
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