"use client"

import { useEffect, useState } from "react"
import api from "@/lib/axios"

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL
const API_URL = `${BASE_URL}/getLogo`
const ASSETS_URL = process.env.NEXT_PUBLIC_ASSETS_URL

interface BrandAssets {
  logo: string
  dark_logo: string
  favicon: string
}

export function useBrandAssets(theme: "light" | "dark") {
  const [assets, setAssets] = useState<BrandAssets | null>(null)

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const res = await api.get('/getLogo')
        if (res.data?.success) {
          setAssets(res.data.data)

          // 🔥 Set favicon dynamically
          if (res.data.data.favicon) {
            let link: HTMLLinkElement | null =
              document.querySelector("link[rel~='icon']")

            if (!link) {
              link = document.createElement("link")
              link.rel = "icon"
              document.head.appendChild(link)
            }

            link.href = `${ASSETS_URL}/${res.data.data.favicon}`
          }
        }
      } catch (err) {
        // Silently handle error to avoid Next.js dev overlay crash
        console.warn("Failed to load brand assets from backend.")
      }
    }

    fetchAssets()
  }, [])

  const logoSrc =
    theme === "dark"
      ? assets?.dark_logo || assets?.logo
      : assets?.logo

  return {
    logo: logoSrc ? `${ASSETS_URL}/${logoSrc}` : null,
    raw: assets,
  }
}
