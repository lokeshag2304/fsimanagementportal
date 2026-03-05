"use client"

import { useState, useEffect } from "react"
import api from "@/lib/api"
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
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { getNavigationByRole } from "@/lib/getNavigationByRole"
import Pagination from "@/common/Pagination"
import DashboardLoader from "@/common/DashboardLoader"

interface ActivityItem {
  id: number
  user_id: number
  action: string
  message: string
  s_action?: string
  s_message?: string
  creator_name?: string
  name?: string
  role?: string
  login_type?: number
  created_at: string
  updated_at: string
}

export default function ActivityPage() {
  const { user, getToken } = useAuth()
  const token = getToken()
  const navigationTabs = getNavigationByRole(user?.role)

  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [totalItems, setTotalItems] = useState(0)
  const [pagination, setPagination] = useState({
    page: 0,
    rowsPerPage: 20,
  })

  const fetchActivities = async () => {
    if (!user?.id || !token) return
    try {
      setLoading(true)
      setError(null)

      const response = await api.post(
        "/secure/Activites/Get-acitivites",
        {
          admin_id: user.id,
          page: pagination.page + 1,
          rowsPerPage: pagination.rowsPerPage,
          order: "desc",
          orderBy: "id",
          search: searchQuery,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      )

      setActivities(response.data.rows || [])
      setTotalItems(response.data.total || 0)
    } catch (err: any) {
      console.error("Activity fetch error:", err)
      setError(err.response?.data?.message || "Failed to load activities")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchActivities()
  }, [pagination.page, pagination.rowsPerPage, searchQuery, user?.id])

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  const getActionIcon = (action: string) => {
    if (!action) return <Activity className="w-4 h-4" />
    if (action.includes("Hosting")) return <Activity className="w-4 h-4" />
    if (action.includes("Domain")) return <FileText className="w-4 h-4" />
    if (action.includes("SSL")) return <Shield className="w-4 h-4" />
    if (action.includes("Email")) return <FileText className="w-4 h-4" />
    if (action.includes("Subscription")) return <History className="w-4 h-4" />
    if (action.includes("User") || action.includes("Client")) return <User className="w-4 h-4" />
    return <Activity className="w-4 h-4" />
  }

  const getActionColor = (action: string) => {
    if (!action) return "text-gray-400"
    const a = action.toLowerCase()
    if (a.includes("added") || a.includes("created") || a.includes("import")) return "text-green-400"
    if (a.includes("updated")) return "text-blue-400"
    if (a.includes("deleted")) return "text-red-400"
    return "text-gray-400"
  }

  const getActionBgColor = (action: string) => {
    if (!action) return "bg-gray-500/20"
    const a = action.toLowerCase()
    if (a.includes("added") || a.includes("created") || a.includes("import")) return "bg-green-500/20"
    if (a.includes("updated")) return "bg-blue-500/20"
    if (a.includes("deleted")) return "bg-red-500/20"
    return "bg-gray-500/20"
  }

  const formatMessage = (message: string) => {
    if (!message) return "—"
    if (!message.includes("|")) return message
    return message.split("|").map((part, index) => (
      <div key={index} className="text-xs">
        {part.trim()}
      </div>
    ))
  }

  const filteredActivities = activities.filter(activity => {
    if (!activity) return false
    const q = searchQuery.toLowerCase()
    if (!q) return true
    return (
      (activity.action?.toLowerCase().includes(q) || false) ||
      (activity.message?.toLowerCase().includes(q) || false) ||
      (activity.role?.toLowerCase().includes(q) || false) ||
      (activity.s_message?.toLowerCase().includes(q) || false) ||
      (activity.creator_name?.toLowerCase().includes(q) || false)
    )
  })

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
                  className="pl-10 pr-4 py-2 w-full sm:w-auto bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.1)] rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.1)]">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-300 w-[60px]">S.NO</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Admin</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Action</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Details</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-6">
                      <DashboardLoader label="Loading Activity data ...." />
                    </td>
                  </tr>
                ) : filteredActivities.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <History className="w-12 h-12 text-gray-400" />
                        <span className="text-gray-400">No activity logs found</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredActivities.map((activity, index) => (
                    <tr
                      key={activity.id}
                      className="border-b border-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.02)] transition-colors"
                    >
                      <td className="py-3 px-4 text-sm text-gray-400">
                        {(pagination.page * pagination.rowsPerPage) + index + 1}
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <div className="text-white font-medium">
                            {activity.creator_name || activity.name || "System"}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-400 font-medium">{activity.role}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div
                          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${getActionColor(activity.action)} ${getActionBgColor(activity.action)}`}
                        >
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
                          <Clock className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="text-sm text-white">{activity.created_at}</div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!loading && totalItems > 0 && (
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