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
  Globe,
  Package,
  Hash,
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  MessageSquare
} from "lucide-react"
import { navigationTabs } from "@/lib/navigation"

interface Email {
  id: number
  client: string
  domainName: string
  product: string
  quantity: number
  billType: string
  startDate: string
  endDate: string
  daysToExpire: number
  todayDate: string
  status: 'Active' | 'Expired' | 'Suspended' | 'Pending'
  remark: string
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

// Calculate status based on end date
const calculateStatus = (endDate: string): 'Active' | 'Expired' | 'Suspended' | 'Pending' => {
  const today = new Date()
  const expire = new Date(endDate)
  const daysUntilExpire = calculateDaysBetween(today, expire)
  
  if (daysUntilExpire < 0) return 'Expired'
  if (daysUntilExpire <= 7) return 'Pending'
  if (daysUntilExpire > 7) return 'Active'
  return 'Suspended'
}

// Calculate days until expiration
const calculateDaysToExpire = (endDate: string): number => {
  const today = new Date()
  const expire = new Date(endDate)
  return calculateDaysBetween(today, expire)
}

const initialData: Email[] = [
  {
    id: 1,
    client: "John Smith",
    domainName: "example.com",
    product: "Business Email Pro",
    quantity: 5,
    billType: "Annual",
    startDate: "2024-01-01",
    endDate: "2024-12-31",
    daysToExpire: 60,
    todayDate: getTodayDate(),
    status: "Active",
    remark: "Auto-renew enabled"
  },
  {
    id: 2,
    client: "Sarah Johnson",
    domainName: "myshop.com",
    product: "Enterprise Email",
    quantity: 20,
    billType: "Monthly",
    startDate: "2024-10-01",
    endDate: "2024-11-15",
    daysToExpire: 10,
    todayDate: getTodayDate(),
    status: "Pending",
    remark: "Payment pending"
  },
  {
    id: 3,
    client: "Mike Wilson",
    domainName: "blog-site.org",
    product: "Basic Email",
    quantity: 3,
    billType: "Annual",
    startDate: "2023-11-01",
    endDate: "2024-10-01",
    daysToExpire: -15,
    todayDate: getTodayDate(),
    status: "Expired",
    remark: "Renewal required"
  },
  {
    id: 4,
    client: "David Brown",
    domainName: "api-service.net",
    product: "Enterprise Email Plus",
    quantity: 50,
    billType: "Quarterly",
    startDate: "2024-03-01",
    endDate: "2025-02-28",
    daysToExpire: 120,
    todayDate: getTodayDate(),
    status: "Active",
    remark: "Bulk pricing applied"
  },
  {
    id: 5,
    client: "Emma Davis",
    domainName: "store-app.io",
    product: "Business Email Basic",
    quantity: 10,
    billType: "Monthly",
    startDate: "2024-09-01",
    endDate: "2024-11-30",
    daysToExpire: 30,
    todayDate: getTodayDate(),
    status: "Active",
    remark: "Trial period ending"
  }
]

export default function EmailsPage() {
  const [data, setData] = useState<Email[]>(initialData)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedItems, setSelectedItems] = useState<number[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEmail, setEditingEmail] = useState<Email | null>(null)
  const [formData, setFormData] = useState({
    client: "",
    domainName: "",
    product: "",
    quantity: "",
    billType: "",
    startDate: "",
    endDate: ""
  })

  // Update todayDate and calculations whenever data changes
  useEffect(() => {
    const updatedData = data.map(item => {
      const daysToExpire = calculateDaysToExpire(item.endDate)
      const status = calculateStatus(item.endDate)
      
      return {
        ...item,
        todayDate: getTodayDate(),
        daysToExpire,
        status
      }
    })
    setData(updatedData)
  }, [])

