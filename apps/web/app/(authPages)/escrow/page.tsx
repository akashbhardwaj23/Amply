"use client"

import { Switch } from "@/components/ui/switch"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Calendar,
  ChevronRight,
  Clock,
  ExternalLink,
  Eye,
  EyeOff,
  Info,
  Lock,
  Search,
  Shield,
  ShieldCheck,
  Wallet,
} from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { useBalance } from "@/hooks/usebalance"

// Mock escrow data
const escrowData = {
  activeEscrows: [
    {
      id: "esc-001",
      stationName: "SolCharge Downtown",
      amount: 15.5,
      status: "active",
      startTime: "May 15, 2025 10:30 AM",
      estimatedEndTime: "May 15, 2025 11:30 AM",
      progress: 65,
    },
  ],
  pendingEscrows: [
    {
      id: "esc-002",
      stationName: "EcoCharge Plaza",
      amount: 20.0,
      status: "pending",
      createdAt: "May 15, 2025 09:15 AM",
    },
  ],
  completedEscrows: [
    {
      id: "esc-003",
      stationName: "GreenWatt Station",
      amount: 12.75,
      status: "completed",
      startTime: "May 12, 2025 02:30 PM",
      endTime: "May 12, 2025 03:15 PM",
      energyDelivered: "42.5 kWh",
      transactionHash: "5UxP8Qqw3BhD...",
    },
    {
      id: "esc-004",
      stationName: "Volt Boost Center",
      amount: 8.25,
      status: "completed",
      startTime: "May 10, 2025 11:00 AM",
      endTime: "May 10, 2025 11:45 AM",
      energyDelivered: "27.5 kWh",
      transactionHash: "7JkL9PqR2TvW...",
    },
    {
      id: "esc-005",
      stationName: "SolCharge Downtown",
      amount: 18.5,
      status: "completed",
      startTime: "May 8, 2025 09:30 AM",
      endTime: "May 8, 2025 10:45 AM",
      energyDelivered: "61.7 kWh",
      transactionHash: "3FgH7JkL9PqR...",
    },
  ],
  disputedEscrows: [
    {
      id: "esc-006",
      stationName: "QuickCharge Hub",
      amount: 22.0,
      status: "disputed",
      startTime: "May 5, 2025 04:15 PM",
      endTime: "May 5, 2025 05:00 PM",
      energyDelivered: "35.2 kWh",
      disputeReason: "Charging interrupted prematurely",
      disputeStatus: "under review",
    },
  ],
  escrowSettings: {
    autoRelease: true,
    releaseDelay: 15, // minutes
    disputeWindow: 48, // hours
    notificationsEnabled: true,
  },
  totalInEscrow: 15.5,
  totalCompleted: 39.5,
  walletAddress: "7X6Ug3Rc9z2QV8C9aBJBzd...",
}

