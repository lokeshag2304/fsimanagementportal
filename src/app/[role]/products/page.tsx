// app/Products/page.tsx
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
  ChevronLeft,
  ChevronRight,
  ProjectorIcon
} from "lucide-react"
import { navigationTabs } from "@/lib/navigation"
import axios from "axios"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/useToast"
import DashboardLoader from "@/common/DashboardLoader"
import Pagination from "@/common/Pagination"
import { DeleteConfirmationModal } from "@/common/services/DeleteConfirmationModal"

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL

interface Product {
  id: number
  name: string
  created_at: string
}

interface ProductsResponse {
  rows: Product[]
  total: number
}

interface ApiResponse {
  success: boolean
  message: string
  domain_id?: number
}

export default function ProductsPage() {
  const { user, getToken } = useAuth()
  const { toast } = useToast()
  const [data, setData] = useState<Product[]>([])
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
  const [totalProducts, setTotalProducts] = useState(0)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<number | null>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout>()
  const isMountedRef = useRef(true)

  // Fetch products function
  const fetchProducts = async () => {
    if (!isMountedRef.current) return;
    
    try {
      setLoading(true)
      const token = getToken() || user?.token
      
      if (!token) {
        toast({
          title: "Error",
          description: "Authentication token not found",
          variant: "destructive"
        })
        return
      }

      const response = await axios.post<ProductsResponse>(
        `${BASE_URL}/secure/Products/list-products`,
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
        setTotalProducts(response.data.total)
      }
    } catch (error: any) {
      console.error("Error fetching products:", error)
      
      if (error.response?.status === 401) {
        toast({
          title: "Session Expired",
          description: "Please login again",
          variant: "destructive"
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch products",
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
    fetchProducts()
    
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
      fetchProducts()
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
    fetchProducts()
  }

  // Handle error
  const handleError = (error: any, defaultMessage: string) => {
    console.error("Error:", error)
    
    if (error.response?.status === 401) {
      toast({
        title: "Session Expired",
        description: "Please login again",
        variant: "destructive"
      })
    } else {
      toast({
        title: "Error",
        description: error.response?.data?.message || defaultMessage,
        variant: "destructive"
      })
    }
  }

  const handleAdd = async () => {
    if (!editValue.trim()) {
      toast({
        title: "Error",
        description: "Please enter a product name",
        variant: "destructive"
      })
      return
    }

    try {
      setIsAdding(true)
      const token = getToken() || user?.token
      
      if (!token) {
        toast({
          title: "Error",
          description: "Authentication token not found",
          variant: "destructive"
        })
        return
      }

      const response = await axios.post<ApiResponse>(
        `${BASE_URL}/secure/Products/add-products`,
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
      handleError(error, "Failed to add product")
    } finally {
      setIsAdding(false)
    }
  }

  const handleSave = async (id: number) => {
    if (!editValue.trim()) {
      toast({
        title: "Error",
        description: "Please enter a product name",
        variant: "destructive"
      })
      return
    }

    try {
      setIsSaving(true)
      const token = getToken() || user?.token
      
      if (!token) {
        toast({
          title: "Error",
          description: "Authentication token not found",
          variant: "destructive"
        })
        return
      }

      const response = await axios.post<ApiResponse>(
        `${BASE_URL}/secure/Products/update-products`,
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
      handleError(error, "Failed to update product")
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditValue("")
  }

  // Handle delete click - shows confirmation modal
  const handleDelete = (id: number) => {
    setItemToDelete(id)
    setShowDeleteModal(true)
  }

  // Handle bulk delete click - shows confirmation modal
  const handleBulkDelete = () => {
    if (selectedItems.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one product",
        variant: "destructive"
      })
      return
    }

    setItemToDelete(null)
    setShowDeleteModal(true)
  }

  // Actual delete function that gets called after confirmation
  const confirmDelete = async () => {
    const idToDelete = itemToDelete || (selectedItems.length > 0 ? selectedItems : null)
    
    if (!idToDelete) {
      setShowDeleteModal(false)
      setItemToDelete(null)
      return
    }

    try {
      setIsDeleting(true)
      const token = getToken() || user?.token
      
      if (!token) {
        toast({
          title: "Error",
          description: "Authentication token not found",
          variant: "destructive"
        })
        return
      }

      const idsToDelete = Array.isArray(idToDelete) ? idToDelete : [idToDelete]
      
      const response = await axios.post<ApiResponse>(
        `${BASE_URL}/secure/Products/delete-products`,
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
        const successMessage = idsToDelete.length === 1 
          ? "Product deleted successfully"
          : `${idsToDelete.length} product(s) deleted successfully`
        
        handleSuccess(successMessage)
        
        // Remove from selected items
        if (Array.isArray(idToDelete)) {
          setSelectedItems([])
        } else {
          setSelectedItems(prev => prev.filter(itemId => itemId !== idToDelete))
        }
      } else {
        toast({
          title: "Error",
          description: response.data.message,
          variant: "destructive"
        })
      }
    } catch (error: any) {
      handleError(error, "Failed to delete product(s)")
    } finally {
      setIsDeleting(false)
      setShowDeleteModal(false)
      setItemToDelete(null)
    }
  }

  const handleEdit = (item: Product) => {
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
  const totalPages = Math.ceil(totalProducts / pagination.rowsPerPage)
  const startItem = pagination.page * pagination.rowsPerPage + 1
  const endItem = Math.min((pagination.page + 1) * pagination.rowsPerPage, totalProducts)

  return (
    <div className="min-h-screen pb-8">
      <Header title="Products Management" tabs={navigationTabs} />

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
        title={itemToDelete ? "Delete Product" : "Delete Multiple Products"}
        message={itemToDelete 
          ? "Are you sure you want to delete this product? This action cannot be undone."
          : "Are you sure you want to delete the selected products? This action cannot be undone."
        }
      />

      <div className="px-4 sm:px-6 mt-6">
        <GlassCard className="p-6">
          {/* Header with Search and Add Button */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <ProjectorIcon className="w-6 h-6 text-[#CB8959]" />
                <h2 className="text-xl font-semibold text-white">Products</h2>
              </div>
              <p className="text-sm text-gray-400 mt-1">
                Manage your products and inventory
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  defaultValue={searchQuery}
                  onChange={(e) => handleSearchInput(e.target.value)}
 className="w-full sm:w-64 pl-10 pr-4 py-2 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
              </div>
              <div className="flex gap-2">
                {selectedItems.length > 0 && (
                  <GlassButton
                    variant="danger"
                    onClick={handleBulkDelete}
                    className="flex items-center gap-2"
                    disabled={isDeleting || editingId !== null}
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
                      Add Product
                    </>
                  )}
                </GlassButton>
              </div>
            </div>
          </div>

          {/* Add Form - Only for adding new products */}
          {editingId === -1 && (
            <div className="mb-6 p-4 bg-[rgba(255,255,255,0.05)] rounded-lg border border-[rgba(255,255,255,0.1)]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-medium">Add New Product</h3>
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
                    placeholder="Enter product name..."
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
                        Add Product
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
                        Product Name
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
                      <td colSpan={5} className="text-center">
                        <div className="flex flex-col items-center justify-center">
                          <DashboardLoader label="Loading products... " />
                        </div>
                      </td>
                    </tr>
                  ) : data.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <span className="text-gray-400">No products found</span>
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
                            <span className="text-sm text-white font-medium">
                              {item.name}
                            </span>
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
                                  onClick={() => handleDelete(item.id)}
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
                totalItems={totalProducts}
                onPageChange={handlePageChange}
              />
            )}
          </div>

          {/* Selected Items Info */}
          {selectedItems.length > 0 && (
            <div className="mt-4 p-3 bg-[rgba(255,255,255,0.05)] rounded-lg border border-[rgba(255,255,255,0.1)]">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">
                  {selectedItems.length} product{selectedItems.length > 1 ? 's' : ''} selected
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedItems([])}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Clear selection
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    disabled={isDeleting || editingId !== null}
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
    </div>
  )
}










// // app/Products/page.tsx
// "use client"

// import { useState, useEffect, useCallback, useRef } from "react"
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
//   ChevronLeft,
//   ChevronRight,
//   ProjectorIcon
// } from "lucide-react"
// import { navigationTabs } from "@/lib/navigation"
// import axios from "axios"
// import { useAuth } from "@/contexts/AuthContext"
// import { useToast } from "@/hooks/useToast"
// import DashboardLoader from "@/common/DashboardLoader"
// import Pagination from "@/common/Pagination"

// const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL

// interface Product {
//   id: number
//   name: string
//   created_at: string
// }

// interface ProductsResponse {
//   rows: Product[]
//   total: number
// }

// interface ApiResponse {
//   success: boolean
//   message: string
//   domain_id?: number
// }

// export default function ProductsPage() {
//   const { user, getToken } = useAuth()
//   const { toast } = useToast()
//   const [data, setData] = useState<Product[]>([])
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
//   const [totalProducts, setTotalProducts] = useState(0)
//   const searchTimeoutRef = useRef<NodeJS.Timeout>()
//   const isMountedRef = useRef(true)

//   // Fetch products function - now without useCallback
//   const fetchProducts = async () => {
//     if (!isMountedRef.current) return;
    
//     try {
//       setLoading(true)
//       const token = getToken() || user?.token
      
//       if (!token) {
//         toast({
//           title: "Error",
//           description: "Authentication token not found",
//           variant: "destructive"
//         })
//         return
//       }

//       const response = await axios.post<ProductsResponse>(
//         `${BASE_URL}/secure/Products/list-products`,
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
//         setTotalProducts(response.data.total)
//       }
//     } catch (error: any) {
//       console.error("Error fetching products:", error)
      
//       if (error.response?.status === 401) {
//         toast({
//           title: "Session Expired",
//           description: "Please login again",
//           variant: "destructive"
//         })
//       } else {
//         toast({
//           title: "Error",
//           description: "Failed to fetch products",
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

//   // Initial fetch only - using refs to track changes
//   useEffect(() => {
//     isMountedRef.current = true
//     fetchProducts()
    
//     return () => {
//       isMountedRef.current = false
//       if (searchTimeoutRef.current) {
//         clearTimeout(searchTimeoutRef.current)
//       }
//     }
//   }, []) // Empty dependency array - fetch only on mount

//   // Separate effect for pagination and search changes
//   useEffect(() => {
//     if (!isMountedRef.current) return;
    
//     // Debounce search and pagination changes
//     const timeoutId = setTimeout(() => {
//       fetchProducts()
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
    
//     // Refresh data after successful operation - only once
//     fetchProducts()
//   }

//   // Handle error
//   const handleError = (error: any, defaultMessage: string) => {
//     console.error("Error:", error)
    
//     if (error.response?.status === 401) {
//       toast({
//         title: "Session Expired",
//         description: "Please login again",
//         variant: "destructive"
//       })
//     } else {
//       toast({
//         title: "Error",
//         description: error.response?.data?.message || defaultMessage,
//         variant: "destructive"
//       })
//     }
//   }

//   const handleAdd = async () => {
//     if (!editValue.trim()) {
//       toast({
//         title: "Error",
//         description: "Please enter a product name",
//         variant: "destructive"
//       })
//       return
//     }

//     try {
//       setIsAdding(true)
//       const token = getToken() || user?.token
      
//       if (!token) {
//         toast({
//           title: "Error",
//           description: "Authentication token not found",
//           variant: "destructive"
//         })
//         return
//       }

//       const response = await axios.post<ApiResponse>(
//         `${BASE_URL}/secure/Products/add-products`,
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
//       handleError(error, "Failed to add product")
//     } finally {
//       setIsAdding(false)
//     }
//   }

//   const handleSave = async (id: number) => {
//     if (!editValue.trim()) {
//       toast({
//         title: "Error",
//         description: "Please enter a product name",
//         variant: "destructive"
//       })
//       return
//     }

//     try {
//       setIsSaving(true)
//       const token = getToken() || user?.token
      
//       if (!token) {
//         toast({
//           title: "Error",
//           description: "Authentication token not found",
//           variant: "destructive"
//         })
//         return
//       }

//       const response = await axios.post<ApiResponse>(
//         `${BASE_URL}/secure/Products/update-products`,
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
//       handleError(error, "Failed to update product")
//     } finally {
//       setIsSaving(false)
//     }
//   }

//   const handleCancel = () => {
//     setEditingId(null)
//     setEditValue("")
//   }

//   const handleDelete = async (id: number) => {
//     if (!window.confirm("Are you sure you want to delete this product?")) {
//       return
//     }

//     try {
//       const token = getToken() || user?.token
      
//       if (!token) {
//         toast({
//           title: "Error",
//           description: "Authentication token not found",
//           variant: "destructive"
//         })
//         return
//       }

//       const response = await axios.post<ApiResponse>(
//         `${BASE_URL}/secure/Products/delete-products`,
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
//         handleSuccess("Product deleted successfully")
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
//       handleError(error, "Failed to delete product")
//     }
//   }

//   const handleBulkDelete = async () => {
//     if (selectedItems.length === 0) {
//       toast({
//         title: "Error",
//         description: "Please select at least one product",
//         variant: "destructive"
//       })
//       return
//     }

//     if (!window.confirm(`Are you sure you want to delete ${selectedItems.length} product(s)?`)) {
//       return
//     }

//     try {
//       setIsDeleting(true)
//       const token = getToken() || user?.token
      
//       if (!token) {
//         toast({
//           title: "Error",
//           description: "Authentication token not found",
//           variant: "destructive"
//         })
//         return
//       }

//       const response = await axios.post<ApiResponse>(
//         `${BASE_URL}/secure/Products/delete-products`,
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
//         handleSuccess(`${selectedItems.length} product(s) deleted successfully`)
//         setSelectedItems([])
//       } else {
//         toast({
//           title: "Error",
//           description: response.data.message,
//           variant: "destructive"
//         })
//       }
//     } catch (error: any) {
//       handleError(error, "Failed to delete products")
//     } finally {
//       setIsDeleting(false)
//     }
//   }

//   const handleEdit = (item: Product) => {
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
//       page: 0 // Reset to first page when sorting
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
//   const totalPages = Math.ceil(totalProducts / pagination.rowsPerPage)
//   const startItem = pagination.page * pagination.rowsPerPage + 1
//   const endItem = Math.min((pagination.page + 1) * pagination.rowsPerPage, totalProducts)

//   return (
//     <div className="min-h-screen pb-8">
//       <Header title="Products Management" tabs={navigationTabs} />

//       <div className="px-4 sm:px-6 mt-6">
//         <GlassCard className="p-6">
//           {/* Header with Search and Add Button */}
//           <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
//             <div>
//               <div className="flex items-center gap-2">
//                 <ProjectorIcon className="w-6 h-6 text-[#CB8959]" />
//               <h2 className="text-xl font-semibold text-white">Products</h2></div>
//               <p className="text-sm text-gray-400 mt-1">
//                 Manage your products and inventory
//               </p>
//             </div>
//             <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
//               <div className="relative flex-1 sm:flex-initial">
//                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
//                 <input
//                   type="text"
//                   placeholder="Search products..."
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
//                       Add Product
//                     </>
//                   )}
//                 </GlassButton>
//               </div>
//             </div>
//           </div>

//           {/* Add Form - Only for adding new products */}
//           {editingId === -1 && (
//             <div className="mb-6 p-4 bg-[rgba(255,255,255,0.05)] rounded-lg border border-[rgba(255,255,255,0.1)]">
//               <div className="flex items-center justify-between mb-3">
//                 <h3 className="text-white font-medium">Add New Product</h3>
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
//                     placeholder="Enter product name..."
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
//                         Add Product
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
//                         Product Name
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
//                       <td colSpan={5} className="text-center">
//                         <div className="flex flex-col items-center justify-center">
//                           <DashboardLoader label="Loading products... " />
//                         </div>
//                       </td>
//                     </tr>
//                   ) : data.length === 0 ? (
//                     <tr>
//                       <td colSpan={5} className="py-8 text-center">
//                         <div className="flex flex-col items-center justify-center gap-2">
//                           <span className="text-gray-400">No products found</span>
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
//                             <span className="text-sm text-white font-medium">
//                               {item.name}
//                             </span>
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
//   totalItems={totalProducts}
//   onPageChange={handlePageChange}
// />
//             )}
//           </div>

//           {/* Selected Items Info */}
//           {selectedItems.length > 0 && (
//             <div className="mt-4 p-3 bg-[rgba(255,255,255,0.05)] rounded-lg border border-[rgba(255,255,255,0.1)]">
//               <div className="flex items-center justify-between">
//                 <span className="text-sm text-gray-300">
//                   {selectedItems.length} product{selectedItems.length > 1 ? 's' : ''} selected
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






// // app/Products/page.tsx
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
//   Loader2
// } from "lucide-react"
// import { navigationTabs } from "@/lib/navigation"
// import axios from "axios"
// import { useAuth } from "@/contexts/AuthContext"
// import { useToast } from "@/hooks/useToast"

// const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL

// interface Product {
//   id: number
//   name: string
//   created_at: string
// }

// interface ProductsResponse {
//   rows: Product[]
//   total: number
// }

// interface ApiResponse {
//   success: boolean
//   message: string
//   domain_id?: number
// }

// export default function ProductsPage() {
//   const { user, getToken } = useAuth()
//   const { toast } = useToast()
//   const [data, setData] = useState<Product[]>([])
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
//   const [totalProducts, setTotalProducts] = useState(0)

//   // Fetch products from API
//   const fetchProducts = async () => {
//     try {
//       setLoading(true)
//       const token = getToken() || user?.token
      
//       if (!token) {
//         toast.error("Authentication token not found")
//         return
//       }

//       const response = await axios.post<ProductsResponse>(
//         `${BASE_URL}/secure/Products/list-products`,
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
//       setTotalProducts(response.data.total)
//     } catch (error: any) {
//       console.error("Error fetching products:", error)
//       if (error.response?.status === 401) {
//         toast.error("Session expired. Please login again.")
//         // Optionally redirect to login
//         // router.push('/auth/login')
//       } else {
//         toast.error("Failed to fetch products")
//       }
//     } finally {
//       setLoading(false)
//     }
//   }

//   // Initial fetch
//   useEffect(() => {
//     fetchProducts()
//   }, [pagination.page, pagination.order, pagination.orderBy, searchQuery])

//   const handleAdd = async () => {
//     if (!editValue.trim()) {
//       toast.error("Please enter a product name")
//       return
//     }

//     try {
//       setIsAdding(true)
//       const token = getToken() || user?.token
      
//       if (!token) {
//         toast.error("Authentication token not found")
//         return
//       }

//       const response = await axios.post<ApiResponse>(
//         `${BASE_URL}/secure/Products/add-products`,
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
//         fetchProducts()
//       } else {
//         toast.error(response.data.message)
//       }
//     } catch (error: any) {
//       console.error("Error adding product:", error)
//       if (error.response?.status === 401) {
//         toast.error("Session expired. Please login again.")
//       } else {
//         toast.error("Failed to add product")
//       }
//     } finally {
//       setIsAdding(false)
//     }
//   }

//   const handleSave = async (id: number) => {
//     if (!editValue.trim()) {
//       toast.error("Please enter a product name")
//       return
//     }

//     try {
//       const token = getToken() || user?.token
      
//       if (!token) {
//         toast.error("Authentication token not found")
//         return
//       }

//       const response = await axios.post<ApiResponse>(
//         `${BASE_URL}/secure/Products/update-products`,
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
//         fetchProducts()
//       } else {
//         toast.error(response.data.message)
//       }
//     } catch (error: any) {
//       console.error("Error updating product:", error)
//       if (error.response?.status === 401) {
//         toast.error("Session expired. Please login again.")
//       } else {
//         toast.error("Failed to update product")
//       }
//     }
//   }

//   const handleCancel = () => {
//     setEditingId(null)
//     setEditValue("")
//   }

//   const handleDelete = async (id: number) => {
//     if (!confirm("Are you sure you want to delete this product?")) {
//       return
//     }

//     try {
//       const token = getToken() || user?.token
      
//       if (!token) {
//         toast.error("Authentication token not found")
//         return
//       }

//       const response = await axios.post<ApiResponse>(
//         `${BASE_URL}/secure/Products/delete-products`,
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
//         toast.success("Product deleted successfully")
//         fetchProducts()
//         setSelectedItems(selectedItems.filter(selectedId => selectedId !== id))
//       } else {
//         toast.error(response.data.message)
//       }
//     } catch (error: any) {
//       console.error("Error deleting product:", error)
//       if (error.response?.status === 401) {
//         toast.error("Session expired. Please login again.")
//       } else {
//         toast.error("Failed to delete product")
//       }
//     }
//   }

//   const handleBulkDelete = async () => {
//     if (selectedItems.length === 0) {
//       toast.error("Please select at least one product")
//       return
//     }

//     if (!confirm(`Are you sure you want to delete ${selectedItems.length} product(s)?`)) {
//       return
//     }

//     try {
//       setIsDeleting(true)
//       const token = getToken() || user?.token
      
//       if (!token) {
//         toast.error("Authentication token not found")
//         return
//       }

//       const response = await axios.post<ApiResponse>(
//         `${BASE_URL}/secure/Products/delete-products`,
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
//         toast.success(`${selectedItems.length} product(s) deleted successfully`)
//         fetchProducts()
//         setSelectedItems([])
//       } else {
//         toast.error(response.data.message)
//       }
//     } catch (error: any) {
//       console.error("Error deleting products:", error)
//       if (error.response?.status === 401) {
//         toast.error("Session expired. Please login again.")
//       } else {
//         toast.error("Failed to delete products")
//       }
//     } finally {
//       setIsDeleting(false)
//     }
//   }

//   const handleEdit = (item: Product) => {
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
//       <Header title="Products Management" tabs={navigationTabs} />

//       <div className="px-4 sm:px-6 mt-6">
//         <GlassCard className="p-6">
//           {/* Header with Search and Add Button */}
//           <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
//             <h2 className="text-xl font-semibold text-white">Products</h2>
//             <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
//               <div className="relative flex-1 sm:flex-initial">
//                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
//                 <input
//                   type="text"
//                   placeholder="Search products..."
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
//                     setEditingId(-1)
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
//                   Add Product
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
//                 {editingId === -1 ? "Add New Product" : "Edit Product"}
//               </h3>
//               <div className="flex gap-3">
//                 <input
//                   type="text"
//                   value={editValue}
//                   onChange={(e) => setEditValue(e.target.value)}
//                   placeholder="Enter product name"
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
//                           Name
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
//                             <span className="text-sm text-white font-medium">
//                               {item.name}
//                             </span>
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
//                     Showing {data.length} of {totalProducts} products
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
//                       disabled={(pagination.page + 1) * pagination.rowsPerPage >= totalProducts}
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
//                 <span className="text-[var(--text-muted)]">No products found</span>
//               </div>
//             )}
//           </div>

//           {/* Selected Items Info */}
//           {selectedItems.length > 0 && (
//             <div className="mt-4 p-3 bg-[rgba(255,255,255,var(--ui-opacity-5))] rounded-lg border border-[rgba(255,255,255,var(--glass-border-opacity))]">
//               <span className="text-sm text-[var(--text-secondary)]">
//                 {selectedItems.length} product{selectedItems.length > 1 ? 's' : ''} selected
//               </span>
//             </div>
//           )}
//         </GlassCard>
//       </div>
//     </div>
//   )
// }








// "use client"

// import { useState } from "react"
// import { Header } from "@/components/layout"
// import { GlassCard, GlassButton } from "@/components/glass"
// import {
//   Edit,
//   Trash2,
//   Check,
//   X,
//   Search,
//   Plus
// } from "lucide-react"
// import { navigationTabs } from "@/lib/navigation"

// interface Product {
//   id: number
//   name: string
// }

// const initialData: Product[] = [
//   { id: 1, name: "iPhone 15 Pro" },
//   { id: 2, name: "Samsung Galaxy S24" },
//   { id: 3, name: "MacBook Pro M3" },
//   { id: 4, name: "Dell XPS 13" },
//   { id: 5, name: "iPad Air" }
// ]

// export default function ProductsPage() {
//   const [data, setData] = useState<Product[]>(initialData)
//   const [searchQuery, setSearchQuery] = useState("")
//   const [editingId, setEditingId] = useState<number | null>(null)
//   const [editValue, setEditValue] = useState("")
//   const [selectedItems, setSelectedItems] = useState<number[]>([])

//   const filteredData = data.filter(item =>
//     item.name.toLowerCase().includes(searchQuery.toLowerCase())
//   )

//   const handleEdit = (item: Product) => {
//     setEditingId(item.id)
//     setEditValue(item.name)
//   }

//   const handleSave = (id: number) => {
//     setData(data.map(item => 
//       item.id === id ? { ...item, name: editValue } : item
//     ))
//     setEditingId(null)
//     setEditValue("")
//   }

//   const handleCancel = () => {
//     setEditingId(null)
//     setEditValue("")
//   }

//   const handleDelete = (id: number) => {
//     if (confirm("Are you sure you want to delete this product?")) {
//       setData(data.filter(item => item.id !== id))
//       setSelectedItems(selectedItems.filter(selectedId => selectedId !== id))
//     }
//   }

//   const handleAdd = () => {
//     const newId = Math.max(...data.map(item => item.id)) + 1
//     const newProduct: Product = {
//       id: newId,
//       name: "New Product"
//     }
//     setData([...data, newProduct])
//     setEditingId(newId)
//     setEditValue("New Product")
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

//   return (
//     <div className="min-h-screen pb-8">
//       <Header title="Products Management" tabs={navigationTabs} />

//       <div className="px-4 sm:px-6 mt-6">
//         <GlassCard className="p-6">
//           {/* Header with Search and Add Button */}
//           <div className="flex items-center justify-between mb-6">
//             <h2 className="text-xl font-semibold text-white">Products</h2>
//             <div className="flex items-center gap-4">
//               <div className="relative">
//                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
//                 <input
//                   type="text"
//                   placeholder="Search products..."
//                   value={searchQuery}
//                   onChange={(e) => setSearchQuery(e.target.value)}
//                   className="pl-10 pr-4 py-2 bg-[rgba(255,255,255,var(--ui-opacity-10))] border border-gray-300 dark:border-[rgba(255,255,255,var(--glass-border-opacity))] rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent"
//                 />
//               </div>
//               <GlassButton
//                 variant="primary"
//                 onClick={handleAdd}
//                 className="flex items-center gap-2"
//               >
//                 <Plus className="w-4 h-4" />
//                 Add Product
//               </GlassButton>
//             </div>
//           </div>

//           {/* Table */}
//           <div className="overflow-x-auto">
//             <table className="w-full">
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
//                   <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-tertiary)] w-[80px]">
//                     S.NO
//                   </th>
//                   <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-tertiary)]">
//                     Name
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
//                       {editingId === item.id ? (
//                         <input
//                           type="text"
//                           value={editValue}
//                           onChange={(e) => setEditValue(e.target.value)}
//                           className="w-full px-3 py-2 bg-[rgba(255,255,255,var(--ui-opacity-10))] border border-[rgba(255,255,255,var(--glass-border-opacity))] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent"
//                           autoFocus
//                           onKeyDown={(e) => {
//                             if (e.key === 'Enter') handleSave(item.id)
//                             if (e.key === 'Escape') handleCancel()
//                           }}
//                         />
//                       ) : (
//                         <span className="text-sm text-white font-medium">
//                           {item.name}
//                         </span>
//                       )}
//                     </td>
//                     <td className="py-3 px-4">
//                       <div className="flex items-center justify-end gap-2">
//                         {editingId === item.id ? (
//                           <>
//                             <button
//                               onClick={() => handleSave(item.id)}
//                               className="p-2 rounded-lg hover:bg-green-500/20 transition-colors"
//                               title="Save"
//                             >
//                               <Check className="w-4 h-4 text-green-400" />
//                             </button>
//                             <button
//                               onClick={handleCancel}
//                               className="p-2 rounded-lg hover:bg-red-500/20 transition-colors"
//                               title="Cancel"
//                             >
//                               <X className="w-4 h-4 text-red-400" />
//                             </button>
//                           </>
//                         ) : (
//                           <>
//                             <button
//                               onClick={() => handleEdit(item)}
//                               className="p-2 rounded-lg hover:bg-[rgba(255,255,255,var(--ui-opacity-10))] transition-colors"
//                               title="Edit"
//                             >
//                               <Edit className="w-4 h-4 text-[var(--text-tertiary)]" />
//                             </button>
//                             <button
//                               onClick={() => handleDelete(item.id)}
//                               className="p-2 rounded-lg hover:bg-red-500/20 transition-colors"
//                               title="Delete"
//                             >
//                               <Trash2 className="w-4 h-4 text-red-400" />
//                             </button>
//                           </>
//                         )}
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
//                 {selectedItems.length} product{selectedItems.length > 1 ? 's' : ''} selected
//               </span>
//             </div>
//           )}

//           {filteredData.length === 0 && (
//             <div className="text-center py-8">
//               <span className="text-[var(--text-muted)]">No products found</span>
//             </div>
//           )}
//         </GlassCard>
//       </div>
//     </div>
//   )
// }