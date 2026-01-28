// // src/components/common/EditRow.tsx
// "use client"

// import { useState, useEffect } from "react"
// import { Check, X, Loader2 } from "lucide-react"
// import { GlassInput } from "@/components/glass"

// interface EditRowProps<T> {
//   record: T
//   onSave: (data: T) => Promise<void>
//   onCancel: () => void
//   fields: {
//     name: keyof T
//     label: string
//     type: 'text' | 'number' | 'date' | 'select' | 'textarea'
//     required?: boolean
//     options?: Array<{ value: string | number; label: string }>
//     disabled?: boolean
//   }[]
//   isLoading?: boolean
// }

// export function EditRow<T extends Record<string, any>>({
//   record,
//   onSave,
//   onCancel,
//   fields,
//   isLoading = false
// }: EditRowProps<T>) {
//   const [formData, setFormData] = useState<T>(record)
//   const [errors, setErrors] = useState<Record<string, string>>({})

//   useEffect(() => {
//     setFormData(record)
//   }, [record])

//   const handleChange = (field: keyof T, value: any) => {
//     setFormData(prev => ({ ...prev, [field]: value }))
//     // Clear error for this field
//     if (errors[field as string]) {
//       setErrors(prev => ({ ...prev, [field as string]: '' }))
//     }
//   }

//   const validate = (): boolean => {
//     const newErrors: Record<string, string> = {}
    
//     fields.forEach(field => {
//       if (field.required && !formData[field.name]) {
//         newErrors[field.name as string] = `${field.label} is required`
//       }
//     })
    
//     setErrors(newErrors)
//     return Object.keys(newErrors).length === 0
//   }

//   const handleSubmit = async () => {
//     if (!validate()) return
    
//     try {
//       await onSave(formData)
//     } catch (error) {
//       console.error('Error saving:', error)
//     }
//   }

//   const handleKeyDown = (e: React.KeyboardEvent) => {
//     if (e.key === 'Enter') handleSubmit()
//     if (e.key === 'Escape') onCancel()
//   }

//   return (
//     <div className="space-y-4 p-4 bg-[rgba(59,130,246,0.05)] rounded-lg border border-[rgba(59,130,246,0.2)]">
//       <div className="flex items-center justify-between mb-2">
//         <h3 className="text-white font-medium">Edit Record</h3>
//         <button
//           onClick={onCancel}
//           className="p-1 hover:bg-[rgba(255,255,255,0.1)] rounded transition-colors"
//           disabled={isLoading}
//         >
//           <X className="w-4 h-4 text-gray-400" />
//         </button>
//       </div>

//       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//         {fields.map(field => (
//           <div key={field.name as string}>
//             <label className="block text-sm text-[var(--text-tertiary)] mb-2">
//               {field.label}
//               {field.required && <span className="text-red-400 ml-1">*</span>}
//             </label>
            
//             {field.type === 'select' && field.options ? (
//               <select
//                 value={formData[field.name] || ''}
//                 onChange={(e) => handleChange(field.name, e.target.value)}
//                 disabled={field.disabled || isLoading}
//                 onKeyDown={handleKeyDown}
//                 className="w-full px-4 py-2 bg-[rgba(255,255,255,var(--ui-opacity-10))] border border-[rgba(255,255,255,var(--glass-border-opacity))] rounded-lg text-white placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent"
//               >
//                 <option value="">Select {field.label}</option>
//                 {field.options.map(option => (
//                   <option key={option.value} value={option.value} className="bg-gray-800 text-white">
//                     {option.label}
//                   </option>
//                 ))}
//               </select>
//             ) : field.type === 'textarea' ? (
//               <textarea
//                 value={formData[field.name] || ''}
//                 onChange={(e) => handleChange(field.name, e.target.value)}
//                 disabled={field.disabled || isLoading}
//                 onKeyDown={handleKeyDown}
//                 className="w-full px-4 py-2 bg-[rgba(255,255,255,var(--ui-opacity-10))] border border-[rgba(255,255,255,var(--glass-border-opacity))] rounded-lg text-white placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent resize-none"
//                 rows={3}
//               />
//             ) : (
//               <GlassInput
//                 type={field.type}
//                 value={formData[field.name] || ''}
//                 onChange={(e) => handleChange(field.name, e.target.value)}
//                 disabled={field.disabled || isLoading}
//                 onKeyDown={handleKeyDown}
//                 placeholder={`Enter ${field.label}`}
//                 min={field.type === 'number' ? 0 : undefined}
//                 step={field.type === 'number' ? 0.01 : undefined}
//               />
//             )}
            
