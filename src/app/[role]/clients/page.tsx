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
  MapPin,
  Eye,
  EyeOff
} from "lucide-react"
import axios from "@/lib/axios"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/useToast"
import { useRouter } from "next/navigation"
import Select from 'react-select'
import { GlassSelect } from "@/components/glass/GlassSelect"
import { getNavigationByRole } from "@/lib/getNavigationByRole"
import Pagination from "@/common/Pagination"
import DashboardLoader from "@/common/DashboardLoader"
import { glassSelectStyles } from "@/common/DynamicDropdown"

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;
const ASSETS_URL = process.env.NEXT_PUBLIC_ASSETS_URL;

interface Domain {
  id: number
  name: string
}

interface DomainOption {
  value: number
  label: string
}

interface Client {
  password: string
  id: number
  name: string
  email: string
  phone: string
  number: string
  address: string
  profile: string
  login_type: number
  type: number
  domain_ids: string[]
  domains?: Domain[]
  created_at: string
  country?: string | null
}

interface ClientsResponse {
  rows: Client[]
  total: number
}

interface DomainResponse {
  status: boolean
  message: string
  data: Domain[]
}

interface ClientDetailsResponse {
  status: boolean
  message: string
  data: Client
}

interface ApiResponse {
  status: boolean
  message: string
}

