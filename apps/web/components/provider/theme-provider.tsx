"use client"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ThemeProviderProps } from "next-themes"
import Navbar from "../navbar"
import { usePathname } from "next/navigation"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const pathname = usePathname()

  return (
 
    <NextThemesProvider {...props}>
      {pathname && !pathname.startsWith("/dashboard") &&!pathname.startsWith("/login")&&!pathname.startsWith("/register") && <Navbar />}
      {children}</NextThemesProvider>
   )
}
