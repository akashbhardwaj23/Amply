'use client'
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarInset,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
    SidebarTrigger
} from '@/components/ui/sidebar'
import { Separator } from "@/components/ui/separator"
import {
    Calendar,
    Home,
    MessageSquareText,
    Search,
    Settings
} from "lucide-react"

import React from 'react'
import { Button } from '@/components/ui/button'
import { SideBarUser } from '@/components/side-bar-user'
import { ModeToggle } from '@/components/mode-toggle'
import { cn } from '@/lib/utils'
import { usePathname } from 'next/navigation'

type Props = {
    children: React.ReactNode
}

// Menu items.
const items = [
    {
        title: "Home",
        url: "/dashboard",
        icon: Home,
    },
    {
        title: "Find Stations",
        url: "/dashboard/find-stations",
        icon: Search,
    },
    {
        title: "Register your Station",
        url: "/dashboard/register-station",
        icon: Calendar,
    },
    {
        title: "Tokens Rewards",
        url: "/dashboard/rewards",
        icon: MessageSquareText,
    },
    {
        title: "AI Pricing",
        url: "/dashboard/ai-pricing",
        icon: Settings,
    },
]

export default async function DashBoardLayout({
    children
}: Props) {
    const pathname = usePathname();
    return (
        <SidebarProvider>
            <Sidebar
                collapsible="icon"
            >
                <SidebarContent className="text-white mt-4">
                    <SidebarGroup>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {items.map((item) => (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton 
                                        className={
                                            cn(
                                                "text-lg",
                                                pathname === item.url ? "bg-[#333] dark:bg-primary" : ""
                                            )
                                        }
                                        asChild>
                                            <a href={item.url}>
                                                <Button asChild className='!text-start items-start ' size='lg'
                                                >
                                                    <>
                                                        {React.createElement(item.icon, { size: 40, className: "h-11 w-11" })}
                                                        <span className='text-xl'>{item.title}</span>
                                                    </>
                                                </Button>
                                            </a>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                </SidebarContent>

                <SidebarFooter>
                    <SideBarUser
                        user={{
                            name: "John Doe",
                            email: "jogn@gmail.com",
                            avatar: ""
                        }}
                    />
                </SidebarFooter>
            </Sidebar>
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4 dark:!bg-[#333] bg-rose-500 ">
                    <div className='flex h-16 shrink-0 items-center gap-2 text-white'>
                        <SidebarTrigger className="-ml-1" />

                        <Separator orientation="vertical" className="mr-2 h-4" />
                        <a href="/" className="flex items-center space-x-2">
                            <span className="text-xl font-bold tracking-tight">Amply</span>
                        </a>
                    </div>

                    <ModeToggle />
                </header>
                {children}
            </SidebarInset>
        </SidebarProvider>
    )
}