export default function ClientsPage() {
  const { user, getToken } = useAuth()
  const token = getToken();
  const navigationTabs = getNavigationByRole(user?.role)
  const { toast } = useToast()
  const router = useRouter()
  const [data, setData] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedItems, setSelectedItems] = useState<number[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<number | null>(null)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [domains, setDomains] = useState<Domain[]>([])
  const [domainOptions, setDomainOptions] = useState<DomainOption[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isMountedRef = useRef(true)

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    number: "",
    address: "",
    password: "",
    domain_ids: [] as number[],
    profile: null as File | null,
    type: 1 // 1 for client
  })

  const [pagination, setPagination] = useState({
    page: 0,
    rowsPerPage: 10,
    order: "desc" as "asc" | "desc",
    orderBy: "id"
  })
  const [totalClients, setTotalClients] = useState(0)

  // Fetch domains for dropdown
  const fetchDomains = async () => {
    try {
      if (!token) return

      const response = await axios.post<DomainResponse>(
        `${BASE_URL}/secure/Dropdowns/get-domains`,
        {},
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      )

      if (response.data.status) {
        setDomains(response.data.data)
        // Convert to react-select options
        const options = response.data.data.map(domain => ({
          value: domain.id,
          label: domain.name
        }))
        setDomainOptions(options)
      }
    } catch (error) {
      console.error("Error fetching domains:", error)
    }
  }

  // Fetch clients list
  const fetchClients = async () => {
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

      const response = await axios.post<ClientsResponse>(
        `${BASE_URL}/secure/Usermanagement/get-clients-user-list`,
        {
          type: 1, // 1 for clients
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
        // Map the response to ensure we have both phone and number fields
        const formattedData = response.data.rows.map(client => ({
          ...client,
          phone: client.phone || client.number || "", // Use phone if exists, otherwise number
          number: client.number || client.phone || "" // Use number if exists, otherwise phone
        }))
        setData(formattedData)
        setTotalClients(response.data.total)
      }
    } catch (error: any) {
      console.error("Error fetching clients:", error)

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
          description: error.response?.data?.message || "Failed to fetch clients",
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
    fetchClients()
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
      fetchClients()
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
      number: "",
      address: "",
      password: "",
      domain_ids: [],
      profile: null,
      type: 1
    })
    setEditingClient(null)
    setShowPassword(false)

    // Refresh data after successful operation
    fetchClients()
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

  // Fetch client details for editing
  const fetchClientDetails = async (id: number) => {
    try {
      if (!token) return

      const response = await axios.post<ClientDetailsResponse>(
        `${BASE_URL}/secure/Usermanagement/get-clients-user-details`,
        { id },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      )

      if (response.data.status && response.data.data) {
        const client = response.data.data

        setFormData({
          name: client.name,
          email: client.email,
          phone: client.phone || client.number || "",
          number: client.number || client.phone || "",
          address: client.address || "",
          password: client.password || "",
          domain_ids: client.domain_ids?.map(id => parseInt(id)) || [],
          profile: null,
          type: 1
        })

        setEditingClient(client)
        setIsModalOpen(true)
      }
    } catch (error) {
      console.error("Error fetching client details:", error)
      toast({
        title: "Error",
        description: "Failed to fetch client details",
        variant: "destructive"
      })
    }
  }

  const handleAdd = () => {
    setEditingClient(null)
    setFormData({
      name: "",
      email: "",
      phone: "",
      number: "",
      address: "",
      password: "",
      domain_ids: [],
      profile: null,
      type: 1
    })
    setShowPassword(false)
    setIsModalOpen(true)
  }

  const handleEdit = (client: Client) => {
    fetchClientDetails(client.id)
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

      const response = await axios.post<ApiResponse>(
        `${BASE_URL}/secure/Usermanagement/get-clients-user-delete`,
        {
          ids: idsToDelete,
          s_id: user?.id || 6,
          type: 1 // Add type field for delete
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      )

      if (response.data.success) {
        handleSuccess(response.data.message || "Client(s) deleted successfully")
        if (!itemToDelete) {
          setSelectedItems([])
        }
      } else {
        toast({
          title: "Error",
          description: response.data.message || "Failed to delete client(s)",
          variant: "destructive"
        })
      }
    } catch (error: any) {
      console.error("Error deleting client:", error)

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
          description: error.response?.data?.message || "Failed to delete client(s)",
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
        description: "Please enter client name",
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

    const phoneNumber = formData.phone.trim() || formData.number.trim()
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

    if (!editingClient && !formData.password.trim()) {
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

      // Only add password if it's not empty (for edit) or for new client
      if (formData.password.trim()) {
        formDataToSend.append('password', formData.password.trim())
      }

      formDataToSend.append('s_id', user?.id?.toString() || '6')
      formDataToSend.append('type', '1') // Client type

      // Add domain_ids - make sure to include even if empty
      if (formData.domain_ids.length > 0) {
        formData.domain_ids.forEach(id => {
          formDataToSend.append('domain_ids[]', id.toString())
        })
      } else {
        // If no domains selected, still send empty array
        formDataToSend.append('domain_ids[]', '')
      }

      // Add profile if exists
      if (formData.profile) {
        formDataToSend.append('profile', formData.profile)
      }

      let endpoint = ''

      if (editingClient) {
        // Update client
        endpoint = `${BASE_URL}/secure/Usermanagement/update-clients-user`
        formDataToSend.append('id', editingClient.id.toString())
        formDataToSend.append('type', '1') // Add type field for update
      } else {
        // Add new client
        endpoint = `${BASE_URL}/secure/Usermanagement/add-clients-user`
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

      if (response.data.status) {
        handleSuccess(response.data.message || (editingClient ? "Client updated successfully" : "Client added successfully"))
      } else {
        toast({
          title: "Error",
          description: response.data.message || "Failed to save client",
          variant: "destructive"
        })
      }
    } catch (error: any) {
      console.error("Error saving client:", error)

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
          description: "Failed to save client",
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
    }
  }

  const handleDomainSelect = (selectedOptions: DomainOption[] | null) => {
    const selectedIds = selectedOptions ? selectedOptions.map(option => option.value) : []
    setFormData({ ...formData, domain_ids: selectedIds })
  }

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  const formatDate = (dateString: string) => {
    try {
      // The date string is already in format "Oct-17-2025 01:16pm"
      // Just return as is since it's already formatted
      return dateString
    } catch {
      return dateString
    }
  }

  const getSelectedDomainOptions = () => {
    return domainOptions.filter(option =>
      formData.domain_ids.includes(option.value)
    )
  }

  const isAllSelected = data.length > 0 && selectedItems.length === data.length
  const totalPages = Math.ceil(totalClients / pagination.rowsPerPage)
  const startItem = pagination.page * pagination.rowsPerPage + 1
  const endItem = Math.min((pagination.page + 1) * pagination.rowsPerPage, totalClients)


  return (
    <div className="min-h-screen pb-8">
      <Header title="Clients Management" tabs={navigationTabs} />

      <div className="px-4 sm:px-6 mt-6">
        <GlassCard className="p-6">
          {/* Header with Search and Add Button */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <User className="w-6 h-6 text-[#BC8969]" />
                <h2 className="text-xl font-semibold text-white">Clients</h2>
              </div>
              <p className="text-sm text-gray-400 mt-1">
                Manage client accounts and their domains
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search clients..."
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
                  Add Client
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
                          <DashboardLoader label="Loading clients..." />
                        </div>
                      </td>
                    </tr>
                  ) : data.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <User className="w-12 h-12 text-gray-400" />
                          <span className="text-gray-400">No clients found</span>
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
                          <span className="text-sm text-white font-medium hover:text-blue-400 cursor-pointer" onClick={() => router.push(`/${user?.role}/client-details/${item.id}`)}>{item.name}</span>
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
                          {formatDate(item.created_at)}
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
              // <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 bg-[rgba(255,255,255,0.05)] border-t border-[rgba(255,255,255,0.1)]">
              //   <div className="text-sm text-gray-400 mb-3 sm:mb-0">
              //     Showing {startItem} to {endItem} of {totalClients} clients
              //   </div>
              //   <div className="flex items-center gap-2">
              //     <button
              //       onClick={() => handlePageChange(pagination.page - 1)}
              //       disabled={pagination.page === 0}
              //       className="p-2 rounded-lg bg-[rgba(255,255,255,0.05)] text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[rgba(255,255,255,0.1)] transition-colors"
              //       title="Previous"
              //     >
              //       Previous
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
              //             onClick={() => handlePageChange(pageNum)}
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
              //       onClick={() => handlePageChange(pagination.page + 1)}
              //       disabled={pagination.page >= totalPages - 1}
              //       className="p-2 rounded-lg bg-[rgba(255,255,255,0.05)] text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[rgba(255,255,255,0.1)] transition-colors"
              //       title="Next"
              //     >
              //       Next
              //     </button>
              //   </div>
              // </div>
              <Pagination
                page={pagination.page}
                rowsPerPage={pagination.rowsPerPage}
                totalItems={totalClients}
                onPageChange={handlePageChange}
              />
            )}
          </div>

          {/* Selected Items Info */}
          {selectedItems.length > 0 && (
            <div className="mt-4 p-3 bg-[rgba(255,255,255,0.05)] rounded-lg border border-[rgba(255,255,255,0.1)]">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">
                  {selectedItems.length} client{selectedItems.length > 1 ? 's' : ''} selected
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
          setEditingClient(null)
        }}
        title={editingClient ? "Edit Client" : "Add New Client"}
        size="lg"
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 pl-2">
          <div>
            <label className="block text-gray-300 text-sm mb-2">
              Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              placeholder="Enter client name"
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
              value={formData.phone || formData.number}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 10)
                setFormData({
                  ...formData,
                  phone: value,
                  number: value
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
              Password {!editingClient && <span className="text-red-400">*</span>}
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder={editingClient ? "Leave empty to keep current password" : "Enter password (min 6 characters)"}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.1)] rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {/* {editingClient ? (
              <p className="text-xs text-gray-400 mt-1">
                Leave password empty to keep current password
              </p>
            ) : (
              <p className="text-xs text-gray-400 mt-1">
                Minimum 6 characters
              </p>
            )} */}
          </div>

          {/* Domain Selection using react-select */}
          <div>
            <label className="block text-gray-300 text-sm mb-2">Select Domains</label>
            <GlassSelect
              //label="Select Domains"
              isMulti
              options={domainOptions}
              value={getSelectedDomainOptions()}
              onChange={handleDomainSelect}
              placeholder="Select domains..."
              isSearchable
              isClearable
              noOptionsMessage={() => "No domains found"}
              styles={glassSelectStyles}
            />

          </div>

          <div className="flex gap-3 pt-4">
            <button
              className="flex-1 px-4 py-2 bg-[rgba(255,255,255,0.1)] text-white rounded-lg hover:bg-[rgba(255,255,255,0.2)] transition-colors disabled:opacity-50"
              onClick={() => {
                setIsModalOpen(false)
                setEditingClient(null)
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
                  {editingClient ? "Saving..." : "Adding..."}
                </>
              ) : editingClient ? (
                "Save Changes"
              ) : (
                "Add Client"
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
        title={itemToDelete ? "Delete Client" : "Delete Multiple Clients"}
        message={itemToDelete
          ? "Are you sure you want to delete this client? This action cannot be undone."
          : "Are you sure you want to delete the selected clients? This action cannot be undone."
        }
      />
    </div>
  )
}