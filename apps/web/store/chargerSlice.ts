import { ChargerType } from "@/types";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "./charger";


export type ChargerStoreSlice = {
    charger : ChargerType[],
}


const defaultState : ChargerStoreSlice = {
    charger : []
}

export const chargerSlice = createSlice({
  name: 'charger',
  initialState: defaultState,
  reducers: {
    setCharger: (state, action: PayloadAction<any>) => state.charger + action.payload,
  },
})


export const { setCharger } = chargerSlice.actions;

export const selectChargerValue = (state: RootState) => state.charger.value

export default chargerSlice.reducer;