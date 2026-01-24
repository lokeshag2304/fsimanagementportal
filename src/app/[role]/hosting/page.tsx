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
  Globe,
  User,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react"
import { navigationTabs } from "@/lib/navigation"

interface SSL {
  id: number
  domainName: string
  client: string
  expireDate: string
  daysOfExpire: number
  todayDate: string
  products: string
  status: 'Active' | 'Expired' | 'Warning' | 'Inactive'
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

// Calculate status based on expiration date
const calculateStatus = (expireDate: string): 'Active' | 'Expired' | 'Warning' | 'Inactive' => {
  const today = new Date()
  const expire = new Date(expireDate)
  const daysUntilExpire = calculateDaysBetween(today, expire)
  
  if (daysUntilExpire < 0) return 'Expired'
  if (daysUntilExpire <= 30) return 'Warning'
  if (daysUntilExpire > 30) return 'Active'
  return 'Inactive'
}

// Calculate days until expiration
const calculateDaysOfExpire = (expireDate: string): number => {
  const today = new Date()
  const expire = new Date(expireDate)
  return calculateDaysBetween(today, expire)
}

const initialData: SSL[] = [
  {
    id: 1,
    domainName: "example.com",
    client: "John Smith",
    expireDate: "2024-12-31",
    daysOfExpire: 60,
    todayDate: getTodayDate(),
    products: "Wildcard SSL",
    status: "Active"
  },
  {
    id: 2,
    domainName: "myshop.com",
    client: "Sarah Johnson",
    expireDate: "2024-11-15",
    daysOfExpire: 15,
    todayDate: getTodayDate(),
    products: "EV SSL Certificate",
    status: "Warning"
  },
  {
    id: 3,
    domainName: "blog-site.org",
    client: "Mike Wilson",
    expireDate: "2024-10-01",
    daysOfExpire: -10,
    todayDate: getTodayDate(),
    products: "Standard SSL",
    status: "Expired"
  },
  {
    id: 4,
    domainName: "api-service.net",
    client: "David Brown",
    expireDate: "2025-03-20",
    daysOfExpire: 150,
    todayDate: getTodayDate(),
    products: "Multi-domain SSL",
    status: "Active"
  },
  {
    id: 5,
    domainName: "store-app.io",
    client: "Emma Davis",
    expireDate: "2024-12-05",
    daysOfExpire: 35,
    todayDate: getTodayDate(),
    products: "Code Signing SSL",
    status: "Active"
  }
]

export default function SSLPage() {
  const [data, setData] = useState<SSL[]>(initialData)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedItems, setSelectedItems] = useState<number[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSSL, setEditingSSL] = useState<SSL | null>(null)
  const [formData, setFormData] = useState({
    domainName: "",
    client: "",
    expireDate: "",
    products: ""
  })

  // Update todayDate and calculations whenever data changes
  useEffect(() => {
    const updatedData = data.map(item => {
      const daysOfExpire = calculateDaysOfExpire(item.expireDate)
      const status = calculateStatus(item.expireDate)
      
      return {
        ...item,
        todayDate: getTodayDate(),
        daysOfExpire,
        status
      }
    })
    setData(updatedData)
  }, [])

