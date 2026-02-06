// "use client"

// import { useEffect, useState } from "react"
// import Select from "react-select"
// import { useAuth } from "@/contexts/AuthContext"

// const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL + "/secure/Dropdowns"

// interface OptionType {
//   value: number
//   label: string
// }

// interface ApiDropdownProps {
//   endpoint: string              // 👈 last endpoint only
//   value: OptionType | null
//   onChange: (value: OptionType | null) => void
//   placeholder?: string
//   label?: string
//   isClearable?: boolean
//   isSearchable?: boolean
//   disabled?: boolean
// }

// /* ================================
//    Dark Mode Detector
// ================================ */
// const isDarkMode = () =>
//   typeof window !== "undefined" &&
//   document.documentElement.getAttribute("data-theme") === "dark"

// /* ================================
//    Glass Select Styles
// ================================ */
// /* ================================
//    Glass Select Styles (Unified)
// ================================ */
// export const glassSelectStyles = {
//   /* MAIN CONTROL */
//   control: (base: any, state: any) => {
//     const dark = isDarkMode()

//     return {
//       ...base,
//       backgroundColor: dark ? "rgba(255,255,255,0.08)" : "#ffffff",
//       borderColor: state.isFocused
//         ? "#3b82f6"
//         : dark
//         ? "rgba(255,255,255,0.15)"
//         : "#e5e7eb",
//       color: dark ? "#ffffff" : "#111827",
//       minHeight: "36px",
//       borderRadius: "8px",
//       boxShadow: "none",
//       fontSize: "12px",
//       cursor: "pointer",
//       "&:hover": {
//         borderColor: "#3b82f6",
//       },
//     }
//   },

//   /* MENU */
//   menu: (base: any) => {
//     const dark = isDarkMode()
//     return {
//       ...base,
//       backgroundColor: dark ? "#0b0b0b" : "#ffffff",
//       border: dark
//         ? "1px solid rgba(255,255,255,0.15)"
//         : "1px solid #e5e7eb",
//       borderRadius: "8px",
//       overflow: "hidden",
//     }
//   },

//   /* MENU PORTAL (Z-INDEX FIX) */
//   menuPortal: (base: any) => ({
//     ...base,
//     zIndex: 99999,
//   }),

//   /* OPTION */
//   option: (base: any, state: any) => {
//     const dark = isDarkMode()
//     return {
//       ...base,
//       backgroundColor: state.isSelected
//         ? "#3b82f6"
//         : state.isFocused
//         ? dark
//           ? "rgba(255,255,255,0.1)"
//           : "#f3f4f6"
//         : "transparent",
//       color: state.isSelected
//         ? "#ffffff"
//         : dark
//         ? "#ffffff"
//         : "#111827",
//       cursor: "pointer",
//       fontSize: "12px",
//     }
//   },

//   /* SINGLE VALUE */
//   singleValue: (base: any) => ({
//     ...base,
//     color: isDarkMode() ? "#ffffff" : "#111827",
//     fontSize: "12px",
//   }),

//   /* PLACEHOLDER */
//   placeholder: (base: any) => ({
//     ...base,
//     color: isDarkMode()
//       ? "rgba(255,255,255,0.5)"
//       : "#6b7280",
//     fontSize: "12px",
//   }),

//   /* INPUT (Typing Text) */
//   input: (base: any) => ({
//     ...base,
//     color: isDarkMode() ? "#ffffff" : "#111827",
//     fontSize: "12px",
//   }),

//   /* MULTI VALUE CHIP */
//   multiValue: (base: any) => ({
//     ...base,
//     backgroundColor: "rgba(59,130,246,0.15)",
//     borderRadius: "6px",
//   }),

//   multiValueLabel: (base: any) => ({
//     ...base,
//     color: isDarkMode() ? "#ffffff" : "#111827",
//     fontSize: "11px",
//     fontWeight: 500,
//   }),

//   multiValueRemove: (base: any) => ({
//     ...base,
//     color: isDarkMode() ? "#ffffff" : "#111827",
//     "&:hover": {
//       backgroundColor: "rgba(239,68,68,0.25)",
//       color: "#ef4444",
//     },
//   }),

