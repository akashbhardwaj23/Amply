"use client";
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
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Calendar,
  Home,
  MessageSquareText,
  Search,
  Settings,
} from "lucide-react";

import React from "react";
import { Button } from "@/components/ui/button";
import { SideBarUser } from "@/components/sidebar-components/side-bar-user";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import Link from "next/link";

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
];

export default function SidebarComponent({
  user
} : {
  user : any
}) {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="text-foreground dark:text-white mt-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <div className="flex justify-end w-full">
              <SidebarTrigger />
            </div>
            <SidebarMenu className="py-4">
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    className={cn(
                      "text-sm",
                      pathname === item.url && "bg-primary"
                    )}
                    asChild
                  >
                    <Link href={item.url}>
                      <Button asChild className="!text-start items-start">
                        <React.Fragment key={item.title}>
                          {<item.icon className="h-11 w-11" />}
                          <span className="text-sm">{item.title}</span>
                        </React.Fragment>
                      </Button>
                    </Link>
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
            name: user.name || "jhon",
            email: user.email || "jhon@gmail.com",
            avatar: user.picture || "",
          }}
        />
      </SidebarFooter>
    </Sidebar>
  );
}
