import { ModeToggle } from "@/components/mode-toggle";
import SidebarComponent from "@/components/sidebar-components/sidebar-dashboard";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getUser } from "@civic/auth-web3/nextjs";
import { Separator } from "@radix-ui/react-dropdown-menu";
import { cookies } from "next/headers";
import Link from "next/link";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
    const cookieStore = await cookies()

    const defaultOptions = cookieStore.get("sidebarState")?.value === "true"


    const user = await getUser();

  return (
    <SidebarProvider  style={{
        //@ts-ignore
        "--sidebar-width": "15rem",
      }} className="bg-white">
    <SidebarComponent user={user}/>
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4">
          <div className="flex h-16 shrink-0 items-center gap-2 text-foreground">
            <Separator className="mr-2 h-4" />
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-xl font-bold tracking-tight">Amply</span>
            </Link>
          </div>

          <ModeToggle />
        </header>
        <div className="h-full">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