//   /* DROPDOWN ICON */
//   dropdownIndicator: (base: any) => ({
//     ...base,
//     color: isDarkMode()
//       ? "rgba(255,255,255,0.45)"
//       : "#6b7280",
//     "&:hover": {
//       color: "#3b82f6",
//     },
//   }),

//   clearIndicator: (base: any) => ({
//     ...base,
//     color: isDarkMode()
//       ? "rgba(255,255,255,0.45)"
//       : "#6b7280",
//     "&:hover": {
//       color: "#ef4444",
//     },
//   }),

//   indicatorSeparator: (base: any) => ({
//     ...base,
//     backgroundColor: isDarkMode()
//       ? "rgba(255,255,255,0.15)"
//       : "#e5e7eb",
//   }),
// }


// /* ================================
//    ApiDropdown Component
// ================================ */
// export function ApiDropdown({
//   endpoint,
//   value,
//   onChange,
//   placeholder = "Select option",
//   label,
//   isClearable = true,
//   isSearchable = true,
//   disabled = false,
// }: ApiDropdownProps) {
//   const { user } = useAuth()
//   const [options, setOptions] = useState<OptionType[]>([])
//   const [loading, setLoading] = useState(false)
//   const [error, setError] = useState<string | null>(null)

//   useEffect(() => {
//     fetchOptions()
//   }, [endpoint])

//   const fetchOptions = async () => {
//     try {
//       setLoading(true)
//       setError(null)

//       const token = user?.token

//       const res = await fetch(`${BASE_URL}/${endpoint}`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//       })

//       const data = await res.json()

//       if (data.status) {
//         const formatted = data.data.map((item: any) => ({
//           value: item.id,
//           label: item.name,
//         }))
//         setOptions(formatted)
//       } else {
//         setError(data.message || "Failed to load dropdown")
//       }
//     } catch (err) {
//       console.error(err)
//       setError("Failed to load dropdown")
//     } finally {
//       setLoading(false)
//     }
//   }

//   return (
//     <div>
//       {label && (
//         <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">
//           {label}
//         </label>
//       )}

//       <Select
//         value={value}
//         onChange={onChange}
//         options={options}
//         isLoading={loading}
//         isDisabled={disabled || loading}
//         isClearable={isClearable}
//         isSearchable={isSearchable}
//         placeholder={loading ? "Loading..." : placeholder}
//         styles={glassSelectStyles}
//         className="text-sm"
//         menuPortalTarget={typeof window !== "undefined" ? document.body : null}
//         menuPosition="fixed"
//       />

//     </div>
//   )
// }





"use client"

import { useEffect, useState } from "react"
import Select from "react-select"
import { useAuth } from "@/contexts/AuthContext"
import { Plus } from "lucide-react"
import { toast } from "@/hooks/useToast"
import { on } from "events"

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL + "/secure/Dropdowns"

interface OptionType {
  value: number
  label: string
}

interface ApiDropdownProps {
  endpoint: string
  value: OptionType | null
  onChange: (value: OptionType | null) => void
  placeholder?: string
  label?: string
  isClearable?: boolean
  isSearchable?: boolean
  disabled?: boolean
}

/* ================================
   Dark Mode Detector
================================ */
const isDarkMode = () =>
  typeof window !== "undefined" &&
  document.documentElement.getAttribute("data-theme") === "dark"

