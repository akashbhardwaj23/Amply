"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@repo/ui/components/ui/button"
import { Input } from "@repo/ui/components/ui/input"
import { Search, MapPin } from "lucide-react"
import { useRouter } from "next/navigation"

export function HeroSection() {
  const [location, setLocation] = useState("")
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (location.trim()) {
      router.push(`/map?location=${encodeURIComponent(location)}`)
    }
  }

  return (
    <div className="relative">
      {/* Background with gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-rose-500 to-red-700 opacity-90" />

      {/* Hero content */}
      <div className="relative container py-24 md:py-32 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6">
            Find EV Charging Stations on the Solana Blockchain
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-white/90">
            Discover nearby charging stations, get AI-optimized pricing, and earn tokens with every charge
          </p>

          <form onSubmit={handleSearch} className="flex w-full max-w-lg mx-auto mb-8 gap-2">
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/70" />
              <Input
                type="text"
                placeholder="Enter your location"
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/70"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <Button type="submit" className="bg-white text-rose-600 hover:bg-white/90">
              <Search className="mr-2 h-4 w-4" />
              Search
            </Button>
          </form>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
              <Link href="/map">Find Stations</Link>
            </Button>
            <Button asChild size="lg" className="bg-white text-rose-600 hover:bg-white/90">
              <Link href="/register-station">Register Your Charger</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
