"use client"

import { useState } from "react"
import Image from "next/image"
import { Header } from "@/components/layout"
import { GlassButton, GlassInput, GlassModal } from "@/components/glass"
import { DataTable, PageLayout } from "@/components/shared"
import {
  Edit,
  Trash2,
  UserCog,
  Users,
  Mail,
  Phone,
  Shield,
  ShieldCheck
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface SupportAdmin {
  id: number
  name: string
  email: string
  phone: string
  profile: string
  twoStepAuth: boolean
}

const supportAdminsData: SupportAdmin[] = [
  {
    id: 1,
    name: "John Smith",
    email: "john.smith@company.com",
    phone: "+1 234 567 8901",
    profile: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
    twoStepAuth: true
  },
  {
    id: 2,
    name: "Sarah Johnson",
    email: "sarah.johnson@company.com",
    phone: "+1 234 567 8902",
    profile: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face",
    twoStepAuth: false
  },
  {
    id: 3,
    name: "Mike Wilson",
    email: "mike.wilson@company.com",
    phone: "+1 234 567 8903",
    profile: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    twoStepAuth: true
  }
]

export default function SupportAdminPage() {
  const [admins, setAdmins] = useState<SupportAdmin[]>(supportAdminsData)
  const [searchQuery, setSearchQuery] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAdmin, setEditingAdmin] = useState<SupportAdmin | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    profile: ""
  })
  const [profilePreview, setProfilePreview] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        setFormData({ ...formData, profile: result })
        setProfilePreview(result)
      }
      reader.readAsDataURL(file)
    }
  }

  const filteredAdmins = admins.filter(admin =>
    admin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    admin.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAddNew = () => {
    setEditingAdmin(null)
    setFormData({ name: "", email: "", phone: "", password: "", profile: "" })
    setProfilePreview(null)
    setIsModalOpen(true)
  }

  const handleEdit = (admin: SupportAdmin) => {
    setEditingAdmin(admin)
    setFormData({
      name: admin.name,
      email: admin.email,
      phone: admin.phone,
      password: "",
      profile: admin.profile
    })
    setProfilePreview(admin.profile)
    setIsModalOpen(true)
  }

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this admin?")) {
      setAdmins(admins.filter(a => a.id !== id))
    }
  }

  const handleSubmit = () => {
    if (editingAdmin) {
      setAdmins(admins.map(a =>
        a.id === editingAdmin.id
          ? { ...a, ...formData }
          : a
      ))
    } else {
      const newAdmin: SupportAdmin = {
        id: Math.max(...admins.map(a => a.id)) + 1,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        profile: formData.profile,
        twoStepAuth: false
      }
      setAdmins([...admins, newAdmin])
    }
    setIsModalOpen(false)
  }

  const columns = [
    {
      key: "sno",
      header: "S.NO",
      className: "w-[60px]",
      render: (_: SupportAdmin, index: number) => (
        <span className="text-[var(--text-secondary)]">{String(index + 1)}</span>
      )
    },
    {
      key: "name",
      header: "Name",
      render: (admin: SupportAdmin) => (
        <span className="text-white font-medium">{admin.name}</span>
      )
    },
    {
      key: "email",
      header: "Email",
      render: (admin: SupportAdmin) => (
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-[var(--text-muted)]" />
          <span className="text-[var(--text-secondary)]">{admin.email}</span>
        </div>
      )
    },
    {
      key: "profile",
      header: "Profile",
      render: (admin: SupportAdmin) => (
        <div className="w-10 h-10 rounded-full overflow-hidden bg-[rgba(255,255,255,var(--ui-opacity-5))] border border-white/[0.04]">
          <Image
            src={admin.profile}
            alt={admin.name}
            width={40}
            height={40}
            className="w-full h-full object-cover"
          />
        </div>
      )
    },
    {
      key: "phone",
      header: "Phone",
      render: (admin: SupportAdmin) => (
        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4 text-[var(--text-muted)]" />
          <span className="text-[var(--text-secondary)]">{admin.phone}</span>
        </div>
      )
    },
    {
      key: "twoStepAuth",
      header: "Two Step Auth",
      render: (admin: SupportAdmin) => (
        <div className="flex items-center gap-2">
          {admin.twoStepAuth ? (
            <ShieldCheck className="w-4 h-4 text-green-400" />
          ) : (
            <Shield className="w-4 h-4 text-red-400" />
          )}
          <span className={admin.twoStepAuth ? "text-green-400" : "text-red-400"}>
            {admin.twoStepAuth ? "Enabled" : "Disabled"}
          </span>
        </div>
      )
    },
    {
      key: "actions",
      header: "Actions",
      render: (admin: SupportAdmin) => (
        <div className="flex items-center gap-2 justify-end">
          <button
            onClick={() => handleEdit(admin)}
            className="p-2 rounded-lg hover:bg-[rgba(255,255,255,var(--ui-opacity-10))] transition-colors"
          >
            <Edit className="w-4 h-4 text-[var(--text-tertiary)]" />
          </button>
          <button
            onClick={() => handleDelete(admin.id)}
            className="p-2 rounded-lg hover:bg-red-500/20 transition-colors"
          >
            <Trash2 className="w-4 h-4 text-red-400" />
          </button>
        </div>
      )
    }
  ]

  const totalAdmins = admins.length
  const activeAdmins = admins.filter(a => a.twoStepAuth).length

  return (
    <div className="min-h-screen pb-8">
      {/* <Header title="Support Admin Management" tabs={navigationTabs} /> */}

      <div className="px-4 sm:px-6">
        <PageLayout
          stats={[
            { icon: UserCog, label: "Total Admins", value: totalAdmins },
            { icon: ShieldCheck, label: "2FA Enabled", value: activeAdmins },
            { icon: Users, label: "Active", value: totalAdmins },
            { icon: Shield, label: "Security", value: `${Math.round((activeAdmins/totalAdmins)*100)}%` }
          ]}
          searchPlaceholder="Search support admins..."
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          filterGroups={[
            { label: "Filter by Status", options: ["All Admins", "2FA Enabled", "2FA Disabled"] }
          ]}
          addButtonLabel="Add Support Admin"
          onAddClick={handleAddNew}
        >
          <DataTable columns={columns} data={filteredAdmins} />
        </PageLayout>
      </div>

      {/* Add/Edit Modal */}
      <GlassModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingAdmin ? "Edit Support Admin" : "Add New Support Admin"}
        size="lg"
      >
        <div className="space-y-3 sm:space-y-4">
          <div>
            <label className="block text-[var(--text-tertiary)] text-sm mb-2">Full Name</label>
            <GlassInput
              placeholder="Enter full name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-[var(--text-tertiary)] text-sm mb-2">Email Address</label>
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
            <label className="block text-[var(--text-tertiary)] text-sm mb-2">Password</label>
            <GlassInput
              type="password"
              placeholder="Enter password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-[var(--text-tertiary)] text-sm mb-2">Profile Picture</label>
            <div className="space-y-3">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="block w-full text-sm text-[var(--text-secondary)] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[rgba(255,255,255,var(--ui-opacity-10))] file:text-white hover:file:bg-[rgba(255,255,255,var(--ui-opacity-20))] file:cursor-pointer"
              />
              {profilePreview && (
                <div className="flex justify-center">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[rgba(255,255,255,var(--glass-border-opacity))]">
                    <img
                      src={profilePreview}
                      alt="Profile preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2 sm:gap-3 pt-3 sm:pt-4">
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
              {editingAdmin ? "Save Changes" : "Add Admin"}
            </GlassButton>
          </div>
        </div>
      </GlassModal>
    </div>
  )
}