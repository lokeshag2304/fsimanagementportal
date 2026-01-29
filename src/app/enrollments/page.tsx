"use client"

import { useState } from "react"
import { Header } from "@/components/layout"
import { DataTable, PageLayout } from "@/components/shared"
import { enrollmentsData } from "@/lib/mock-data"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import {
  UserPlus,
  Mail,
  Calendar,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react"

interface Enrollment {
  id: number
  student: string
  email: string
  course: string
  date: string
  status: string
  amount: number
  avatar: string
}

export default function EnrollmentsPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>(enrollmentsData)
  const [searchQuery, setSearchQuery] = useState("")

  const filteredEnrollments = enrollments.filter(e =>
    e.student.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.course.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleApprove = (id: number) => {
    setEnrollments(enrollments.map(e =>
      e.id === id ? { ...e, status: "active" } : e
    ))
  }

  const handleReject = (id: number) => {
    if (confirm("Are you sure you want to reject this enrollment?")) {
      setEnrollments(enrollments.filter(e => e.id !== id))
    }
  }

  const columns = [
    {
      key: "student",
      header: "Student",
      render: (enrollment: Enrollment) => (
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10 border border-[rgba(255,255,255,var(--glass-border-opacity))]">
            <AvatarImage src={enrollment.avatar} alt={enrollment.student} />
            <AvatarFallback>
              {enrollment.student.split(" ").map(n => n[0]).join("")}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-white">{enrollment.student}</p>
            <p className="text-[var(--text-muted)] text-xs flex items-center gap-1">
              <Mail className="w-3 h-3" />
              {enrollment.email}
            </p>
          </div>
        </div>
      )
    },
    {
      key: "course",
      header: "Course",
      render: (enrollment: Enrollment) => (
        <span className="text-[var(--text-secondary)]">{enrollment.course}</span>
      )
    },
    {
      key: "date",
      header: "Date",
      render: (enrollment: Enrollment) => (
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[var(--text-muted)]" />
          <span className="text-[var(--text-secondary)]">{new Date(enrollment.date).toLocaleDateString()}</span>
        </div>
      )
    },
    {
      key: "amount",
      header: "Amount",
      render: (enrollment: Enrollment) => (
        <div className="flex items-center gap-1">
          <DollarSign className="w-4 h-4 text-green-400" />
          <span className="text-[var(--text-secondary)]">{enrollment.amount.toFixed(2)}</span>
        </div>
      )
    },
    {
      key: "status",
      header: "Status",
      render: (enrollment: Enrollment) => (
        <span className={`px-2 py-1 rounded-full text-xs ${
          enrollment.status === "active"
            ? "bg-green-500/20 text-green-400"
            : enrollment.status === "pending"
            ? "bg-yellow-500/20 text-yellow-400"
            : "bg-blue-500/20 text-blue-400"
        }`}>
          {enrollment.status}
        </span>
      )
    },
    {
      key: "actions",
      header: "Actions",
      render: (enrollment: Enrollment) => (
        <div className="flex items-center gap-2 justify-end">
          {enrollment.status === "pending" && (
            <>
              <button
                onClick={() => handleApprove(enrollment.id)}
                className="p-2 rounded-lg hover:bg-green-500/20 transition-colors"
                title="Approve"
              >
                <CheckCircle className="w-4 h-4 text-green-400" />
              </button>
              <button
                onClick={() => handleReject(enrollment.id)}
                className="p-2 rounded-lg hover:bg-red-500/20 transition-colors"
                title="Reject"
              >
                <XCircle className="w-4 h-4 text-red-400" />
              </button>
            </>
          )}
        </div>
      )
    }
  ]

  const activeCount = enrollments.filter(e => e.status === "active").length
  const pendingCount = enrollments.filter(e => e.status === "pending").length
  const totalRevenue = enrollments.filter(e => e.status !== "pending").reduce((sum, e) => sum + e.amount, 0)

  return (
    <div className="min-h-screen pb-8">
      {/* <Header title="Enrollments" tabs={navigationTabs} /> */}

      <div className="px-4 sm:px-6">
        <PageLayout
          stats={[
            { icon: UserPlus, label: "Enrollments", value: enrollments.length },
            { icon: CheckCircle, label: "Active", value: activeCount },
            { icon: Clock, label: "Pending", value: pendingCount },
            { icon: DollarSign, label: "Revenue", value: `$${(totalRevenue / 1000).toFixed(0)}k` }
          ]}
          searchPlaceholder="Search enrollments..."
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          filterGroups={[
            { label: "Filter by Status", options: ["All Status", "Active", "Pending", "Completed"] }
          ]}
        >
          <DataTable columns={columns} data={filteredEnrollments} />
        </PageLayout>
      </div>
    </div>
  )
}
