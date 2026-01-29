"use client"

import { useState } from "react"
import Image from "next/image"
import { Header } from "@/components/layout"
import { GlassButton, GlassInput, GlassModal } from "@/components/glass"
import { DataTable, PageLayout } from "@/components/shared"
import { ebooksData } from "@/lib/mock-data"
import {
  Book,
  Star,
  DollarSign,
  Edit,
  Trash2,
  ShoppingCart,
  User
} from "lucide-react"

interface Ebook {
  id: number
  title: string
  author: string
  price: number
  sales: number
  category: string
  rating: number
  image?: string
}

export default function EbooksPage() {
  const [ebooks, setEbooks] = useState<Ebook[]>(ebooksData)
  const [searchQuery, setSearchQuery] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEbook, setEditingEbook] = useState<Ebook | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    price: "",
    category: ""
  })

  const filteredEbooks = ebooks.filter(e =>
    e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.author.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAddNew = () => {
    setEditingEbook(null)
    setFormData({ title: "", author: "", price: "", category: "" })
    setIsModalOpen(true)
  }

  const handleEdit = (ebook: Ebook) => {
    setEditingEbook(ebook)
    setFormData({
      title: ebook.title,
      author: ebook.author,
      price: ebook.price.toString(),
      category: ebook.category
    })
    setIsModalOpen(true)
  }

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this e-book?")) {
      setEbooks(ebooks.filter(e => e.id !== id))
    }
  }

  const handleSubmit = () => {
    if (editingEbook) {
      setEbooks(ebooks.map(e =>
        e.id === editingEbook.id
          ? { ...e, ...formData, price: parseFloat(formData.price) }
          : e
      ))
    } else {
      const newEbook: Ebook = {
        id: Math.max(...ebooks.map(e => e.id)) + 1,
        title: formData.title,
        author: formData.author,
        price: parseFloat(formData.price),
        sales: 0,
        category: formData.category,
        rating: 0
      }
      setEbooks([...ebooks, newEbook])
    }
    setIsModalOpen(false)
  }

  const columns = [
    {
      key: "title",
      header: "E-Book",
      render: (ebook: Ebook) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-[rgba(255,255,255,var(--ui-opacity-5))] border border-white/[0.04]">
            {ebook.image ? (
              <Image
                src={ebook.image}
                alt={ebook.title}
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Book className="w-5 h-5 text-[var(--text-muted)]" />
              </div>
            )}
          </div>
          <div>
            <p className="font-medium text-white">{ebook.title}</p>
            <p className="text-[var(--text-muted)] text-xs flex items-center gap-1">
              <User className="w-3 h-3" />
              {ebook.author}
            </p>
          </div>
        </div>
      )
    },
    {
      key: "category",
      header: "Category",
      render: (ebook: Ebook) => (
        <span className="text-[var(--text-secondary)]">{ebook.category}</span>
      )
    },
    {
      key: "price",
      header: "Price",
      render: (ebook: Ebook) => (
        <div className="flex items-center gap-1">
          <DollarSign className="w-4 h-4 text-green-400" />
          <span className="text-[var(--text-secondary)]">{ebook.price.toFixed(2)}</span>
        </div>
      )
    },
    {
      key: "sales",
      header: "Sales",
      render: (ebook: Ebook) => (
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-4 h-4 text-[var(--text-muted)]" />
          <span className="text-[var(--text-secondary)]">{ebook.sales}</span>
        </div>
      )
    },
    {
      key: "rating",
      header: "Rating",
      render: (ebook: Ebook) => (
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
          <span className="text-[var(--text-secondary)]">{ebook.rating}</span>
        </div>
      )
    },
    {
      key: "actions",
      header: "Actions",
      render: (ebook: Ebook) => (
        <div className="flex items-center gap-2 justify-end">
          <button
            onClick={() => handleEdit(ebook)}
            className="p-2 rounded-lg hover:bg-[rgba(255,255,255,var(--ui-opacity-10))] transition-colors"
          >
            <Edit className="w-4 h-4 text-[var(--text-tertiary)]" />
          </button>
          <button
            onClick={() => handleDelete(ebook.id)}
            className="p-2 rounded-lg hover:bg-red-500/20 transition-colors"
          >
            <Trash2 className="w-4 h-4 text-red-400" />
          </button>
        </div>
      )
    }
  ]

  const totalSales = ebooks.reduce((sum, e) => sum + e.sales, 0)
  const totalRevenue = ebooks.reduce((sum, e) => sum + e.price * e.sales, 0)
  const avgRating = (ebooks.reduce((sum, e) => sum + e.rating, 0) / ebooks.length).toFixed(1)

  return (
    <div className="min-h-screen pb-8">
      {/* <Header title="E-Books" tabs={navigationTabs} /> */}

      <div className="px-4 sm:px-6">
        <PageLayout
          stats={[
            { icon: Book, label: "E-Books", value: ebooks.length },
            { icon: ShoppingCart, label: "Sales", value: totalSales },
            { icon: DollarSign, label: "Revenue", value: `$${(totalRevenue / 1000).toFixed(0)}k` },
            { icon: Star, label: "Rating", value: avgRating }
          ]}
          searchPlaceholder="Search e-books..."
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          filterGroups={[
            { label: "Filter by Category", options: ["All E-Books", "Development", "Design", "Marketing"] }
          ]}
          addButtonLabel="Add E-Book"
          onAddClick={handleAddNew}
        >
          <DataTable columns={columns} data={filteredEbooks} />
        </PageLayout>
      </div>

      {/* Add/Edit Modal */}
      <GlassModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingEbook ? "Edit E-Book" : "Add New E-Book"}
        size="lg"
      >
        <div className="space-y-3 sm:space-y-4">
          <div>
            <label className="block text-[var(--text-tertiary)] text-sm mb-2">Title</label>
            <GlassInput
              placeholder="Enter e-book title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-[var(--text-tertiary)] text-sm mb-2">Author</label>
              <GlassInput
                placeholder="Author name"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[var(--text-tertiary)] text-sm mb-2">Price ($)</label>
              <GlassInput
                type="number"
                placeholder="0.00"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-[var(--text-tertiary)] text-sm mb-2">Category</label>
            <GlassInput
              placeholder="Category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            />
          </div>
          <div className="flex gap-2 sm:gap-3 pt-3 sm:pt-4">
            <GlassButton variant="ghost" className="flex-1" onClick={() => setIsModalOpen(false)}>
              Cancel
            </GlassButton>
            <GlassButton variant="primary" className="flex-1" onClick={handleSubmit}>
              {editingEbook ? "Save Changes" : "Add E-Book"}
            </GlassButton>
          </div>
        </div>
      </GlassModal>
    </div>
  )
}
