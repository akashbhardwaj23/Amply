"use client"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ThemeProviderProps } from "next-themes"
import Navbar from "./navbar"
import { usePathname } from "next/navigation"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const pathname = usePathname()

  return (
    <>
    {
      pathname && !pathname.startsWith("/dashboard") && <Navbar/>
    }
    <NextThemesProvider {...props}>{children}</NextThemesProvider>
    </>
  )
}
