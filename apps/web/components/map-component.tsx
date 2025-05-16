'use client';

import { RefObject, useCallback, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Navigation, MapPin, Zap } from 'lucide-react';
import { Layer, LayerProps, Map, MapRef, Marker, Source } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { NomanatomData } from '@/types/nomanatom';

interface Station {
  id: string;
  name: string;
  address: string;
  price: number;
  rating: number;
  available: boolean;
  power: number;
  lat: number;
  lng: number;
}

interface boundingboxType {
  minLon : number,
  minLat : number,
  maxLon : number,
  maxLat : number
}

interface MapComponentProps {
  city ? : NomanatomData
  mapRef : RefObject<MapRef | null>
  stations: Station[];
  selectedStation: string | null;
  onSelectStation: (id: string) => void;
}

export function MapComponent({
  city,
  mapRef,
  stations,
  selectedStation,
  onSelectStation,
}: MapComponentProps) {
  // const [map, setMap] = useState<MapRef | null>(null)
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [navigating, setNavigating] = useState(false)

  const flyToThePosition = useCallback(
    (longitude: number, latitude: number) => {
      if (mapRef.current) {
        const map = mapRef.current;

        map.flyTo({
          center: [longitude, latitude],
          zoom: 16,
          speed: 0.2,
        });
      }

    },
    []
  );



  return (
    <div className="relative h-full w-full bg-gray-100 dark:bg-gray-800">
      <Map
        initialViewState={{
          longitude: 77.216721,
          latitude: 28.6448,
          zoom: 14,
        }}
        id="findStationMap"
        ref={mapRef}
        interactive
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          zIndex: 10,
        }}
        mapStyle="https://tiles.openfreemap.org/styles/liberty"
      >

      {city && (
        <>
       <MapComponentCityOutline city={city} />
       </>
      )}


        {stations.map((station) => (
          <Marker
            longitude={station.lng}
            latitude={station.lat}
            key={station.id}
            onClick={() => {
              onSelectStation(station.id);
            }}
          >
            <MapPin
              className={`w-8 h-8 ${selectedStation === station.id ? 'text-red-600' : 'text-gray-800'}`}
            />
          </Marker>
        ))}
      </Map>

      <div className="absolute inset-0 grid grid-cols-8 grid-rows-8">
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

      {selectedStation && (
        <Card className="absolute bottom-4 left-4 right-4 max-w-md mx-auto z-50">
          <CardContent className="p-4">
            {stations
              .filter((s) => s.id === selectedStation)
              .map((station) => (
                <div
                  key={station.id}
                  className="flex justify-between items-start"
                >
                  <div>
                    <h3 className="font-bold">{station.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {station.address}
                    </p>
                    <div className="flex items-center mt-2 space-x-4 text-sm">
                      <span className="flex items-center">
                        <Zap className="mr-1 h-4 w-4 text-amber-500" />
                        {station.power} kW
                      </span>
                      <span>{station.price.toFixed(2)} SOL/kWh</span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      setNavigating(true);
                      flyToThePosition(station.lng, station.lat)
                      setNavigating(false)
                    }}
                  >
                    {navigating ? "Navigating" : "Navigate"}
                  </Button>
                </div>
              ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}



function MapComponentCityOutline({
  city
}: {
  city : NomanatomData
}){


    // "type": "Feature",
  // "geometry": {
  //   "type": "Polygon",
  //   "coordinates": [
  //     [
  //       [-122.514426, 37.779280],
  //       [-122.514426, 37.708075],
  //       [-122.356981, 37.708075],
  //       [-122.356981, 37.779280],
  //       [-122.514426, 37.779280]
  //     ]
  //   ]
  // },
  // "properties": {
  //   "name": "Sample City"
  // }


  if(!city){
    return null
  }


  console.log(city)


  // Create GeoJSON for the bounding box as a Polygon
  const cityboundaries: GeoJSON.Feature<GeoJSON.Geometry> =  {
    type: "Feature",
    geometry: {
      type: "Polygon",
      coordinates: [[
        [Number(city.boundingbox[0]), Number(city.boundingbox[1])], // Bottom-left
        [Number(city.boundingbox[2]), Number(city.boundingbox[1])], // Bottom-right
        [Number(city.boundingbox[2]), Number(city.boundingbox[3])], // Top-right
        [Number(city.boundingbox[0]), Number(city.boundingbox[3])], // Top-left
        [Number(city.boundingbox[0]), Number(city.boundingbox[1])]  // Close the polygon
      ]]
    },
    properties: {
      name: city.name
    }
  };

  const layerStyle: LayerProps = {
    id: "city-boundary",
    type: "line",
    paint: {
      "line-color": "#ff0000",
      "line-width": 3
    }
  };

  return ( <Source id="bbox-source" type="geojson" data={cityboundaries!}>
    <Layer {...layerStyle} />
  </Source>)
}