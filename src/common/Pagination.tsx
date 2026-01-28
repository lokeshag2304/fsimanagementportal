"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"

interface PaginationProps {
  page: number
  rowsPerPage: number
  totalItems: number
  onPageChange: (page: number) => void
  maxVisiblePages?: number
}

export default function Pagination({
  page,
  rowsPerPage,
  totalItems,
  onPageChange,
  maxVisiblePages = 5,
}: PaginationProps) {
  const totalPages = Math.ceil(totalItems / rowsPerPage)

  if (totalPages <= 1) return null

  const startItem = page * rowsPerPage + 1
  const endItem = Math.min((page + 1) * rowsPerPage, totalItems)

  const getPageNumbers = () => {
    const pages: number[] = []

    if (totalPages <= maxVisiblePages) {
      for (let i = 0; i < totalPages; i++) pages.push(i)
    } else if (page <= 2) {
      for (let i = 0; i < maxVisiblePages; i++) pages.push(i)
    } else if (page >= totalPages - 3) {
      for (let i = totalPages - maxVisiblePages; i < totalPages; i++) pages.push(i)
    } else {
      for (let i = page - 2; i <= page + 2; i++) pages.push(i)
    }

    return pages
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3
      bg-[rgba(255,255,255,0.05)]
      border-t border-[rgba(255,255,255,0.1)]
    ">
      {/* Info */}
      <div className="text-sm text-gray-400 mb-3 sm:mb-0">
        Showing {startItem} to {endItem} of {totalItems}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        {/* Previous */}
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 0}
          className="p-2 rounded-lg bg-[rgba(255,255,255,0.05)]
            text-white disabled:opacity-30 disabled:cursor-not-allowed
            hover:bg-[rgba(255,255,255,0.1)] transition-colors"
          title="Previous"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Page Numbers */}
        <div className="flex items-center gap-1">
          {getPageNumbers().map((p) => (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`px-3 py-1 rounded text-sm transition-colors
                ${
                  page === p
                    ? "bg-[#CB8959] text-white"
                    : "bg-[rgba(255,255,255,0.05)] text-gray-300 hover:bg-[rgba(255,255,255,0.1)]"
                }
              `}
            >
              {p + 1}
            </button>
          ))}
        </div>

        {/* Next */}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages - 1}
          className="p-2 rounded-lg bg-[rgba(255,255,255,0.05)]
            text-white disabled:opacity-30 disabled:cursor-not-allowed
            hover:bg-[rgba(255,255,255,0.1)] transition-colors"
          title="Next"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