//             {errors[field.name as string] && (
//               <p className="text-red-400 text-xs mt-1">{errors[field.name as string]}</p>
//             )}
//           </div>
//         ))}
//       </div>

//       <div className="flex gap-2 pt-2">
//         <button
//           onClick={handleSubmit}
//           disabled={isLoading}
//           className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
//         >
//           {isLoading ? (
//             <Loader2 className="w-4 h-4 animate-spin" />
//           ) : (
//             <Check className="w-4 h-4" />
//           )}
//           {isLoading ? "Saving..." : "Save Changes"}
//         </button>
//         <button
//           onClick={onCancel}
//           disabled={isLoading}
//           className="px-4 py-2 bg-[rgba(255,255,255,0.1)] text-white rounded-lg hover:bg-[rgba(255,255,255,0.2)] transition-colors disabled:opacity-50"
//         >
//           Cancel
//         </button>
//       </div>
//     </div>
//   )
// }








// src/components/common/EditRow.tsx
"use client"

import { useState, useEffect } from "react"
import { Check, X } from "lucide-react"

interface EditRowProps<T> {
  record: T
  onSave: (data: T) => Promise<void>
  onCancel: () => void
  fields: {
    name: keyof T
    label: string
    type: 'text' | 'number' | 'date' | 'select' | 'textarea'
    required?: boolean
    options?: Array<{ value: string | number; label: string }>
    disabled?: boolean
    className?: string
  }[]
  isLoading?: boolean
}

export function EditRow<T extends Record<string, any>>({
  record,
  onSave,
  onCancel,
  fields,
  isLoading = false
}: EditRowProps<T>) {
  const [formData, setFormData] = useState<T>(record)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    setFormData(record)
  }, [record])

  const handleChange = (field: keyof T, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field as string]) {
      setErrors(prev => ({ ...prev, [field as string]: '' }))
    }
  }

  const handleSubmit = async () => {
    try {
      await onSave(formData)
    } catch (error) {
      console.error('Error saving:', error)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit()
    if (e.key === 'Escape') onCancel()
  }

  return (
    <>
      {fields.map(field => (
        <td key={field.name as string} className="py-3 px-4">
          <div className="relative">
            {field.type === 'select' && field.options ? (
              <select
                value={formData[field.name] || ''}
                onChange={(e) => handleChange(field.name, e.target.value)}
                disabled={field.disabled || isLoading}
                onKeyDown={handleKeyDown}
                className={`w-full px-2 py-1 bg-[rgba(255,255,255,var(--ui-opacity-10))] border border-[rgba(59,130,246,0.3)] rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent ${field.className || ''}`}
                style={{ minHeight: '32px' }}
              >
                <option value="" className="bg-gray-800 text-white">Select...</option>
                {field.options.map(option => (
                  <option key={option.value} value={option.value} className="bg-gray-800 text-white">
                    {option.label}
                  </option>
                ))}
              </select>
            ) : field.type === 'textarea' ? (
              <textarea
                value={formData[field.name] || ''}
                onChange={(e) => handleChange(field.name, e.target.value)}
                disabled={field.disabled || isLoading}
                onKeyDown={handleKeyDown}
                className={`w-full px-2 py-1 bg-[rgba(255,255,255,var(--ui-opacity-10))] border border-[rgba(59,130,246,0.3)] rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent resize-none ${field.className || ''}`}
                rows={1}
                style={{ minHeight: '32px' }}
              />
            ) : (
              <input
                type={field.type}
                value={formData[field.name] || ''}
                onChange={(e) => handleChange(field.name, e.target.value)}
                disabled={field.disabled || isLoading}
                onKeyDown={handleKeyDown}
                className={`w-full px-2 py-1 bg-[rgba(255,255,255,var(--ui-opacity-10))] border border-[rgba(59,130,246,0.3)] rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent ${field.className || ''}`}
                style={{ minHeight: '32px' }}
                placeholder={field.label}
                min={field.type === 'number' ? 0 : undefined}
                step={field.type === 'number' ? 0.01 : undefined}
              />
            )}
            
            {errors[field.name as string] && (
              <p className="text-red-400 text-xs mt-1 absolute -bottom-5 left-0">
                {errors[field.name as string]}
              </p>
            )}
          </div>
        </td>
      ))}
    </>
  )
}