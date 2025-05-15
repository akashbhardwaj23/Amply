import { configureStore } from '@reduxjs/toolkit'

export const chargerStore = configureStore({
    reducer : {}
})


// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof chargerStore.getState>
export type AppDispatch = typeof chargerStore.dispatch