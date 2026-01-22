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
import { navigationTabs } from "@/lib/navigation"

interface CustomerAdmin {
  id: number
  name: string
  email: string
  phone: string
  profile: string
  twoStepAuth: boolean
}

const customerAdminsData: CustomerAdmin[] = [
  {
    id: 1,
    name: "Emily Davis",
    email: "emily.davis@company.com",
    phone: "+1 234 567 8904",
    profile: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
    twoStepAuth: true
  },
  {
    id: 2,
    name: "David Brown",
    email: "david.brown@company.com",
    phone: "+1 234 567 8905",
    profile: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face",
    twoStepAuth: false
  },
  {
    id: 3,
    name: "Lisa Anderson",
    email: "lisa.anderson@company.com",
    phone: "+1 234 567 8906",
    profile: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face",
    twoStepAuth: true
  },
  {
    id: 4,
    name: "Robert Taylor",
    email: "robert.taylor@company.com",
    phone: "+1 234 567 8907",
    profile: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop&crop=face",
    twoStepAuth: false
  }
]

export default function CustomerAdminPage() {
  const [admins, setAdmins] = useState<CustomerAdmin[]>(customerAdminsData)
  const [searchQuery, setSearchQuery] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAdmin, setEditingAdmin] = useState<CustomerAdmin | null>(null)
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

  const handleEdit = (admin: CustomerAdmin) => {
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
      const newAdmin: CustomerAdmin = {
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
      render: (_: CustomerAdmin, index: number) => (
        <span className="text-[var(--text-secondary)]">{String(index + 1)}</span>
      )
    },
    {
      key: "name",
      header: "Name",
      render: (admin: CustomerAdmin) => (
        <span className="text-white font-medium">{admin.name}</span>
      )
    },
    {
      key: "email",
      header: "Email",
      render: (admin: CustomerAdmin) => (
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-[var(--text-muted)]" />
          <span className="text-[var(--text-secondary)]">{admin.email}</span>
        </div>
      )
    },
    {
      key: "profile",
      header: "Profile",
      render: (admin: CustomerAdmin) => (
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
      render: (admin: CustomerAdmin) => (
        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4 text-[var(--text-muted)]" />
          <span className="text-[var(--text-secondary)]">{admin.phone}</span>
        </div>
      )
    },
    {
      key: "twoStepAuth",
      header: "Two Step Auth",
      render: (admin: CustomerAdmin) => (
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
      render: (admin: CustomerAdmin) => (
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
      <Header title="Customer Admin Management" tabs={navigationTabs} />

      <div className="px-4 sm:px-6">
        <PageLayout
          stats={[
            { icon: UserCog, label: "Total Admins", value: totalAdmins },
            { icon: ShieldCheck, label: "2FA Enabled", value: activeAdmins },
            { icon: Users, label: "Active", value: totalAdmins },
            { icon: Shield, label: "Security", value: `${Math.round((activeAdmins/totalAdmins)*100)}%` }
          ]}
          searchPlaceholder="Search customer admins..."
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          filterGroups={[
            { label: "Filter by Status", options: ["All Admins", "2FA Enabled", "2FA Disabled"] }
          ]}
          addButtonLabel="Add Customer Admin"
          onAddClick={handleAddNew}
        >
          <DataTable columns={columns} data={filteredAdmins} />
        </PageLayout>
      </div>

      {/* Add/Edit Modal */}
      <GlassModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingAdmin ? "Edit Customer Admin" : "Add New Customer Admin"}
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