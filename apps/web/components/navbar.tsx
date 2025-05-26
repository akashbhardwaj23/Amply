"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { ModeToggle } from "@/components/mode-toggle";
import { Mic } from "lucide-react";
import { useEffect, useState } from "react";
import { VoiceCommandDialog } from "@/components/voice-command-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion } from "motion/react";
import { useUser } from "@civic/auth-web3/react";
import { AvatarImage } from "@radix-ui/react-avatar";
import { Loader } from "./ui/loader";
import { useLoading } from "@/hooks/useLoading";
import { ChargerType } from "@/types";
import { fetchChargerData } from "@/app/server/charger";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export default function Navbar() {
  const pathname = usePathname();
  const [voiceCommandOpen, setVoiceCommandOpen] = useState(false);
  const router = useRouter();
  const { loading, setLoading } = useLoading();
  const { user, isLoading, signIn, signOut } = useUser();
  const [cData, setCData] = useState<ChargerType[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const chargeData = await fetchChargerData();

      setCData(chargeData);
    };

    fetchData();
  }, []);

  const handleSignIn = async () => {
    setLoading(true);
    await signIn();
    setLoading(false);
  };

  const handleSignOut = async () => {
    setLoading(true);
    await signOut();
    setLoading(false);
  };

  return (
    <motion.header
      initial={{ opacity: 0, scaleX: 0.98 }}
      animate={{ opacity: 1, scaleX: 1 }}
      transition={{ type: "spring", damping: 10, stiffness: 100 }}
      className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center space-x-2">
            <img
              src="/logo.jpg"
              alt="EV Charging Station"
              className="w-8 h-8 object-cover"
            />
            <span className="text-xl font-bold tracking-tight">Amply</span>
          </Link>
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <Link href="/map" legacyBehavior passHref>
                  <NavigationMenuLink
                    className={cn(
                      navigationMenuTriggerStyle(),
                      pathname === "/map" && "font-medium"
                    )}
                  >
                    Find Stations
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Features</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                    <li className="row-span-3">
                      <NavigationMenuLink asChild>
                        <a
                          className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-rose-500 to-red-700 p-6 no-underline outline-none focus:shadow-md"
                          href="/register-station"
                        >
                          <div className="mt-4 mb-2 text-lg font-medium text-white">
                            Register Your Charger
                          </div>
                          <p className="text-sm leading-tight text-white/90">
                            Add your charging station to our network and earn
                            Solana tokens
                          </p>
                        </a>
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <Link href="/ai-pricing" legacyBehavior passHref>
                        <NavigationMenuLink className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                          <div className="text-sm font-medium leading-none">
                            AI Pricing
                          </div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            Get the best charging rates with our AI price
                            optimizer
                          </p>
                        </NavigationMenuLink>
                      </Link>
                    </li>
                    <li>
                      <Link href="/token" legacyBehavior passHref>
                        <NavigationMenuLink className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                          <div className="text-sm font-medium leading-none">
                            Token Rewards
                          </div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            Earn and spend tokens through our referral program
                          </p>
                        </NavigationMenuLink>
                      </Link>
                    </li>
                    <li>
                      <Link href="/escrow" legacyBehavior passHref>
                        <NavigationMenuLink className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                          <div className="text-sm font-medium leading-none">
                            Secure Payments
                          </div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            Our escrow system ensures safe transactions on the
                            Solana blockchain
                          </p>
                        </NavigationMenuLink>
                      </Link>
                    </li>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setVoiceCommandOpen(true)}
            aria-label="Voice commands"
          >
            <Mic className="h-5 w-5" />
          </Button>

          {user && (<WalletMultiButton style={{ backgroundColor: "#d32454" }} />)}

          <ModeToggle />

          {user && !isLoading ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 rounded-full"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.picture} />
                    <AvatarFallback>
                      <img src="/avatar.svg" alt="avatar" />
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClickCapture={() => router.push("/profile")}
                >
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/dashboard")}>
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              {isLoading ? (
                <Loader />
              ) : (
                <Button variant="default" onClick={handleSignIn}>
                  Sign In
                </Button>
              )}
            </>
          )}
        </div>
      </div>
      <VoiceCommandDialog
        open={voiceCommandOpen}
        onOpenChange={setVoiceCommandOpen}
        chargerData={cData}
      />
    </motion.header>
  );
}
