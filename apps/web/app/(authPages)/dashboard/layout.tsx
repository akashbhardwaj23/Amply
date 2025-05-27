import DashboardAppbar from "@/components/dashboard-header";
import { ModeToggle } from "@/components/mode-toggle";
import SidebarComponent from "@/components/sidebar-components/sidebar-dashboard";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getUser } from "@civic/auth-web3/nextjs";
import { Separator } from "@radix-ui/react-dropdown-menu";
import { cookies } from "next/headers";
import Link from "next/link";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();

  const defaultOptions = cookieStore.get("sidebarState")?.value === "true";

  const user = await getUser();

  return (
    <TooltipProvider>
      <SidebarProvider
        style={{
          //@ts-ignore
          "--sidebar-width": "15rem",
        }}
        className="bg-white"
      >
        <SidebarComponent user={user} />
        <SidebarInset>
          <DashboardAppbar />
          <div className="h-full">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
