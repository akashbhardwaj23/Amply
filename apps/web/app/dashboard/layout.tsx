import { ModeToggle } from "@/components/mode-toggle";
import SidebarComponent from "@/components/sidebar-components/sidebar-dashboard";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Separator } from "@radix-ui/react-dropdown-menu";
import { cookies } from "next/headers";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
    const cookieStore = await cookies()

    const defaultOptions = cookieStore.get("sidebarState")?.value === "true"

  return (
    <SidebarProvider  style={{
        //@ts-ignore
        "--sidebar-width": "15rem"
      }}>
    <SidebarComponent/>
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4 dark:!bg-[#333] bg-rose-500 ">
          <div className="flex h-16 shrink-0 items-center gap-2 text-white">
            <Separator className="mr-2 h-4" />
            <a href="/" className="flex items-center space-x-2">
              <span className="text-xl font-bold tracking-tight">Amply</span>
            </a>
          </div>

          <ModeToggle />
        </header>
        <div>{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
