"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent } from "@repo/ui/components/ui/card"
import { Button } from "@repo/ui/components/ui/button"
import { Navigation, MapPin, Zap } from "lucide-react"

interface Station {
  id: string
  name: string
  address: string
  price: number
  rating: number
  available: boolean
  power: number
  lat: number
  lng: number
}

interface MapComponentProps {
  stations: Station[]
  selectedStation: string | null
  onSelectStation: (id: string) => void
}

export function MapComponent({ stations, selectedStation, onSelectStation }: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)

  // In a real implementation, this would use a map library like Google Maps, Mapbox, or Leaflet
  // For this demo, we'll create a simple visual representation

  useEffect(() => {
    // Simulate getting user's location
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
      },
      (error) => {
        console.error("Error getting location:", error)
        // Default to San Francisco if location access is denied
        setUserLocation({ lat: 37.7749, lng: -122.4194 })
      },
    )
  }, [])

  return (
    <div className="relative h-full w-full bg-gray-100 dark:bg-gray-800">
      {/* This would be replaced with an actual map in a real implementation */}
      <div ref={mapRef} className="h-full w-full relative overflow-hidden">
        {/* Simulated map background */}
        <div className="absolute inset-0 grid grid-cols-8 grid-rows-8">
          {Array.from({ length: 64 }).map((_, i) => (
            <div
              key={i}
              className="border border-gray-200 dark:border-gray-700"
              style={{ opacity: Math.random() * 0.5 + 0.5 }}
            />
          ))}
        </div>

        {/* Station markers */}
        {stations.map((station) => (
          <div
            key={station.id}
            className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all ${
              selectedStation === station.id ? "scale-125 z-10" : "hover:scale-110"
            }`}
            style={{
              left: `${(station.lng + 122.45) * 100}px`,
              top: `${(37.8 - station.lat) * 100}px`,
            }}
            onClick={() => onSelectStation(station.id)}
          >
            <div className={`p-1 rounded-full ${station.available ? "bg-emerald-500" : "bg-gray-400"}`}>
              <MapPin className={`h-6 w-6 ${selectedStation === station.id ? "text-white" : "text-white/80"}`} />
            </div>
          </div>
        ))}

        {/* User location marker */}
        {userLocation && (
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20"
            style={{
              left: `${(userLocation.lng + 122.45) * 100}px`,
              top: `${(37.8 - userLocation.lat) * 100}px`,
            }}
          >
            <div className="p-1 rounded-full bg-rose-600 animate-pulse">
              <Navigation className="h-6 w-6 text-white" />
            </div>
          </div>
        )}
      </div>

      {/* Selected station info */}
      {selectedStation && (
        <Card className="absolute bottom-4 left-4 right-4 max-w-md mx-auto">
          <CardContent className="p-4">
            {stations
              .filter((s) => s.id === selectedStation)
              .map((station) => (
                <div key={station.id} className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold">{station.name}</h3>
                    <p className="text-sm text-muted-foreground">{station.address}</p>
                    <div className="flex items-center mt-2 space-x-4 text-sm">
                      <span className="flex items-center">
                        <Zap className="mr-1 h-4 w-4 text-amber-500" />
                        {station.power} kW
                      </span>
                      <span>{station.price.toFixed(2)} SOL/kWh</span>
                    </div>
                  </div>
                  <Button size="sm">Navigate</Button>
                </div>
              ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
