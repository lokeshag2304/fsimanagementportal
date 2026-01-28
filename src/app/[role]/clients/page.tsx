// app/Clients/page.tsx
"use client"

import { useState, useEffect, useRef } from "react"
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
  Globe,
  MapPin
} from "lucide-react"
import { navigationTabs } from "@/lib/navigation"
import axios from "axios"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/useToast"
import { useRouter } from "next/navigation"
import Select from 'react-select'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "";
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
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [data, setData] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedItems, setSelectedItems] = useState<number[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [domains, setDomains] = useState<Domain[]>([])
  const [domainOptions, setDomainOptions] = useState<DomainOption[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [profilePreview, setProfilePreview] = useState<string | null>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout>()
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

  // Function to get token from localStorage
  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('authToken')
    }
    return null
  }

  // Fetch domains for dropdown
  const fetchDomains = async () => {
    try {
      const token = getAuthToken()
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
    setIsModalOpen(false)
    setProfilePreview(null)
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
      const token = getAuthToken()
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
        console.log("Client details fetched:", client)
        
        setFormData({
          name: client.name,
          email: client.email,
          phone: client.phone || client.number || "",
          number: client.number || client.phone || "",
          address: client.address || "",
          password: "", // Password empty for edit
          domain_ids: client.domain_ids?.map(id => parseInt(id)) || [],
          profile: null,
          type: 1
        })
        
        // Set profile preview if exists
        if (client.profile) {
          setProfilePreview(`${BASE_URL}/${client.profile}`)
        }
      }
    } catch (error) {
      console.error("Error fetching client details:", error)
    }
  }

  const handleAdd = () => {
    setEditingClient(null)
    setProfilePreview(null)
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
    setIsModalOpen(true)
  }

  const handleEdit = async (client: Client) => {
    console.log("Editing client:", client)
    setEditingClient(client)
    setIsModalOpen(true)
    await fetchClientDetails(client.id)
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this client?")) {
      return
    }

    try {
      const token = getAuthToken()
      if (!token) return

      const response = await axios.post<ApiResponse>(
        `${BASE_URL}/secure/Usermanagement/delete-clients-user`,
        { 
          id,
          s_id: user?.id || 6
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      )

      if (response.data.status) {
        handleSuccess(response.data.message || "Client deleted successfully")
      } else {
        toast({
          title: "Error",
          description: response.data.message || "Failed to delete client",
          variant: "destructive"
        })
      }
    } catch (error: any) {
      handleError(error, "Failed to delete client")
    }
  }

  const handleSubmit = async () => {
    console.log("Submitting form data:", formData)
    console.log("Editing client:", editingClient)
    
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
    
    if (!editingClient && !formData.password.trim()) {
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
        console.log("Adding profile file:", formData.profile)
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

      console.log("Sending to endpoint:", endpoint)
      
      // Debug: Log FormData contents
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
        handleSuccess(response.data.message)
      } else {
        toast({
          title: "Error",
          description: response.data.message,
          variant: "destructive"
        })
      }
    } catch (error: any) {
      console.error("Error saving client:", error)
      console.error("Error response:", error.response)
      
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
      console.log("File selected:", file)
      setFormData({ ...formData, profile: file })
      // Create preview URL
      const previewUrl = URL.createObjectURL(file)
      setProfilePreview(previewUrl)
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

  const getSelectedDomainOptions = () => {
    return domainOptions.filter(option => 
      formData.domain_ids.includes(option.value)
    )
  }

  const isAllSelected = data.length > 0 && selectedItems.length === data.length
  const totalPages = Math.ceil(totalClients / pagination.rowsPerPage)
  const startItem = pagination.page * pagination.rowsPerPage + 1
  const endItem = Math.min((pagination.page + 1) * pagination.rowsPerPage, totalClients)

  // Custom styles for react-select
  const selectStyles = {
    control: (base: any) => ({
      ...base,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderColor: 'rgba(255, 255, 255, 0.1)',
      color: '#fff',
      borderRadius: '0.5rem',
      minHeight: '42px',
      '&:hover': {
        borderColor: 'rgba(255, 255, 255, 0.2)',
      }
    }),
    menu: (base: any) => ({
      ...base,
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '0.5rem',
      zIndex: 9999,
    }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isSelected 
        ? 'rgba(59, 130, 246, 0.5)' 
        : state.isFocused 
          ? 'rgba(255, 255, 255, 0.1)' 
          : 'transparent',
      color: '#fff',
      '&:active': {
        backgroundColor: 'rgba(59, 130, 246, 0.3)',
      }
    }),
    multiValue: (base: any) => ({
      ...base,
      backgroundColor: 'rgba(59, 130, 246, 0.2)',
    }),
    multiValueLabel: (base: any) => ({
      ...base,
      color: '#fff',
    }),
    multiValueRemove: (base: any) => ({
      ...base,
      color: '#fff',
      '&:hover': {
        backgroundColor: 'rgba(239, 68, 68, 0.3)',
        color: '#fff',
      }
    }),
    input: (base: any) => ({
      ...base,
      color: '#fff',
    }),
    singleValue: (base: any) => ({
      ...base,
      color: '#fff',
    }),
    placeholder: (base: any) => ({
      ...base,
      color: 'rgba(255, 255, 255, 0.4)',
    }),
    dropdownIndicator: (base: any) => ({
      ...base,
      color: 'rgba(255, 255, 255, 0.4)',
      '&:hover': {
        color: 'rgba(255, 255, 255, 0.6)',
      }
    }),
    clearIndicator: (base: any) => ({
      ...base,
      color: 'rgba(255, 255, 255, 0.4)',
      '&:hover': {
        color: 'rgba(255, 255, 255, 0.6)',
      }
    }),
    indicatorSeparator: (base: any) => ({
      ...base,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
    })
  }

  return (
    <div className="min-h-screen pb-8">
      <Header title="Clients Management" tabs={navigationTabs} />

      <div className="px-4 sm:px-6 mt-6">
        <GlassCard className="p-6">
          {/* Header with Search and Add Button */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <User className="w-6 h-6 text-blue-500" />
                <h2 className="text-xl font-semibold text-white">Clients</h2>
              </div>
              <p className="text-sm text-gray-400 mt-1">
                Manage client accounts and their domains
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <GlassInput
                  type="text"
                  placeholder="Search clients..."
                  defaultValue={searchQuery}
                  onChange={(e) => handleSearchInput(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full sm:w-64 bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.1)] rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex gap-2">
                {selectedItems.length > 0 && (
                  <GlassButton
                    variant="danger"
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to delete ${selectedItems.length} client(s)?`)) {
                        selectedItems.forEach(id => handleDelete(id))
                      }
                    }}
                    className="flex items-center gap-2"
                    disabled={isSubmitting}
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete ({selectedItems.length})
                  </GlassButton>
                )}
                
                <GlassButton
                  variant="primary"
                  onClick={handleAdd}
                  className="flex items-center gap-2"
                  disabled={isSubmitting || isModalOpen}
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
                          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                          <span className="text-gray-400">Loading clients...</span>
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
                        <td className="py-3 px-4">
                          <span className="text-sm text-white font-medium">{item.name}</span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="text-sm text-gray-300 truncate">{item.email}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="text-sm text-gray-300">
                              {item.phone || item.number || "No phone"}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="text-sm text-gray-300 max-w-[200px] truncate">
                              {item.address || "No address"}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-300">
                          {formatDate(item.created_at)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEdit(item)}
                              disabled={isSubmitting}
                              className="p-1.5 rounded hover:bg-[rgba(255,255,255,0.1)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4 text-gray-400 hover:text-blue-400" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              disabled={isSubmitting}
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
              <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 bg-[rgba(255,255,255,0.05)] border-t border-[rgba(255,255,255,0.1)]">
                <div className="text-sm text-gray-400 mb-3 sm:mb-0">
                  Showing {startItem} to {endItem} of {totalClients} clients
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 0}
                    className="p-2 rounded-lg bg-[rgba(255,255,255,0.05)] text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[rgba(255,255,255,0.1)] transition-colors"
                    title="Previous"
                  >
                    Previous
                  </button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum
                      if (totalPages <= 5) {
                        pageNum = i
                      } else if (pagination.page <= 2) {
                        pageNum = i
                      } else if (pagination.page >= totalPages - 3) {
                        pageNum = totalPages - 5 + i
                      } else {
                        pageNum = pagination.page - 2 + i
                      }
                      
                      if (pageNum >= totalPages) return null
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-3 py-1 rounded text-sm transition-colors ${
                            pagination.page === pageNum
                              ? 'bg-blue-600 text-white'
                              : 'bg-[rgba(255,255,255,0.05)] text-gray-300 hover:bg-[rgba(255,255,255,0.1)]'
                          }`}
                        >
                          {pageNum + 1}
                        </button>
                      )
                    })}
                  </div>
                  
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= totalPages - 1}
                    className="p-2 rounded-lg bg-[rgba(255,255,255,0.05)] text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[rgba(255,255,255,0.1)] transition-colors"
                    title="Next"
                  >
                    Next
                  </button>
                </div>
              </div>
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
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to delete ${selectedItems.length} client(s)?`)) {
                        selectedItems.forEach(id => handleDelete(id))
                      }
                    }}
                    disabled={isSubmitting}
                    className="text-sm text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? "Deleting..." : `Delete ${selectedItems.length} items`}
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
          setProfilePreview(null)
          setEditingClient(null)
        }}
        title={editingClient ? "Edit Client" : "Add New Client"}
        size="lg"
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
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
              placeholder="Enter phone number"
              value={formData.phone || formData.number}
              onChange={(e) => {
                const value = e.target.value
                setFormData({ 
                  ...formData, 
                  phone: value,
                  number: value
                })
              }}
              className="w-full px-3 py-2 bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.1)] rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
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
            <input
              type="password"
              placeholder={editingClient ? "Leave empty to keep current password" : "Enter password"}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3 py-2 bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.1)] rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {editingClient && (
              <p className="text-xs text-gray-400 mt-1">
                Leave password empty to keep current password
              </p>
            )}
          </div>
          
          {/* Domain Selection using react-select */}
          <div>
            <label className="block text-gray-300 text-sm mb-2">Select Domains</label>
            <Select
              isMulti
              options={domainOptions}
              value={getSelectedDomainOptions()}
              onChange={handleDomainSelect}
              styles={selectStyles}
              placeholder="Select domains..."
              className="react-select-container"
              classNamePrefix="react-select"
              noOptionsMessage={() => "No domains found"}
              isSearchable
              isClearable
            />
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
                ) : editingClient?.profile ? (
                  <img
                    src={`${BASE_URL}/${editingClient.profile}`}
                    alt="Current Profile"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.currentTarget
                      target.style.display = 'none'
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
                    {profilePreview || editingClient?.profile ? "Change File" : "Choose File"}
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
                {(profilePreview || editingClient?.profile) && (
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
    </div>
  )
}








// // app/Clients/page.tsx
// "use client"

// import { useState, useEffect } from "react"
// import { Header } from "@/components/layout"
// import { GlassCard, GlassButton, GlassInput, GlassModal } from "@/components/glass"
// import {
//   Edit,
//   Trash2,
//   Search,
//   Plus,
//   Loader2,
//   Mail,
//   Phone,
//   User,
//   Globe,
//   MapPin
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
// }

// interface Client {
//   id: number
//   name: string
//   email: string
//   phone: string
//   address: string
//   profile: string
//   login_type: number
//   type: number
//   domain_ids: string[]
//   domains?: Domain[]
//   created_at: string
// }

// interface ClientsResponse {
//   rows: Client[]
//   total: number
// }

// interface DomainResponse {
//   status: boolean
//   message: string
//   data: Domain[]
// }

// interface ClientDetailsResponse {
//   status: boolean
//   message: string
//   data: Client
// }

// interface ApiResponse {
//   status: boolean
//   message: string
// }

// export default function ClientsPage() {
//   const { user } = useAuth()
//   const { toast } = useToast()
//   const router = useRouter()
//   const [data, setData] = useState<Client[]>([])
//   const [loading, setLoading] = useState(true)
//   const [searchQuery, setSearchQuery] = useState("")
//   const [selectedItems, setSelectedItems] = useState<number[]>([])
//   const [isModalOpen, setIsModalOpen] = useState(false)
//   const [editingClient, setEditingClient] = useState<Client | null>(null)
//   const [domains, setDomains] = useState<Domain[]>([])
//   const [isSubmitting, setIsSubmitting] = useState(false)
//   const [profilePreview, setProfilePreview] = useState<string | null>(null)
  
//   const [formData, setFormData] = useState({
//     name: "",
//     email: "",
//     phone: "",
//     address: "",
//     password: "",
//     domain_ids: [] as number[],
//     profile: null as File | null,
//     type: 1 // 1 for client
//   })

//   const [pagination, setPagination] = useState({
//     page: 0,
//     rowsPerPage: 10,
//     order: "desc" as "asc" | "desc",
//     orderBy: "id"
//   })
//   const [totalClients, setTotalClients] = useState(0)

//   // Function to get token from localStorage
//   const getAuthToken = () => {
//     if (typeof window !== 'undefined') {
//       return localStorage.getItem('authToken')
//     }
//     return null
//   }

//   // Fetch domains for dropdown
//   const fetchDomains = async () => {
//     try {
//       const token = getAuthToken()
//       if (!token) return

//       const response = await axios.post<DomainResponse>(
//         `${BASE_URL}/secure/Dropdowns/get-domains`,
//         {},
//         {
//           headers: {
//             'Content-Type': 'application/json',
//             'Authorization': `Bearer ${token}`
//           }
//         }
//       )

//       if (response.data.status) {
//         setDomains(response.data.data)
//       }
//     } catch (error) {
//       console.error("Error fetching domains:", error)
//     }
//   }

//   // Fetch clients list
//   const fetchClients = async () => {
//     try {
//       setLoading(true)
//       const token = getAuthToken()
      
//       if (!token) {
//         toast.error("Authentication token not found. Please login again.")
//         router.push('/auth/login')
//         return
//       }

//       const response = await axios.post<ClientsResponse>(
//         `${BASE_URL}/secure/Usermanagement/get-clients-user-list`,
//         {
//           type: 1, // 1 for clients
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
//       setTotalClients(response.data.total)
//     } catch (error: any) {
//       console.error("Error fetching clients:", error)
//       if (error.response?.status === 401) {
//         toast.error("Session expired. Please login again.")
//         router.push('/auth/login')
//       } else {
//         toast.error(error.response?.data?.message || "Failed to fetch clients")
//       }
//     } finally {
//       setLoading(false)
//     }
//   }

//   // Fetch client details for editing
//   const fetchClientDetails = async (id: number) => {
//     try {
//       const token = getAuthToken()
//       if (!token) return

//       const response = await axios.post<ClientDetailsResponse>(
//         `${BASE_URL}/secure/Usermanagement/get-clients-user-details`,
//         { id },
//         {
//           headers: {
//             'Content-Type': 'application/json',
//             'Authorization': `Bearer ${token}`
//           }
//         }
//       )

//       if (response.data.status && response.data.data) {
//         const client = response.data.data
//         console.log("Client details fetched:", client)
        
//         setFormData({
//           name: client.name,
//           email: client.email,
//           phone: client.phone,
//           address: client.address || "",
//           password: "", // Password empty for edit
//           domain_ids: client.domain_ids?.map(id => parseInt(id)) || [],
//           profile: null,
//           type: 1
//         })
        
//         // Set profile preview if exists
//         if (client.profile) {
//           setProfilePreview(`${BASE_URL}/${client.profile}`)
//         }
//       }
//     } catch (error) {
//       console.error("Error fetching client details:", error)
//     }
//   }

//   // Initial fetches
//   useEffect(() => {
//     fetchClients()
//     fetchDomains()
//   }, [pagination.page, pagination.order, pagination.orderBy, searchQuery])

//   const handleAdd = () => {
//     setEditingClient(null)
//     setProfilePreview(null)
//     setFormData({
//       name: "",
//       email: "",
//       phone: "",
//       address: "",
//       password: "",
//       domain_ids: [],
//       profile: null,
//       type: 1
//     })
//     setIsModalOpen(true)
//   }

//   const handleEdit = async (client: Client) => {
//     console.log("Editing client:", client)
//     setEditingClient(client)
//     setIsModalOpen(true)
//     await fetchClientDetails(client.id)
//   }

//   const handleDelete = async (id: number) => {
//     if (!confirm("Are you sure you want to delete this client?")) {
//       return
//     }

//     try {
//       const token = getAuthToken()
//       if (!token) return

//       // Note: Delete API needs to be confirmed from backend
//       // This is placeholder code
//       toast.success("Delete functionality to be implemented")
      
//       // Refresh list after delete
//       fetchClients()
//       setSelectedItems(selectedItems.filter(selectedId => selectedId !== id))
//     } catch (error: any) {
//       console.error("Error deleting client:", error)
//       toast.error("Failed to delete client")
//     }
//   }

//   const handleSubmit = async () => {
//     console.log("Submitting form data:", formData)
//     console.log("Editing client:", editingClient)
    
//     // Validation
//     if (!formData.name.trim()) {
//       toast.error("Please enter client name")
//       return
//     }
    
//     if (!formData.email.trim()) {
//       toast.error("Please enter email address")
//       return
//     }
    
//     if (!formData.phone.trim()) {
//       toast.error("Please enter phone number")
//       return
//     }
    
//     if (!editingClient && !formData.password.trim()) {
//       toast.error("Please enter password")
//       return
//     }

//     try {
//       setIsSubmitting(true)
//       const token = getAuthToken()
//       if (!token) {
//         toast.error("Authentication token not found")
//         return
//       }

//       const formDataToSend = new FormData()
//       formDataToSend.append('name', formData.name.trim())
//       formDataToSend.append('email', formData.email.trim())
//       formDataToSend.append('phone', formData.phone.trim())
//       formDataToSend.append('address', formData.address.trim())
      
//       // Only add password if it's not empty (for edit) or for new client
//       if (formData.password.trim()) {
//         formDataToSend.append('password', formData.password.trim())
//       }
      
//       formDataToSend.append('s_id', user?.id?.toString() || '6')
//       formDataToSend.append('type', '1') // Client type
      
//       // Add domain_ids - make sure to include even if empty
//       if (formData.domain_ids.length > 0) {
//         formData.domain_ids.forEach(id => {
//           formDataToSend.append('domain_ids[]', id.toString())
//         })
//       } else {
//         // If no domains selected, still send empty array
//         formDataToSend.append('domain_ids[]', '')
//       }

//       // Add profile if exists
//       if (formData.profile) {
//         console.log("Adding profile file:", formData.profile)
//         formDataToSend.append('profile', formData.profile)
//       }

//       let endpoint = ''
//       let method = 'POST'
      
//       if (editingClient) {
//         // Update client
//         endpoint = `${BASE_URL}/secure/Usermanagement/update-clients-user`
//         formDataToSend.append('id', editingClient.id.toString())
//         formDataToSend.append('type', '1') // Add type field for update
//       } else {
//         // Add new client
//         endpoint = `${BASE_URL}/secure/Usermanagement/add-clients-user`
//       }

//       console.log("Sending to endpoint:", endpoint)
      
//       // Debug: Log FormData contents
//       for (let [key, value] of formDataToSend.entries()) {
//         console.log(key, value)
//       }

//       const response = await axios.post<ApiResponse>(
//         endpoint,
//         formDataToSend,
//         {
//           headers: {
//             'Authorization': `Bearer ${token}`,
//             'Content-Type': 'multipart/form-data'
//           }
//         }
//       )

//       console.log("API Response:", response.data)

//       if (response.data.status) {
//         toast.success(response.data.message)
//         setIsModalOpen(false)
//         fetchClients() // Refresh list
        
//         // Reset form
//         setFormData({
//           name: "",
//           email: "",
//           phone: "",
//           address: "",
//           password: "",
//           domain_ids: [],
//           profile: null,
//           type: 1
//         })
//         setProfilePreview(null)
//       } else {
//         toast.error(response.data.message)
//       }
//     } catch (error: any) {
//       console.error("Error saving client:", error)
//       console.error("Error response:", error.response)
      
//       if (error.response?.status === 401) {
//         toast.error("Session expired. Please login again.")
//         router.push('/auth/login')
//       } else if (error.response?.data?.message) {
//         toast.error(error.response.data.message)
//       } else {
//         toast.error("Failed to save client")
//       }
//     } finally {
//       setIsSubmitting(false)
//     }
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

//   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (e.target.files && e.target.files[0]) {
//       const file = e.target.files[0]
//       console.log("File selected:", file)
//       setFormData({ ...formData, profile: file })
//       // Create preview URL
//       const previewUrl = URL.createObjectURL(file)
//       setProfilePreview(previewUrl)
//     }
//   }

//   const isAllSelected = data.length > 0 && selectedItems.length === data.length

//   return (
//     <div className="min-h-screen pb-8">
//       <Header title="Clients Management" tabs={navigationTabs} />

//       <div className="px-4 sm:px-6 mt-6">
//         <GlassCard className="p-6">
//           {/* Header with Search and Add Button */}
//           <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
//             <div className="flex items-center gap-3">
//               <User className="w-6 h-6 text-[var(--theme-primary)]" />
//               <h2 className="text-xl font-semibold text-white">Clients</h2>
//             </div>
            
//             <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
//               <div className="relative flex-1 sm:flex-initial">
//                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
//                 <input
//                   type="text"
//                   placeholder="Search clients..."
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
//                   onClick={handleAdd}
//                   className="flex items-center gap-2"
//                   disabled={isSubmitting}
//                 >
//                   {isSubmitting ? (
//                     <Loader2 className="w-4 h-4 animate-spin" />
//                   ) : (
//                     <Plus className="w-4 h-4" />
//                   )}
//                   Add Client
//                 </GlassButton>
                
//                 {selectedItems.length > 0 && (
//                   <GlassButton
//                     variant="danger"
//                     onClick={() => toast.info("Bulk delete to be implemented")}
//                     className="flex items-center gap-2"
//                   >
//                     <Trash2 className="w-4 h-4" />
//                     Delete ({selectedItems.length})
//                   </GlassButton>
//                 )}
//               </div>
//             </div>
//           </div>

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
//                       <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-tertiary)]">
//                         Profile
//                       </th>
//                       <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-tertiary)]">
//                         Name
//                       </th>
//                       <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-tertiary)]">
//                         Email
//                       </th>
//                       <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-tertiary)]">
//                         Phone
//                       </th>
//                       <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-tertiary)]">
//                         Address
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
//                           <div className="w-10 h-10 rounded-full overflow-hidden bg-[rgba(255,255,255,var(--ui-opacity-5))] border border-[rgba(255,255,255,var(--glass-border-opacity))]">
//                             {item.profile ? (
//                               <img
//                                 src={`${BASE_URL}/${item.profile}`}
//                                 alt={item.name}
//                                 className="w-full h-full object-cover"
//                                 onError={(e) => {
//                                   // If image fails to load, show placeholder
//                                   e.currentTarget.style.display = 'none'
//                                 }}
//                               />
//                             ) : (
//                               <div className="w-full h-full flex items-center justify-center bg-[var(--theme-primary)]/20">
//                                 <User className="w-5 h-5 text-white/60" />
//                               </div>
//                             )}
//                           </div>
//                         </td>
//                         <td className="py-3 px-4">
//                           <span className="text-sm text-white font-medium">{item.name}</span>
//                         </td>
//                         <td className="py-3 px-4">
//                           <div className="flex items-center gap-2">
//                             <Mail className="w-4 h-4 text-[var(--text-muted)]" />
//                             <span className="text-sm text-[var(--text-secondary)]">{item.email}</span>
//                           </div>
//                         </td>
//                         <td className="py-3 px-4">
//                           <div className="flex items-center gap-2">
//                             <Phone className="w-4 h-4 text-[var(--text-muted)]" />
//                             <span className="text-sm text-[var(--text-secondary)]">{item.phone}</span>
//                           </div>
//                         </td>
//                         <td className="py-3 px-4">
//                           <div className="flex items-center gap-2">
//                             <MapPin className="w-4 h-4 text-[var(--text-muted)]" />
//                             <span className="text-sm text-[var(--text-secondary)] max-w-[200px] truncate">
//                               {item.address || "No address"}
//                             </span>
//                           </div>
//                         </td>
//                         <td className="py-3 px-4 text-sm text-[var(--text-secondary)]">
//                           {item.created_at}
//                         </td>
//                         <td className="py-3 px-4">
//                           <div className="flex items-center justify-end gap-2">
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
//                           </div>
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>

//                 {/* Pagination */}
//                 <div className="flex items-center justify-between mt-4 pt-4 border-t border-[rgba(255,255,255,var(--glass-border-opacity))]">
//                   <div className="text-sm text-[var(--text-muted)]">
//                     Showing {data.length} of {totalClients} clients
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
//                       disabled={(pagination.page + 1) * pagination.rowsPerPage >= totalClients}
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
//                 <User className="w-12 h-12 mx-auto text-[var(--text-muted)] mb-3" />
//                 <span className="text-[var(--text-muted)]">No clients found</span>
//               </div>
//             )}
//           </div>

//           {/* Selected Items Info */}
//           {selectedItems.length > 0 && (
//             <div className="mt-4 p-3 bg-[rgba(255,255,255,var(--ui-opacity-5))] rounded-lg border border-[rgba(255,255,255,var(--glass-border-opacity))]">
//               <span className="text-sm text-[var(--text-secondary)]">
//                 {selectedItems.length} client{selectedItems.length > 1 ? 's' : ''} selected
//               </span>
//             </div>
//           )}
//         </GlassCard>
//       </div>

//       {/* Add/Edit Modal */}
//       <GlassModal
//         isOpen={isModalOpen}
//         onClose={() => {
//           setIsModalOpen(false)
//           setProfilePreview(null)
//         }}
//         title={editingClient ? "Edit Client" : "Add New Client"}
//         size="lg"
//       >
//         <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
//           <div>
//             <label className="block text-[var(--text-tertiary)] text-sm mb-2">
//               Name <span className="text-red-400">*</span>
//             </label>
//             <GlassInput
//               placeholder="Enter client name"
//               value={formData.name}
//               onChange={(e) => setFormData({ ...formData, name: e.target.value })}
//             />
//           </div>
          
//           <div>
//             <label className="block text-[var(--text-tertiary)] text-sm mb-2">
//               Email <span className="text-red-400">*</span>
//             </label>
//             <GlassInput
//               type="email"
//               placeholder="Enter email address"
//               value={formData.email}
//               onChange={(e) => setFormData({ ...formData, email: e.target.value })}
//             />
//           </div>
          
//           <div>
//             <label className="block text-[var(--text-tertiary)] text-sm mb-2">
//               Phone Number <span className="text-red-400">*</span>
//             </label>
//             <GlassInput
//               placeholder="Enter phone number"
//               value={formData.phone}
//               onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
//             />
//           </div>
          
//           <div>
//             <label className="block text-[var(--text-tertiary)] text-sm mb-2">Address</label>
//             <GlassInput
//               placeholder="Enter address"
//               value={formData.address}
//               onChange={(e) => setFormData({ ...formData, address: e.target.value })}
//             />
//           </div>
          
//           <div>
//             <label className="block text-[var(--text-tertiary)] text-sm mb-2">
//               Password {!editingClient && <span className="text-red-400">*</span>}
//             </label>
//             <GlassInput
//               type="password"
//               placeholder={editingClient ? "Leave empty to keep current password" : "Enter password"}
//               value={formData.password}
//               onChange={(e) => setFormData({ ...formData, password: e.target.value })}
//             />
//             {editingClient && (
//               <p className="text-xs text-[var(--text-muted)] mt-1">
//                 Leave password empty to keep current password
//               </p>
//             )}
//           </div>
          
//           {/* Domain Selection (Only for Clients) */}
//           <div>
//             <label className="block text-[var(--text-tertiary)] text-sm mb-2">Select Domains</label>
//             <div className="max-h-40 overflow-y-auto space-y-2 p-2 bg-[rgba(255,255,255,var(--ui-opacity-5))] rounded-lg">
//               {domains.length > 0 ? (
//                 domains.map((domain) => (
//                   <div key={domain.id} className="flex items-center gap-2">
//                     <input
//                       type="checkbox"
//                       id={`domain-${domain.id}`}
//                       checked={formData.domain_ids.includes(domain.id)}
//                       onChange={(e) => {
//                         if (e.target.checked) {
//                           setFormData({
//                             ...formData,
//                             domain_ids: [...formData.domain_ids, domain.id]
//                           })
//                         } else {
//                           setFormData({
//                             ...formData,
//                             domain_ids: formData.domain_ids.filter(id => id !== domain.id)
//                           })
//                         }
//                       }}
//                       className="w-4 h-4 rounded border-[rgba(255,255,255,var(--glass-border-opacity))] bg-[rgba(255,255,255,var(--ui-opacity-10))] text-[var(--theme-primary)] focus:ring-[var(--theme-primary)]"
//                     />
//                     <label
//                       htmlFor={`domain-${domain.id}`}
//                       className="flex items-center gap-2 text-sm text-[var(--text-secondary)] cursor-pointer"
//                     >
//                       <Globe className="w-4 h-4" />
//                       {domain.name}
//                     </label>
//                   </div>
//                 ))
//               ) : (
//                 <div className="text-center py-2 text-[var(--text-muted)] text-sm">
//                   No domains available
//                 </div>
//               )}
//             </div>
//           </div>
          
//           <div>
//             <label className="block text-[var(--text-tertiary)] text-sm mb-2">Profile Picture</label>
//             <div className="flex items-center gap-4">
//               <div className="w-16 h-16 rounded-full overflow-hidden bg-[rgba(255,255,255,var(--ui-opacity-5))] border border-[rgba(255,255,255,var(--glass-border-opacity))]">
//                 {profilePreview ? (
//                   <img
//                     src={profilePreview}
//                     alt="Profile Preview"
//                     className="w-full h-full object-cover"
//                   />
//                 ) : editingClient?.profile ? (
//                   <img
//                     src={`${BASE_URL}/${editingClient.profile}`}
//                     alt="Current Profile"
//                     className="w-full h-full object-cover"
//                     onError={(e) => {
//                       // If image fails to load, show placeholder
//                       e.currentTarget.style.display = 'none'
//                     }}
//                   />
//                 ) : (
//                   <div className="w-full h-full flex items-center justify-center">
//                     <User className="w-8 h-8 text-white/40" />
//                   </div>
//                 )}
//               </div>
//               <div className="flex-1">
//                 <label className="block">
//                   <div className="cursor-pointer px-4 py-2 bg-[rgba(255,255,255,var(--ui-opacity-10))] border border-[rgba(255,255,255,var(--glass-border-opacity))] rounded-lg text-white text-sm text-center hover:bg-[rgba(255,255,255,var(--ui-opacity-20))] transition-colors">
//                     {profilePreview ? "Change File" : "Choose File"}
//                   </div>
//                   <input
//                     type="file"
//                     accept="image/*"
//                     className="hidden"
//                     onChange={handleFileChange}
//                   />
//                 </label>
//                 {formData.profile && (
//                   <p className="text-xs text-[var(--text-muted)] mt-1">
//                     {formData.profile.name}
//                   </p>
//                 )}
//                 <button
//                   type="button"
//                   onClick={() => {
//                     setFormData({ ...formData, profile: null })
//                     setProfilePreview(null)
//                   }}
//                   className="mt-2 text-xs text-red-400 hover:text-red-300"
//                 >
//                   Remove photo
//                 </button>
//               </div>
//             </div>
//           </div>
          
//           <div className="flex gap-3 pt-4">
//             <GlassButton
//               variant="ghost"
//               className="flex-1"
//               onClick={() => {
//                 setIsModalOpen(false)
//                 setProfilePreview(null)
//               }}
//               disabled={isSubmitting}
//             >
//               Cancel
//             </GlassButton>
//             <GlassButton
//               variant="primary"
//               className="flex-1"
//               onClick={handleSubmit}
//               disabled={isSubmitting}
//             >
//               {isSubmitting ? (
//                 <Loader2 className="w-4 h-4 animate-spin mx-auto" />
//               ) : editingClient ? (
//                 "Save Changes"
//               ) : (
//                 "Add Client"
//               )}
//             </GlassButton>
//           </div>
//         </div>
//       </GlassModal>
//     </div>
//   )
// }