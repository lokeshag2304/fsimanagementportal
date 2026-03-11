"use client"

import React, { useState, useEffect } from "react"
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
  ChevronDown,
  ChevronRight,
  Filter,
  Monitor,
  ChartColumnStacked as LucideChartColumnStacked
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { getNavigationByRole } from "@/lib/getNavigationByRole"
import Pagination from "@/common/Pagination"
import DashboardLoader from "@/common/DashboardLoader"

interface ActivityItem {
  id: number
  creator_name: string | null
  role: string | null
  action_type: string | null
  module: string | null
  table_name: string | null
  record_id: number | null
  old_data: Record<string, any> | null
  new_data: Record<string, any> | null
  description: string | null
  ip_address: string | null
  created_at: string
}

export default function ActivityPage() {
  const { user, getToken } = useAuth()
  const token = getToken()
  const navigationTabs = getNavigationByRole(user?.role)

  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalItems, setTotalItems] = useState(0)

  // Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [userFilter, setUserFilter] = useState("")
  const [moduleFilter, setModuleFilter] = useState("")
  const [actionFilter, setActionFilter] = useState("")
  const [dateFilter, setDateFilter] = useState("")
  const [showFilters, setShowFilters] = useState(false)

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
          userFilter,
          moduleFilter,
          actionFilter,
          dateFilter
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
      console.warn("Activity fetch error:", err?.response?.data?.message || err.message)
      setError(err.response?.data?.message || "Failed to load activities")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchActivities()
  }, [pagination.page, pagination.rowsPerPage, searchQuery, userFilter, moduleFilter, actionFilter, dateFilter, user?.id])

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  const getActionIcon = (moduleName: string | null) => {
    const mod = (moduleName || "").toUpperCase()
    if (mod.includes("SSL")) return <Shield className="w-3.5 h-3.5" />
    if (mod.includes("EMAIL")) return <FileText className="w-3.5 h-3.5" />
    if (mod.includes("COUNTER")) return <LucideChartColumnStacked className="w-3.5 h-3.5" />;
    return <Activity className="w-3.5 h-3.5" />
  }

  const getActionColor = (action: string | null) => {
    if (!action) return "text-gray-400"
    const a = action.toUpperCase()
    if (a.includes("CREATE") || a.includes("ADD")) return "text-green-400 font-semibold"
    if (a.includes("UPDATE")) return "text-blue-400 font-semibold"
    if (a.includes("DELETE")) return "text-red-400 font-semibold"
    if (a.includes("EXPORT")) return "text-amber-400 font-semibold"
    if (a.includes("IMPORT")) return "text-purple-400 font-semibold"
    return "text-gray-400 font-semibold"
  }

  const getActionBgColor = (action: string | null) => {
    if (!action) return "bg-gray-500/20 border-[rgba(255,255,255,0.1)]"
    const a = action.toUpperCase()
    if (a.includes("CREATE") || a.includes("ADD")) return "bg-green-500/10 border-green-500/20 text-green-400"
    if (a.includes("UPDATE")) return "bg-blue-500/10 border-blue-500/20 text-blue-400"
    if (a.includes("DELETE")) return "bg-red-500/10 border-red-500/20 text-red-400"
    if (a.includes("EXPORT")) return "bg-amber-500/10 border-amber-500/20 text-amber-400"
    if (a.includes("IMPORT")) return "bg-purple-500/10 border-purple-500/20 text-purple-400"
    return "bg-gray-500/20 border-[rgba(255,255,255,0.1)] text-gray-400"
  }

  // Returns true if the value looks like a base64 / encrypted token that wasn't decrypted
  const isLikelyEncrypted = (val: any): boolean => {
    if (val === null || val === undefined || val === "") return false
    const str = String(val)
    if (str.length < 16) return false
    // Must be ALL base64 chars with NO spaces or punctuation (dashes, dots, etc.)
    return /^[A-Za-z0-9+/=]{16,}$/.test(str) && !/[\s\-\_\.\,\:\@\/]/.test(str)
  }

  // Humanize a raw change value to something readable
  const formatChangeValue = (val: any, fieldName: string): string => {
    if (val === null || val === undefined || val === "") return "none"
    const str = String(val)

    // Status: 1/0 → Active/Inactive
    if (fieldName.toLowerCase() === "status") {
      return str === "1" || str === "active" ? "Active" : str === "0" || str === "inactive" ? "Inactive" : str
    }

    // Date: YYYY-MM-DD → "25 Mar 2026"
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      try {
        const d = new Date(str)
        return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
      } catch { return str }
    }

    return str
  }

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
                <h2 className="text-xl font-semibold text-white">Full Audit Trail</h2>
              </div>
              <p className="text-sm text-gray-400 mt-1">
                Track detailed system activities and user actions.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder="Global search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full sm:w-auto bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.1)] rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-lg border flex items-center gap-2 transition-all ${showFilters ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-[rgba(255,255,255,0.1)] border-[rgba(255,255,255,0.1)] text-white hover:bg-[rgba(255,255,255,0.15)]'
                  }`}
              >
                <Filter className="w-4 h-4" />
                <span className="text-sm hidden sm:inline">Filters</span>
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 rounded-lg bg-[rgba(0,0,0,0.2)] border border-[rgba(255,255,255,0.05)]">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">User</label>
                <input
                  type="text"
                  placeholder="Filter by user..."
                  value={userFilter}
                  onChange={(e) => setUserFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded text-sm text-white"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Module</label>
                <select
                  value={moduleFilter}
                  onChange={(e) => setModuleFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded text-sm text-white [&>option]:bg-gray-800"
                >
                  <option value="">All Modules</option>
                  <option value="Subscription">Subscriptions</option>
                  <option value="Domains">Domains</option>
                  <option value="SSL">SSL</option>
                  <option value="Clients">Clients</option>
                  <option value="Users">Users</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Action</label>
                <select
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded text-sm text-white [&>option]:bg-gray-800"
                >
                  <option value="">All Actions</option>
                  <option value="CREATE">CREATE</option>
                  <option value="UPDATE">UPDATE</option>
                  <option value="DELETE">DELETE</option>
                  <option value="EXPORT">EXPORT</option>
                  <option value="IMPORT">IMPORT</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Date</label>
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded text-sm text-white [color-scheme:dark]"
                />
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="border-[rgba(255,255,255,0.05)] text-sm font-medium text-gray-300">
                  <th className="py-4 px-4 font-semibold w-16">S.NO</th>
                  <th className="py-4 px-4 font-semibold">Admin</th>
                  <th className="py-4 px-4 font-semibold text-center sm:text-left">Action</th>
                  <th className="py-4 px-4 font-semibold">Details</th>
                  <th className="py-4 px-4 font-semibold text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-8">
                      <DashboardLoader label="Loading Audit Trail ...." />
                    </td>
                  </tr>
                ) : activities.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center border-b border-[rgba(255,255,255,0.05)]">
                      <div className="flex flex-col items-center gap-2">
                        <History className="w-12 h-12 text-gray-500/50" />
                        <span className="text-gray-400 text-sm">No activity logs found.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  activities.map((activity, index) => {
                    let product_name = "";
                    let client_name = "";
                    let changes: any[] = [];
                    if (activity.new_data && Array.isArray(activity.new_data.changes)) {
                      changes = activity.new_data.changes;
                      const rawProduct = activity.new_data.product_name || "";
                      const rawClient = activity.new_data.client_name || "";
                      // Only show if not encrypted
                      product_name = isLikelyEncrypted(rawProduct) ? "" : rawProduct;
                      client_name = isLikelyEncrypted(rawClient) ? "" : rawClient;
                    }

                    // Filter and humanize changes
                    const cleanChanges = changes
                      .filter((c: any) => {
                        // Skip changes where either old or new is an encrypted blob
                        if (isLikelyEncrypted(c.old) || isLikelyEncrypted(c.new)) return false;
                        // Skip noisy / technical fields
                        const f = (c.field || "").toLowerCase();
                        if (["client", "product", "vendor", "remark histories count", "record type",
                          "days left", "days to delete", "expiry date"].includes(f)) return false;
                        // Skip changes where nothing actually changed meaningfully
                        const o = c.old !== null && c.old !== undefined && c.old !== "" ? String(c.old) : "none";
                        const n = c.new !== null && c.new !== undefined && c.new !== "" ? String(c.new) : "none";
                        return o !== n;
                      });

                    return (
                      <tr key={activity.id} className="border-t border-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.02)] transition-colors text-sm">
                        <td className="py-4 px-4 text-gray-400 font-medium whitespace-nowrap">
                          {(pagination.page * pagination.rowsPerPage) + index + 1}
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap">
                          <div className="text-white font-medium">{activity.creator_name || "System"}</div>
                          <div className="text-gray-500 text-xs mt-0.5">{activity.role || "Unknown"}</div>
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap text-center sm:text-left">
                          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${getActionColor(activity.action_type)} ${getActionBgColor(activity.action_type)}`}>
                            {getActionIcon(activity.module)}
                            <span>{activity.module} {activity.action_type === 'CREATE' ? 'Created' : activity.action_type === 'UPDATE' ? 'Updated' : activity.action_type === 'DELETE' ? 'Deleted' : activity.action_type === 'EXPORT' ? 'Exported' : activity.action_type === 'IMPORT' ? 'Imported' : activity.action_type}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 min-w-[250px]">
                          <div className="flex flex-col gap-1.5 text-xs text-gray-200 font-medium">
                            {activity.record_id && <div>Row: <span className="text-white font-bold">{activity.record_id}</span></div>}
                            {client_name && <div>Client: <span className="text-white">{client_name}</span></div>}
                            {product_name && <div>Product: <span className="text-white">{product_name}</span></div>}
                            {cleanChanges.length > 0 ? (
                              <div className="mt-2 space-y-1">
                                {cleanChanges.map((change: any, idx: number) => {
                                  const field = (change.field || "").toLowerCase() === "count" ? "Amount" : (change.field || "")
                                  const oldStr = formatChangeValue(change.old, field)
                                  const newStr = formatChangeValue(change.new, field)
                                  return (
                                    <div key={idx} className="flex flex-col gap-0.5 border-l-2 border-blue-500/30 pl-2 pb-1">
                                      <span className="text-gray-400 font-bold text-[10px] uppercase tracking-wider">{field}</span>
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-gray-500 line-through text-[11px]">{oldStr}</span>
                                        <span className="text-gray-400">→</span>
                                        <span className="text-white font-bold text-sm">{newStr}</span>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            ) : (
                              <div className="text-gray-400 mt-1">
                                {client_name || product_name ? null : (activity.description || "—")}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-gray-300 whitespace-nowrap text-right text-xs">
                          <div className="flex items-center justify-end gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                            <span>{activity.created_at}</span>
                          </div>
                        </td>
                      </tr>
                    )
                  })
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