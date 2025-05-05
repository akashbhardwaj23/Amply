'use client';

import { usePathname } from "next/navigation";
import DashboardAIPricing from "../_tabs/ai-pricing";
import DashboardFindStation from "../_tabs/find-stations";
import DashboardHome from "../_tabs/home";
import DashboardRegisterStation from "../_tabs/register-station";
import DashboardRewards from "../_tabs/rewards";
import MapPage from "@/components/pages-components/maps/map-page";

const DashBoardTabs = () => {
    const pathname = usePathname()

    switch (pathname) {
        case "/dashboard/ai-pricing":
            return <DashboardAIPricing />;
        case "/dashboard/find-stations":
            return <MapPage/>;
        case "/dashboard/register-station":
            return <DashboardRegisterStation/>;
        case "/dashboard/rewards":
            return <DashboardRewards/>;
        default:
            return <DashboardHome/>

    }
    return <DashboardHome/>;
}
 
export default DashBoardTabs;