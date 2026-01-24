"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/layout"
import { GlassCard, GlassButton, GlassInput, GlassModal } from "@/components/glass"
import {
  Edit,
  Trash2,
  Search,
  Plus,
  Calendar,
  User,
  Hash,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  MessageSquare,
  RefreshCw
} from "lucide-react"
import { navigationTabs } from "@/lib/navigation"

interface Counter {
  id: number
  client: string
  count: number
  validity: string
  daysToExpire: number
  todayDate: string
  product: string
  status: 'Active' | 'Expired' | 'Warning' | 'Inactive'
  remark: string
  lastUpdated: string
}

// Helper function to calculate days between dates
const calculateDaysBetween = (date1: Date, date2: Date): number => {
  const diffTime = Math.abs(date2.getTime() - date1.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

// Helper function to get today's date in YYYY-MM-DD format
const getTodayDate = (): string => {
  const today = new Date()
  return today.toISOString().split('T')[0]
}

// Helper function to get current date-time for last updated
const getCurrentDateTime = (): string => {
  const now = new Date()
  return now.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Calculate status based on validity date
const calculateStatus = (validity: string): 'Active' | 'Expired' | 'Warning' | 'Inactive' => {
  const today = new Date()
  const expire = new Date(validity)
  const daysUntilExpire = calculateDaysBetween(today, expire)
  
  if (daysUntilExpire < 0) return 'Expired'
  if (daysUntilExpire <= 7) return 'Warning'
  if (daysUntilExpire > 7) return 'Active'
  return 'Inactive'
}

// Calculate days until expiration
const calculateDaysToExpire = (validity: string): number => {
  const today = new Date()
  const expire = new Date(validity)
  return calculateDaysBetween(today, expire)
}

// Generate remark based on count and validity
const generateRemark = (count: number, validity: string): string => {
  const days = calculateDaysToExpire(validity)
  
  if (count === 0) return "No counts remaining"
  if (days < 0) return "Validity expired"
  if (days <= 7) return `Expiring in ${days} days`
  if (count < 10) return `Low count: ${count} remaining`
  if (count > 100) return "High usage account"
  
  return "Normal usage"
}

const initialData: Counter[] = [
  {
    id: 1,
    client: "John Smith",
    count: 150,
    validity: "2024-12-31",
    daysToExpire: 60,
    todayDate: getTodayDate(),
    product: "Premium API Calls",
    status: "Active",
    remark: "High usage account",
    lastUpdated: "2024-10-31 14:30"
  },
  {
    id: 2,
    client: "Sarah Johnson",
    count: 8,
    validity: "2024-11-15",
    daysToExpire: 15,
    todayDate: getTodayDate(),
    product: "SMS Credits",
    status: "Warning",
    remark: "Low count: 8 remaining",
    lastUpdated: "2024-10-31 10:15"
  },
  {
    id: 3,
    client: "Mike Wilson",
    count: 0,
    validity: "2024-10-01",
    daysToExpire: -10,
    todayDate: getTodayDate(),
    product: "Email Quota",
    status: "Expired",
    remark: "No counts remaining",
    lastUpdated: "2024-10-28 09:45"
  },
  {
    id: 4,
    client: "David Brown",
    count: 500,
    validity: "2025-03-20",
    daysToExpire: 150,
    todayDate: getTodayDate(),
    product: "Cloud Storage",
    status: "Active",
    remark: "High usage account",
    lastUpdated: "2024-10-31 16:20"
  },
  {
    id: 5,
    client: "Emma Davis",
    count: 45,
    validity: "2024-12-05",
    daysToExpire: 35,
    todayDate: getTodayDate(),
    product: "Database Queries",
    status: "Active",
    remark: "Normal usage",
    lastUpdated: "2024-10-30 11:10"
  }
]

export default function CounterPage() {
  const [data, setData] = useState<Counter[]>(initialData)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedItems, setSelectedItems] = useState<number[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCounter, setEditingCounter] = useState<Counter | null>(null)
  const [formData, setFormData] = useState({
    client: "",
    count: "",
    validity: "",
    product: ""
  })

  // Update todayDate and calculations whenever data changes
  useEffect(() => {
    const updatedData = data.map(item => {
      const daysToExpire = calculateDaysToExpire(item.validity)
      const status = calculateStatus(item.validity)
      const remark = generateRemark(item.count, item.validity)
      
      return {
        ...item,
        todayDate: getTodayDate(),
        daysToExpire,
        status,
        remark
      }
    })
    setData(updatedData)
  }, [])

  const filteredData = data.filter(item =>
    item.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.product.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.status.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAdd = () => {
    setEditingCounter(null)
    setFormData({
      client: "",
      count: "",
      validity: "",
      product: ""
    })
    setIsModalOpen(true)
  }

  const handleEdit = (counter: Counter) => {
    setEditingCounter(counter)
    setFormData({
      client: counter.client,
      count: counter.count.toString(),
      validity: counter.validity,
      product: counter.product
    })
    setIsModalOpen(true)
  }

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this counter?")) {
      setData(data.filter(item => item.id !== id))
      setSelectedItems(selectedItems.filter(selectedId => selectedId !== id))
    }
  }

  const handleRefresh = (id: number) => {
    if (confirm("Refresh this counter's data?")) {
      setData(data.map(item =>
        item.id === id
          ? {
              ...item,
              lastUpdated: getCurrentDateTime(),
              todayDate: getTodayDate()
            }
          : item
      ))
      alert("Counter data refreshed successfully!")
    }
  }

  const handleSubmit = () => {
    const daysToExpire = calculateDaysToExpire(formData.validity)
    const status = calculateStatus(formData.validity)
    const count = parseInt(formData.count)
    const remark = generateRemark(count, formData.validity)
    const lastUpdated = getCurrentDateTime()

    if (editingCounter) {
      setData(data.map(item =>
        item.id === editingCounter.id
          ? {
              ...item,
              client: formData.client,
              count,
              validity: formData.validity,
              product: formData.product,
              todayDate: getTodayDate(),
              daysToExpire,
              status,
              remark,
              lastUpdated
            }
          : item
      ))
    } else {
      const newCounter: Counter = {
        id: Math.max(...data.map(item => item.id)) + 1,
        client: formData.client,
        count,
        validity: formData.validity,
        todayDate: getTodayDate(),
        daysToExpire,
        product: formData.product,
        status,
        remark,
        lastUpdated
      }
      setData([...data, newCounter])
    }
    setIsModalOpen(false)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(filteredData.map(item => item.id))
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

  const isAllSelected = filteredData.length > 0 && selectedItems.length === filteredData.length

  const getStatusColor = (status: Counter['status']) => {
    switch (status) {
      case 'Active': return 'text-green-400'
      case 'Warning': return 'text-yellow-400'
      case 'Expired': return 'text-red-400'
      case 'Inactive': return 'text-gray-400'
      default: return 'text-gray-400'
    }
  }

  const getStatusIcon = (status: Counter['status']) => {
    switch (status) {
      case 'Active': return <CheckCircle className="w-4 h-4" />
      case 'Warning': return <AlertCircle className="w-4 h-4" />
      case 'Expired': return <XCircle className="w-4 h-4" />
      case 'Inactive': return <Clock className="w-4 h-4" />
      default: return <AlertCircle className="w-4 h-4" />
    }
  }

  // Sample client options
  const clientOptions = [
    "John Smith",
    "Sarah Johnson",
    "Mike Wilson",
    "David Brown",
    "Emma Davis",
    "Robert Taylor",
    "Lisa Anderson"
  ]

  // Sample product options
  const productOptions = [
    "Premium API Calls",
    "SMS Credits",
    "Email Quota",
    "Cloud Storage",
    "Database Queries",
    "File Uploads",
    "Video Processing",
    "AI Credits"
  ]

  return (
    <div className="min-h-screen pb-8">
      <Header title="Counter Management" tabs={navigationTabs} />

      <div className="px-4 sm:px-6 mt-6">
        <GlassCard className="p-6">
          {/* Header with Search and Add Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-xl font-semibold text-white">Counters</h2>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder="Search counters..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full sm:w-auto bg-[rgba(255,255,255,var(--ui-opacity-10))] border border-[rgba(255,255,255,var(--glass-border-opacity))] rounded-lg text-white placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent"
                />
              </div>
              <GlassButton
                variant="primary"
                onClick={handleAdd}
                className="flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Counter
              </GlassButton>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px]">
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
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-tertiary)] w-[60px]">
                    S.NO
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-tertiary)]">
                    Client
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-tertiary)]">
                    Count
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-tertiary)]">
                    Validity
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-tertiary)]">
                    Days to Expire
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-tertiary)]">
                    Today's Date
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-tertiary)]">
                    Product
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-tertiary)]">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-tertiary)]">
                    Remark
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-tertiary)]">
                    Last Updated
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-[var(--text-tertiary)] w-[140px]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item, index) => (
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
                      {index + 1}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                       
                        <span className="text-sm text-white font-medium">{item.client}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className={`flex items-center gap-2 ${
                        item.count === 0 ? 'text-red-400' : 
                        item.count < 10 ? 'text-yellow-400' : 
                        'text-green-400'
                      }`}>
                        
                        <span className="text-sm font-bold">{item.count}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        
                        <span className="text-sm text-[var(--text-secondary)]">
                          {new Date(item.validity).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                        item.daysToExpire < 0 
                          ? 'bg-red-500/20 text-red-400' 
                          : item.daysToExpire <= 7 
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-green-500/20 text-green-400'
                      }`}>
                      
                        {item.daysToExpire >= 0 ? `${item.daysToExpire} days` : `${Math.abs(item.daysToExpire)} days ago`}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-[var(--text-secondary)]">
                        {new Date(item.todayDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                       
                        <span className="text-sm text-[var(--text-secondary)]">{item.product}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(item.status)} bg-opacity-20 ${
                        item.status === 'Active' ? 'bg-green-500/20' :
                        item.status === 'Warning' ? 'bg-yellow-500/20' :
                        item.status === 'Expired' ? 'bg-red-500/20' :
                        'bg-gray-500/20'
                      }`}>
                       
                        {item.status}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                      
                        <span className="text-sm text-[var(--text-secondary)] max-w-[150px] truncate">
                          {item.remark}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                       
                        <span className="text-sm text-[var(--text-secondary)]">
                          {item.lastUpdated}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleRefresh(item.id)}
                          className="p-2 rounded-lg hover:bg-blue-500/20 transition-colors"
                          title="Refresh"
                        >
                          <RefreshCw className="w-4 h-4 text-blue-400" />
                        </button>
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
          </div>

          {/* Selected Items Info */}
          {selectedItems.length > 0 && (
            <div className="mt-4 p-3 bg-[rgba(255,255,255,var(--ui-opacity-5))] rounded-lg border border-[rgba(255,255,255,var(--glass-border-opacity))]">
              <span className="text-sm text-[var(--text-secondary)]">
                {selectedItems.length} counter{selectedItems.length > 1 ? 's' : ''} selected
              </span>
            </div>
          )}

          {filteredData.length === 0 && (
            <div className="text-center py-8">
              <span className="text-[var(--text-muted)]">No counters found</span>
            </div>
          )}
        </GlassCard>
      </div>

      {/* Add/Edit Modal */}
      <GlassModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCounter ? "Edit Counter" : "Add New Counter"}
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-[var(--text-tertiary)] text-sm mb-2">Client</label>
            <select
              value={formData.client}
              onChange={(e) => setFormData({ ...formData, client: e.target.value })}
              className="w-full px-4 py-2 bg-[rgba(255,255,255,var(--ui-opacity-10))] border border-[rgba(255,255,255,var(--glass-border-opacity))] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent"
            >
              <option value="">Select client</option>
              {clientOptions.map((client, index) => (
                <option key={index} value={client} className="bg-gray-800 text-white">
                  {client}
                </option>
              ))}
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[var(--text-tertiary)] text-sm mb-2">Count</label>
              <GlassInput
                type="number"
                placeholder="Enter count"
                value={formData.count}
                onChange={(e) => setFormData({ ...formData, count: e.target.value })}
                min="0"
              />
            </div>
            
            <div>
              <label className="block text-[var(--text-tertiary)] text-sm mb-2">Validity Date</label>
              <GlassInput
                type="date"
                value={formData.validity}
                onChange={(e) => setFormData({ ...formData, validity: e.target.value })}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-[var(--text-tertiary)] text-sm mb-2">Product</label>
            <select
              value={formData.product}
              onChange={(e) => setFormData({ ...formData, product: e.target.value })}
              className="w-full px-4 py-2 bg-[rgba(255,255,255,var(--ui-opacity-10))] border border-[rgba(255,255,255,var(--glass-border-opacity))] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent"
            >
              <option value="">Select product</option>
              {productOptions.map((product, index) => (
                <option key={index} value={product} className="bg-gray-800 text-white">
                  {product}
                </option>
              ))}
            </select>
          </div>
          
          {/* Display-only fields (not editable in form) */}
          <div className="pt-4 border-t border-[rgba(255,255,255,var(--glass-border-opacity))]">
            <h4 className="text-sm font-medium text-[var(--text-tertiary)] mb-3">Auto-generated Information</h4>
            <div className="grid grid-cols-5 gap-4 text-sm">
              <div className="space-y-1">
                <div className="text-[var(--text-muted)]">Days to Expire</div>
                <div className={`font-medium ${
                  formData.validity 
                    ? calculateDaysToExpire(formData.validity) < 0 
                      ? 'text-red-400' 
                      : calculateDaysToExpire(formData.validity) <= 7 
                        ? 'text-yellow-400'
                        : 'text-green-400'
                    : 'text-white'
                }`}>
                  {formData.validity 
                    ? (() => {
                        const days = calculateDaysToExpire(formData.validity)
                        return days >= 0 ? `${days} days` : `${Math.abs(days)} days ago`
                      })() 
                    : '-- days'
                  }
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-[var(--text-muted)]">Today's Date</div>
                <div className="text-white">{getTodayDate()}</div>
              </div>
              <div className="space-y-1">
                <div className="text-[var(--text-muted)]">Status</div>
                <div className={`font-medium ${formData.validity ? getStatusColor(calculateStatus(formData.validity)) : 'text-white'}`}>
                  {formData.validity ? calculateStatus(formData.validity) : '--'}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-[var(--text-muted)]">Remark</div>
                <div className="text-white truncate">
                  {formData.validity && formData.count 
                    ? generateRemark(parseInt(formData.count), formData.validity) 
                    : '--'
                  }
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-[var(--text-muted)]">Last Updated</div>
                <div className="text-white">{getCurrentDateTime()}</div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-6">
            <GlassButton
              variant="ghost"
              className="flex-1"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </GlassButton>
            <GlassButton
              variant="primary"
              className="flex-1"
              onClick={handleSubmit}
              disabled={!formData.client || !formData.count || !formData.validity || !formData.product}
            >
              {editingCounter ? "Save Changes" : "Add Counter"}
            </GlassButton>
          </div>
        </div>
      </GlassModal>
    </div>
  )
}   