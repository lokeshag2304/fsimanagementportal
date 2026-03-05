// app/Users/page.tsx
"use client"

import { useState, useEffect, useRef } from "react"
import { Header } from "@/components/layout"
import { GlassCard, GlassButton, GlassInput, GlassModal } from "@/components/glass"
import { DeleteConfirmationModal } from "@/common/services/DeleteConfirmationModal"
import {
  Edit,
  Trash2,
  Search,
  Plus,
  Loader2,
  Mail,
  Phone,
  User,
  Users as UsersIcon,
  MapPin,
  Eye,
  EyeOff
} from "lucide-react"
import api from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/useToast"
import { useRouter } from "next/navigation"
import { getNavigationByRole } from "@/lib/getNavigationByRole"
import Pagination from "@/common/Pagination"
import DashboardLoader from "@/common/DashboardLoader"

const ASSETS_URL = process.env.NEXT_PUBLIC_ASSETS_URL || BASE_URL

interface UserType {
  id: number
  name: string
  email: string
  phone: string
  number: string
  profile: string
  address?: string
  created_at: string
}

interface UsersResponse {
  rows: UserType[]
  total: number
}

interface UserDetailsResponse {
  status: boolean
  message: string
  data: any
}

interface ApiResponse {
  status: boolean
  message: string
}