/* ================================
   Glass Select Styles
================================ */
export const glassSelectStyles = {
  /* MAIN CONTROL */
  control: (base: any, state: any) => {
    const dark = isDarkMode()

    return {
      ...base,
      backgroundColor: dark ? "rgba(255,255,255,0.08)" : "#ffffff",
      borderColor: state.isFocused
        ? "#3b82f6"
        : dark
        ? "rgba(255,255,255,0.15)"
        : "#e5e7eb",
      color: dark ? "#ffffff" : "#111827",
      minHeight: "36px",
      borderRadius: "8px",
      boxShadow: "none",
      fontSize: "12px",
      cursor: "pointer",
      "&:hover": {
        borderColor: "#3b82f6",
      },
    }
  },

  /* MENU */
  menu: (base: any) => {
    const dark = isDarkMode()
    return {
      ...base,
      backgroundColor: dark ? "#0b0b0b" : "#ffffff",
      border: dark
        ? "1px solid rgba(255,255,255,0.15)"
        : "1px solid #e5e7eb",
      borderRadius: "8px",
      overflow: "hidden",
      zIndex: 99999,
    }
  },

  /* MENU PORTAL (Z-INDEX FIX) */
  menuPortal: (base: any) => ({
    ...base,
    zIndex: 999999,
  }),

  /* MENU LIST WITH SCROLLBAR */
  menuList: (base: any) => {
    const dark = isDarkMode()
    return {
      ...base,
      maxHeight: "200px",
      overflowY: "auto",
      scrollbarWidth: "thin",
      scrollbarColor: dark 
        ? "#4b5563 transparent" 
        : "#d1d5db transparent",
      "&::-webkit-scrollbar": {
        width: "6px",
      },
      "&::-webkit-scrollbar-track": {
        background: "transparent",
      },
      "&::-webkit-scrollbar-thumb": {
        backgroundColor: dark ? "#4b5563" : "#d1d5db",
        borderRadius: "3px",
      },
      "&::-webkit-scrollbar-thumb:hover": {
        backgroundColor: dark ? "#6b7280" : "#9ca3af",
      },
    }
  },

  /* OPTION */
  option: (base: any, state: any) => {
    const dark = isDarkMode()
    return {
      ...base,
      backgroundColor: state.isSelected
        ? "#3b82f6"
        : state.isFocused
        ? dark
          ? "rgba(255,255,255,0.1)"
          : "#f3f4f6"
        : "transparent",
      color: state.isSelected
        ? "#ffffff"
        : dark
        ? "#ffffff"
        : "#111827",
      cursor: "pointer",
      fontSize: "12px",
    }
  },

  /* SINGLE VALUE */
  singleValue: (base: any) => ({
    ...base,
    color: isDarkMode() ? "#ffffff" : "#111827",
    fontSize: "12px",
  }),

  /* PLACEHOLDER */
  placeholder: (base: any) => ({
    ...base,
    color: isDarkMode()
      ? "rgba(255,255,255,0.5)"
      : "#6b7280",
    fontSize: "12px",
  }),

  /* INPUT (Typing Text) */
  input: (base: any) => ({
    ...base,
    color: isDarkMode() ? "#ffffff" : "#111827",
    fontSize: "12px",
  }),

  /* MULTI VALUE CHIP */
  multiValue: (base: any) => ({
    ...base,
    backgroundColor: "rgba(59,130,246,0.15)",
    borderRadius: "6px",
  }),

  multiValueLabel: (base: any) => ({
    ...base,
    color: isDarkMode() ? "#ffffff" : "#111827",
    fontSize: "11px",
    fontWeight: 500,
  }),

  multiValueRemove: (base: any) => ({
    ...base,
    color: isDarkMode() ? "#ffffff" : "#111827",
    "&:hover": {
      backgroundColor: "rgba(239,68,68,0.25)",
      color: "#ef4444",
    },
  }),

  /* DROPDOWN ICON */
  dropdownIndicator: (base: any) => ({
    ...base,
    color: isDarkMode()
      ? "rgba(255,255,255,0.45)"
      : "#6b7280",
    "&:hover": {
      color: "#3b82f6",
    },
  }),

  clearIndicator: (base: any) => ({
    ...base,
    color: isDarkMode()
      ? "rgba(255,255,255,0.45)"
      : "#6b7280",
    "&:hover": {
      color: "#ef4444",
    },
  }),

  indicatorSeparator: (base: any) => ({
    ...base,
    backgroundColor: isDarkMode()
      ? "rgba(255,255,255,0.15)"
      : "#e5e7eb",
  }),
}

