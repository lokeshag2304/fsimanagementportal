"use client"

import Select from "react-select"

interface GlassSelectProps {
  label?: string
  isMulti?: boolean
  options: any[]
  value: any
  onChange: (value: any) => void
  placeholder?: string
  isSearchable?: boolean
  isClearable?: boolean
  noOptionsMessage?: () => string
}

/* ================================
   Theme Detector
================================ */
const isDarkMode = () =>
  typeof window !== "undefined" &&
  document.documentElement.classList.contains("dark")

/* ================================
   Glass Select Styles (AUTO)
================================ */
const glassSelectStyles = {
  control: (base: any) => {
    const dark = isDarkMode()

    return {
      ...base,
      backgroundColor: dark
        ? "rgba(255,255,255,0.1)"
        : "rgba(255,255,255,0.8)",
      borderColor: dark
        ? "rgba(255,255,255,0.15)"
        : "rgba(0,0,0,0.15)",
      color: dark ? "#ffffff" : "#111827",
      borderRadius: "0.5rem",
      minHeight: "42px",
      boxShadow: "none",
      "&:hover": {
        borderColor: dark
          ? "rgba(255,255,255,0.25)"
          : "rgba(0,0,0,0.25)",
      },
    }
  },

  menu: (base: any) => {
    const dark = isDarkMode()

    return {
      ...base,
      backgroundColor: dark
        ? "rgba(0,0,0,0.9)"
        : "rgba(255,255,255,0.95)",
      border: dark
        ? "1px solid rgba(255,255,255,0.15)"
        : "1px solid rgba(0,0,0,0.1)",
      borderRadius: "0.5rem",
      zIndex: 9999,
    }
  },

  option: (base: any, state: any) => {
    const dark = isDarkMode()

    return {
      ...base,
      backgroundColor: state.isSelected
        ? "rgba(59,130,246,0.4)"
        : state.isFocused
        ? dark
          ? "rgba(255,255,255,0.1)"
          : "rgba(0,0,0,0.05)"
        : "transparent",
      color: dark ? "#ffffff" : "#111827",
      cursor: "pointer",
    }
  },

  multiValue: (base: any) => ({
    ...base,
    backgroundColor: "rgba(59,130,246,0.15)",
  }),

  multiValueLabel: (base: any) => ({
    ...base,
    color: isDarkMode() ? "#ffffff" : "#111827",
  }),

  multiValueRemove: (base: any) => ({
    ...base,
    color: isDarkMode() ? "#ffffff" : "#111827",
    "&:hover": {
      backgroundColor: "rgba(239,68,68,0.25)",
      color: isDarkMode() ? "#ffffff" : "#111827",
    },
  }),

  input: (base: any) => ({
    ...base,
    color: isDarkMode() ? "#ffffff" : "#111827",
  }),

  singleValue: (base: any) => ({
    ...base,
    color: isDarkMode() ? "#ffffff" : "#111827",
  }),

  placeholder: (base: any) => ({
    ...base,
    color: isDarkMode()
      ? "rgba(255,255,255,0.45)"
      : "rgba(0,0,0,0.45)",
  }),

  dropdownIndicator: (base: any) => ({
    ...base,
    color: isDarkMode()
      ? "rgba(255,255,255,0.45)"
      : "rgba(0,0,0,0.45)",
    "&:hover": {
      color: isDarkMode() ? "#ffffff" : "#111827",
    },
  }),

  clearIndicator: (base: any) => ({
    ...base,
    color: isDarkMode()
      ? "rgba(255,255,255,0.45)"
      : "rgba(0,0,0,0.45)",
    "&:hover": {
      color: isDarkMode() ? "#ffffff" : "#111827",
    },
  }),

  indicatorSeparator: (base: any) => ({
    ...base,
    backgroundColor: isDarkMode()
      ? "rgba(255,255,255,0.15)"
      : "rgba(0,0,0,0.15)",
  }),
}

/* ================================
   GlassSelect Component
================================ */
export function GlassSelect({
  label,
  ...props
}: GlassSelectProps) {
  return (
    <div>
      {label && (
        <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}

      <Select
        {...props}
        styles={glassSelectStyles}
        className="react-select-container"
        classNamePrefix="react-select"
      />
    </div>
  )
}
