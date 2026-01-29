"use client"

import { useState } from "react"
import Image from "next/image"
import { Header } from "@/components/layout"
import { GlassButton, GlassInput, GlassModal } from "@/components/glass"
import { DataTable, PageLayout } from "@/components/shared"
import { coursesData } from "@/lib/mock-data"
import {
  Edit,
  Trash2,
  Star,
  BookOpen,
  Users,
  DollarSign,
  CheckCircle
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Course {
  id: number
  name: string
  category: string
  students: number
  price: number
  status: string
  instructor: string
  rating: number
  image?: string
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>(coursesData)
  const [searchQuery, setSearchQuery] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    price: "",
    instructor: "",
    status: "active"
  })

  const filteredCourses = courses.filter(course =>
    course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAddNew = () => {
    setEditingCourse(null)
    setFormData({ name: "", category: "", price: "", instructor: "", status: "active" })
    setIsModalOpen(true)
  }

  const handleEdit = (course: Course) => {
    setEditingCourse(course)
    setFormData({
      name: course.name,
      category: course.category,
      price: course.price.toString(),
      instructor: course.instructor,
      status: course.status
    })
    setIsModalOpen(true)
  }

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this course?")) {
      setCourses(courses.filter(c => c.id !== id))
    }
  }

  const handleSubmit = () => {
    if (editingCourse) {
      setCourses(courses.map(c =>
        c.id === editingCourse.id
          ? { ...c, ...formData, price: parseFloat(formData.price) }
          : c
      ))
    } else {
      const newCourse: Course = {
        id: Math.max(...courses.map(c => c.id)) + 1,
        name: formData.name,
        category: formData.category,
        students: 0,
        price: parseFloat(formData.price),
        status: formData.status,
        instructor: formData.instructor,
        rating: 0
      }
      setCourses([...courses, newCourse])
    }
    setIsModalOpen(false)
  }

  const columns = [
    {
      key: "name",
      header: "Course",
      render: (course: Course) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-[rgba(255,255,255,var(--ui-opacity-5))] border border-white/[0.04]">
            {course.image ? (
              <Image
                src={course.image}
                alt={course.name}
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-[var(--text-muted)]" />
              </div>
            )}
          </div>
          <div>
            <p className="font-medium text-white">{course.name}</p>
            <p className="text-[var(--text-muted)] text-xs flex items-center gap-1">
              <Users className="w-3 h-3" />
              {course.instructor}
            </p>
          </div>
        </div>
      )
    },
    {
      key: "category",
      header: "Category",
      render: (course: Course) => (
        <span className="text-[var(--text-secondary)]">{course.category}</span>
      )
    },
    {
      key: "students",
      header: "Students",
      render: (course: Course) => (
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-[var(--text-muted)]" />
          <span className="text-[var(--text-secondary)]">{course.students}</span>
        </div>
      )
    },
    {
      key: "price",
      header: "Price",
      render: (course: Course) => (
        <div className="flex items-center gap-1">
          <DollarSign className="w-4 h-4 text-green-400" />
          <span className="text-[var(--text-secondary)]">{course.price.toFixed(2)}</span>
        </div>
      )
    },
    {
      key: "rating",
      header: "Rating",
      render: (course: Course) => (
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
          <span className="text-[var(--text-secondary)]">{course.rating}</span>
        </div>
      )
    },
    {
      key: "status",
      header: "Status",
      render: (course: Course) => (
        <span className={`px-2 py-1 rounded-full text-xs ${
          course.status === "active"
            ? "bg-green-500/20 text-green-400"
            : "bg-yellow-500/20 text-yellow-400"
        }`}>
          {course.status}
        </span>
      )
    },
    {
      key: "actions",
      header: "Actions",
      render: (course: Course) => (
        <div className="flex items-center gap-2 justify-end">
          <button
            onClick={() => handleEdit(course)}
            className="p-2 rounded-lg hover:bg-[rgba(255,255,255,var(--ui-opacity-10))] transition-colors"
          >
            <Edit className="w-4 h-4 text-[var(--text-tertiary)]" />
          </button>
          <button
            onClick={() => handleDelete(course.id)}
            className="p-2 rounded-lg hover:bg-red-500/20 transition-colors"
          >
            <Trash2 className="w-4 h-4 text-red-400" />
          </button>
        </div>
      )
    }
  ]

  // Stats
  const totalStudents = courses.reduce((sum, c) => sum + c.students, 0)
  const totalRevenue = courses.reduce((sum, c) => sum + c.price * c.students, 0)
  const activeCourses = courses.filter(c => c.status === "active").length

  return (
    <div className="min-h-screen pb-8">
      {/* <Header title="Courses Management" tabs={navigationTabs} /> */}

      <div className="px-4 sm:px-6">
        <PageLayout
          stats={[
            { icon: BookOpen, label: "Courses", value: courses.length },
            { icon: CheckCircle, label: "Active", value: activeCourses },
            { icon: Users, label: "Students", value: totalStudents },
            { icon: DollarSign, label: "Revenue", value: `$${(totalRevenue / 1000).toFixed(0)}k` }
          ]}
          searchPlaceholder="Search courses..."
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          filterGroups={[
            { label: "Filter by Status", options: ["All Courses", "Active", "Draft"] },
            { label: "Filter by Category", options: ["Development", "Design", "Marketing"] }
          ]}
          addButtonLabel="Add Course"
          onAddClick={handleAddNew}
        >
          <DataTable columns={columns} data={filteredCourses} />
        </PageLayout>
      </div>

      {/* Add/Edit Modal */}
      <GlassModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCourse ? "Edit Course" : "Add New Course"}
        size="lg"
      >
        <div className="space-y-3 sm:space-y-4">
          <div>
            <label className="block text-[var(--text-tertiary)] text-sm mb-2">Course Name</label>
            <GlassInput
              placeholder="Enter course name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-[var(--text-tertiary)] text-sm mb-2">Category</label>
              <GlassInput
                placeholder="Category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
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
            <label className="block text-[var(--text-tertiary)] text-sm mb-2">Instructor</label>
            <GlassInput
              placeholder="Instructor name"
              value={formData.instructor}
              onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-[var(--text-tertiary)] text-sm mb-2">Status</label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger className="w-full glass-input">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
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
              {editingCourse ? "Save Changes" : "Add Course"}
            </GlassButton>
          </div>
        </div>
      </GlassModal>
    </div>
  )
}
