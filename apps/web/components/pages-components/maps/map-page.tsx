"use client"


import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MapPin, Filter, Search } from "lucide-react"
import { StationCard } from "@/components/station-card"
import { MapComponent } from "@/components/map-component"
import { useWallet } from "@solana/wallet-adapter-react"

const mockStations = [
  {
    id: "1",
    name: "SolCharge Downtown",
    address: "123 Main St, Anytown",
    price: 0.25,
    rating: 4.8,
    available: true,
    power: 150,
    lat: 37.7749,
    lng: -122.4194,
  },
  {
    id: "2",
    name: "EcoCharge Plaza",
    address: "456 Oak Ave, Somewhere",
    price: 0.3,
    rating: 4.5,
    available: true,
    power: 50,
    lat: 37.785,
    lng: -122.4,
  },
  {
    id: "3",
    name: "GreenWatt Station",
    address: "789 Pine St, Elsewhere",
    price: 0.22,
    rating: 4.7,
    available: false,
    power: 350,
    lat: 37.77,
    lng: -122.43,
  },
  {
    id: "4",
    name: "Volt Boost Center",
    address: "101 Elm St, Nowhere",
    price: 0.28,
    rating: 4.6,
    available: true,
    power: 100,
    lat: 37.765,
    lng: -122.41,
  },
  {
    id: "5",
    name: "SolCharge Delhi",
    address: "Delhi",
    price: 0.25,
    rating: 4.8,
    available: true,
    power: 150,
    lat: 28.6448,
    lng: 77.216721,
  },
  {
    id: "6",
    name: "SolCharge Delhi New",
    address: "New Delhi",
    price: 0.25,
    rating: 4.8,
    available: true,
    power: 150,
    lat: 28.65,
    lng: 77.2168,
  },
]

export default function MapPage() {
  const {wallet} = useWallet();

  console.log("wallets are ", wallet)
  const searchParams = useSearchParams()
  const locationQuery = searchParams.get("location")

  const [searchLocation, setSearchLocation] = useState(locationQuery || "")
  const [priceRange, setPriceRange] = useState([0, 50])
  const [powerRange, setPowerRange] = useState([0, 350])
  const [availableOnly, setAvailableOnly] = useState(false)
  const [stations, setStations] = useState(mockStations)
  const [filteredStations, setFilteredStations] = useState(mockStations)
  const [selectedStation, setSelectedStation] = useState<string | null>(null)
  const [view, setView] = useState<"list" | "map">("map")

  // Filter stations based on criteria
  useEffect(() => {
    const filtered = stations.filter((station) => {
      if (availableOnly && !station.available) return false
      if (station.price < priceRange[0] / 100 || station.price > priceRange[1] / 100) return false
      if (station.power < powerRange[0] || station.power > powerRange[1]) return false
      return true
    })
    setFilteredStations(filtered)
  }, [stations, priceRange, powerRange, availableOnly])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, this would call an API with AI search capabilities
    console.log("Searching for:", searchLocation)
    // For demo, we'll just reset filters
    setFilteredStations(mockStations)
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Find Charging Stations</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Filters sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Filter className="mr-2 h-5 w-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="location" className="text-sm font-medium">
                    Location
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="location"
                      placeholder="Enter city or address"
                      className="pl-9"
                      value={searchLocation}
                      onChange={(e) => setSearchLocation(e.target.value)}
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full">
                  <Search className="mr-2 h-4 w-4" />
                  Search with AI
                </Button>
              </form>

              <div className="space-y-2">
                <label className="text-sm font-medium">Price (SOL per kWh)</label>
                <Slider defaultValue={[0, 50]} max={50} step={1} value={priceRange} onValueChange={setPriceRange} />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{(priceRange[0] / 100).toFixed(2)} SOL</span>
                  <span>{(priceRange[1] / 100).toFixed(2)} SOL</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Power (kW)</label>
                <Slider defaultValue={[0, 350]} max={350} step={10} value={powerRange} onValueChange={setPowerRange} />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{powerRange[0]} kW</span>
                  <span>{powerRange[1]} kW</span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="available"
                  checked={availableOnly}
                  onChange={(e) => setAvailableOnly(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-rose-600 focus:ring-rose-500"
                />
                <label htmlFor="available" className="text-sm font-medium">
                  Available stations only
                </label>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Tabs defaultValue="map" className="w-full" onValueChange={(v : any) => setView(v as "list" | "map")}>
            <div className="flex justify-between items-center mb-4">
              <TabsList>
                <TabsTrigger value="map">Map View</TabsTrigger>
                <TabsTrigger value="list">List View</TabsTrigger>
              </TabsList>
              <div className="text-sm text-muted-foreground">{filteredStations.length} stations found</div>
            </div>

            <TabsContent value="map" className="mt-0">
              <div className="bg-muted rounded-lg overflow-hidden h-[600px]">
                <MapComponent
                  // map={mapRef}
                  stations={filteredStations}
                  selectedStation={selectedStation}
                  onSelectStation={setSelectedStation}
                />
              </div>
            </TabsContent>

            <TabsContent value="list" className="mt-0">
              <div className="space-y-4">
                {filteredStations.length > 0 ? (
                  filteredStations.map((station) => (
                    <StationCard
                      key={station.id}
                      station={station}
                      selected={selectedStation === station.id}
                      onSelect={() => setSelectedStation(station.id)}
                    />
                  ))
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No stations found matching your criteria</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
