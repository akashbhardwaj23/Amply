"use client"
import { createContext, Dispatch, SetStateAction, useCallback, useEffect, useState } from "react";
import {MapRef, useMap} from "react-map-gl/maplibre"


interface MapContextProps {
    map : MapRef | null
    setMap : Dispatch<SetStateAction<MapRef | null>>
    flyToAPoint: (longitude: number, latitude: number) => void
}

export const MapContext = createContext<MapContextProps | null>(null)


export function MapContextProvider({
    children
}: {
    children : React.ReactNode
}){
    const [map, setMap] = useState<MapRef | null>(null);

    const flyToAPoint = useCallback((longitude : number, latitude : number) => {
        if(map){
            map.flyTo({
                center: [longitude, latitude],
                zoom: 16,
                speed: 0.2,
              });
        }
    },[])


    useEffect(() => {
        if(!map){
            const newMap = useMap();
            if(newMap.current){
                setMap(newMap.current);
            }
        }
    },[map])

    return <MapContext.Provider value={{map, setMap, flyToAPoint}}>
        {children}
    </MapContext.Provider>
}