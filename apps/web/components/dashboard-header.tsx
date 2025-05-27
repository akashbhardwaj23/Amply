"use client"
import Link from "next/link";
import { Separator } from "./ui/separator";
import { ModeToggle } from "./mode-toggle";
import { useIsMobile } from "@/hooks/use-mobile";
import { SidebarTrigger } from "./ui/sidebar";




export default function DashboardAppbar(){
    const isMobile = useIsMobile();
    return (
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4 w-full">
           
            <div className="flex h-16 shrink-0 items-center gap-2 text-foreground">
              {/* <Separator className="mr-2 h-4" /> */}
               {isMobile && (<div className="flex justify-end w-full">
              <SidebarTrigger />
            </div>)}
              <Link href="/" className="flex items-center space-x-2">
                <span className="text-xl font-bold tracking-tight">Amply</span>
              </Link>
            </div>

            <ModeToggle />
          </header>
    )
}