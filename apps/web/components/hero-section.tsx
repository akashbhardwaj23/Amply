"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, MapPin } from "lucide-react"
import { useRouter } from "next/navigation"
import {motion} from "motion/react"

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
    <motion.div
    initial={{opacity:0}}
    animate={{opacity:1}}
    transition={{type:"spring", damping:10, stiffness:200}}
    className="relative">
      <div className="relative container py-24 md:py-32 text-primary">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6">
            Find EV Charging Stations on the Solana Blockchain
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-primary/90">
            Discover nearby charging stations, get AI-optimized pricing, and earn tokens with every charge
          </p>

          <form onSubmit={handleSearch} className="flex w-full max-w-lg mx-auto mb-8 gap-2">
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-foreground/70" />
              <Input
                type="text"
                placeholder="Enter your location"
                className="pl-10 bg-card border-border text-foreground placeholder:text-foreground/70"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <Button type="submit" className="bg-primary text-background hover:backdrop-blur-md hover:bg-primary/80">
              <Search className="h-4 w-4" />
              Search
            </Button>
          </form>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild size="lg" variant="outline" className="border-accent text-foreground hover:backdrop-blur-md hover:bg-foreground/20">
              <Link href="/map">Find Stations</Link>
            </Button>
            <Button asChild size="lg" className="bg-background border border-border text-rose-600 hover:bg-secondary/90">
              <Link href="/register-station">Register Your Charger</Link>
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