  const filteredData = data.filter(item =>
    item.domainName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.products.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAdd = () => {
    setEditingSSL(null)
    setFormData({
      domainName: "",
      client: "",
      expireDate: "",
      products: ""
    })
    setIsModalOpen(true)
  }

  const handleEdit = (ssl: SSL) => {
    setEditingSSL(ssl)
    setFormData({
      domainName: ssl.domainName,
      client: ssl.client,
      expireDate: ssl.expireDate,
      products: ssl.products
    })
    setIsModalOpen(true)
  }

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this SSL record?")) {
      setData(data.filter(item => item.id !== id))
      setSelectedItems(selectedItems.filter(selectedId => selectedId !== id))
    }
  }

  const handleSubmit = () => {
    const daysOfExpire = calculateDaysOfExpire(formData.expireDate)
    const status = calculateStatus(formData.expireDate)

    if (editingSSL) {
      setData(data.map(item =>
        item.id === editingSSL.id
          ? {
              ...item,
              domainName: formData.domainName,
              client: formData.client,
              expireDate: formData.expireDate,
              products: formData.products,
              todayDate: getTodayDate(),
              daysOfExpire,
              status
            }
          : item
      ))
    } else {
      const newSSL: SSL = {
        id: Math.max(...data.map(item => item.id)) + 1,
        domainName: formData.domainName,
        client: formData.client,
        expireDate: formData.expireDate,
        products: formData.products,
        todayDate: getTodayDate(),
        daysOfExpire,
        status
      }
      setData([...data, newSSL])
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

  const getStatusColor = (status: SSL['status']) => {
    switch (status) {
      case 'Active': return 'text-green-400'
      case 'Warning': return 'text-yellow-400'
      case 'Expired': return 'text-red-400'
      case 'Inactive': return 'text-gray-400'
      default: return 'text-gray-400'
    }
  }

  const getStatusIcon = (status: SSL['status']) => {
    switch (status) {
      case 'Active': return <CheckCircle className="w-4 h-4" />
      case 'Warning': return <AlertCircle className="w-4 h-4" />
      case 'Expired': return <XCircle className="w-4 h-4" />
      case 'Inactive': return <Clock className="w-4 h-4" />
      default: return <AlertCircle className="w-4 h-4" />
    }
  }

  // Sample client data for dropdown (you can fetch this from API)
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
    "Standard SSL",
    "Wildcard SSL",
    "EV SSL Certificate",
    "Multi-domain SSL",
    "Code Signing SSL",
    "OV SSL Certificate"
  ]

  return (
    <div className="min-h-screen pb-8">
      <Header title="Hosting Management" tabs={navigationTabs} />

      <div className="px-4 sm:px-6 mt-6">
        <GlassCard className="p-6">
          {/* Header with Search and Add Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-xl font-semibold text-white">Hosting</h2>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder="Search hosting..."
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
                Add Hosting
              </GlassButton>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
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
                    Domain Name
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-tertiary)]">
                    Client
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
                    Products
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
                        <Globe className="w-4 h-4 text-[var(--text-muted)]" />
                        <span className="text-sm text-white font-medium">{item.domainName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-[var(--text-muted)]" />
                        <span className="text-sm text-[var(--text-secondary)]">{item.client}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[var(--text-muted)]" />
                        <span className="text-sm text-[var(--text-secondary)]">
                          {new Date(item.expireDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                        item.daysOfExpire < 0 
                          ? 'bg-red-500/20 text-red-400' 
                          : item.daysOfExpire <= 30 
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-green-500/20 text-green-400'
                      }`}>
                        <Clock className="w-3 h-3" />
                        {item.daysOfExpire >= 0 ? `${item.daysOfExpire} days` : `${Math.abs(item.daysOfExpire)} days ago`}
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
                        <Package className="w-4 h-4 text-[var(--text-muted)]" />
                        <span className="text-sm text-[var(--text-secondary)]">{item.products}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(item.status)} bg-opacity-20 ${
                        item.status === 'Active' ? 'bg-green-500/20' :
                        item.status === 'Warning' ? 'bg-yellow-500/20' :
                        item.status === 'Expired' ? 'bg-red-500/20' :
                        'bg-gray-500/20'
                      }`}>
                        {getStatusIcon(item.status)}
                        {item.status}
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
                {selectedItems.length} SSL certificate{selectedItems.length > 1 ? 's' : ''} selected
              </span>
            </div>
          )}

          {filteredData.length === 0 && (
            <div className="text-center py-8">
              <span className="text-[var(--text-muted)]">No SSL certificates found</span>
            </div>
          )}
        </GlassCard>
      </div>

      {/* Add/Edit Modal */}
      <GlassModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSSL ? "Edit SSL Certificate" : "Add New SSL Certificate"}
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-[var(--text-tertiary)] text-sm mb-2">Domain Name</label>
            <GlassInput
              placeholder="Enter domain name (e.g., example.com)"
              value={formData.domainName}
              onChange={(e) => setFormData({ ...formData, domainName: e.target.value })}
            />
          </div>
          
          <div>
            <label className="block text-[var(--text-tertiary)] text-sm mb-2">Client</label>
            <select
              value={formData.client}
              onChange={(e) => setFormData({ ...formData, client: e.target.value })}
              className="w-full px-4 py-2 bg-[rgba(255,255,255,var(--ui-opacity-10))] border border-[rgba(255,255,255,var(--glass-border-opacity))] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent"
            >
              <option value="">Select a client</option>
              {clientOptions.map((client, index) => (
                <option key={index} value={client} className="bg-gray-800 text-white">
                  {client}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-[var(--text-tertiary)] text-sm mb-2">Expiration Date</label>
            <GlassInput
              type="date"
              value={formData.expireDate}
              onChange={(e) => setFormData({ ...formData, expireDate: e.target.value })}
            />
          </div>
          
          <div>
            <label className="block text-[var(--text-tertiary)] text-sm mb-2">SSL Product</label>
            <select
              value={formData.products}
              onChange={(e) => setFormData({ ...formData, products: e.target.value })}
              className="w-full px-4 py-2 bg-[rgba(255,255,255,var(--ui-opacity-10))] border border-[rgba(255,255,255,var(--glass-border-opacity))] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent"
            >
              <option value="">Select SSL product</option>
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
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="space-y-1">
                <div className="text-[var(--text-muted)]">Days to Expire</div>
                <div className={`font-medium ${
                  formData.expireDate 
                    ? calculateDaysOfExpire(formData.expireDate) < 0 
                      ? 'text-red-400' 
                      : calculateDaysOfExpire(formData.expireDate) <= 30 
                        ? 'text-yellow-400'
                        : 'text-green-400'
                    : 'text-white'
                }`}>
                  {formData.expireDate 
                    ? (() => {
                        const days = calculateDaysOfExpire(formData.expireDate)
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
                <div className={`font-medium ${formData.expireDate ? getStatusColor(calculateStatus(formData.expireDate)) : 'text-white'}`}>
                  {formData.expireDate ? calculateStatus(formData.expireDate) : '--'}
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
              disabled={!formData.domainName || !formData.client || !formData.expireDate || !formData.products}
            >
              {editingSSL ? "Save Changes" : "Add Hosting "}
            </GlassButton>
          </div>
        </div>
      </GlassModal>
    </div>
  )
}