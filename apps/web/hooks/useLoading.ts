import { LoadingContext } from "@/app/context/LoadingContext";
import { useContext } from "react";



export function useLoading(){
    const context = useContext(LoadingContext);

    if(!context){
        throw Error("Context Must be Provided");
    }

    return context;
}