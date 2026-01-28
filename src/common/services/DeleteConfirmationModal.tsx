// src/components/common/DeleteConfirmationModal.tsx
"use client"

import { GlassModal, GlassButton } from "@/components/glass"
import { AlertTriangle } from "lucide-react"

interface DeleteConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  message?: string
  itemCount?: number
  isLoading?: boolean
}

export function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Deletion",
  message = "Are you sure you want to delete this item? This action cannot be undone.",
  itemCount = 1,
  isLoading = false
}: DeleteConfirmationModalProps) {
  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="md"
    >
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <AlertTriangle className="w-16 h-16 text-yellow-500" />
        </div>
        
        <p className="text-[var(--text-secondary)]">
          {itemCount > 1 
            ? `Are you sure you want to delete ${itemCount} items? This action cannot be undone.`
            : message
          }
        </p>
        
        <div className="flex gap-3 pt-4">
          <GlassButton
            variant="ghost"
            className="flex-1"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </GlassButton>
          <GlassButton
            variant="danger"
            className="flex-1"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Deleting..." : "Delete"}
          </GlassButton>
        </div>
      </div>
    </GlassModal>
  )
}