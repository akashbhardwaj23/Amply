"use client";

import { Loader } from "@/components/ui/loader";
import { createContext, Dispatch, SetStateAction, useState } from "react";


interface LoadingType {
    loading : boolean,
    setLoading : Dispatch<SetStateAction<boolean>>
}


export const LoadingContext = createContext<LoadingType | null>(null)


export function LoadingProvider({
    children
}: {
    children : React.ReactNode
}){
    const [loading, setLoading] = useState<boolean>(false);

    if(loading){
        return <div className="w-full h-screen flex justify-center items-center">
            <Loader />
        </div>
    }

    return <LoadingContext.Provider value={{loading, setLoading}}>
        {children}
    </LoadingContext.Provider>
}