import {createSlice} from "@reduxjs/toolkit"
import { MapRef } from "react-map-gl/maplibre"

export interface MapState {
    map : MapRef
}

const initialState = {

}