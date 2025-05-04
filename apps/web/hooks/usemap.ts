"use client"
import { MapContext } from "@/app/context/MapContext";
import { useContext } from "react";


export function useMap(){
  const mapInstance = useContext(MapContext);
  if(!mapInstance){
    throw Error("Map Should be Provided");
  }

  return {
    map :  mapInstance.map,
    setMap : mapInstance.setMap
  }
}