  const filteredData = data.filter(item =>
    item.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.domainName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.product.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAdd = () => {
    setEditingEmail(null)
    setFormData({
      client: "",
      domainName: "",
      product: "",
      quantity: "",
      billType: "",
      startDate: "",
      endDate: ""
    })
    setIsModalOpen(true)
  }

  const handleEdit = (email: Email) => {
    setEditingEmail(email)
    setFormData({
      client: email.client,
      domainName: email.domainName,
      product: email.product,
      quantity: email.quantity.toString(),
      billType: email.billType,
      startDate: email.startDate,
      endDate: email.endDate
    })
    setIsModalOpen(true)
  }

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this email account?")) {
      setData(data.filter(item => item.id !== id))
      setSelectedItems(selectedItems.filter(selectedId => selectedId !== id))
    }
  }

  const handleSubmit = () => {
    const daysToExpire = calculateDaysToExpire(formData.endDate)
    const status = calculateStatus(formData.endDate)
    const remark = generateRemark(formData.endDate, formData.billType)

    if (editingEmail) {
      setData(data.map(item =>
        item.id === editingEmail.id
          ? {
              ...item,
              client: formData.client,
              domainName: formData.domainName,
              product: formData.product,
              quantity: parseInt(formData.quantity),
              billType: formData.billType,
              startDate: formData.startDate,
              endDate: formData.endDate,
              todayDate: getTodayDate(),
              daysToExpire,
              status,
              remark
            }
          : item
      ))
    } else {
      const newEmail: Email = {
        id: Math.max(...data.map(item => item.id)) + 1,
        client: formData.client,
        domainName: formData.domainName,
        product: formData.product,
        quantity: parseInt(formData.quantity),
        billType: formData.billType,
        startDate: formData.startDate,
        endDate: formData.endDate,
        todayDate: getTodayDate(),
        daysToExpire,
        status,
        remark
      }
      setData([...data, newEmail])
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

  const getStatusColor = (status: Email['status']) => {
    switch (status) {
      case 'Active': return 'text-green-400'
      case 'Pending': return 'text-yellow-400'
      case 'Expired': return 'text-red-400'
      case 'Suspended': return 'text-gray-400'
      default: return 'text-gray-400'
    }
  }

  const getStatusIcon = (status: Email['status']) => {
    switch (status) {
      case 'Active': return <CheckCircle className="w-4 h-4" />
      case 'Pending': return <AlertCircle className="w-4 h-4" />
      case 'Expired': return <XCircle className="w-4 h-4" />
      case 'Suspended': return <Clock className="w-4 h-4" />
      default: return <AlertCircle className="w-4 h-4" />
    }
  }

  // Generate remark based on end date and bill type
  const generateRemark = (endDate: string, billType: string): string => {
    const days = calculateDaysToExpire(endDate)
    
    if (days < 0) return "Renewal overdue"
    if (days <= 7) return `Expiring in ${days} days`
    if (billType === "Monthly") return "Monthly billing active"
    if (billType === "Annual") return "Annual plan - auto renew"
    if (billType === "Quarterly") return "Quarterly payment due"
    
    return "Active subscription"
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
    "Business Email Pro",
    "Enterprise Email",
    "Basic Email",
    "Enterprise Email Plus",
    "Business Email Basic",
    "Personal Email",
    "Team Email",
    "Custom Email Solution"
  ]

  // Sample bill type options
  const billTypeOptions = [
    "Monthly",
    "Annual",
    "Quarterly",
    "Semi-Annual",
    "One-time"
  ]

  return (
    <div className="min-h-screen pb-8">
      <Header title="Email Accounts Management" tabs={navigationTabs} />

      <div className="px-4 sm:px-6 mt-6">
        <GlassCard className="p-6">
          {/* Header with Search and Add Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-xl font-semibold text-white">Email Accounts</h2>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder="Search email accounts..."
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
                Add Email Account
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
                    Domain Name
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-tertiary)]">
                    Product
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-tertiary)]">
                    Quantity
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-tertiary)]">
                    Bill Type
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-tertiary)]">
                    Start Date
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-tertiary)]">
                    End Date
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-tertiary)]">
                    Days to Expire
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-tertiary)]">
                    Today's Date
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-tertiary)]">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-tertiary)]">
                    Remark
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
                       
                        <span className="text-sm text-white font-medium">{item.client}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                       
                        <span className="text-sm text-[var(--text-secondary)]">{item.domainName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                       
                        <span className="text-sm text-[var(--text-secondary)]">{item.product}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                       
                        <span className="text-sm text-[var(--text-secondary)]">{item.quantity}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                     
                        <span className="text-sm text-[var(--text-secondary)]">{item.billType}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                       
                        <span className="text-sm text-[var(--text-secondary)]">
                          {new Date(item.startDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        
                        <span className="text-sm text-[var(--text-secondary)]">
                          {new Date(item.endDate).toLocaleDateString('en-US', {
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
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(item.status)} bg-opacity-20 ${
                        item.status === 'Active' ? 'bg-green-500/20' :
                        item.status === 'Pending' ? 'bg-yellow-500/20' :
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
                {selectedItems.length} email account{selectedItems.length > 1 ? 's' : ''} selected
              </span>
            </div>
          )}

          {filteredData.length === 0 && (
            <div className="text-center py-8">
              <span className="text-[var(--text-muted)]">No email accounts found</span>
            </div>
          )}
        </GlassCard>
      </div>

      {/* Add/Edit Modal */}
      <GlassModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingEmail ? "Edit Email Account" : "Add New Email Account"}
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
          
          <div>
            <label className="block text-[var(--text-tertiary)] text-sm mb-2">Domain Name</label>
            <GlassInput
              placeholder="Enter domain name (e.g., example.com)"
              value={formData.domainName}
              onChange={(e) => setFormData({ ...formData, domainName: e.target.value })}
            />
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
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[var(--text-tertiary)] text-sm mb-2">Quantity</label>
              <GlassInput
                type="number"
                placeholder="Number of emails"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                min="1"
              />
            </div>
            
            <div>
              <label className="block text-[var(--text-tertiary)] text-sm mb-2">Bill Type</label>
              <select
                value={formData.billType}
                onChange={(e) => setFormData({ ...formData, billType: e.target.value })}
                className="w-full px-4 py-2 bg-[rgba(255,255,255,var(--ui-opacity-10))] border border-[rgba(255,255,255,var(--glass-border-opacity))] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent"
              >
                <option value="">Select bill type</option>
                {billTypeOptions.map((type, index) => (
                  <option key={index} value={type} className="bg-gray-800 text-white">
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[var(--text-tertiary)] text-sm mb-2">Start Date</label>
              <GlassInput
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>
            
            <div>
              <label className="block text-[var(--text-tertiary)] text-sm mb-2">End Date</label>
              <GlassInput
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>
          </div>
          
          {/* Display-only fields (not editable in form) */}
          <div className="pt-4 border-t border-[rgba(255,255,255,var(--glass-border-opacity))]">
            <h4 className="text-sm font-medium text-[var(--text-tertiary)] mb-3">Auto-generated Information</h4>
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div className="space-y-1">
                <div className="text-[var(--text-muted)]">Days to Expire</div>
                <div className={`font-medium ${
                  formData.endDate 
                    ? calculateDaysToExpire(formData.endDate) < 0 
                      ? 'text-red-400' 
                      : calculateDaysToExpire(formData.endDate) <= 7 
                        ? 'text-yellow-400'
                        : 'text-green-400'
                    : 'text-white'
                }`}>
                  {formData.endDate 
                    ? (() => {
                        const days = calculateDaysToExpire(formData.endDate)
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
                <div className={`font-medium ${formData.endDate ? getStatusColor(calculateStatus(formData.endDate)) : 'text-white'}`}>
                  {formData.endDate ? calculateStatus(formData.endDate) : '--'}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-[var(--text-muted)]">Remark</div>
                <div className="text-white truncate">
                  {formData.endDate && formData.billType ? generateRemark(formData.endDate, formData.billType) : '--'}
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
              disabled={!formData.client || !formData.domainName || !formData.product || !formData.quantity || !formData.billType || !formData.startDate || !formData.endDate}
            >
              {editingEmail ? "Save Changes" : "Add Email Account"}
            </GlassButton>
          </div>
        </div>
      </GlassModal>
    </div>
  )
}