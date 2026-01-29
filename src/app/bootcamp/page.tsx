"use client"

import { useState } from "react"
import Image from "next/image"
import { Header } from "@/components/layout"
import { GlassButton, GlassInput, GlassModal } from "@/components/glass"
import { DataTable, PageLayout } from "@/components/shared"
import { bootcampsData } from "@/lib/mock-data"
import {
  Rocket,
  Calendar,
  Users,
  DollarSign,
  Edit,
  Trash2,
  Clock,
  CheckCircle
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Bootcamp {
  id: number
  name: string
  duration: string
  participants: number
  startDate: string
  status: string
  price: number
  image?: string
}

export default function BootcampPage() {
  const [bootcamps, setBootcamps] = useState<Bootcamp[]>(bootcampsData)
  const [searchQuery, setSearchQuery] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBootcamp, setEditingBootcamp] = useState<Bootcamp | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    duration: "",
    startDate: "",
    price: "",
    status: "upcoming"
  })

  const filteredBootcamps = bootcamps.filter(b =>
    b.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAddNew = () => {
    setEditingBootcamp(null)
    setFormData({ name: "", duration: "", startDate: "", price: "", status: "upcoming" })
    setIsModalOpen(true)
  }

  const handleEdit = (bootcamp: Bootcamp) => {
    setEditingBootcamp(bootcamp)
    setFormData({
      name: bootcamp.name,
      duration: bootcamp.duration,
      startDate: bootcamp.startDate,
      price: bootcamp.price.toString(),
      status: bootcamp.status
    })
    setIsModalOpen(true)
  }

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this bootcamp?")) {
      setBootcamps(bootcamps.filter(b => b.id !== id))
    }
  }

  const handleSubmit = () => {
    if (editingBootcamp) {
      setBootcamps(bootcamps.map(b =>
        b.id === editingBootcamp.id
          ? { ...b, ...formData, price: parseFloat(formData.price), participants: b.participants }
          : b
      ))
    } else {
      const newBootcamp: Bootcamp = {
        id: Math.max(...bootcamps.map(b => b.id)) + 1,
        name: formData.name,
        duration: formData.duration,
        participants: 0,
        startDate: formData.startDate,
        status: formData.status,
        price: parseFloat(formData.price)
      }
      setBootcamps([...bootcamps, newBootcamp])
    }
    setIsModalOpen(false)
  }

  const columns = [
    {
      key: "name",
      header: "Bootcamp",
      render: (bootcamp: Bootcamp) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-[rgba(255,255,255,var(--ui-opacity-5))] border border-white/[0.04]">
            {bootcamp.image ? (
              <Image
                src={bootcamp.image}
                alt={bootcamp.name}
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Rocket className="w-5 h-5 text-[var(--text-muted)]" />
              </div>
            )}
          </div>
          <div>
            <p className="font-medium text-white">{bootcamp.name}</p>
            <p className="text-[var(--text-muted)] text-xs flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {bootcamp.duration}
            </p>
          </div>
        </div>
      )
    },
    {
      key: "duration",
      header: "Duration",
      render: (bootcamp: Bootcamp) => (
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[var(--text-muted)]" />
          <span className="text-[var(--text-secondary)]">{bootcamp.duration}</span>
        </div>
      )
    },
    {
      key: "participants",
      header: "Participants",
      render: (bootcamp: Bootcamp) => (
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-[var(--text-muted)]" />
          <span className="text-[var(--text-secondary)]">{bootcamp.participants}</span>
        </div>
      )
    },
    {
      key: "startDate",
      header: "Start Date",
      render: (bootcamp: Bootcamp) => (
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[var(--text-muted)]" />
          <span className="text-[var(--text-secondary)]">{new Date(bootcamp.startDate).toLocaleDateString()}</span>
        </div>
      )
    },
    {
      key: "price",
      header: "Price",
      render: (bootcamp: Bootcamp) => (
        <div className="flex items-center gap-1">
          <DollarSign className="w-4 h-4 text-green-400" />
          <span className="text-[var(--text-secondary)]">{bootcamp.price.toLocaleString('en-US')}</span>
        </div>
      )
    },
    {
      key: "status",
      header: "Status",
      render: (bootcamp: Bootcamp) => (
        <span className={`px-2 py-1 rounded-full text-xs ${
          bootcamp.status === "active"
            ? "bg-green-500/20 text-green-400"
            : "bg-blue-500/20 text-blue-400"
        }`}>
          {bootcamp.status}
        </span>
      )
    },
    {
      key: "actions",
      header: "Actions",
      render: (bootcamp: Bootcamp) => (
        <div className="flex items-center gap-2 justify-end">
          <button
            onClick={() => handleEdit(bootcamp)}
            className="p-2 rounded-lg hover:bg-[rgba(255,255,255,var(--ui-opacity-10))] transition-colors"
          >
            <Edit className="w-4 h-4 text-[var(--text-tertiary)]" />
          </button>
          <button
            onClick={() => handleDelete(bootcamp.id)}
            className="p-2 rounded-lg hover:bg-red-500/20 transition-colors"
          >
            <Trash2 className="w-4 h-4 text-red-400" />
          </button>
        </div>
      )
    }
  ]

  const totalParticipants = bootcamps.reduce((sum, b) => sum + b.participants, 0)
  const activeBootcamps = bootcamps.filter(b => b.status === "active").length
  const upcomingBootcamps = bootcamps.filter(b => b.status === "upcoming").length

  return (
    <div className="min-h-screen pb-8">
      {/* <Header title="Bootcamp Programs" tabs={navigationTabs} /> */}

      <div className="px-4 sm:px-6">
        <PageLayout
          stats={[
            { icon: Rocket, label: "Bootcamps", value: bootcamps.length },
            { icon: CheckCircle, label: "Active", value: activeBootcamps },
            { icon: Users, label: "Participants", value: totalParticipants },
            { icon: Calendar, label: "Upcoming", value: upcomingBootcamps }
          ]}
          searchPlaceholder="Search bootcamps..."
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          filterGroups={[
            { label: "Filter by Status", options: ["All Bootcamps", "Active", "Upcoming"] }
          ]}
          addButtonLabel="Add Bootcamp"
          onAddClick={handleAddNew}
        >
          <DataTable columns={columns} data={filteredBootcamps} />
        </PageLayout>
      </div>

      {/* Add/Edit Modal */}
      <GlassModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBootcamp ? "Edit Bootcamp" : "Add New Bootcamp"}
        size="lg"
      >
        <div className="space-y-3 sm:space-y-4">
          <div>
            <label className="block text-[var(--text-tertiary)] text-sm mb-2">Bootcamp Name</label>
            <GlassInput
              placeholder="Enter bootcamp name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-[var(--text-tertiary)] text-sm mb-2">Duration</label>
              <GlassInput
                placeholder="e.g., 12 weeks"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[var(--text-tertiary)] text-sm mb-2">Price ($)</label>
              <GlassInput
                type="number"
                placeholder="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-[var(--text-tertiary)] text-sm mb-2">Start Date</label>
              <GlassInput
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[var(--text-tertiary)] text-sm mb-2">Status</label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger className="w-full glass-input border-[rgba(255,255,255,var(--glass-border-opacity))] text-white">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="glass-dropdown border-[rgba(255,255,255,var(--glass-border-opacity))]">
                  <SelectItem value="upcoming" className="text-[var(--text-secondary)] focus:bg-[rgba(255,255,255,var(--ui-opacity-10))] focus:text-white">Upcoming</SelectItem>
                  <SelectItem value="active" className="text-[var(--text-secondary)] focus:bg-[rgba(255,255,255,var(--ui-opacity-10))] focus:text-white">Active</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2 sm:gap-3 pt-3 sm:pt-4">
            <GlassButton variant="ghost" className="flex-1" onClick={() => setIsModalOpen(false)}>
              Cancel
            </GlassButton>
            <GlassButton variant="primary" className="flex-1" onClick={handleSubmit}>
              {editingBootcamp ? "Save Changes" : "Add Bootcamp"}
            </GlassButton>
          </div>
        </div>
      </GlassModal>
    </div>
  )
}
