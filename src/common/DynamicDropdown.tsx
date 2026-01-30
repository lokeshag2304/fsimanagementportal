"use client"

import { useEffect, useState } from "react"
import Select from "react-select"
import { useAuth } from "@/contexts/AuthContext"

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL + "/secure/Dropdowns"

interface OptionType {
  value: number
  label: string
}

interface ApiDropdownProps {
  endpoint: string              // 👈 last endpoint only
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
/* ================================
   Glass Select Styles (Unified)
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
    }
  },

  /* MENU PORTAL (Z-INDEX FIX) */
  menuPortal: (base: any) => ({
    ...base,
    zIndex: 99999,
  }),

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

  return (
    <div>
      {label && (
        <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">
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
      />

    </div>
  )
}
