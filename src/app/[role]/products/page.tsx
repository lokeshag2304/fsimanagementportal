"use client"

import { useState } from "react"
import { Header } from "@/components/layout"
import { GlassCard, GlassButton } from "@/components/glass"
import {
  Edit,
  Trash2,
  Check,
  X,
  Search,
  Plus
} from "lucide-react"
import { navigationTabs } from "@/lib/navigation"

interface Product {
  id: number
  name: string
}

const initialData: Product[] = [
  { id: 1, name: "iPhone 15 Pro" },
  { id: 2, name: "Samsung Galaxy S24" },
  { id: 3, name: "MacBook Pro M3" },
  { id: 4, name: "Dell XPS 13" },
  { id: 5, name: "iPad Air" }
]

export default function ProductsPage() {
  const [data, setData] = useState<Product[]>(initialData)
  const [searchQuery, setSearchQuery] = useState("")
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editValue, setEditValue] = useState("")
  const [selectedItems, setSelectedItems] = useState<number[]>([])

  const filteredData = data.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleEdit = (item: Product) => {
    setEditingId(item.id)
    setEditValue(item.name)
  }

  const handleSave = (id: number) => {
    setData(data.map(item => 
      item.id === id ? { ...item, name: editValue } : item
    ))
    setEditingId(null)
    setEditValue("")
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditValue("")
  }

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this product?")) {
      setData(data.filter(item => item.id !== id))
      setSelectedItems(selectedItems.filter(selectedId => selectedId !== id))
    }
  }

  const handleAdd = () => {
    const newId = Math.max(...data.map(item => item.id)) + 1
    const newProduct: Product = {
      id: newId,
      name: "New Product"
    }
    setData([...data, newProduct])
    setEditingId(newId)
    setEditValue("New Product")
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
      <Header title="Products Management" tabs={navigationTabs} />

      <div className="px-4 sm:px-6 mt-6">
        <GlassCard className="p-6">
          {/* Header with Search and Add Button */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Products</h2>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-[rgba(255,255,255,var(--ui-opacity-10))] border border-gray-300 dark:border-[rgba(255,255,255,var(--glass-border-opacity))] rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent"
                />
              </div>
              <GlassButton
                variant="primary"
                onClick={handleAdd}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Product
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
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-tertiary)] w-[80px]">
                    S.NO
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-tertiary)]">
                    Name
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
                      {editingId === item.id ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-full px-3 py-2 bg-[rgba(255,255,255,var(--ui-opacity-10))] border border-[rgba(255,255,255,var(--glass-border-opacity))] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSave(item.id)
                            if (e.key === 'Escape') handleCancel()
                          }}
                        />
                      ) : (
                        <span className="text-sm text-white font-medium">
                          {item.name}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        {editingId === item.id ? (
                          <>
                            <button
                              onClick={() => handleSave(item.id)}
                              className="p-2 rounded-lg hover:bg-green-500/20 transition-colors"
                              title="Save"
                            >
                              <Check className="w-4 h-4 text-green-400" />
                            </button>
                            <button
                              onClick={handleCancel}
                              className="p-2 rounded-lg hover:bg-red-500/20 transition-colors"
                              title="Cancel"
                            >
                              <X className="w-4 h-4 text-red-400" />
                            </button>
                          </>
                        ) : (
                          <>
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
                          </>
                        )}
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
                {selectedItems.length} product{selectedItems.length > 1 ? 's' : ''} selected
              </span>
            </div>
          )}

          {filteredData.length === 0 && (
            <div className="text-center py-8">
              <span className="text-[var(--text-muted)]">No products found</span>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  )
}