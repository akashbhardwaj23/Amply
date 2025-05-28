"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Zap, Star } from "lucide-react"
import { MapRef, useMap } from "react-map-gl/maplibre"
import { Dispatch, RefObject, SetStateAction, useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface Station {
  id: string
  name: string
  address: string
  price: number
  rating: number
  available: boolean
  power: number
  lat: number;
  lng: number;
}

interface StationCardProps {
  station: Station
  handleTabChange : () => void
  mapRef : RefObject<MapRef | null>
  selected: boolean
  onSelect: () => void
  setView : Dispatch<SetStateAction<"list" | "map">>
}

export function StationCard({ station, mapRef,handleTabChange, selected, onSelect, setView }: StationCardProps) {
  const map = useMap();

  console.log("map is ",map)
  const handleClick = (longitude : number, latitude: number) => {
    console.log("clicked")
    if(mapRef.current){
      const map = mapRef.current;
      console.log("map ", map)
      map.flyTo({
        center: [longitude, latitude],
        zoom: 16,
        speed: 6,
      })
    }
  

    setView("map")
  }

  return (
    <Card className={`transition-all ${selected ? "border-rose-500 shadow-md" : "hover:shadow-sm"}`} onClick={onSelect}>
      <CardContent className="p-4">
        <div className="flex justify-between gap-1 md:gap-0">
          <div>
            <div className="flex items-center mb-1">
              <h3 className="font-bold">{station.name}</h3>
              {station.available ? (
                <Badge
                  variant="outline"
                  className="ml-1 md:ml-2 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                >
                  Available
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="ml-1 md:ml-2 bg-gray-50 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400 border-gray-200 dark:border-gray-800"
                >
                  In Use
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground flex items-center mb-2">
              <MapPin className="mr-1 h-3 w-3" />
              {station.address}
            </p>
            <div className="flex items-center space-x-4 text-xs md:text-sm">
              <span className="flex items-center">
                <Zap className="mr-1 h-4 w-4 text-amber-500" />
                {station.power} kW
              </span>
              <span className="flex items-center">
                <Star className="mr-1 h-4 w-4 text-yellow-500" />
                {station.rating}
              </span>
              <span className="font-medium">{station.price.toFixed(2)} SOL/kWh</span>
            </div>
          </div>
          <div className="flex flex-col space-y-2">
            <Button size="sm" variant="default" onClick={() => handleClick(station.lng, station.lat)}>
              Navigate
            </Button>
            <Button size="sm" variant="outline">
              Details
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
