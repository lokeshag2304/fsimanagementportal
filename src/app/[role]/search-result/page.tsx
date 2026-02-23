"use client"

import { useState, useEffect } from "react"
import axios from "@/lib/axios"
import { Header } from "@/components/layout"
import { GlassCard } from "@/components/glass"
import {
  Search,
  Calendar,
  FileText,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  SearchCheckIcon
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { getNavigationByRole } from "@/lib/getNavigationByRole"
import Pagination from "@/common/Pagination"
import DashboardLoader from "@/common/DashboardLoader"

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL

interface SearchResult {
  id: number
  record_type_name: string
  expiry_date: string
  days_to_expired: number
  today_date: string
  domain_name: string
  product_name: string
  status: 'Active' | 'Expired' | 'Warning' | 'Draft'
}

interface PaginationState {
  page: number
  rowsPerPage: number
}

export default function SearchResultsPage() {
  const { user, getToken } = useAuth()
  const navigationTabs = getNavigationByRole(user?.role)
  const [data, setData] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [pagination, setPagination] = useState<PaginationState>({
    page: 0,
    rowsPerPage: 10
  })
  const [totalItems, setTotalItems] = useState(0)
  const token = getToken();

  // Fetch data from API
  const fetchSearchResults = async () => {
    try {
      setLoading(true)
      
      const response = await axios.post(
        `${BASE_URL}/secure/Categories/search-results`,
        {
          s_id: user?.id, // Adjust based on your auth context
          page: pagination.page,
          rowsPerPage: pagination.rowsPerPage,
          search: searchQuery,
          orderBy: "id",
          orderDir: "desc"
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      )

      if (response.data.status) {
        setData(response.data.data)
        setTotalItems(response.data.total)
      } else {
        setError("Failed to fetch search results")
      }
    } catch (err) {
      console.error("Error fetching search results:", err)
      setError("An error occurred while fetching data")
    } finally {
      setLoading(false)
    }
  }

  // Fetch data on component mount and when pagination/search changes
  useEffect(() => {
    if (searchQuery) {
      fetchSearchResults()
    }
  }, [pagination.page, pagination.rowsPerPage, searchQuery])

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  // Calculate status based on days_to_expired from API
  const getStatusFromDays = (days: number): 'Active' | 'Expired' | 'Warning' | 'Draft' => {
    if (days < 0) return 'Expired'
    if (days <= 7) return 'Warning'
    if (days > 7) return 'Active'
    return 'Draft'
  }

  const getStatusColor = (status: SearchResult['status']) => {
    switch (status) {
      case 'Active': return 'text-green-400'
      case 'Warning': return 'text-yellow-400'
      case 'Expired': return 'text-red-400'
      case 'Draft': return 'text-blue-400'
      default: return 'text-gray-400'
    }
  }

  const getStatusIcon = (status: SearchResult['status']) => {
    switch (status) {
      case 'Active': return <CheckCircle className="w-4 h-4" />
      case 'Warning': return <AlertCircle className="w-4 h-4" />
      case 'Expired': return <XCircle className="w-4 h-4" />
      case 'Draft': return <FileText className="w-4 h-4" />
      default: return <AlertCircle className="w-4 h-4" />
    }
  }

  // Filter data locally if needed (though API handles search)
  const filteredData = data.filter(item =>
    item.record_type_name?.toLowerCase().includes(searchQuery?.toLowerCase()) ||
    item.domain_name?.toLowerCase().includes(searchQuery?.toLowerCase()) ||
    item.product_name?.toLowerCase().includes(searchQuery?.toLowerCase()) ||
    item.status?.toLowerCase().includes(searchQuery?.toLowerCase())
  )

  // if (loading) {
  //   return (
  //     <div className="min-h-screen">
  //       <DashboardLoader />
  //     </div>
  //   )
  // }

  if (error) {
    return (
      <div className="min-h-screen">
        <Header title="Search Results Management" tabs={navigationTabs} />
        <div className="px-4 sm:px-6 mt-6">
          <GlassCard className="p-6">
            <div className="text-center py-8 text-red-400">
              {error}
            </div>
          </GlassCard>
        </div>
      </div>
    )
  }

  return (

      <div className="px-4 sm:px-6 mt-6">
        <GlassCard className="p-6">
          {/* Header with Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <SearchCheckIcon className="w-6 h-6 text-[#CB8969]" />
                <h2 className="text-xl font-semibold text-white">Search Results</h2>
              </div>
              <p className="text-sm text-gray-400 mt-1">
                View and track your search results.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder="Search results..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full sm:w-auto bg-[rgba(255,255,255,var(--ui-opacity-10))] border border-[rgba(255,255,255,var(--glass-border-opacity))] rounded-lg text-white placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,var(--glass-border-opacity))]">
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-tertiary)] w-[60px]">
                    S.NO
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-tertiary)]">
                    Type
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-tertiary)]">
                    Expire Date
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-tertiary)]">
                    Days to Expire
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-tertiary)]">
                    Today's Date
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-tertiary)]">
                    Domain Name
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-tertiary)]">
                    Product
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-tertiary)]">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {
                  loading ? (
                    <tr>
                      <td colSpan={8} className="text-center py-4">
                        <DashboardLoader />
                      </td>
                    </tr>
                  )
                  : (
                    filteredData.map((item, index) => (
                  <tr
                    key={item.id}
                    className="border-b border-[rgba(255,255,255,var(--glass-border-opacity))] hover:bg-[rgba(255,255,255,var(--ui-opacity-5))] transition-colors"
                  >
                    <td className="py-3 px-4 text-sm text-[var(--text-secondary)]">
                      {(pagination.page * pagination.rowsPerPage) + index + 1}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[var(--text-muted)]" />
                        <span className="text-sm text-white font-medium">{item.record_type_name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[var(--text-muted)]" />
                        <span className="text-sm text-[var(--text-secondary)]">
                          {new Date(item.expiry_date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                        item.days_to_expired < 0 
                          ? 'bg-red-500/20 text-red-400' 
                          : item.days_to_expired <= 7 
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-green-500/20 text-green-400'
                      }`}>
                        <Clock className="w-3 h-3" />
                        {item.days_to_expired >= 0 ? `${item.days_to_expired} days` : `${Math.abs(item.days_to_expired)} days ago`}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-[var(--text-secondary)]">
                        {new Date(item.today_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-[var(--text-muted)]" />
                        <span className="text-sm text-[var(--text-secondary)]">{item.domain_name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-[var(--text-muted)]" />
                        <span className="text-sm text-[var(--text-secondary)]">{item.product_name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(item.status)} bg-opacity-20 ${
                        item.status === 'Active' ? 'bg-green-500/20' :
                        item.status === 'Warning' ? 'bg-yellow-500/20' :
                        item.status === 'Expired' ? 'bg-red-500/20' :
                        'bg-blue-500/20'
                      }`}>
                        {getStatusIcon(item.status)}
                        {item.status}
                      </div>
                    </td>
                  </tr>
                ))
                  )
                }
              </tbody>
            </table>
            
            {filteredData.length === 0 && (
              <div className="text-center py-8">
                <span className="text-[var(--text-muted)]">No search results found</span>
              </div>
            )}
          </div>

          {/* Pagination */}
          {filteredData.length > 0 && (
            <div className="mt-6">
              <Pagination
                page={pagination.page}
                rowsPerPage={pagination.rowsPerPage}
                totalItems={totalItems}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </GlassCard>
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
//   FileText,
//   Package,
//   Clock,
//   CheckCircle,
//   XCircle,
//   AlertCircle,
//   Eye,
//   SearchCheckIcon
// } from "lucide-react"
// import { useAuth } from "@/contexts/AuthContext"
// import { getNavigationByRole } from "@/lib/getNavigationByRole"

// interface SearchResult {
//   id: number
//   type: string
//   expireDate: string
//   daysOfExpire: number
//   todayDate: string
//   products: string
//   status: 'Active' | 'Expired' | 'Warning' | 'Draft'
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
// const calculateStatus = (expireDate: string): 'Active' | 'Expired' | 'Warning' | 'Draft' => {
//   const today = new Date()
//   const expire = new Date(expireDate)
//   const daysUntilExpire = calculateDaysBetween(today, expire)
  
//   if (daysUntilExpire < 0) return 'Expired'
//   if (daysUntilExpire <= 7) return 'Warning'
//   if (daysUntilExpire > 7) return 'Active'
//   return 'Draft'
// }

// // Calculate days until expiration
// const calculateDaysOfExpire = (expireDate: string): number => {
//   const today = new Date()
//   const expire = new Date(expireDate)
//   return calculateDaysBetween(today, expire)
// }

// const initialData: SearchResult[] = [
//   {
//     id: 1,
//     type: "Domain Search",
//     expireDate: "2024-12-31",
//     daysOfExpire: 60,
//     todayDate: getTodayDate(),
//     products: "Premium DNS",
//     status: "Active"
//   },
//   {
//     id: 2,
//     type: "Keyword Research",
//     expireDate: "2024-11-10",
//     daysOfExpire: 10,
//     todayDate: getTodayDate(),
//     products: "SEO Tool",
//     status: "Warning"
//   },
//   {
//     id: 3,
//     type: "Backlink Analysis",
//     expireDate: "2024-09-15",
//     daysOfExpire: -15,
//     todayDate: getTodayDate(),
//     products: "Analytics Pro",
//     status: "Expired"
//   },
//   {
//     id: 4,
//     type: "Competitor Analysis",
//     expireDate: "2025-02-20",
//     daysOfExpire: 120,
//     todayDate: getTodayDate(),
//     products: "Business Intelligence",
//     status: "Active"
//   },
//   {
//     id: 5,
//     type: "Market Research",
//     expireDate: "2024-11-30",
//     daysOfExpire: 30,
//     todayDate: getTodayDate(),
//     products: "Market Insights",
//     status: "Active"
//   },
//   {
//     id: 6,
//     type: "Trend Analysis",
//     expireDate: "2024-10-25",
//     daysOfExpire: 5,
//     todayDate: getTodayDate(),
//     products: "Trend Tracker",
//     status: "Warning"
//   }
// ]

// export default function SearchResultsPage() {
//    const {user} = useAuth()
//   const navigationTabs = getNavigationByRole(user?.role)
//   const [data, setData] = useState<SearchResult[]>(initialData)
//   const [searchQuery, setSearchQuery] = useState("")
//   const [selectedItems, setSelectedItems] = useState<number[]>([])
//   const [isModalOpen, setIsModalOpen] = useState(false)
//   const [editingResult, setEditingResult] = useState<SearchResult | null>(null)
//   const [formData, setFormData] = useState({
//     type: "",
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
//     item.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
//     item.products.toLowerCase().includes(searchQuery.toLowerCase()) ||
//     item.status.toLowerCase().includes(searchQuery.toLowerCase())
//   )

//   const handleAdd = () => {
//     setEditingResult(null)
//     setFormData({
//       type: "",
//       expireDate: "",
//       products: ""
//     })
//     setIsModalOpen(true)
//   }

//   const handleEdit = (result: SearchResult) => {
//     setEditingResult(result)
//     setFormData({
//       type: result.type,
//       expireDate: result.expireDate,
//       products: result.products
//     })
//     setIsModalOpen(true)
//   }

//   const handleDelete = (id: number) => {
//     if (confirm("Are you sure you want to delete this search result?")) {
//       setData(data.filter(item => item.id !== id))
//       setSelectedItems(selectedItems.filter(selectedId => selectedId !== id))
//     }
//   }

//   const handleSubmit = () => {
//     const daysOfExpire = calculateDaysOfExpire(formData.expireDate)
//     const status = calculateStatus(formData.expireDate)

//     if (editingResult) {
//       setData(data.map(item =>
//         item.id === editingResult.id
//           ? {
//               ...item,
//               type: formData.type,
//               expireDate: formData.expireDate,
//               products: formData.products,
//               todayDate: getTodayDate(),
//               daysOfExpire,
//               status
//             }
//           : item
//       ))
//     } else {
//       const newResult: SearchResult = {
//         id: Math.max(...data.map(item => item.id)) + 1,
//         type: formData.type,
//         expireDate: formData.expireDate,
//         products: formData.products,
//         todayDate: getTodayDate(),
//         daysOfExpire,
//         status
//       }
//       setData([...data, newResult])
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

//   const handleViewDetails = (result: SearchResult) => {
//     alert(`Viewing details for: ${result.type}\nProducts: ${result.products}\nStatus: ${result.status}\nExpires: ${result.expireDate}`)
//   }

//   const isAllSelected = filteredData.length > 0 && selectedItems.length === filteredData.length

//   const getStatusColor = (status: SearchResult['status']) => {
//     switch (status) {
//       case 'Active': return 'text-green-400'
//       case 'Warning': return 'text-yellow-400'
//       case 'Expired': return 'text-red-400'
//       case 'Draft': return 'text-blue-400'
//       default: return 'text-gray-400'
//     }
//   }

//   const getStatusIcon = (status: SearchResult['status']) => {
//     switch (status) {
//       case 'Active': return <CheckCircle className="w-4 h-4" />
//       case 'Warning': return <AlertCircle className="w-4 h-4" />
//       case 'Expired': return <XCircle className="w-4 h-4" />
//       case 'Draft': return <FileText className="w-4 h-4" />
//       default: return <AlertCircle className="w-4 h-4" />
//     }
//   }

//   // Sample type options for dropdown
//   const typeOptions = [
//     "Domain Search",
//     "Keyword Research",
//     "Backlink Analysis",
//     "Competitor Analysis",
//     "Market Research",
//     "Trend Analysis",
//     "SEO Audit",
//     "Content Analysis"
//   ]

//   // Sample product options
//   const productOptions = [
//     "Premium DNS",
//     "SEO Tool",
//     "Analytics Pro",
//     "Business Intelligence",
//     "Market Insights",
//     "Trend Tracker",
//     "Content Optimizer",
//     "Rank Tracker"
//   ]

//   return (
//     <div className="min-h-screen pb-8">
//       <Header title="Search Results Management" tabs={navigationTabs} />

//       <div className="px-4 sm:px-6 mt-6">
//         <GlassCard className="p-6">
//           {/* Header with Search and Add Button */}
//           <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
//            <div>
//               <div className="flex items-center gap-2">
//                 <SearchCheckIcon className="w-6 h-6 text-[#CB8969]" />
//                 <h2 className="text-xl font-semibold text-white">Search Results</h2>
//               </div>
//               <p className="text-sm text-gray-400 mt-1">
//                 Manage and track your search results.
//               </p>
//             </div>
//             <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
//               <div className="relative">
//                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
//                 <input
//                   type="text"
//                   placeholder="Search results..."
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
//                 Add Result
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
//                     Type
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
//                         <FileText className="w-4 h-4 text-[var(--text-muted)]" />
//                         <span className="text-sm text-white font-medium">{item.type}</span>
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
//                           : item.daysOfExpire <= 7 
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
//                         'bg-blue-500/20'
//                       }`}>
//                         {getStatusIcon(item.status)}
//                         {item.status}
//                       </div>
//                     </td>
//                     <td className="py-3 px-4">
//                       <div className="flex items-center justify-end gap-2">
//                         <button
//                           onClick={() => handleViewDetails(item)}
//                           className="p-2 rounded-lg hover:bg-[rgba(255,255,255,var(--ui-opacity-10))] transition-colors"
//                           title="View Details"
//                         >
//                           <Eye className="w-4 h-4 text-blue-400" />
//                         </button>
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
//                 {selectedItems.length} result{selectedItems.length > 1 ? 's' : ''} selected
//               </span>
//             </div>
//           )}

//           {filteredData.length === 0 && (
//             <div className="text-center py-8">
//               <span className="text-[var(--text-muted)]">No search results found</span>
//             </div>
//           )}
//         </GlassCard>
//       </div>

//       {/* Add/Edit Modal */}
//       <GlassModal
//         isOpen={isModalOpen}
//         onClose={() => setIsModalOpen(false)}
//         title={editingResult ? "Edit Search Result" : "Add New Search Result"}
//         size="lg"
//       >
//         <div className="space-y-4">
//           <div>
//             <label className="block text-[var(--text-tertiary)] text-sm mb-2">Type</label>
//             <select
//               value={formData.type}
//               onChange={(e) => setFormData({ ...formData, type: e.target.value })}
//               className="w-full px-4 py-2 bg-[rgba(255,255,255,var(--ui-opacity-10))] border border-[rgba(255,255,255,var(--glass-border-opacity))] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent"
//             >
//               <option value="">Select search type</option>
//               {typeOptions.map((type, index) => (
//                 <option key={index} value={type} className="bg-gray-800 text-white">
//                   {type}
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
//             <label className="block text-[var(--text-tertiary)] text-sm mb-2">Products</label>
//             <select
//               value={formData.products}
//               onChange={(e) => setFormData({ ...formData, products: e.target.value })}
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
//                   formData.expireDate 
//                     ? calculateDaysOfExpire(formData.expireDate) < 0 
//                       ? 'text-red-400' 
//                       : calculateDaysOfExpire(formData.expireDate) <= 7 
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
//               disabled={!formData.type || !formData.expireDate || !formData.products}
//             >
//               {editingResult ? "Save Changes" : "Add Result"}
//             </GlassButton>
//           </div>
//         </div>
//       </GlassModal>
//     </div>
//   )
// }