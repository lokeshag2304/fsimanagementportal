"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/layout"
import { GlassCard, GlassButton, GlassInput, GlassModal, GlassSelect } from "@/components/glass"
import {
  Edit,
  Trash2,
  Search,
  Plus,
  Calendar,
  DollarSign,
  Package,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react"
import { navigationTabs } from "@/lib/navigation"

interface Subscription {
  id: number
  product: string
  renewalDate: string
  amount: number
  remark: string
  // These fields are calculated/auto-generated
  nextRenewIn: number
  todayDate: string
  status: 'Active' | 'Expired' | 'Pending' | 'Cancelled'
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

// Calculate status based on renewal date
const calculateStatus = (renewalDate: string): 'Active' | 'Expired' | 'Pending' | 'Cancelled' => {
  const today = new Date()
  const renewal = new Date(renewalDate)
  const daysUntilRenewal = calculateDaysBetween(today, renewal)
  
  if (daysUntilRenewal < 0) return 'Expired'
  if (daysUntilRenewal <= 7) return 'Pending'
  if (daysUntilRenewal > 7) return 'Active'
  return 'Active'
}

const initialData: Subscription[] = [
  {
    id: 1,
    product: "Premium Hosting",
    renewalDate: "2024-12-15",
    amount: 299.99,
    remark: "Auto-renew enabled",
    nextRenewIn: 45,
    todayDate: getTodayDate(),
    status: "Active"
  },
  {
    id: 2,
    product: "Domain Registration",
    renewalDate: "2024-11-30",
    amount: 19.99,
    remark: "Need to confirm",
    nextRenewIn: 30,
    todayDate: getTodayDate(),
    status: "Pending"
  },
  {
    id: 3,
    product: "SSL Certificate",
    renewalDate: "2024-10-15",
    amount: 89.99,
    remark: "Expired last month",
    nextRenewIn: -15,
    todayDate: getTodayDate(),
    status: "Expired"
  },
  {
    id: 4,
    product: "Business Email",
    renewalDate: "2025-01-20",
    amount: 149.99,
    remark: "Annual plan",
    nextRenewIn: 80,
    todayDate: getTodayDate(),
    status: "Active"
  },
  {
    id: 5,
    product: "Cloud Storage",
    renewalDate: "2024-11-05",
    amount: 49.99,
    remark: "Monthly subscription",
    nextRenewIn: 5,
    todayDate: getTodayDate(),
    status: "Pending"
  }
]

export default function SubscriptionsPage() {
  const [data, setData] = useState<Subscription[]>(initialData)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedItems, setSelectedItems] = useState<number[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null)
  const [formData, setFormData] = useState({
    product: "",
    renewalDate: "",
    amount: "",
    remark: ""
  })

  // Update todayDate and calculations whenever data changes
  useEffect(() => {
    const updatedData = data.map(item => {
      const today = new Date()
      const renewal = new Date(item.renewalDate)
      const nextRenewIn = calculateDaysBetween(today, renewal)
      const status = calculateStatus(item.renewalDate)
      
      return {
        ...item,
        todayDate: getTodayDate(),
        nextRenewIn,
        status
      }
    })
    setData(updatedData)
  }, [])

  const filteredData = data.filter(item =>
    item.product.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.remark.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAdd = () => {
    setEditingSubscription(null)
    setFormData({
      product: "",
      renewalDate: "",
      amount: "",
      remark: ""
    })
    setIsModalOpen(true)
  }

  const handleEdit = (subscription: Subscription) => {
    setEditingSubscription(subscription)
    setFormData({
      product: subscription.product,
      renewalDate: subscription.renewalDate,
      amount: subscription.amount.toString(),
      remark: subscription.remark
    })
    setIsModalOpen(true)
  }

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this subscription?")) {
      setData(data.filter(item => item.id !== id))
      setSelectedItems(selectedItems.filter(selectedId => selectedId !== id))
    }
  }

  const handleSubmit = () => {
    const today = new Date()
    const renewal = new Date(formData.renewalDate)
    const nextRenewIn = calculateDaysBetween(today, renewal)
    const status = calculateStatus(formData.renewalDate)

    if (editingSubscription) {
      setData(data.map(item =>
        item.id === editingSubscription.id
          ? {
              ...item,
              product: formData.product,
              renewalDate: formData.renewalDate,
              amount: parseFloat(formData.amount),
              remark: formData.remark,
              todayDate: getTodayDate(),
              nextRenewIn,
              status
            }
          : item
      ))
    } else {
      const newSubscription: Subscription = {
        id: Math.max(...data.map(item => item.id)) + 1,
        product: formData.product,
        renewalDate: formData.renewalDate,
        amount: parseFloat(formData.amount),
        remark: formData.remark,
        todayDate: getTodayDate(),
        nextRenewIn,
        status
      }
      setData([...data, newSubscription])
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

  const getStatusColor = (status: Subscription['status']) => {
    switch (status) {
      case 'Active': return 'text-green-400'
      case 'Pending': return 'text-yellow-400'
      case 'Expired': return 'text-red-400'
      case 'Cancelled': return 'text-gray-400'
      default: return 'text-gray-400'
    }
  }

  const getStatusIcon = (status: Subscription['status']) => {
    switch (status) {
      case 'Active': return <CheckCircle className="w-4 h-4" />
      case 'Pending': return <Clock className="w-4 h-4" />
      case 'Expired': return <XCircle className="w-4 h-4" />
      case 'Cancelled': return <AlertCircle className="w-4 h-4" />
      default: return <AlertCircle className="w-4 h-4" />
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  return (
    <div className="min-h-screen pb-8">
      <Header title="Subscription Management" tabs={navigationTabs} />

      <div className="px-4 sm:px-6 mt-6">
        <GlassCard className="p-6">
          {/* Header with Search and Add Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-xl font-semibold text-white">Subscriptions</h2>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder="Search subscriptions..."
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
                Add Subscription
              </GlassButton>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
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
                    Product
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-tertiary)]">
                    Renewal Date
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-tertiary)]">
                    Amount
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-tertiary)]">
                    Remark
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-tertiary)]">
                    Next Renew In
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-tertiary)]">
                    Today's Date
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-tertiary)]">
                    Status
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-[var(--text-tertiary)] w-[120px]">
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
                        <Package className="w-4 h-4 text-[var(--text-muted)]" />
                        <span className="text-sm text-white font-medium">{item.product}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[var(--text-muted)]" />
                        <span className="text-sm text-[var(--text-secondary)]">
                          {new Date(item.renewalDate).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-[var(--text-muted)]" />
                        <span className="text-sm text-[var(--text-secondary)]">
                          {formatCurrency(item.amount)}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-[var(--text-muted)]" />
                        <span className="text-sm text-[var(--text-secondary)] max-w-[150px] truncate">
                          {item.remark}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Clock className={`w-4 h-4 ${
                          item.nextRenewIn < 0 ? 'text-red-400' : 
                          item.nextRenewIn <= 7 ? 'text-yellow-400' : 
                          'text-green-400'
                        }`} />
                        <span className={`text-sm font-medium ${
                          item.nextRenewIn < 0 ? 'text-red-400' : 
                          item.nextRenewIn <= 7 ? 'text-yellow-400' : 
                          'text-green-400'
                        }`}>
                          {item.nextRenewIn >= 0 ? `${item.nextRenewIn} days` : `${Math.abs(item.nextRenewIn)} days ago`}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-[var(--text-secondary)]">
                        {new Date(item.todayDate).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className={getStatusColor(item.status)}>
                          {getStatusIcon(item.status)}
                        </span>
                        <span className={`text-sm font-medium ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                      </div>
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
          </div>

          {/* Selected Items Info */}
          {selectedItems.length > 0 && (
            <div className="mt-4 p-3 bg-[rgba(255,255,255,var(--ui-opacity-5))] rounded-lg border border-[rgba(255,255,255,var(--glass-border-opacity))]">
              <span className="text-sm text-[var(--text-secondary)]">
                {selectedItems.length} subscription{selectedItems.length > 1 ? 's' : ''} selected
              </span>
            </div>
          )}

          {filteredData.length === 0 && (
            <div className="text-center py-8">
              <span className="text-[var(--text-muted)]">No subscriptions found</span>
            </div>
          )}
        </GlassCard>
      </div>

      {/* Add/Edit Modal */}
      <GlassModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSubscription ? "Edit Subscription" : "Add New Subscription"}
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-[var(--text-tertiary)] text-sm mb-2">Product Name</label>
            <GlassInput
              placeholder="Enter product name"
              value={formData.product}
              onChange={(e) => setFormData({ ...formData, product: e.target.value })}
            />
          </div>
          
          <div>
            <label className="block text-[var(--text-tertiary)] text-sm mb-2">Renewal Date</label>
            <GlassInput
              type="date"
              value={formData.renewalDate}
              onChange={(e) => setFormData({ ...formData, renewalDate: e.target.value })}
            />
          </div>
          
          <div>
            <label className="block text-[var(--text-tertiary)] text-sm mb-2">Amount</label>
            <GlassInput
              type="number"
              placeholder="Enter amount"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              min="0"
              step="0.01"
            />
          </div>
          
          <div>
            <label className="block text-[var(--text-tertiary)] text-sm mb-2">Remark</label>
            <textarea
              placeholder="Enter any remarks or notes"
              value={formData.remark}
              onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
              className="w-full px-4 py-2 bg-[rgba(255,255,255,var(--ui-opacity-10))] border border-[rgba(255,255,255,var(--glass-border-opacity))] rounded-lg text-white placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent resize-none"
              rows={3}
            />
          </div>
          
          {/* Display-only fields (not editable in form) */}
          <div className="pt-4 border-t border-[rgba(255,255,255,var(--glass-border-opacity))]">
            <h4 className="text-sm font-medium text-[var(--text-tertiary)] mb-3">Auto-generated Information</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <div className="text-[var(--text-muted)]">Next Renew In</div>
                <div className="text-white">
                  {formData.renewalDate ? 
                    (() => {
                      const today = new Date()
                      const renewal = new Date(formData.renewalDate)
                      const days = calculateDaysBetween(today, renewal)
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
                <div className="text-white">
                  {formData.renewalDate ? 
                    (() => {
                      const status = calculateStatus(formData.renewalDate)
                      return <span className={getStatusColor(status)}>{status}</span>
                    })() 
                    : '--'
                  }
                </div>
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
              disabled={!formData.product || !formData.renewalDate || !formData.amount}
            >
              {editingSubscription ? "Save Changes" : "Add Subscription"}
            </GlassButton>
          </div>
        </div>
      </GlassModal>
    </div>
  )
}