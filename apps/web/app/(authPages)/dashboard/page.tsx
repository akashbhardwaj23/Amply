"use client";

import { useEffect, useState } from "react";
import { ChargeButton } from "@/components/ChargeButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Battery,
  Calendar,
  ChartCandlestick,
  Clock,
  CreditCard,
  History,
  MapPin,
  Zap,
} from "lucide-react";
import { useUser } from "@civic/auth-web3/react";
import { fetchChargerData } from "@/app/server/charger";
import { Loader } from "@/components/ui/loader";
import { ChargerType } from "@/types";
import SelectChargeButton from "@/components/select-charger";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const DashBoardPage = () => {
  const [cData, setCData] = useState<ChargerType[]>();
  const [selectedCharger, setSelectedCharger] = useState<ChargerType>();
  const [loading, setLoading] = useState(false);
  const [isCharging, setIsCharging] = useState(false);
  const [viewAll, setViewAll] = useState(false);

  const getCharger = async () => {
    setLoading(true);
    const chargerData = await fetchChargerData();
    setCData(chargerData);
    setLoading(false);
  };
  useEffect(() => {
    getCharger();
  }, []);

  console.log("cData", cData);
  const { user, isLoading } = useUser();

  // if (!user) {
  //   return <div>User Not Found</div>;
  // }

  if (isLoading || loading) {
    return (
      <div className="flex justify-center items-center h-72">
        <Loader />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <Button variant="outline" size="sm">
              <History className="mr-2 h-4 w-4" />
              View All Activity
            </Button>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={user?.picture} alt={user?.name} />
                    <AvatarFallback>{user?.name?.charAt(0)!}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle>{user?.name}</CardTitle>
                    <CardDescription>{user?.email}</CardDescription>
                  </div>
                </div>

                <Dialog>
                  <DialogTrigger className="border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 rounded-md px-3">
                    Edit Profile
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="text-3xl">Profile</DialogTitle>
                    </DialogHeader>

                    <div className="flex items-center space-x-2">
                      <div className="grid flex-1 gap-2">
                        <label htmlFor="name">Name : </label>
                        <Input
                          id="name"
                          defaultValue={user?.name}
                          readOnly
                        />
                        <label htmlFor="email">Email : </label>
                        <Input
                          id="email"
                          defaultValue={user?.email}
                          readOnly
                        />
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="mr-4 rounded-full bg-rose-100 p-2 dark:bg-rose-900">
                    <CreditCard className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Token Balance</p>
                    <p className="text-2xl font-bold">
                      {userData.tokenBalance} SOL
                    </p>
                  </div>

                  <div className="p-2 flex flex-col justify-between items-start gap-2">
                    <Label className="text-[10px]">Use the Token Balance</Label>
                    <Switch className="text-primary bg-white" />
                  </div>
                </div>
                <Button size="sm">
                  <Zap className="mr-2 h-4 w-4" />
                  Add Tokens
                </Button>
              </div>

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="mr-4 rounded-full bg-rose-100 p-2 dark:bg-rose-900">
                    <ChartCandlestick className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Solana Balance</p>
                    <p className="text-2xl font-bold">
                      {userData.tokenBalance} SOL
                    </p>
                  </div>
                </div>
              </div>

              <Separator className="my-4" />

              <div>
                <h3 className="text-lg font-medium mb-3">
                  Previous Charging Sessions
                </h3>
                <div className="space-y-3">
                  {userData.previousChargingSessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between bg-muted/50 p-3 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{session.location}</p>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="mr-1 h-3 w-3" />
                          <span>{session.date}</span>
                          <span className="mx-2">•</span>
                          <Clock className="mr-1 h-3 w-3" />
                          <span>{session.duration}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{session.cost}</p>
                        <p className="text-sm text-muted-foreground">
                          {session.energy}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Charging Statistics</CardTitle>
              <CardDescription>
                Your charging activity over the past month
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">
                    Total Energy
                  </p>
                  <p className="text-2xl font-bold">245.8 kWh</p>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">
                    Total Spent
                  </p>
                  <p className="text-2xl font-bold">61.45 SOL</p>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Sessions</p>
                  <p className="text-2xl font-bold">12</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Nearby Charger</CardTitle>
              <CardDescription>
                Currently closest to your location
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedCharger ? (
                <div className="bg-rose-50 dark:bg-rose-950/20 p-4 rounded-lg border border-rose-200 dark:border-rose-800">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-lg">
                      {selectedCharger.account.name}
                    </h3>
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                      {chargerData.status}
                    </span>
                  </div>

                  <div className="flex items-center text-sm text-muted-foreground mb-4">
                    <MapPin className="mr-1 h-4 w-4" />
                    <span>{selectedCharger.account.address}</span>
                    <span className="mx-2">•</span>
                    <span>{chargerData.distance}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Power Output
                      </p>
                      <p className="font-medium">
                        {selectedCharger.account.power.length}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Price</p>
                      <p className="font-medium">
                        {selectedCharger.account.price.length}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Connector Types
                      </p>
                      <p className="font-medium">
                        {selectedCharger.account.chargerType}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Availability
                      </p>
                      <p className="font-medium">
                        {chargerData.currentUsers}/{chargerData.maxUsers} in use
                      </p>
                    </div>
                  </div>

                  {/* <div className="mb-4">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-sm font-medium">Your Vehicle Battery</p>
                    <p className="text-sm">{chargerData.batteryLevel}%</p>
                  </div>
                  <Progress value={chargerData.batteryLevel} className="h-2" />
                </div> */}

                  <ChargeButton
                    charger={selectedCharger}
                    isCharging={isCharging}
                    setIsCharging={setIsCharging}
                  />
                </div>
              ) : (
                <div className="bg-rose-50 text-primary dark:bg-rose-950/20 p-4 rounded-lg border border-rose-200 dark:border-rose-800">
                  No Selected Charger
                </div>
              )}
            </CardContent>

            <div className="space-y-6">
              <CardContent>
                {cData &&
                  cData.map((charger, idx) => (
                      viewAll ? (<SelectChargeButton
                      key={idx}
                      charger={charger}
                      isCharging={isCharging}
                      setSelectedCharger={setSelectedCharger}
                    />): (idx < 4 && (<SelectChargeButton
                      key={idx}
                      charger={charger}
                      isCharging={isCharging}
                      setSelectedCharger={setSelectedCharger}
                    />))
                  ))}
                  <div className="flex justify-end items-center p-4">
               <Button variant={"ghost"} onClick={() => setViewAll(prev => !prev)}>{viewAll ? "View Less" : "View All"}</Button>
              </div>
              </CardContent>

            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Charging Rewards</CardTitle>
              <CardDescription>
                Earn tokens with every charge. Coming Soon
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Battery className="mr-2 h-4 w-4 text-emerald-500" />
                    <span className="text-sm font-medium">Next Reward</span>
                  </div>
                  <span className="font-bold">5.0 SOL</span>
                </div>

                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-sm mb-2">
                    Refer friends and earn 10 SOL for each new user who
                    completes their first charging session.
                  </p>
                  <Button variant="outline" size="sm" className="w-full">
                    Share Referral Code
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DashBoardPage;

// Mock user data
const userData = {
  name: "Alex Johnson",
  email: "alex.johnson@example.com",
  avatar: "/placeholder.svg?height=40&width=40",
  tokenBalance: 125.75,
  previousChargingSessions: [
    {
      id: "cs-001",
      date: "May 8, 2025",
      location: "SolCharge Downtown",
      duration: "45 min",
      energy: "32.5 kWh",
      cost: "8.13 SOL",
    },
    {
      id: "cs-002",
      date: "May 3, 2025",
      location: "EcoCharge Plaza",
      duration: "30 min",
      energy: "22.1 kWh",
      cost: "6.63 SOL",
    },
    {
      id: "cs-003",
      date: "Apr 28, 2025",
      location: "GreenWatt Station",
      duration: "60 min",
      energy: "45.8 kWh",
      cost: "10.08 SOL",
    },
  ],
};

// Mock charger data
const chargerData = {
  id: "charger-001",
  name: "SolCharge Downtown #5",
  location: "123 Main St, Anytown",
  status: "Available",
  power: "150 kW",
  price: "0.25 SOL/kWh",
  connectorType: "CCS, CHAdeMO",
  currentUsers: 0,
  maxUsers: 2,
  distance: "0.3 miles away",
  batteryLevel: 42,
};
