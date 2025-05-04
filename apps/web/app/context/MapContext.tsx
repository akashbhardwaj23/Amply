"use client"
import { createContext, Dispatch, SetStateAction, useState } from "react";
import {MapRef} from "react-map-gl/maplibre"


interface MapContextProps {
    map : MapRef | null
    setMap : Dispatch<SetStateAction<MapRef | null>>
}



export const MapContext = createContext<MapContextProps | null>(null)


export function MapContextProvider({
    children
}: {
    children : React.ReactNode
}){
    const [map, setMap] = useState<MapRef | null>(null);

    return <MapContext.Provider value={{map, setMap}}>
        {children}
    </MapContext.Provider>
}