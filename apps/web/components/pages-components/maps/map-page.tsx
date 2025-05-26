"use client";

import { useState, useEffect, useRef, ChangeEvent } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Filter, Search } from "lucide-react";
import { StationCard } from "@/components/station-card";
import { MapComponent } from "@/components/map-component";
import { MapRef } from "react-map-gl/maplibre";
import {
  web3,
  AnchorProvider,
  Program,
  setProvider,
  getProvider,
  Wallet,
} from '@coral-xyz/anchor';
import idl from '@/idl/ev_charging.json'; // Adjust path as needed
import { NomanatomData, NomanatomType } from "@/types/nomanatom"
import { PhantomProvider, Station } from '@/types';
import { Loader } from "@/components/ui/loader";
import { toast } from "@/hooks/use-toast";
import { motion } from "motion/react";

const programId = new web3.PublicKey(idl.address);
const network = "https://api.devnet.solana.com";

const getPhantomProvider = (): PhantomProvider | undefined => {
  if (typeof window !== "undefined" && "solana" in window) {
    const provider = window.solana as PhantomProvider;
    if (provider.isPhantom) return provider;
  }
  window.open("https://phantom.app/", "_blank");
  return undefined;
};

export default function MapPage() {
  const searchParams = useSearchParams();
  const locationQuery = searchParams.get("location");
  const [searchLocation, setSearchLocation] = useState(locationQuery || "");
  const [priceRange, setPriceRange] = useState([0, 50]);
  const [powerRange, setPowerRange] = useState([0, 350]);
  const [loading, setLoading] = useState(false);
  const [city, setCity] = useState<NomanatomData>();
  const [cities, setCities] = useState<NomanatomData[]>();
  const [availableOnly, setAvailableOnly] = useState(false);
  const [stations, setStations] = useState([]);
  const [filteredStations, setFilteredStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState<string | null>(null);
  const [view, setView] = useState<"list" | "map">("map");
  const mapRef = useRef<MapRef | null>(null);
  const mapTabRef = useRef<HTMLButtonElement | null>(null);
  const listTabRef = useRef<HTMLButtonElement | null>(null);

  const handleMapMove = async (longitude: number, latitude: number) => {
    if (mapRef.current) {
      const map = mapRef.current;

      map.flyTo({
        center: [longitude, latitude],
        zoom: 16,
        speed: 0.7,
      });
    }
  };



  // --- Fetch stations from Solana on mount ---
  useEffect(() => {
    // console.log('11');
    // console.log('IDL content:', idl);
    // console.log('programId:', programId.toString());

    async function fetchStations() {
      const phantom = getPhantomProvider() as PhantomProvider;
      if (!phantom) {
        toast({
          variant : "default",
          title : "Install Phantom",
          description : "Please Install Phantom Wallet"
        })
        // alert("Please install Phantom Wallet!");
        return;
      }
      console.log("333");
      try {
        await phantom.connect();
        console.log("Phantom connected:", phantom.isConnected);
        console.log("444");

        const connection = new web3.Connection(network, "confirmed");
        const provider = new AnchorProvider(
          connection,
          phantom as unknown as Wallet,
          AnchorProvider.defaultOptions()
        );
        setProvider(provider);
        console.log("555");
        const anchorProvider = getProvider();

        const program = new Program(idl, anchorProvider);
        console.log("programmm", program);

        console.log("777");
        //@ts-ignore
        const chargers = await program.account.charger.all();
        console.log("Chargers data:", chargers);

        const stationList = chargers.map(({ account, publicKey }: { account: any; publicKey: any }) => ({
          id: publicKey.toBase58(),
          name: account.name,
          address: account.address,
          price: Number(account.price) / web3.LAMPORTS_PER_SOL, // adjust if price is in lamports
          rating: 4.8, // Placeholder, replace with real rating if available
          available: account.available ?? true, // Placeholder
          power: Number(account.power),
          lat: Number(account.latitude),
          lng: Number(account.longitude),
        }));

        console.log("station", stationList);
        setStations(stationList);
        setFilteredStations(stationList);
      } catch (e) {
        console.error("Failed to fetch stations:", e);
      }
    }

    fetchStations();
  }, []);

  const fetchLoction = async () => {
    setLoading(true);
    try {
      const response = await fetch(`api/${searchLocation}`, {
        method: "GET",
      });

      const responseData: NomanatomType = await response.json();

      const citydataArray = responseData.data;

      const city = citydataArray.filter(
        (mycity) => mycity.class === "boundary"
      )[0];
      setCities(citydataArray);
      setCity(city);
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };



  const handleCitySearch = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchLocation(e.target.value);
    setCities([]);
  };



  // useEffect(() => {
  //   const fetchLoction = async () => {
  //     const response = await fetch(`api/${searchLocation}`, {
  //       method : "GET",
  //     })

  //     const responseData:NomanatomType = await response.json()

  //     const citydataArray = responseData.data;

  //     const city = citydataArray.filter(mycity => mycity.class === "boundary")[0]

  //     setCity(city);
  //   }

  //   fetchLoction()
  // },[])

  // Filter stations based on criteria
  useEffect(() => {
    const filtered = stations.filter((station: Station) => {
      if (availableOnly && !station.available) return false;
      if (
        station.price < priceRange[0] / 100 ||
        station.price > priceRange[1] / 100
      )
        return false;
      if (station.power < powerRange[0] || station.power > powerRange[1])
        return false;
      return true;
    });
    setFilteredStations(filtered);
  }, [stations, priceRange, powerRange, availableOnly]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // For demo, we'll just reset filters
    setFilteredStations(stations);
  };

  const handleTabChange = (tabType: "map" | "list") => {
    if (tabType === "map") {
      mapTabRef.current?.click();
    } else {
      listTabRef.current?.click();
    }
  };

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
            <CardContent className="space-y-6 relative">
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
                      onChange={(e) => handleCitySearch}
                    />
                  </div>
                </div>
                <Button type="submit" disabled={loading} className="w-full" onClick={fetchLoction}>
                  {loading ? (<Loader className="h-4 w-4"/>) : (
                    <>
                    <Search className="h-4 w-4" />
                  Search
                    </>
                  )}
                </Button>
              </form>

              {cities && (
                <div className="absolute top-12 z-50 rounded-b-xl max-w-64 bg-black">
                  {cities.map((mycity, index) => (
                    <motion.div key={index} layoutId="cityname" className="border-b p-4 flex flex-col" onClick={() =>
                        handleMapMove(Number(mycity.lon), Number(mycity.lat))} >
                      <span>{mycity.display_name}</span>
                      <span>Long : {mycity.lon}</span>
                      <span>Lat : {mycity.lat}</span>
                    </motion.div>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Price (SOL per kWh)
                </label>
                <Slider
                  defaultValue={[0, 50]}
                  max={50}
                  step={1}
                  value={priceRange}
                  onValueChange={setPriceRange}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{(priceRange[0] / 100).toFixed(2)} SOL</span>
                  <span>{(priceRange[1] / 100).toFixed(2)} SOL</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Power (kW)</label>
                <Slider
                  defaultValue={[0, 350]}
                  max={350}
                  step={10}
                  value={powerRange}
                  onValueChange={setPowerRange}
                />
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
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAvailableOnly(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-rose-600 focus:ring-rose-500"
                />
                <label htmlFor="available" className="text-sm font-medium">
                  Available stations only
                </label>
              </div>

              <div className="flex items-center text-xs space-x-2">
                <div className="flex flex-col items-center justify-center space-x-2">
                    <MapPin className="text-red-600" />
                    <span>Selected Map Pin</span>
                </div>
                 <div className="flex flex-col items-center justify-center space-x-2">
                    <MapPin className="text-gray-800" />
                    <span>Map Charger Position</span>
                </div>
                 <div className="flex flex-col items-center justify-center space-x-2">
                    <MapPin className="text-emerald-700 dark:text-emerald-400" />
                    <span>Searched Map Pin</span>
                </div>
              </div>

            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-2">
          <Tabs
            defaultValue="map"
            value={view}
            className="w-full"
            onValueChange={(v: any) => setView(v as "list" | "map")}
          >
            <div className="flex justify-between items-center mb-4">
              <TabsList>
                <TabsTrigger value="map" ref={mapTabRef}>
                  Map View
                </TabsTrigger>
                <TabsTrigger value="list" ref={listTabRef}>
                  List View
                </TabsTrigger>
              </TabsList>
              <div className="text-sm text-muted-foreground">
                {filteredStations.length} stations found
              </div>
            </div>
            <TabsContent value="map" className="mt-0">
              <div className="bg-muted rounded-lg overflow-hidden h-[600px]">
                <MapComponent
                  city={city}
                  mapRef={mapRef}
                  stations={filteredStations}
                  selectedStation={selectedStation}
                  onSelectStation={setSelectedStation}
                />
              </div>
            </TabsContent>
            <TabsContent value="list" className="mt-0">
              <div className="space-y-4">
                {filteredStations.length > 0 ? (
                  filteredStations.map((station: Station) => (
                    <StationCard
                      key={station.id}
                      mapRef={mapRef}
                      station={station}
                      handleTabChange={() => handleTabChange("map")}
                      selected={selectedStation === station.id}
                      onSelect={() => setSelectedStation(station.id)}
                      setView={setView}
                    />
                  ))
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">
                      No stations found matching your criteria
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
