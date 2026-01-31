"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { Header } from "@/components/layout"
import { GlassCard } from "@/components/glass"
import {
  Search,
  Clock,
  User,
  Shield,
  Activity,
  History,
  FileText,
  SearchCheckIcon
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { getNavigationByRole } from "@/lib/getNavigationByRole"
import Pagination from "@/common/Pagination"
import DashboardLoader from "@/common/DashboardLoader"

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL

interface ActivityLog {
  id: number
  user_id: number
  action: string
  message: string
  s_action: string
  s_message: string
  created_at: string
  updated_at: string
  name: string
  login_type: number
  role: string
  creator_name: string
}

interface PaginationState {
  page: number
  rowsPerPage: number
}

export default function ActivityLogPage() {
  const { user, getToken } = useAuth()
  const navigationTabs = getNavigationByRole(user?.role)
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [pagination, setPagination] = useState<PaginationState>({
    page: 0,
    rowsPerPage: 10
  })
  const [totalItems, setTotalItems] = useState(0)
  const token = getToken() // Adjust token storage as needed

  // Fetch activity logs from API
  const fetchActivities = async () => {
    try {
      setLoading(true)
      
      const response = await axios.post(
        `${BASE_URL}/secure/Activites/Get-acitivites`,
        {
          admin_id: user?.id, // Adjust based on your auth context
          page: pagination.page,
          rowsPerPage: pagination.rowsPerPage,
          search: searchQuery,
          orderBy: "id",
          order: "desc"
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      )

      if (response.data && response.data.rows) {
        setActivities(response.data.rows)
        setTotalItems(response.data.total || 0)
      } else {
        setError("Failed to fetch activity logs")
      }
    } catch (err) {
      console.error("Error fetching activity logs:", err)
      setError("An error occurred while fetching data")
    } finally {
      setLoading(false)
    }
  }

  // Fetch data on component mount and when pagination/search changes
  useEffect(() => {
    if (user?.id) {
      fetchActivities()
    }
  }, [pagination.page, pagination.rowsPerPage, searchQuery, user?.id])

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  // Get icon based on action type
  const getActionIcon = (action: string) => {
    if (action.includes("Hosting")) return <Activity className="w-4 h-4" />
    if (action.includes("Domain")) return <FileText className="w-4 h-4" />
    if (action.includes("SSL")) return <Shield className="w-4 h-4" />
    if (action.includes("Email")) return <FileText className="w-4 h-4" />
    if (action.includes("Subscription")) return <History className="w-4 h-4" />
    return <Activity className="w-4 h-4" />
  }

  // Get color based on action type
  const getActionColor = (action: string) => {
    if (action.includes("Added")) return "text-green-400"
    if (action.includes("Updated")) return "text-blue-400"
    if (action.includes("Deleted")) return "text-red-400"
    return "text-gray-400"
  }

  // Get background color based on action type
  const getActionBgColor = (action: string) => {
    if (action.includes("Added")) return "bg-green-500/20"
    if (action.includes("Updated")) return "bg-blue-500/20"
    if (action.includes("Deleted")) return "bg-red-500/20"
    return "bg-gray-500/20"
  }

  // Format the message for better readability
  const formatMessage = (message: string) => {
    if (!message.includes("|")) return message
    
    const parts = message.split("|")
    return parts.map((part, index) => (
      <div key={index} className="text-xs">
        {part.trim()}
      </div>
    ))
  }

  // Filter activities locally if needed (though API handles search)
  const filteredActivities = activities.filter(activity =>
    activity.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
    activity.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
    activity.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    activity.s_message.toLowerCase().includes(searchQuery.toLowerCase())
  )

//   if (loading) {
//     return (
//       <div className="min-h-screen">
//         <DashboardLoader label="Loading Activity data ...." />
//       </div>
//     )
//   }

  if (error) {
    return (
      <div className="min-h-screen">
        <Header title="Activity Log" tabs={navigationTabs} />
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
    <div className="min-h-screen pb-8">
      <Header title="Activity Log" tabs={navigationTabs} />

      <div className="px-4 sm:px-6 mt-6">
        <GlassCard className="p-6">
          {/* Header with Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <History className="w-6 h-6 text-[#CB8969]" />
                <h2 className="text-xl font-semibold text-white">Activity Log</h2>
              </div>
              <p className="text-sm text-gray-400 mt-1">
                Track all system activities and user actions.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder="Search activities..."
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
        Admin
      </th>
      <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-tertiary)]">
        Action
      </th>
      <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-tertiary)]">
        Details
      </th>
      <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-tertiary)]">
        Timestamp
      </th>
    </tr>
  </thead>
  <tbody>
    {loading ? (
      <tr>
        <td colSpan={5} className="text-center py-6">
          <DashboardLoader label="Loading Activity data ...." />
        </td>
      </tr>
    ) : (
      filteredActivities.map((activity, index) => (
        <tr
          key={activity.id}
          className="border-b border-[rgba(255,255,255,var(--glass-border-opacity))] hover:bg-[rgba(255,255,255,var(--ui-opacity-5))] transition-colors"
        >
          <td className="py-3 px-4 text-sm text-[var(--text-secondary)]">
            {(pagination.page * pagination.rowsPerPage) + index + 1}
          </td>
          <td className="py-3 px-4">
            <div>
              <div className="text-white font-medium">
                {activity.creator_name || activity.name || ""}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-400 font-medium">
                  {activity.role}
                </span>
              </div>
            </div>
          </td>
          <td className="py-3 px-4">
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${getActionColor(activity.action)} ${getActionBgColor(activity.action)}`}>
              {getActionIcon(activity.action)}
              {activity.s_action || activity.action}
            </div>
          </td>
          <td className="py-3 px-4">
            <div className="max-w-md">
              <div className="text-sm text-white mb-1">
                {formatMessage(activity.s_message || activity.message)}
              </div>
            </div>
          </td>
          <td className="py-3 px-4">
            <div className="flex items-center gap-2">
              <div>
                <div className="text-sm text-white">
                  {activity.created_at}
                </div>
                <div className="text-xs text-gray-400">
                  {new Date(activity.updated_at).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  })}
                </div>
              </div>
            </div>
          </td>
        </tr>
      ))
    )}
  </tbody>
</table>
            
            {filteredActivities.length === 0 && (
              <div className="text-center py-8">
                <span className="text-[var(--text-muted)]">No activity logs found</span>
              </div>
            )}
          </div>

          {/* Pagination */}
          {filteredActivities.length > 0 && (
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
    </div>
  )
}









// "use client"

// import { useState, useEffect } from "react"
// import axios from "axios"
// import { Header } from "@/components/layout"
// import { GlassCard } from "@/components/glass"
// import {
//   Search,
//   Clock,
//   User,
//   Shield,
//   Activity,
//   History,
//   FileText,
//   SearchCheckIcon
// } from "lucide-react"
// import { useAuth } from "@/contexts/AuthContext"
// import { getNavigationByRole } from "@/lib/getNavigationByRole"
// import Pagination from "@/common/Pagination"
// import DashboardLoader from "@/common/DashboardLoader"

// const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL

// interface ActivityLog {
//   id: number
//   user_id: number
//   action: string
//   message: string
//   s_action: string
//   s_message: string
//   created_at: string
//   updated_at: string
//   name: string
//   login_type: number
//   role: string
// }

// interface PaginationState {
//   page: number
//   rowsPerPage: number
// }

// export default function ActivityLogPage() {
//   const { user, getToken } = useAuth()
//   const navigationTabs = getNavigationByRole(user?.role)
//   const [activities, setActivities] = useState<ActivityLog[]>([])
//   const [loading, setLoading] = useState(true)
//   const [error, setError] = useState<string | null>(null)
//   const [searchQuery, setSearchQuery] = useState("")
//   const [pagination, setPagination] = useState<PaginationState>({
//     page: 0,
//     rowsPerPage: 10
//   })
//   const [totalItems, setTotalItems] = useState(0)
//   const token = getToken() // Adjust token storage as needed

//   // Fetch activity logs from API
//   const fetchActivities = async () => {
//     try {
//       setLoading(true)
      
//       const response = await axios.post(
//         `${BASE_URL}/secure/Activites/Get-acitivites`,
//         {
//           admin_id: user?.id, // Adjust based on your auth context
//           page: pagination.page,
//           rowsPerPage: pagination.rowsPerPage,
//           search: searchQuery,
//           orderBy: "id",
//           order: "desc"
//         },
//         {
//           headers: {
//             'Authorization': `Bearer ${token}`,
//             'Content-Type': 'application/json',
//             'Accept': 'application/json'
//           }
//         }
//       )

//       if (response.data && response.data.rows) {
//         setActivities(response.data.rows)
//         setTotalItems(response.data.total || 0)
//       } else {
//         setError("Failed to fetch activity logs")
//       }
//     } catch (err) {
//       console.error("Error fetching activity logs:", err)
//       setError("An error occurred while fetching data")
//     } finally {
//       setLoading(false)
//     }
//   }

//   // Fetch data on component mount and when pagination/search changes
//   useEffect(() => {
//     if (user?.id) {
//       fetchActivities()
//     }
//   }, [pagination.page, pagination.rowsPerPage, searchQuery, user?.id])

//   const handlePageChange = (newPage: number) => {
//     setPagination(prev => ({ ...prev, page: newPage }))
//   }

//   // Get icon based on action type
//   const getActionIcon = (action: string) => {
//     if (action.includes("Hosting")) return <Activity className="w-4 h-4" />
//     if (action.includes("Domain")) return <FileText className="w-4 h-4" />
//     if (action.includes("SSL")) return <Shield className="w-4 h-4" />
//     if (action.includes("Email")) return <FileText className="w-4 h-4" />
//     if (action.includes("Subscription")) return <History className="w-4 h-4" />
//     return <Activity className="w-4 h-4" />
//   }

//   // Get color based on action type
//   const getActionColor = (action: string) => {
//     if (action.includes("Added")) return "text-green-400"
//     if (action.includes("Updated")) return "text-blue-400"
//     if (action.includes("Deleted")) return "text-red-400"
//     return "text-gray-400"
//   }

//   // Get background color based on action type
//   const getActionBgColor = (action: string) => {
//     if (action.includes("Added")) return "bg-green-500/20"
//     if (action.includes("Updated")) return "bg-blue-500/20"
//     if (action.includes("Deleted")) return "bg-red-500/20"
//     return "bg-gray-500/20"
//   }

//   // Format the message for better readability
//   const formatMessage = (message: string) => {
//     if (!message.includes("|")) return message
    
//     const parts = message.split("|")
//     return parts.map((part, index) => (
//       <div key={index} className="text-xs">
//         {part.trim()}
//       </div>
//     ))
//   }

//   // Filter activities locally if needed (though API handles search)
//   const filteredActivities = activities.filter(activity =>
//     activity.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
//     activity.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
//     activity.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
//     activity.s_message.toLowerCase().includes(searchQuery.toLowerCase())
//   )

// //   if (loading) {
// //     return (
// //       <div className="min-h-screen">
// //         <DashboardLoader label="Loading Activity data ...." />
// //       </div>
// //     )
// //   }

//   if (error) {
//     return (
//       <div className="min-h-screen">
//         <Header title="Activity Log" tabs={navigationTabs} />
//         <div className="px-4 sm:px-6 mt-6">
//           <GlassCard className="p-6">
//             <div className="text-center py-8 text-red-400">
//               {error}
//             </div>
//           </GlassCard>
//         </div>
//       </div>
//     )
//   }

//   return (
//     <div className="min-h-screen pb-8">
//       <Header title="Activity Log" tabs={navigationTabs} />

//       <div className="px-4 sm:px-6 mt-6">
//         <GlassCard className="p-6">
//           {/* Header with Search */}
//           <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
//             <div>
//               <div className="flex items-center gap-2">
//                 <History className="w-6 h-6 text-[#CB8969]" />
//                 <h2 className="text-xl font-semibold text-white">Activity Log</h2>
//               </div>
//               <p className="text-sm text-gray-400 mt-1">
//                 Track all system activities and user actions.
//               </p>
//             </div>
//             <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
//               <div className="relative">
//                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
//                 <input
//                   type="text"
//                   placeholder="Search activities..."
//                   value={searchQuery}
//                   onChange={(e) => setSearchQuery(e.target.value)}
//                   className="pl-10 pr-4 py-2 w-full sm:w-auto bg-[rgba(255,255,255,var(--ui-opacity-10))] border border-[rgba(255,255,255,var(--glass-border-opacity))] rounded-lg text-white placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent"
//                 />
//               </div>
//             </div>
//           </div>

//           {/* Table */}
//           <div className="overflow-x-auto">
//             <table className="w-full min-w-[1000px]">
//               <thead>
//                 <tr className="border-b border-[rgba(255,255,255,var(--glass-border-opacity))]">
//                   <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-tertiary)] w-[60px]">
//                     S.NO
//                   </th>
//                   <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-tertiary)]">
//                     Admin
//                   </th>
//                   <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-tertiary)]">
//                     Action
//                   </th>
//                   <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-tertiary)]">
//                     Details
//                   </th>
//                   <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-tertiary)]">
//                     Timestamp
//                   </th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {
//                     loading ? (
//                       <tr>
//                         <td colSpan={6} className="text-center py-6">
//                           <DashboardLoader label="Loading Activity data ...." />
//                         </td>
//                       </tr>
//                     )
//                     : (
//                         filteredActivities.map((activity, index) => (
//                   <tr
//                     key={activity.id}
//                     className="border-b border-[rgba(255,255,255,var(--glass-border-opacity))] hover:bg-[rgba(255,255,255,var(--ui-opacity-5))] transition-colors"
//                   >
//                     <td className="py-3 px-4 text-sm text-[var(--text-secondary)]">
//                       {(pagination.page * pagination.rowsPerPage) + index + 1}
//                     </td>
//                     <td className="py-3 px-4">
//                      <div>
//                       <div className="text-purple-700">{activity?.name || ""}</div>
//                        <div className="flex items-center gap-2">
//                         <span className={`text-xs font-medium `}>
//                           {activity.role}
//                         </span>
//                       </div>
//                      </div>
//                     </td>
//                     <td className="py-3 px-4">
//                       <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${getActionColor(activity.action)} ${getActionBgColor(activity.action)}`}>
//                         {/* {getActionIcon(activity.action)} */}
//                         {activity.s_action || activity.action}
//                       </div>
//                     </td>
//                     <td className="py-3 px-4">
//                       <div className="max-w-md">
//                         <div className="text-sm text-white font-medium mb-1">
//                            {formatMessage(activity.s_message || activity.message)}
//                         </div>
//                         {/* <div className="text-xs text-gray-400">
                         
//                         </div> */}
//                       </div>
//                     </td>
//                     <td className="py-3 px-4">
//                       <div className="flex items-center gap-2">
//                         {/* <Clock className="w-4 h-4 text-[var(--text-muted)]" /> */}
//                         <div>
//                           <div className="text-sm text-white">
//                             {activity.created_at}
//                           </div>
//                           <div className="text-xs text-gray-400">
//                             {new Date(activity.updated_at).toLocaleTimeString('en-US', {
//                               hour: '2-digit',
//                               minute: '2-digit',
//                               second: '2-digit'
//                             })}
//                           </div>
//                         </div>
//                       </div>
//                     </td>
//                     <td className="py-3 px-4">
//                       <div className="flex items-center gap-2">
//                         {/* <User className="w-4 h-4 text-[var(--text-muted)]" /> */}
//                         <div>
//                           {/* <div className="text-sm text-white">
//                             User #{activity.user_id}
//                           </div> */}
//                           {/* <div className="text-xs text-gray-400">
//                             {activity.name || "System User"}
//                           </div> */}
//                         </div>
//                       </div>
//                     </td>
//                   </tr>
//                 ))
//                     )
//                 }
//               </tbody>
//             </table>
            
//             {filteredActivities.length === 0 && (
//               <div className="text-center py-8">
//                 <span className="text-[var(--text-muted)]">No activity logs found</span>
//               </div>
//             )}
//           </div>

//           {/* Pagination */}
//           {filteredActivities.length > 0 && (
//             <div className="mt-6">
//               <Pagination
//                 page={pagination.page}
//                 rowsPerPage={pagination.rowsPerPage}
//                 totalItems={totalItems}
//                 onPageChange={handlePageChange}
//               />
//             </div>
//           )}
//         </GlassCard>
//       </div>
//     </div>
//   )
// }