export default function EscrowPage() {
  const [activeTab, setActiveTab] = useState("overview")
  const [showWalletAddress, setShowWalletAddress] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const {balance, publicKey} = useBalance();

  const toggleWalletVisibility = () => {
    setShowWalletAddress(!showWalletAddress)
  }

  const maskWalletAddress = (address: string) => {
    return `${address.substring(0, 10)}...${address.substring(address.length - 4)}`
  }

  return (
    <div className="container py-8">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-1">Secure Escrow System</h1>
            <p className="text-muted-foreground">
              Manage your charging transactions secured by Solana blockchain technology
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">Total in Escrow</div>
            <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-950/20 px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-800">
              <Lock className="h-4 w-4 text-rose-600 dark:text-rose-400" />
              <span className="font-bold">{escrowData.totalInEscrow} SOL</span>
            </div>
          </div>
        </div>

        <Tabs defaultValue="overview" onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 w-full max-w-2xl">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="disputes">Disputes</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>How Our Escrow Works</CardTitle>
                  <CardDescription>Secure, transparent charging payments on Solana</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-rose-50 dark:bg-rose-950/20 p-4 rounded-lg border border-rose-200 dark:border-rose-800">
                    <div className="flex items-start gap-3">
                      <Shield className="h-5 w-5 text-rose-600 dark:text-rose-400 mt-0.5" />
                      <div>
                        <h3 className="font-medium mb-1">ChargeSol Escrow Protection</h3>
                        <p className="text-sm text-muted-foreground">
                          Our escrow system uses Solana smart contracts to ensure fair transactions between EV owners
                          and charging stations. Funds are only released when charging is successfully completed.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div className="bg-muted p-4 rounded-lg">
                      <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900 flex items-center justify-center mx-auto mb-3">
                        <span className="font-bold">1</span>
                      </div>
                      <h3 className="font-medium mb-1">Funds Locked</h3>
                      <p className="text-sm text-muted-foreground">
                        When you start charging, funds are locked in a secure escrow contract
                      </p>
                    </div>
                    <div className="bg-muted p-4 rounded-lg">
                      <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center mx-auto mb-3">
                        <span className="font-bold">2</span>
                      </div>
                      <h3 className="font-medium mb-1">Charging Verified</h3>
                      <p className="text-sm text-muted-foreground">
                        Energy delivery is verified by both parties and recorded on-chain
                      </p>
                    </div>
                    <div className="bg-muted p-4 rounded-lg">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center mx-auto mb-3">
                        <span className="font-bold">3</span>
                      </div>
                      <h3 className="font-medium mb-1">Funds Released</h3>
                      <p className="text-sm text-muted-foreground">
                        After successful charging, funds are automatically released to the station
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between bg-muted p-4 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Wallet className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Connected Wallet</p>
                        <p className="text-sm text-muted-foreground">
                          {showWalletAddress ? publicKey?.toString() : maskWalletAddress(publicKey?.toString() || "")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={toggleWalletVisibility}>
                        {showWalletAddress ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                      <Button variant="outline" size="sm">
                        Change Wallet
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Active Escrows</CardTitle>
                  <CardDescription>Currently locked funds</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {escrowData.activeEscrows.length > 0 ? (
                    escrowData.activeEscrows.map((escrow) => (
                      <div key={escrow.id} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium">{escrow.stationName}</h3>
                          <span className="font-bold">{escrow.amount} SOL</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <div className="flex items-center">
                            <Clock className="mr-1 h-3 w-3" />
                            <span>Started: {escrow.startTime}</span>
                          </div>
                          <div className="flex items-center mt-1">
                            <Calendar className="mr-1 h-3 w-3" />
                            <span>Est. completion: {escrow.estimatedEndTime}</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{escrow.progress}%</span>
                          </div>
                          <Progress value={escrow.progress} className="h-2" />
                        </div>
                        <Button variant="outline" size="sm" className="w-full">
                          View Details
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6">
                      <Lock className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                      <p className="text-muted-foreground">No active escrows</p>
                    </div>
                  )}

                  {escrowData.pendingEscrows.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <h3 className="font-medium mb-2">Pending Escrows</h3>
                        {escrowData.pendingEscrows.map((escrow) => (
                          <div
                            key={escrow.id}
                            className="flex items-center justify-between bg-muted p-3 rounded-lg text-sm"
                          >
                            <div>
                              <p className="font-medium">{escrow.stationName}</p>
                              <p className="text-muted-foreground">{escrow.createdAt}</p>
                            </div>
                            <div className="font-bold">{escrow.amount} SOL</div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
                <CardFooter className="border-t pt-4">
                  <Button variant="link" className="w-full" asChild>
                    <Link href="/escrow/transactions">
                      View All Transactions
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>

            {/* <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>Your latest escrow transactions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium">Station</th>
                        <th className="text-left py-3 px-4 font-medium">Date</th>
                        <th className="text-left py-3 px-4 font-medium">Energy</th>
                        <th className="text-right py-3 px-4 font-medium">Amount</th>
                        <th className="text-center py-3 px-4 font-medium">Status</th>
                        <th className="text-right py-3 px-4 font-medium">Transaction</th>
                      </tr>
                    </thead>
                    <tbody>
                      {escrowData.completedEscrows.slice(0, 3).map((escrow) => (
                        <tr key={escrow.id} className="border-b">
                          <td className="py-3 px-4">{escrow.stationName}</td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">{escrow.endTime}</td>
                          <td className="py-3 px-4">{escrow.energyDelivered}</td>
                          <td className="py-3 px-4 text-right font-medium">{escrow.amount} SOL</td>
                          <td className="py-3 px-4">
                            <div className="flex justify-center">
                              <span className="px-2 py-1 text-xs rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                                Completed
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card> */}
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <CardTitle>All Transactions</CardTitle>
                  <div className="relative w-full md:w-64">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search transactions..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium">Station</th>
                        <th className="text-left py-3 px-4 font-medium">Start Time</th>
                        <th className="text-left py-3 px-4 font-medium">End Time</th>
                        <th className="text-left py-3 px-4 font-medium">Energy</th>
                        <th className="text-right py-3 px-4 font-medium">Amount</th>
                        <th className="text-center py-3 px-4 font-medium">Status</th>
                        <th className="text-right py-3 px-4 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {escrowData.activeEscrows.map((escrow) => (
                        <tr key={escrow.id} className="border-b">
                          <td className="py-3 px-4">{escrow.stationName}</td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">{escrow.startTime}</td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">{escrow.estimatedEndTime}</td>
                          <td className="py-3 px-4">In progress</td>
                          <td className="py-3 px-4 text-right font-medium">{escrow.amount} SOL</td>
                          <td className="py-3 px-4">
                            <div className="flex justify-center">
                              <span className="px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                                Active
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Button variant="ghost" size="sm">
                              View
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {escrowData.pendingEscrows.map((escrow) => (
                        <tr key={escrow.id} className="border-b">
                          <td className="py-3 px-4">{escrow.stationName}</td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">{escrow.createdAt}</td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">-</td>
                          <td className="py-3 px-4">Pending</td>
                          <td className="py-3 px-4 text-right font-medium">{escrow.amount} SOL</td>
                          <td className="py-3 px-4">
                            <div className="flex justify-center">
                              <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                                Pending
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Button variant="ghost" size="sm">
                              View
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {escrowData.completedEscrows.map((escrow) => (
                        <tr key={escrow.id} className="border-b">
                          <td className="py-3 px-4">{escrow.stationName}</td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">{escrow.startTime}</td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">{escrow.endTime}</td>
                          <td className="py-3 px-4">{escrow.energyDelivered}</td>
                          <td className="py-3 px-4 text-right font-medium">{escrow.amount} SOL</td>
                          <td className="py-3 px-4">
                            <div className="flex justify-center">
                              <span className="px-2 py-1 text-xs rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                                Completed
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Button variant="ghost" size="sm">
                              View
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {escrowData.disputedEscrows.map((escrow) => (
                        <tr key={escrow.id} className="border-b">
                          <td className="py-3 px-4">{escrow.stationName}</td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">{escrow.startTime}</td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">{escrow.endTime}</td>
                          <td className="py-3 px-4">{escrow.energyDelivered}</td>
                          <td className="py-3 px-4 text-right font-medium">{escrow.amount} SOL</td>
                          <td className="py-3 px-4">
                            <div className="flex justify-center">
                              <span className="px-2 py-1 text-xs rounded-full bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400">
                                Disputed
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Button variant="ghost" size="sm">
                              View
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t pt-6">
                <Button variant="outline" disabled>
                  Previous
                </Button>
                <Button variant="outline">Next</Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Disputes Tab */}
          <TabsContent value="disputes" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Dispute Resolution</CardTitle>
                <CardDescription>Manage and resolve transaction disputes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-rose-50 dark:bg-rose-950/20 p-4 rounded-lg border border-rose-200 dark:border-rose-800">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-rose-600 dark:text-rose-400 mt-0.5" />
                    <div>
                      <h3 className="font-medium mb-1">About Disputes</h3>
                      <p className="text-sm text-muted-foreground">
                        If you encounter issues with a charging session, you can open a dispute within{" "}
                        {escrowData.escrowSettings.disputeWindow} hours of the transaction. Our arbitration system will
                        review the evidence and resolve the dispute fairly.
                      </p>
                    </div>
                  </div>
                </div>

                {escrowData.disputedEscrows.length > 0 ? (
                  <div className="space-y-4">
                    <h3 className="font-medium">Active Disputes</h3>
                    {escrowData.disputedEscrows.map((dispute) => (
                      <div
                        key={dispute.id}
                        className="bg-muted p-4 rounded-lg border hover:border-rose-200 dark:hover:border-rose-800 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">{dispute.stationName}</h3>
                              <span className="px-2 py-0.5 text-xs rounded-full bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400">
                                Disputed
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {dispute.startTime} • {dispute.energyDelivered}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">{dispute.amount} SOL</p>
                            <p className="text-xs text-muted-foreground">Under Review</p>
                          </div>
                        </div>

                        <Separator className="my-3" />

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">Dispute Reason:</span>
                            <span>{dispute.disputeReason}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">Status:</span>
                            <span className="capitalize">{dispute.disputeStatus}</span>
                          </div>
                        </div>

                        <div className="mt-4 flex gap-2">
                          <Button variant="outline" size="sm" className="flex-1">
                            Provide Evidence
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1">
                            Contact Support
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <ShieldCheck className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                    <h3 className="font-medium mb-1">No Active Disputes</h3>
                    <p className="text-sm text-muted-foreground">All your transactions are in good standing</p>
                  </div>
                )}

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">How to Open a Dispute</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-rose-100 dark:bg-rose-900 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-rose-600 dark:text-rose-400">1</span>
                      </div>
                      <p className="text-sm">
                        Navigate to the transaction in your history and click the "Open Dispute" button
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-rose-100 dark:bg-rose-900 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-rose-600 dark:text-rose-400">2</span>
                      </div>
                      <p className="text-sm">Provide details about the issue and any supporting evidence</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-rose-100 dark:bg-rose-900 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-rose-600 dark:text-rose-400">3</span>
                      </div>
                      <p className="text-sm">Our arbitration team will review the case and provide a resolution</p>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Escrow Settings</CardTitle>
                <CardDescription>Configure your escrow preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="auto-release" className="text-base">
                        Automatic Fund Release
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically release funds after charging is complete
                      </p>
                    </div>
                    <Switch
                      id="auto-release"
                      checked={escrowData.escrowSettings.autoRelease}
                      onCheckedChange={() => {}}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <Label htmlFor="release-delay" className="text-base">
                      Release Delay
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Wait time before automatically releasing funds after charging completes
                    </p>
                    <div className="flex items-center gap-4">
                      <Input
                        id="release-delay"
                        type="number"
                        min="0"
                        max="60"
                        value={escrowData.escrowSettings.releaseDelay}
                        className="w-24"
                        onChange={() => {}}
                      />
                      <span>minutes</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <Label htmlFor="dispute-window" className="text-base">
                      Dispute Window
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Time period during which you can open a dispute after a transaction
                    </p>
                    <div className="flex items-center gap-4">
                      <Input
                        id="dispute-window"
                        type="number"
                        min="1"
                        max="72"
                        value={escrowData.escrowSettings.disputeWindow}
                        className="w-24"
                        onChange={() => {}}
                      />
                      <span>hours</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="escrow-notifications" className="text-base">
                        Escrow Notifications
                      </Label>
                      <p className="text-sm text-muted-foreground">Receive notifications about escrow status changes</p>
                    </div>
                    <Switch
                      id="escrow-notifications"
                      checked={escrowData.escrowSettings.notificationsEnabled}
                      onCheckedChange={() => {}}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline">Reset to Defaults</Button>
                  <Button>Save Settings</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Configure additional security for your escrow transactions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Transaction Confirmation</Label>
                    <p className="text-sm text-muted-foreground">
                      Require additional confirmation for transactions above 20 SOL
                    </p>
                  </div>
                  <Switch checked={true} onCheckedChange={() => {}} />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Trusted Stations Only</Label>
                    <p className="text-sm text-muted-foreground">
                      Only allow escrow transactions with verified charging stations
                    </p>
                  </div>
                  <Switch checked={true} onCheckedChange={() => {}} />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Multi-signature Approval</Label>
                    <p className="text-sm text-muted-foreground">
                      Require multiple signatures for large transactions (over 50 SOL)
                    </p>
                  </div>
                  <Switch checked={false} onCheckedChange={() => {}} />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end border-t pt-6">
                <Button>Save Security Settings</Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