/* ================================
   Add Item Modal Component
================================ */
const AddItemModal = ({
  isOpen,
  onClose,
  onAdd,
  loading,
}: {
  isOpen: boolean
  onClose: () => void
  onAdd: (name: string) => Promise<void>
  loading: boolean
}) => {
  const [itemName, setItemName] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!itemName.trim()) return
    
    await onAdd(itemName.trim())
    setItemName("")
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/50"
      style={{ zIndex: 999999 }}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-xl">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Add New Item
        </h3>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Name
            </label>
            <input
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              placeholder="Enter item name"
              autoFocus
            />
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors disabled:opacity-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 transition-colors"
              disabled={loading || !itemName.trim()}
            >
              {loading ? "Adding..." : "Add Item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ================================
   Custom Menu List Component with Add Button
================================ */
const CustomMenuList = (props: any) => {
  const { showAddButton, onAddClick, children, ...rest } = props
  
  return (
    <>
      <div {...rest}>
        {children}
      </div>
      {showAddButton && (
        <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 sticky bottom-0">
          <button
            type="button"
            onClick={onAddClick}
            className="w-full px-3 py-2 text-left text-sm flex items-center hover:bg-gray-100 dark:hover:bg-gray-700 text-blue-600 dark:text-blue-400 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Item
          </button>
        </div>
      )}
    </>
  )
}

/* ================================
   ApiDropdown Component
================================ */
export function ApiDropdown({
  endpoint,
  value,
  onChange,
  placeholder = "Select option",
  label,
  isClearable = true,
  isSearchable = true,
  disabled = false,
}: ApiDropdownProps) {
  const { user } = useAuth()
  const [options, setOptions] = useState<OptionType[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [adding, setAdding] = useState(false)
  let set = false;

  // Check if this endpoint should show add button
  const shouldShowAddButton = () => {
    const endpointsWithAdd = ['get-products', 'get-domains', 'get-venders']
    return endpointsWithAdd.includes(endpoint)
  }

  // Get the add endpoint based on the current endpoint
  const getAddEndpoint = () => {
    if (endpoint === 'get-products') return 'Products/add-products'
    if (endpoint === 'get-domains') return 'Domain/add-domain'
    if (endpoint === 'get-venders') return 'Venders/add-venders'
    return ''
  }

  useEffect(() => {
    fetchOptions()
  }, [endpoint])

  const fetchOptions = async () => {
    try {
      setLoading(true)
      setError(null)

      const token = user?.token

      const res = await fetch(`${BASE_URL}/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await res.json()

      if (data.status) {
        const formatted = data.data.map((item: any) => ({
          value: item.id,
          label: item.name,
        }))
            if (formatted.length > 0 && set) {
        onChange(formatted[0])
      }
        setOptions(formatted)
      } else {
        setError(data.message || "Failed to load dropdown")
      }
    } catch (err) {
      console.error(err)
      setError("Failed to load dropdown")
    } finally {
      setLoading(false)
    }
  }

  const handleAddItem = async (name: string) => {
    try {
      setAdding(true)
      const token = user?.token
      const addEndpoint = getAddEndpoint()

      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/secure/${addEndpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name,
          s_id: user?.id || 6
        }),
      })

      const data = await response.json()

      if (data.success) {
        set = true
         fetchOptions()

        // Close modal
        setShowModal(false)
        
        toast({
          title: "Success",
          description: data.message || "Item added successfully",
          variant: "default"
        })
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to add item",
          variant: "destructive"
        })
      }
    } catch (err) {
      console.error(err)
    } finally {
      setAdding(false)
    }
  }

  return (
    <>
      <div className="relative">
        {label && (
          <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300 font-medium">
            {label}
          </label>
        )}

        <Select
          value={value}
          onChange={onChange}
          options={options}
          isLoading={loading}
          isDisabled={disabled || loading}
          isClearable={isClearable}
          isSearchable={isSearchable}
          placeholder={loading ? "Loading..." : placeholder}
          styles={glassSelectStyles}
          className="text-sm"
          menuPortalTarget={typeof window !== "undefined" ? document.body : null}
          menuPosition="fixed"
          components={{
            MenuList: (props) => (
              <CustomMenuList
                {...props}
                showAddButton={shouldShowAddButton()}
                onAddClick={() => setShowModal(true)}
              />
            ),
          }}
        />

        {error && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>

      <AddItemModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onAdd={handleAddItem}
        loading={adding}
      />
    </>
  )
}