import { getUser } from "@civic/auth-web3/nextjs";
import { NextResponse } from "next/server";


export async function GET(req : Request, { params }: { params: Promise<{ location: string }> }){
    const {location} = await params
    
    if(!location){
        return NextResponse.json({
            message : "Unauthorized"
        })
    }


    console.log(location)

     const user = await getUser();
    
        if (!user) {
          return  NextResponse.json({
            status: 404,
            error: "User Not Present",
            data: null,
          })
        }
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${location}&format=json`,
            {
              signal: AbortSignal.timeout(5000),
              headers: {
                "User-Agent": "Amply-app",
              },
            }
          );
    
          if (!response.ok) {
            return NextResponse.json({
              status: 504,
              error: "Unable to Reach the Api",
              data: null,
            });
          }
    
          const data = await response.json();
    
          return NextResponse.json({
            status: 200,
            data: data,
          });
        } catch (err) {
          return NextResponse.json({
            status: 504,
            error: "Unable to Reach the Api",
            data: null,
          });
        }
}