"use client"

import Select, { components } from "react-select"

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
  styles?: any
  className?: string
}

/* ================================
   Theme Detector
================================ */
const isDarkMode = () =>
  typeof window !== "undefined" &&
  document.documentElement.getAttribute("data-theme") === "dark"

/* ================================
   Glass Select Styles (AUTO)
================================ */
const glassSelectStyles = {
  control: (base: any, state: any) => {
    const dark = isDarkMode()

    return {
      ...base,
      backgroundColor: dark
        ? "rgba(255,255,255,0.08)"
        : "rgba(255,255,255,0.9)",
      borderColor: state.isFocused
        ? "rgba(59,130,246,0.6)"
        : dark
          ? "rgba(255,255,255,0.15)"
          : "rgba(0,0,0,0.15)",
      color: dark ? "#ffffff" : "#111827",
      borderRadius: "0.75rem",
      minHeight: "30px",
      padding: "0 2px",
      boxShadow: state.isFocused
        ? "0 0 0 2px rgba(59,130,246,0.25)"
        : "none",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      transition: "all 0.2s ease",
      "&:hover": {
        borderColor: "rgba(59,130,246,0.5)",
      },
    }
  },

  /* 🔥 Menu Portal Fix */
  menuPortal: (base: any) => ({
    ...base,
    zIndex: 99999,
  }),

  menu: (base: any) => {
    const dark = isDarkMode()

    return {
      ...base,
      backgroundColor: dark
        ? "rgba(15,15,15,0.95)"
        : "rgba(255,255,255,0.97)",
      border: dark
        ? "1px solid rgba(255,255,255,0.15)"
        : "1px solid rgba(0,0,0,0.1)",
      borderRadius: "0.75rem",
      overflow: "hidden",
      backdropFilter: "blur(14px)",
      WebkitBackdropFilter: "blur(14px)",
    }
  },

  option: (base: any, state: any) => {
    const dark = isDarkMode()

    return {
      ...base,
      backgroundColor: state.isSelected
        ? "rgba(59,130,246,0.35)"
        : state.isFocused
          ? dark
            ? "rgba(255,255,255,0.08)"
            : "rgba(0,0,0,0.05)"
          : "transparent",
      color: dark ? "#ffffff" : "#111827",
      cursor: "pointer",
      fontSize: "0.875rem",
      padding: "10px 14px",
    }
  },

  multiValue: (base: any) => ({
    ...base,
    backgroundColor: "rgba(59,130,246,0.15)",
    borderRadius: "0.5rem",
  }),

  multiValueLabel: (base: any) => ({
    ...base,
    color: isDarkMode() ? "#ffffff" : "#111827",
    fontSize: "0.75rem",
    padding: "2px 6px",
  }),

  multiValueRemove: (base: any) => ({
    ...base,
    color: isDarkMode() ? "#ffffff" : "#111827",
    borderRadius: "0.375rem",
    "&:hover": {
      backgroundColor: "rgba(239,68,68,0.25)",
      color: "#ffffff",
    },
  }),

  input: (base: any) => ({
    ...base,
    color: isDarkMode() ? "#ffffff" : "#111827",
  }),

  singleValue: (base: any) => ({
    ...base,
    color: isDarkMode() ? "#ffffff" : "#111827",
    fontWeight: 500,
    whiteSpace: "nowrap",
    position: "relative" as any,
    overflow: "hidden",
    textOverflow: "ellipsis",
    transform: "none",
    display: "inline-flex",
    alignItems: "center",
    flexShrink: 1,
    flexGrow: 1,
    maxWidth: "100%",
  }),

  valueContainer: (base: any) => ({
    ...base,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    display: "inline-flex",
    alignItems: "center",
    flexWrap: "nowrap" as any,
    flexShrink: 1,
    padding: "0 4px",
  }),

  container: (base: any) => ({
    ...base,
    minWidth: "140px",
    maxWidth: "100%",
  }),

  placeholder: (base: any) => ({
    ...base,
    color: isDarkMode()
      ? "rgba(255,255,255,0.45)"
      : "rgba(0,0,0,0.45)",
    fontSize: "0.875rem",
  }),

  dropdownIndicator: (base: any, state: any) => ({
    ...base,
    color: state.isFocused
      ? "#3b82f6"
      : isDarkMode()
        ? "rgba(255,255,255,0.45)"
        : "rgba(0,0,0,0.45)",
    transition: "color 0.2s ease",
    "&:hover": {
      color: "#3b82f6",
    },
  }),

  clearIndicator: (base: any) => ({
    ...base,
    padding: "5px",
    marginRight: "2px",
    color: isDarkMode()
      ? "rgba(255,255,255,0.45)"
      : "rgba(0,0,0,0.45)",
    "&:hover": {
      color: "#ef4444",
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
   Custom Components
================================ */
const CustomSingleValue = (props: any) => {
  return (
    <components.SingleValue {...props}>
      <span title={props.data.label}>{props.children}</span>
    </components.SingleValue>
  )
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
        components={{ SingleValue: CustomSingleValue }}
        className="react-select-container"
        classNamePrefix="react-select"
      />
    </div>
  )
}
