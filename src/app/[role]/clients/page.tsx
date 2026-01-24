"use client"

import { useState } from "react"
import { Header } from "@/components/layout"
import { GlassCard, GlassButton, GlassInput, GlassModal } from "@/components/glass"
import {
  Edit,
  Trash2,
  Search,
  Plus,
  Mail,
  Phone,
  MapPin
} from "lucide-react"
import { navigationTabs } from "@/lib/navigation"

interface Client {
  id: number
  name: string
  email: string
  phone: string
  address: string
  password: string
}

const initialData: Client[] = [
  {
    id: 1,
    name: "John Smith",
    email: "john.smith@email.com",
    phone: "+1 234 567 8901",
    address: "123 Main St, New York, NY",
    password: "password123"
  },
  {
    id: 2,
    name: "Sarah Johnson",
    email: "sarah.johnson@email.com",
    phone: "+1 234 567 8902",
    address: "456 Oak Ave, Los Angeles, CA",
    password: "password456"
  },
  {
    id: 3,
    name: "Mike Wilson",
    email: "mike.wilson@email.com",
    phone: "+1 234 567 8903",
    address: "789 Pine Rd, Chicago, IL",
    password: "password789"
  }
]

export default function ClientsPage() {
  const [data, setData] = useState<Client[]>(initialData)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedItems, setSelectedItems] = useState<number[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    password: ""
  })

  const filteredData = data.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAdd = () => {
    setEditingClient(null)
    setFormData({ name: "", email: "", phone: "", address: "", password: "" })
    setIsModalOpen(true)
  }

  const handleEdit = (client: Client) => {
    setEditingClient(client)
    setFormData({
      name: client.name,
      email: client.email,
      phone: client.phone,
      address: client.address,
      password: client.password
    })
    setIsModalOpen(true)
  }

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this client?")) {
      setData(data.filter(item => item.id !== id))
      setSelectedItems(selectedItems.filter(selectedId => selectedId !== id))
    }
  }

  const handleSubmit = () => {
    if (editingClient) {
      setData(data.map(item =>
        item.id === editingClient.id
          ? { ...item, ...formData }
          : item
      ))
    } else {
      const newClient: Client = {
        id: Math.max(...data.map(item => item.id)) + 1,
        ...formData
      }
      setData([...data, newClient])
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

  return (
    <div className="min-h-screen pb-8">
      <Header title="Clients Management" tabs={navigationTabs} />

      <div className="px-4 sm:px-6 mt-6">
        <GlassCard className="p-6">
          {/* Header with Search and Add Button */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Clients</h2>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder="Search clients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-[rgba(255,255,255,var(--ui-opacity-10))] border border-[rgba(255,255,255,var(--glass-border-opacity))] rounded-lg text-white placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent"
                />
              </div>
              <GlassButton
                variant="primary"
                onClick={handleAdd}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Client
              </GlassButton>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
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
                    Name
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-tertiary)]">
                    Email
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-tertiary)]">
                    Phone
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-tertiary)]">
                    Address
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-tertiary)]">
                    Password
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
                      <span className="text-sm text-white font-medium">{item.name}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-[var(--text-muted)]" />
                        <span className="text-sm text-[var(--text-secondary)]">{item.email}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-[var(--text-muted)]" />
                        <span className="text-sm text-[var(--text-secondary)]">{item.phone}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-[var(--text-muted)]" />
                        <span className="text-sm text-[var(--text-secondary)] max-w-[200px] truncate">{item.address}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-[var(--text-secondary)]">••••••••</span>
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
                {selectedItems.length} client{selectedItems.length > 1 ? 's' : ''} selected
              </span>
            </div>
          )}

          {filteredData.length === 0 && (
            <div className="text-center py-8">
              <span className="text-[var(--text-muted)]">No clients found</span>
            </div>
          )}
        </GlassCard>
      </div>

      {/* Add/Edit Modal */}
      <GlassModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingClient ? "Edit Client" : "Add New Client"}
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-[var(--text-tertiary)] text-sm mb-2">Name</label>
            <GlassInput
              placeholder="Enter client name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-[var(--text-tertiary)] text-sm mb-2">Email</label>
            <GlassInput
              type="email"
              placeholder="Enter email address"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-[var(--text-tertiary)] text-sm mb-2">Phone Number</label>
            <GlassInput
              placeholder="Enter phone number"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-[var(--text-tertiary)] text-sm mb-2">Address</label>
            <GlassInput
              placeholder="Enter address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-[var(--text-tertiary)] text-sm mb-2">Password</label>
            <GlassInput
              type="password"
              placeholder="Enter password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>
          <div className="flex gap-3 pt-4">
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
            >
              {editingClient ? "Save Changes" : "Add Client"}
            </GlassButton>
          </div>
        </div>
      </GlassModal>
    </div>
  )
}