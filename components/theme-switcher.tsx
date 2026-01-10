"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const THEMES = {
  default: {
    label: "Default",
    colors: {
      primary: "oklch(0.205 0 0)",
      primaryForeground: "oklch(0.985 0 0)",
      ring: "oklch(0.708 0 0)",
      chart1: "oklch(0.646 0.222 41.116)",
      chart2: "oklch(0.6 0.118 184.704)",
      chart3: "oklch(0.398 0.07 227.392)",
      chart4: "oklch(0.828 0.189 84.429)",
      chart5: "oklch(0.769 0.188 70.08)",
      sidebarPrimary: "oklch(0.205 0 0)",
      sidebarPrimaryForeground: "oklch(0.985 0 0)",
      sidebarRing: "oklch(0.708 0 0)",
    },
  },
  violet: {
    label: "Violet",
    colors: {
      primary: "oklch(0.541 0.281 293.009)",
      primaryForeground: "oklch(0.969 0.016 293.756)",
      ring: "oklch(0.702 0.183 293.541)",
      chart1: "oklch(0.811 0.111 293.571)",
      chart2: "oklch(0.606 0.25 292.717)",
      chart3: "oklch(0.541 0.281 293.009)",
      chart4: "oklch(0.491 0.27 292.581)",
      chart5: "oklch(0.432 0.232 292.759)",
      sidebarPrimary: "oklch(0.541 0.281 293.009)",
      sidebarPrimaryForeground: "oklch(0.969 0.016 293.756)",
      sidebarRing: "oklch(0.702 0.183 293.541)",
    },
  },
  yellow: {
    label: "Yellow",
    colors: {
      primary: "oklch(0.852 0.199 91.936)",
      primaryForeground: "oklch(0.421 0.095 57.708)",
      ring: "oklch(0.852 0.199 91.936)",
      chart1: "oklch(0.905 0.182 98.111)",
      chart2: "oklch(0.795 0.184 86.047)",
      chart3: "oklch(0.681 0.162 75.834)",
      chart4: "oklch(0.554 0.135 66.442)",
      chart5: "oklch(0.476 0.114 61.907)",
      sidebarPrimary: "oklch(0.681 0.162 75.834)",
      sidebarPrimaryForeground: "oklch(0.987 0.026 102.212)",
      sidebarRing: "oklch(0.852 0.199 91.936)",
    },
  },
  red: {
    label: "Red",
    colors: {
      primary: "oklch(0.577 0.245 27.325)",
      primaryForeground: "oklch(0.971 0.013 17.38)",
      ring: "oklch(0.704 0.191 22.216)",
      chart1: "oklch(0.808 0.114 19.571)",
      chart2: "oklch(0.637 0.237 25.331)",
      chart3: "oklch(0.577 0.245 27.325)",
      chart4: "oklch(0.505 0.213 27.518)",
      chart5: "oklch(0.444 0.177 26.899)",
      sidebarPrimary: "oklch(0.577 0.245 27.325)",
      sidebarPrimaryForeground: "oklch(0.971 0.013 17.38)",
      sidebarRing: "oklch(0.704 0.191 22.216)",
    },
  },
  blue: {
    label: "Blue",
    colors: {
      primary: "oklch(0.488 0.243 264.376)",
      primaryForeground: "oklch(0.97 0.014 254.604)",
      ring: "oklch(0.708 0 0)",
      chart1: "oklch(0.809 0.105 251.813)",
      chart2: "oklch(0.623 0.214 259.815)",
      chart3: "oklch(0.546 0.245 262.881)",
      chart4: "oklch(0.488 0.243 264.376)",
      chart5: "oklch(0.424 0.199 265.638)",
      sidebarPrimary: "oklch(0.546 0.245 262.881)",
      sidebarPrimaryForeground: "oklch(0.97 0.014 254.604)",
      sidebarRing: "oklch(0.708 0 0)",
    },
  },
  green: {
    label: "Green",
    colors: {
      primary: "oklch(0.648 0.2 131.684)",
      primaryForeground: "oklch(0.986 0.031 120.757)",
      ring: "oklch(0.841 0.238 128.85)",
      chart1: "oklch(0.871 0.15 154.449)",
      chart2: "oklch(0.723 0.219 149.579)",
      chart3: "oklch(0.627 0.194 149.214)",
      chart4: "oklch(0.527 0.154 150.069)",
      chart5: "oklch(0.448 0.119 151.328)",
      sidebarPrimary: "oklch(0.648 0.2 131.684)",
      sidebarPrimaryForeground: "oklch(0.986 0.031 120.757)",
      sidebarRing: "oklch(0.841 0.238 128.85)",
    },
  },
}

export function ThemeSwitcher() {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("admin-theme") || "default"
    }
    return "default"
  })
  
  const applyTheme = (themeName: string) => {
    const themeData = THEMES[themeName as keyof typeof THEMES]
    if (!themeData) return
    
    document.documentElement.dataset.theme = themeName
    
    const { colors } = themeData
    document.documentElement.style.setProperty("--primary", colors.primary)
    document.documentElement.style.setProperty("--primary-foreground", colors.primaryForeground)
    document.documentElement.style.setProperty("--ring", colors.ring)
    
    document.documentElement.style.setProperty("--chart-1", colors.chart1)
    document.documentElement.style.setProperty("--chart-2", colors.chart2)
    document.documentElement.style.setProperty("--chart-3", colors.chart3)
    document.documentElement.style.setProperty("--chart-4", colors.chart4)
    document.documentElement.style.setProperty("--chart-5", colors.chart5)
    
    if (colors.sidebarPrimary) {
      document.documentElement.style.setProperty("--sidebar-primary", colors.sidebarPrimary)
      document.documentElement.style.setProperty("--sidebar-primary-foreground", colors.sidebarPrimaryForeground!)
      document.documentElement.style.setProperty("--sidebar-ring", colors.sidebarRing!)
    }
    
    localStorage.setItem("admin-theme", themeName)
    setTheme(themeName)
  }
  
  useEffect(() => {
    applyTheme(theme)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  
  return (
    <Select value={theme} onValueChange={applyTheme}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select theme" />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(THEMES).map(([key, value]) => (
          <SelectItem key={key} value={key}>
            {value.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