export default function UsersPage() {
  const { user: authUser, getToken } = useAuth()
  const token = getToken();
  const navigationTabs = getNavigationByRole(authUser?.role)
  const { toast } = useToast()
  const router = useRouter()
  const [data, setData] = useState<UserType[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedItems, setSelectedItems] = useState<number[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<number | null>(null)
  const [editingUser, setEditingUser] = useState<UserType | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [profilePreview, setProfilePreview] = useState<string | null>(null)

  // Password visibility state
  const [showPassword, setShowPassword] = useState(false)

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isMountedRef = useRef(true)

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    password: "",
    profile: null as File | null,
    type: 2 // 2 for user
  })

  const [pagination, setPagination] = useState({
    page: 0,
    rowsPerPage: 10,
    order: "desc" as "asc" | "desc",
    orderBy: "id"
  })
  const [totalUsers, setTotalUsers] = useState(0)

  // Fetch users list
  const fetchUsers = async () => {
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

      const response = await api.post('/secure/Usermanagement/get-clients-user-list', {
        type: 2,
        page: pagination.page,
        rowsPerPage: pagination.rowsPerPage,
        order: pagination.order,
        orderBy: pagination.orderBy,
        search: searchQuery
      }, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      })

      if (isMountedRef.current) {
        setData(response.data.rows)
        setTotalUsers(response.data.total)
      }
    } catch (error: any) {
      console.error("Error fetching users:", error)

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
          description: error.response?.data?.message || "Failed to fetch users",
          variant: "destructive"
        })
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
    fetchUsers().catch(err => console.error("Load failed", err));

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
      fetchUsers().catch(err => console.error("Load failed", err));
    }, 300)

    return () => {
      clearTimeout(timeoutId)
    }
  }, [pagination.page, pagination.order, pagination.orderBy, searchQuery])

  // Handle search input with debouncing
  const handleSearchInput = (value: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(() => {
      setSearchQuery(value)
      setPagination(prev => ({ ...prev, page: 0 }))
    }, 500) // 500ms debounce
  }

  // Handle successful operations
  const handleSuccess = (message: string) => {
    toast({
      title: "Success",
      description: message || "Operation completed successfully",
      variant: "default"
    })
    setIsModalOpen(false)
    setFormData({
      name: "",
      email: "",
      phone: "",
      address: "",
      password: "",
      profile: null,
      type: 2
    })
    setEditingUser(null)
    setProfilePreview(null)
    setShowPassword(false)
    // Refresh data after successful operation
    fetchUsers().catch(err => console.error("Load failed", err));
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

  // Fetch user details for editing
  const fetchUserDetails = async (id: number) => {
    try {
      if (!token) return

      const response = await api.post('/secure/Usermanagement/get-clients-user-details', { id }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.data.status && response.data.data) {
        const user = response.data.data

        console.log("API से आया password:", user.password)

        // Note: For security, we don't show the actual password from API
        // Instead we'll use a placeholder or empty string
        setFormData({
          name: user.name || "",
          email: user.email || "",
          phone: user.phone || user.number || "",
          address: user.address || "",
          password: user.password || "", // Empty for edit - user needs to enter new password if they want to change
          profile: null,
          type: 2
        })

        // Set profile preview if exists
        if (user.profile) {
          setProfilePreview(`${ASSETS_URL}/${user.profile}`)
        } else {
          setProfilePreview(null)
        }

        setEditingUser(user)
        setIsModalOpen(true)
      }
    } catch (error) {
      console.error("Error fetching user details:", error)
      toast({
        title: "Error",
        description: "Failed to fetch user details",
        variant: "destructive"
      })
    }
  }

  const handleAdd = () => {
    setEditingUser(null)
    setProfilePreview(null)
    setShowPassword(false)
    setFormData({
      name: "",
      email: "",
      phone: "",
      address: "",
      password: "",
      profile: null,
      type: 2
    })
    setIsModalOpen(true)
  }

  const handleEdit = (user: UserType) => {
    fetchUserDetails(user.id)
  }

  const handleDelete = (id: number) => {
    setItemToDelete(id)
    setShowDeleteModal(true)
  }

  // Handle bulk delete
  const handleBulkDelete = () => {
    if (selectedItems.length === 0) return
    setItemToDelete(null)
    setShowDeleteModal(true)
  }

  // Confirm delete action
  const confirmDelete = async () => {
    try {
      setIsDeleting(true)
      if (!token) {
        toast({
          title: "Error",
          description: "Authentication token not found",
          variant: "destructive"
        })
        return
      }

      const idsToDelete = itemToDelete ? [itemToDelete] : selectedItems

      const response = await api.post(
        `/secure/Usermanagement/get-clients-user-delete`,
        {
          ids: idsToDelete,
          s_id: authUser?.id || 6,
          type: 2
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      )

      if (response.data.success || response.data.status) {
        handleSuccess(response.data.message || "User(s) deleted successfully")
        if (!itemToDelete) {
          setSelectedItems([])
        }
      } else {
        toast({
          title: "Error",
          description: response.data.message || "Failed to delete user(s)",
          variant: "destructive"
        })
      }
    } catch (error: any) {
      console.error("Error deleting user:", error)

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
          description: error.response?.data?.message || "Failed to delete user(s)",
          variant: "destructive"
        })
      }
    } finally {
      setIsDeleting(false)
      setShowDeleteModal(false)
      setItemToDelete(null)
    }
  }

  const handleSubmit = async () => {
    // Validation
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Please enter user name",
        variant: "destructive"
      })
      return
    }

    if (!formData.email.trim()) {
      toast({
        title: "Error",
        description: "Please enter email address",
        variant: "destructive"
      })
      return
    }

    const phoneNumber = formData.phone.trim()
    if (!phoneNumber) {
      toast({
        title: "Error",
        description: "Please enter phone number",
        variant: "destructive"
      })
      return
    }

    // Phone number validation - 10 digits
    const phoneRegex = /^\d{10}$/
    if (!phoneRegex.test(phoneNumber.replace(/\D/g, ''))) {
      toast({
        title: "Error",
        description: "Please enter a valid 10-digit phone number",
        variant: "destructive"
      })
      return
    }

    if (!editingUser && !formData.password.trim()) {
      toast({
        title: "Error",
        description: "Please enter password",
        variant: "destructive"
      })
      return
    }

    // Password validation - at least 6 characters
    if (formData.password.trim() && formData.password.trim().length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive"
      })
      return
    }

    try {
      setIsSubmitting(true)
      if (!token) {
        toast({
          title: "Error",
          description: "Authentication token not found",
          variant: "destructive"
        })
        return
      }

      const formDataToSend = new FormData()
      formDataToSend.append('name', formData.name.trim())
      formDataToSend.append('email', formData.email.trim())
      formDataToSend.append('phone', phoneNumber)
      formDataToSend.append('address', formData.address.trim())

      // Only add password if it's not empty (for edit) or for new user
      if (formData.password.trim()) {
        formDataToSend.append('password', formData.password.trim())
      }

      formDataToSend.append('s_id', authUser?.id?.toString() || '6')
      formDataToSend.append('type', '2') // User type

      // Add profile if exists
      if (formData.profile) {
        formDataToSend.append('profile', formData.profile)
      }

      let endpoint = ''

      if (editingUser) {
        endpoint = `/secure/Usermanagement/update-clients-user`;
        formDataToSend.append('id', editingUser.id.toString());
        formDataToSend.append('type', '2');
      } else {
        endpoint = `/secure/Usermanagement/add-clients-user`;
      }

      const response = await api.post(
        endpoint,
        formDataToSend,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      )

      if (response.data.status) {
        handleSuccess(response.data.message || (editingUser ? "User updated successfully" : "User added successfully"))
      } else {
        toast({
          title: "Error",
          description: response.data.message || "Failed to save user",
          variant: "destructive"
        })
      }
    } catch (error: any) {
      console.error("Error saving user:", error)

      if (error.response?.status === 401) {
        toast({
          title: "Session Expired",
          description: "Please login again.",
          variant: "destructive"
        })
        router.push('/auth/login')
      } else if (error.response?.data?.message) {
        toast({
          title: "Error",
          description: error.response.data.message,
          variant: "destructive"
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to save user",
          variant: "destructive"
        })
      }
    } finally {
      setIsSubmitting(false)
    }
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setFormData({ ...formData, profile: file })
      // Create preview URL
      const previewUrl = URL.createObjectURL(file)
      setProfilePreview(previewUrl)
    }
  }

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  const isAllSelected = data.length > 0 && selectedItems.length === data.length
  const totalPages = Math.ceil(totalUsers / pagination.rowsPerPage)
  const startItem = pagination.page * pagination.rowsPerPage + 1
  const endItem = Math.min((pagination.page + 1) * pagination.rowsPerPage, totalUsers)

  return (
    <div className="min-h-screen pb-8">
      <Header title="Users Management" tabs={navigationTabs} />

      <div className="px-4 sm:px-6 mt-6">
        <GlassCard className="p-6">
          {/* Header with Search and Add Button */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <UsersIcon className="w-6 h-6 text-[#BC8969]" />
                <h2 className="text-xl font-semibold text-white">Users</h2>
              </div>
              <p className="text-sm text-gray-400 mt-1">
                Manage user accounts
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  defaultValue={searchQuery}
                  onChange={(e) => handleSearchInput(e.target.value)}
                  className="w-full sm:w-64 pl-10 pr-4 py-2 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
              </div>

              <div className="flex gap-2">
                {selectedItems.length > 0 && (
                  <GlassButton
                    variant="default"
                    onClick={handleBulkDelete}
                    className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-500 border border-red-500/50"
                    disabled={isSubmitting || isDeleting}
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete ({selectedItems.length})
                  </GlassButton>
                )}

                <GlassButton
                  variant="primary"
                  onClick={handleAdd}
                  className="flex items-center gap-2"
                  disabled={isSubmitting || isDeleting}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  Add User
                </GlassButton>
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
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 min-w-[60px]">
                      Profile
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 min-w-[150px]">
                      Name
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 min-w-[200px]">
                      Email
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 min-w-[120px]">
                      Phone
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 min-w-[150px]">
                      Address
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
                      <td colSpan={9} className="py-8 text-center">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <DashboardLoader label="Loading users..." />
                        </div>
                      </td>
                    </tr>
                  ) : data.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <UsersIcon className="w-12 h-12 text-gray-400" />
                          <span className="text-gray-400">No users found</span>
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
                        className="border-b border-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.02)] transition-colors"
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
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)]">
                            {item.profile ? (
                              <img
                                src={`${ASSETS_URL}/${item.profile}`}
                                alt={item.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  // If image fails to load, show placeholder
                                  const target = e.currentTarget
                                  target.style.display = 'none'
                                  target.parentElement!.innerHTML = `
                                    <div class="w-full h-full flex items-center justify-center bg-blue-500/20">
                                      <User class="w-5 h-5 text-white/60" />
                                    </div>
                                  `
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-blue-500/20">
                                <User className="w-5 h-5 text-white/60" />
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Name field */}
                        <td className="py-3 px-4">
                          <span className="text-sm text-white font-medium">{item.name}</span>
                        </td>

                        {/* Email field */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="text-sm text-gray-300 truncate">{item.email}</span>
                          </div>
                        </td>

                        {/* Phone field */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="text-sm text-gray-300">
                              {item.phone || item.number || "No phone"}
                            </span>
                          </div>
                        </td>

                        {/* Address field */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="text-sm text-gray-300 max-w-[200px] truncate">
                              {item.address || "No address"}
                            </span>
                          </div>
                        </td>

                        {/* Created At field */}
                        <td className="py-3 px-4 text-sm text-gray-300">
                          {item.created_at}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEdit(item)}
                              disabled={isSubmitting || isDeleting}
                              className="p-1.5 rounded hover:bg-[rgba(255,255,255,0.1)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4 text-gray-400 hover:text-blue-400" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              disabled={isSubmitting || isDeleting}
                              className="p-1.5 rounded hover:bg-red-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-400" />
                            </button>
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
                totalItems={totalUsers}
                onPageChange={handlePageChange}
              />
            )}
          </div>

          {/* Selected Items Info */}
          {selectedItems.length > 0 && (
            <div className="mt-4 p-3 bg-[rgba(255,255,255,0.05)] rounded-lg border border-[rgba(255,255,255,0.1)]">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">
                  {selectedItems.length} user{selectedItems.length > 1 ? 's' : ''} selected
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

      {/* Add/Edit Modal */}
      <GlassModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingUser(null)
          setShowPassword(false)
        }}
        title={editingUser ? "Edit User" : "Add New User"}
        size="lg"
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 pl-2">
          <div>
            <label className="block text-gray-300 text-sm mb-2">
              Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              placeholder="Enter user name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.1)] rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm mb-2">
              Email <span className="text-red-400">*</span>
            </label>
            <input
              type="email"
              placeholder="Enter email address"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.1)] rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm mb-2">
              Phone Number <span className="text-red-400">*</span>
            </label>
            <input
              type="tel"
              placeholder="Enter 10-digit phone number"
              value={formData.phone}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 10)
                setFormData({
                  ...formData,
                  phone: value
                })
              }}
              className="w-full px-3 py-2 bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.1)] rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-400 mt-1">10 digits only</p>
          </div>

          <div>
            <label className="block text-gray-300 text-sm mb-2">Address</label>
            <input
              type="text"
              placeholder="Enter address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.1)] rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm mb-2">
              Password {!editingUser && <span className="text-red-400">*</span>}
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder={editingUser ? "Enter new password to change, or leave empty" : "Enter password (min 6 characters)"}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 pr-10 bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.1)] rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {editingUser ? (
              <p className="text-xs text-gray-400 mt-1">
                Enter new password to change, or leave empty to keep current password
              </p>
            ) : (
              <p className="text-xs text-gray-400 mt-1">
                Minimum 6 characters
              </p>
            )}
          </div>

          <div>
            <label className="block text-gray-300 text-sm mb-2">Profile Picture</label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)]">
                {profilePreview ? (
                  <img
                    src={profilePreview}
                    alt="Profile Preview"
                    className="w-full h-full object-cover"
                  />
                ) : editingUser?.profile ? (
                  <img
                    src={`${ASSETS_URL}/${editingUser.profile}`}
                    alt="Current Profile"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // If image fails to load, show placeholder
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-8 h-8 text-white/40" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <label className="block">
                  <div className="cursor-pointer px-4 py-2 bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.1)] rounded-lg text-white text-sm text-center hover:bg-[rgba(255,255,255,0.2)] transition-colors">
                    {profilePreview || editingUser?.profile ? "Change File" : "Choose File"}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
                {formData.profile && (
                  <p className="text-xs text-gray-400 mt-1">
                    {formData.profile.name}
                  </p>
                )}
                {(profilePreview || editingUser?.profile) && (
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, profile: null })
                      setProfilePreview(null)
                    }}
                    className="mt-2 text-xs text-red-400 hover:text-red-300"
                  >
                    Remove photo
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              className="flex-1 px-4 py-2 bg-[rgba(255,255,255,0.1)] text-white rounded-lg hover:bg-[rgba(255,255,255,0.2)] transition-colors disabled:opacity-50"
              onClick={() => {
                setIsModalOpen(false)
                setProfilePreview(null)
                setEditingUser(null)
                setShowPassword(false)
              }}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {editingUser ? "Saving..." : "Adding..."}
                </>
              ) : editingUser ? (
                "Save Changes"
              ) : (
                "Add User"
              )}
            </button>
          </div>
        </div>
      </GlassModal>

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
        title={itemToDelete ? "Delete User" : "Delete Multiple Users"}
        message={itemToDelete
          ? "Are you sure you want to delete this user? This action cannot be undone."
          : "Are you sure you want to delete the selected users? This action cannot be undone."
        }
      />
    </div>
  )
}