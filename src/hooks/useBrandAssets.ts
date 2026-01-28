"use client"

import { useEffect, useState } from "react"

const API_URL = "https://rainbowsolutionandtechnology.com/FSISubscriptionPortal/public/api/getLogo"
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
        const res = await fetch(API_URL)
        const json = await res.json()

        if (json?.success) {
          setAssets(json.data)

          // 🔥 Set favicon dynamically
          if (json.data.favicon) {
            let link: HTMLLinkElement | null =
              document.querySelector("link[rel~='icon']")

            if (!link) {
              link = document.createElement("link")
              link.rel = "icon"
              document.head.appendChild(link)
            }

            link.href = `${ASSETS_URL}/${json.data.favicon}`
          }
        }
      } catch (err) {
        console.error("Failed to load brand assets", err)
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
