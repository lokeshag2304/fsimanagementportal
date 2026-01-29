"use client"

import { useState } from "react"
import Image from "next/image"
import { Header } from "@/components/layout"
import { GlassButton, GlassInput, GlassModal } from "@/components/glass"
import { DataTable, PageLayout } from "@/components/shared"
import { teamTrainingData } from "@/lib/mock-data"
import {
  Building2,
  Users,
  Calendar,
  Edit,
  Trash2,
  TrendingUp
} from "lucide-react"
// import { navigationTabs } from "@/lib/navigation"

interface TeamTraining {
  id: number
  company: string
  program: string
  employees: number
  progress: number
  startDate: string
  image?: string
}

export default function TeamTrainingPage() {
  const [trainings, setTrainings] = useState<TeamTraining[]>(teamTrainingData)
  const [searchQuery, setSearchQuery] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTraining, setEditingTraining] = useState<TeamTraining | null>(null)
  const [formData, setFormData] = useState({
    company: "",
    program: "",
    employees: "",
    startDate: ""
  })

  const filteredTrainings = trainings.filter(t =>
    t.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.program.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAddNew = () => {
    setEditingTraining(null)
    setFormData({ company: "", program: "", employees: "", startDate: "" })
    setIsModalOpen(true)
  }

  const handleEdit = (training: TeamTraining) => {
    setEditingTraining(training)
    setFormData({
      company: training.company,
      program: training.program,
      employees: training.employees.toString(),
      startDate: training.startDate
    })
    setIsModalOpen(true)
  }

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this training program?")) {
      setTrainings(trainings.filter(t => t.id !== id))
    }
  }

  const handleSubmit = () => {
    if (editingTraining) {
      setTrainings(trainings.map(t =>
        t.id === editingTraining.id
          ? { ...t, ...formData, employees: parseInt(formData.employees) }
          : t
      ))
    } else {
      const newTraining: TeamTraining = {
        id: Math.max(...trainings.map(t => t.id)) + 1,
        company: formData.company,
        program: formData.program,
        employees: parseInt(formData.employees),
        progress: 0,
        startDate: formData.startDate
      }
      setTrainings([...trainings, newTraining])
    }
    setIsModalOpen(false)
  }

  const columns = [
    {
      key: "company",
      header: "Company",
      render: (training: TeamTraining) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-[rgba(255,255,255,var(--ui-opacity-5))] border border-white/[0.04]">
            {training.image ? (
              <Image
                src={training.image}
                alt={training.company}
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Building2 className="w-5 h-5 text-[var(--text-muted)]" />
              </div>
            )}
          </div>
          <div>
            <p className="font-medium text-white">{training.company}</p>
            <p className="text-[var(--text-muted)] text-xs flex items-center gap-1">
              <Building2 className="w-3 h-3" />
              {training.program}
            </p>
          </div>
        </div>
      )
    },
    {
      key: "employees",
      header: "Employees",
      render: (training: TeamTraining) => (
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-[var(--text-muted)]" />
          <span className="text-[var(--text-secondary)]">{training.employees}</span>
        </div>
      )
    },
    {
      key: "progress",
      header: "Progress",
      render: (training: TeamTraining) => (
        <div className="flex items-center gap-3">
          <div className="w-24 h-2 bg-[rgba(255,255,255,var(--ui-opacity-10))] rounded-full overflow-hidden">
            <div
              className="h-full bg-theme rounded-full"
              style={{ width: `${training.progress}%` }}
            />
          </div>
          <span className="text-[var(--text-secondary)] text-sm">{training.progress}%</span>
        </div>
      )
    },
    {
      key: "startDate",
      header: "Start Date",
      render: (training: TeamTraining) => (
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[var(--text-muted)]" />
          <span className="text-[var(--text-secondary)]">{new Date(training.startDate).toLocaleDateString()}</span>
        </div>
      )
    },
    {
      key: "actions",
      header: "Actions",
      render: (training: TeamTraining) => (
        <div className="flex items-center gap-2 justify-end">
          <button
            onClick={() => handleEdit(training)}
            className="p-2 rounded-lg hover:bg-[rgba(255,255,255,var(--ui-opacity-10))] transition-colors"
          >
            <Edit className="w-4 h-4 text-[var(--text-tertiary)]" />
          </button>
          <button
            onClick={() => handleDelete(training.id)}
            className="p-2 rounded-lg hover:bg-red-500/20 transition-colors"
          >
            <Trash2 className="w-4 h-4 text-red-400" />
          </button>
        </div>
      )
    }
  ]

  const totalEmployees = trainings.reduce((sum, t) => sum + t.employees, 0)
  const avgProgress = Math.round(trainings.reduce((sum, t) => sum + t.progress, 0) / trainings.length)

  return (
    <div className="min-h-screen pb-8">
      {/* <Header title="Team Training" tabs={navigationTabs} /> */}

      <div className="px-4 sm:px-6">
        <PageLayout
          stats={[
            { icon: Calendar, label: "Programs", value: trainings.length },
            { icon: Building2, label: "Companies", value: trainings.length },
            { icon: Users, label: "Employees", value: totalEmployees },
            { icon: TrendingUp, label: "Progress", value: `${avgProgress}%` }
          ]}
          searchPlaceholder="Search programs..."
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          filterGroups={[
            { label: "Filter by Progress", options: ["All Programs", "In Progress", "Completed"] }
          ]}
          addButtonLabel="Add Program"
          onAddClick={handleAddNew}
        >
          <DataTable columns={columns} data={filteredTrainings} />
        </PageLayout>
      </div>

      {/* Add/Edit Modal */}
      <GlassModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTraining ? "Edit Program" : "Add New Program"}
        size="lg"
      >
        <div className="space-y-3 sm:space-y-4">
          <div>
            <label className="block text-[var(--text-tertiary)] text-sm mb-2">Company Name</label>
            <GlassInput
              placeholder="Enter company name"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-[var(--text-tertiary)] text-sm mb-2">Program Name</label>
            <GlassInput
              placeholder="Enter program name"
              value={formData.program}
              onChange={(e) => setFormData({ ...formData, program: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-[var(--text-tertiary)] text-sm mb-2">Number of Employees</label>
              <GlassInput
                type="number"
                placeholder="0"
                value={formData.employees}
                onChange={(e) => setFormData({ ...formData, employees: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[var(--text-tertiary)] text-sm mb-2">Start Date</label>
              <GlassInput
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>
          </div>
          <div className="flex gap-2 sm:gap-3 pt-3 sm:pt-4">
            <GlassButton variant="ghost" className="flex-1" onClick={() => setIsModalOpen(false)}>
              Cancel
            </GlassButton>
            <GlassButton variant="primary" className="flex-1" onClick={handleSubmit}>
              {editingTraining ? "Save Changes" : "Add Program"}
            </GlassButton>
          </div>
        </div>
      </GlassModal>
    </div>
  )
}
