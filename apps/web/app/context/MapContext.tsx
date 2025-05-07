"use client"
import { createContext, Dispatch, SetStateAction, useCallback, useEffect, useState } from "react";
import {MapRef, useMap} from "react-map-gl/maplibre"


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

    // function init(){
    //     const newMap = useMap();
    //     if(newMap.current){
    //         setMap(newMap.current);
    //     }
    // }

    // useEffect(() => {
    //     init();
    // }, [map])

    return <MapContext.Provider value={{map, setMap}}>
        {children}
    </MapContext.Provider>
}