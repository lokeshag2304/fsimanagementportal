// app/Users/page.tsx
"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/layout"
import { GlassCard, GlassButton, GlassInput, GlassModal } from "@/components/glass"
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
  MapPin
} from "lucide-react"
import { navigationTabs } from "@/lib/navigation"
import axios from "axios"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/useToast"
import { useRouter } from "next/navigation"

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://rainbowsolutionandtechnology.com/FSISubscriptionPortal/public/api"
const ASSETS_URL = process.env.NEXT_PUBLIC_ASSETS_URL;
interface UserType {
  id: number
  name: string
  email: string
  phone: string
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
  const { user: authUser } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [data, setData] = useState<UserType[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedItems, setSelectedItems] = useState<number[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserType | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [profilePreview, setProfilePreview] = useState<string | null>(null)
  
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

  // Function to get token from localStorage
  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('authToken')
    }
    return null
  }

  // Fetch users list
  const fetchUsers = async () => {
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

      const response = await axios.post<UsersResponse>(
        `${BASE_URL}/secure/Usermanagement/get-clients-user-list`,
        {
          type: 2, // 2 for users
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

      setData(response.data.rows)
      setTotalUsers(response.data.total)
    } catch (error: any) {
      console.error("Error fetching users:", error)
      if (error.response?.status === 401) {
        toast({
          title: "Session Expired",
          description: "Please login again",
          variant: "destructive"
        })
        router.push('/auth/login')
      } else {
        toast({
          title: "Error",
          description: error.response?.data?.message || "Something went wrong",
          variant: "destructive"
        })
      }
    } finally {
      setLoading(false)
    }
  }

  // Fetch user details for editing
  const fetchUserDetails = async (id: number) => {
    try {
      const token = getAuthToken()
      if (!token) return

      const response = await axios.post<UserDetailsResponse>(
        `${BASE_URL}/secure/Usermanagement/get-clients-user-details`,
        { id },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      )

      console.log("User details response:", response.data)

      if (response.data.status && response.data.data) {
        const user = response.data.data
        console.log("User data:", user)
        
        setFormData({
          name: user.name || "",
          email: user.email || "",
          phone: user.phone || "",
          address: user.address || "",
          password: user.password || "", 
          profile: null,
          type: 2
        })
        
        // Set profile preview if exists
        if (user.profile) {
          setProfilePreview(`${ASSETS_URL}/${user.profile}`)
        } else {
          setProfilePreview(null)
        }
      }
    } catch (error) {
      console.error("Error fetching user details:", error)
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchUsers()
  }, [pagination.page, pagination.order, pagination.orderBy, searchQuery])

  const handleAdd = () => {
    setEditingUser(null)
    setProfilePreview(null)
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

  const handleEdit = async (user: UserType) => {
    console.log("Editing user:", user)
    setEditingUser(user)
    setIsModalOpen(true)
    await fetchUserDetails(user.id)
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this user?")) {
      return
    }

    try {
      const token = getAuthToken()
      if (!token) return

      // Note: Delete API needs to be confirmed from backend
      // This is placeholder code
      toast({
        title: "Success",
        description: "User deleted successfully",
        variant: "destructive"
      })
      
      // Refresh list after delete
      fetchUsers()
      setSelectedItems(selectedItems.filter(selectedId => selectedId !== id))
    } catch (error: any) {
      console.error("Error deleting user:", error)
    }
  }

  const handleSubmit = async () => {
    console.log("Submitting form data:", formData)
    console.log("Editing user:", editingUser)
    
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
    
    if (!formData.phone.trim()) {
      toast({
        title: "Error",
        description: "Please enter phone number",
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

    try {
      setIsSubmitting(true)
      const token = getAuthToken()
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
      formDataToSend.append('phone', formData.phone.trim())
      formDataToSend.append('address', formData.address.trim())
      
      // Only add password if it's not empty (for edit) or for new user
      if (formData.password.trim()) {
        formDataToSend.append('password', formData.password.trim())
      }
      
      formDataToSend.append('s_id', authUser?.id?.toString() || '6')
      formDataToSend.append('type', '2') // User type
      
      // Add profile if exists
      if (formData.profile) {
        console.log("Adding profile file:", formData.profile)
        formDataToSend.append('profile', formData.profile)
      }

      let endpoint = ''
      
      if (editingUser) {
        // Update user
        endpoint = `${BASE_URL}/secure/Usermanagement/update-clients-user`
        formDataToSend.append('id', editingUser.id.toString())
        formDataToSend.append('type', '2') // Add type field for update
      } else {
        // Add new user
        endpoint = `${BASE_URL}/secure/Usermanagement/add-clients-user`
      }

      console.log("Sending to endpoint:", endpoint)
      
      // Debug: Log FormData contents
      console.log("FormData contents:")
      for (let [key, value] of formDataToSend.entries()) {
        console.log(key, value)
      }

      const response = await axios.post<ApiResponse>(
        endpoint,
        formDataToSend,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      )

      console.log("API Response:", response.data)

      if (response.data.status) {
        toast({
          title: "Success",
          description: response.data.message || "User saved successfully",
          variant: "default"
        })
        setIsModalOpen(false)
        fetchUsers() // Refresh list
        
        // Reset form
        setFormData({
          name: "",
          email: "",
          phone: "",
          address: "",
          password: "",
          profile: null,
          type: 2
        })
        setProfilePreview(null)
      } else {
        toast({
          title: "Error",
          description: response.data.message || "Failed to save user",
          variant: "destructive"
        })
      }
    } catch (error: any) {
      console.error("Error response:", error.response)
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
      setSelectedItems([...selectedItems, id])
    } else {
      setSelectedItems(selectedItems.filter(selectedId => selectedId !== id))
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      console.log("File selected:", file)
      setFormData({ ...formData, profile: file })
      // Create preview URL
      const previewUrl = URL.createObjectURL(file)
      setProfilePreview(previewUrl)
    }
  }

  const isAllSelected = data.length > 0 && selectedItems.length === data.length

  return (
    <div className="min-h-screen pb-8">
      <Header title="Users Management" tabs={navigationTabs} />

      <div className="px-4 sm:px-6 mt-6">
        <GlassCard className="p-6">
          {/* Header with Search and Add Button */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <UsersIcon className="w-6 h-6 text-[var(--theme-primary)]" />
              <h2 className="text-xl font-semibold text-white">Users</h2>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setPagination(prev => ({ ...prev, page: 0 }))
                  }}
                  className="pl-10 pr-4 py-2 w-full bg-[rgba(255,255,255,var(--ui-opacity-10))] border border-[rgba(255,255,255,var(--glass-border-opacity))] rounded-lg text-white placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent"
                />
              </div>
              
              <div className="flex gap-2">
                <GlassButton
                  variant="primary"
                  onClick={handleAdd}
                  className="flex items-center gap-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  Add User
                </GlassButton>
                
                {selectedItems.length > 0 && (
                  <GlassButton
                    variant="danger"
                    onClick={() => toast({
                      title: "Error",
                      description: "Please select at least one user",
                      variant: "destructive"
                    })}
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete ({selectedItems.length})
                  </GlassButton>
                )}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--theme-primary)]" />
              </div>
            ) : (
              <>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[rgba(255,255,255,var(--glass-border-opacity))]">
                      <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-tertiary)]">
                        <input
                          type="checkbox"
                          checked={isAllSelected}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="w-4 h-4 rounded border-[rgba(255,255,255,var(--glass-border-opacity))] bg-[rgba(255,255,255,var(--ui-opacity-10))] text-[var(--theme-primary)] focus:ring-[var(--theme-primary)]"
                        />
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-tertiary)] w-[80px]">
                        S.NO
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-tertiary)]">
                        Profile
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-tertiary)]">
                        Name
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-tertiary)]">
                        Email
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-tertiary)]">
                        Phone
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-tertiary)]">
                        Created At
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-[var(--text-tertiary)] w-[120px]">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((item, index) => (
                      <tr
                        key={item.id}
                        className="border-b border-[rgba(255,255,255,var(--glass-border-opacity))] hover:bg-[rgba(255,255,255,var(--ui-opacity-5))] transition-colors"
                      >
                        <td className="py-3 px-4">
                          <input
                            type="checkbox"
                            checked={selectedItems.includes(item.id)}
                            onChange={(e) => handleSelectItem(item.id, e.target.checked)}
                            className="w-4 h-4 rounded border-[rgba(255,255,255,var(--glass-border-opacity))] bg-[rgba(255,255,255,var(--ui-opacity-10))] text-[var(--theme-primary)] focus:ring-[var(--theme-primary)]"
                          />
                        </td>
                        <td className="py-3 px-4 text-sm text-[var(--text-secondary)]">
                          {index + 1 + (pagination.page * pagination.rowsPerPage)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-[rgba(255,255,255,var(--ui-opacity-5))] border border-[rgba(255,255,255,var(--glass-border-opacity))]">
                            {item.profile ? (
                              <img
                                src={`${ASSETS_URL}/${item.profile}`}
                                alt={item.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  // If image fails to load, show placeholder
                                  e.currentTarget.style.display = 'none'
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-[var(--theme-primary)]/20">
                                <User className="w-5 h-5 text-white/60" />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-white font-medium">{item.name}</span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-[var(--text-muted)]" />
                            <span className="text-sm text-[var(--text-secondary)]">{item.email}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-[var(--text-muted)]" />
                            <span className="text-sm text-[var(--text-secondary)]">{item.number}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-[var(--text-secondary)]">
                          {item.created_at}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEdit(item)}
                              className="p-2 rounded-lg hover:bg-[rgba(255,255,255,var(--ui-opacity-10))] transition-colors"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4 text-[var(--text-tertiary)]" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-2 rounded-lg hover:bg-red-500/20 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4 text-red-400" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-[rgba(255,255,255,var(--glass-border-opacity))]">
                  <div className="text-sm text-[var(--text-muted)]">
                    Showing {data.length} of {totalUsers} users
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                      disabled={pagination.page === 0}
                      className="px-3 py-1 rounded-lg bg-[rgba(255,255,255,var(--ui-opacity-5))] text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[rgba(255,255,255,var(--ui-opacity-10))] transition-colors"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-white">
                      Page {pagination.page + 1}
                    </span>
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                      disabled={(pagination.page + 1) * pagination.rowsPerPage >= totalUsers}
                      className="px-3 py-1 rounded-lg bg-[rgba(255,255,255,var(--ui-opacity-5))] text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[rgba(255,255,255,var(--ui-opacity-10))] transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            )}

            {!loading && data.length === 0 && (
              <div className="text-center py-12">
                <UsersIcon className="w-12 h-12 mx-auto text-[var(--text-muted)] mb-3" />
                <span className="text-[var(--text-muted)]">No users found</span>
              </div>
            )}
          </div>

          {/* Selected Items Info */}
          {selectedItems.length > 0 && (
            <div className="mt-4 p-3 bg-[rgba(255,255,255,var(--ui-opacity-5))] rounded-lg border border-[rgba(255,255,255,var(--glass-border-opacity))]">
              <span className="text-sm text-[var(--text-secondary)]">
                {selectedItems.length} user{selectedItems.length > 1 ? 's' : ''} selected
              </span>
            </div>
          )}
        </GlassCard>
      </div>

      {/* Add/Edit Modal */}
      <GlassModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setProfilePreview(null)
        }}
        title={editingUser ? "Edit User" : "Add New User"}
        size="lg"
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          <div>
            <label className="block text-[var(--text-tertiary)] text-sm mb-2">
              Name <span className="text-red-400">*</span>
            </label>
            <GlassInput
              placeholder="Enter user name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          
          <div>
            <label className="block text-[var(--text-tertiary)] text-sm mb-2">
              Email <span className="text-red-400">*</span>
            </label>
            <GlassInput
              type="email"
              placeholder="Enter email address"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          
          <div>
            <label className="block text-[var(--text-tertiary)] text-sm mb-2">
              Phone Number <span className="text-red-400">*</span>
            </label>
            <GlassInput
              placeholder="Enter phone number"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
          
          <div>
            <label className="block text-[var(--text-tertiary)] text-sm mb-2">Address</label>
            <GlassInput
              placeholder="Enter address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>
          
          <div>
            <label className="block text-[var(--text-tertiary)] text-sm mb-2">
              Password {!editingUser && <span className="text-red-400">*</span>}
            </label>
            <GlassInput
              type="password"
              placeholder={editingUser ? "Leave empty to keep current password" : "Enter password"}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>
          
          <div>
            <label className="block text-[var(--text-tertiary)] text-sm mb-2">Profile Picture</label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-[rgba(255,255,255,var(--ui-opacity-5))] border border-[rgba(255,255,255,var(--glass-border-opacity))]">
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
                  <div className="cursor-pointer px-4 py-2 bg-[rgba(255,255,255,var(--ui-opacity-10))] border border-[rgba(255,255,255,var(--glass-border-opacity))] rounded-lg text-white text-sm text-center hover:bg-[rgba(255,255,255,var(--ui-opacity-20))] transition-colors">
                    {profilePreview ? "Change File" : "Choose File"}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
                {formData.profile && (
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    {formData.profile.name}
                  </p>
                )}
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
              </div>
            </div>
          </div>
          
          <div className="flex gap-3 pt-4">
            <GlassButton
              variant="ghost"
              className="flex-1"
              onClick={() => {
                setIsModalOpen(false)
                setProfilePreview(null)
              }}
              disabled={isSubmitting}
            >
              Cancel
            </GlassButton>
            <GlassButton
              variant="primary"
              className="flex-1"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin mx-auto" />
              ) : editingUser ? (
                "Save Changes"
              ) : (
                "Add User"
              )}
            </GlassButton>
          </div>
        </div>
      </GlassModal>
    </div>
  )
}