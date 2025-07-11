"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Award, Calendar, CreditCard, Gift, History, Share2, ShieldCheck, Sparkles, Zap } from "lucide-react"
import { Loader } from "@/components/ui/loader"
import { useBalance } from "@/hooks/usebalance"

// Mock user data
const userData = {
  name: "Alex Johnson",
  email: "alex.johnson@example.com",
  avatar: "/placeholder.svg?height=40&width=40",
  tokenBalance: 125.75,
  chargingProgress: 3, // Out of 4 charges needed for reward
  nextReward: 15, // SOL tokens
  totalEarned: 85,
  referralCode: "ALEXJ2025",
  rewardHistory: [
    {
      id: "reward-001",
      date: "May 5, 2025",
      type: "Charging Milestone",
      description: "Completed 4 charging sessions",
      amount: 15,
    },
    {
      id: "reward-002",
      date: "Apr 22, 2025",
      type: "Referral Bonus",
      description: "Sarah Smith completed first charge",
      amount: 10,
    },
    {
      id: "reward-003",
      date: "Apr 15, 2025",
      type: "Charging Milestone",
      description: "Completed 4 charging sessions",
      amount: 15,
    },
    {
      id: "reward-004",
      date: "Mar 30, 2025",
      type: "Special Promotion",
      description: "Earth Day charging event",
      amount: 5,
    },
  ],
}

export default function RewardsPage() {
  const [activeTab, setActiveTab] = useState("earn")
  const [referralCopied, setReferralCopied] = useState(false)
  const {balance} = useBalance()

  if(!balance){
    return (
        <div className="flex justify-center items-center h-screen">
                <Loader />
        </div>
    )
  }

  const copyReferralCode = () => {
    navigator.clipboard.writeText(userData.referralCode)
    setReferralCopied(true)
    setTimeout(() => setReferralCopied(false), 2000)
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Token Rewards</h1>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">Your Balance</div>
            <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-950/20 px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-800">
              <Sparkles className="h-4 w-4 text-rose-600 dark:text-rose-400" />
              <span className="font-bold">{balance} SOL</span>
            </div>
          </div>
        </div>

        <Tabs defaultValue="earn" onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 w-full max-w-md mx-auto mb-4">
            <TabsTrigger value="earn">Earn</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="redeem">Redeem</TabsTrigger>
          </TabsList>

          <TabsContent value="earn" className="space-y-6">
            {/* Charging Milestone Card */}
            <Card className="border-2 border-rose-200 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/10">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                    Charging Milestone
                  </CardTitle>
                  <div className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300">
                    Active Reward
                  </div>
                </div>
                <CardDescription>Charge your vehicle 4 times to earn tokens</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-sm font-medium">{userData.chargingProgress} of 4 charges completed</div>
                  <div className="text-sm font-medium">{userData.chargingProgress * 25}%</div>
                </div>
                <Progress value={userData.chargingProgress * 25} className="h-3" />

                <div className="grid grid-cols-4 gap-1 mt-2">
                  {[1, 2, 3, 4].map((step) => (
                    <div
                      key={step}
                      className={`flex flex-col items-center ${
                        step <= userData.chargingProgress ? "text-rose-600 dark:text-rose-400" : "text-muted-foreground"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
                          step <= userData.chargingProgress ? "bg-rose-100 dark:bg-rose-900" : "bg-muted border"
                        }`}
                      >
                        {step <= userData.chargingProgress ? (
                          <Zap className="h-4 w-4" />
                        ) : (
                          <span className="text-xs">{step}</span>
                        )}
                      </div>
                      <span className="text-xs">Charge {step}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-background rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Next reward</p>
                    <p className="text-2xl font-bold">{userData.nextReward} SOL</p>
                  </div>
                  <Button disabled={userData.chargingProgress < 4}>
                    {userData.chargingProgress >= 4 ? "Claim Reward" : "Keep Charging"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Other Ways to Earn */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Referral Program */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Share2 className="h-5 w-5 text-amber-500" />
                    Referral Program
                  </CardTitle>
                  <CardDescription>Invite friends to earn 10 SOL per referral</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm mb-2">Your referral code</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-background p-2 rounded border font-mono">{userData.referralCode}</code>
                      <Button variant="outline" size="sm" onClick={copyReferralCode}>
                        {referralCopied ? "Copied!" : "Copy"}
                      </Button>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full">
                    <Share2 className="mr-2 h-4 w-4" />
                    Share Referral Link
                  </Button>
                </CardContent>
              </Card>

              {/* Special Promotions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-emerald-500" />
                    Special Promotions
                  </CardTitle>
                  <CardDescription>Limited-time opportunities to earn more</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="bg-muted p-3 rounded-lg flex items-center justify-between">
                      <div>
                        <p className="font-medium">Weekend Warrior</p>
                        <p className="text-xs text-muted-foreground">Charge 3 times this weekend for bonus tokens</p>
                      </div>
                      <div className="text-emerald-600 dark:text-emerald-400 font-bold">+5 SOL</div>
                    </div>
                    <div className="bg-muted p-3 rounded-lg flex items-center justify-between">
                      <div>
                        <p className="font-medium">Off-Peak Charging</p>
                        <p className="text-xs text-muted-foreground">Earn extra for charging during off-peak hours</p>
                      </div>
                      <div className="text-emerald-600 dark:text-emerald-400 font-bold">+2 SOL</div>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full">
                    View All Promotions
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Reward History</CardTitle>
                <CardDescription>Your earned tokens and rewards</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">Total Earned</div>
                    <div className="font-bold text-lg">{userData.totalEarned} SOL</div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    {userData.rewardHistory.map((reward) => (
                      <div key={reward.id} className="flex items-center justify-between">
                        <div className="flex items-start gap-3">
                          <div
                            className={`mt-0.5 rounded-full p-1.5 ${
                              reward.type === "Charging Milestone"
                                ? "bg-rose-100 dark:bg-rose-900"
                                : reward.type === "Referral Bonus"
                                  ? "bg-amber-100 dark:bg-amber-900"
                                  : "bg-emerald-100 dark:bg-emerald-900"
                            }`}
                          >
                            {reward.type === "Charging Milestone" ? (
                              <Zap
                                className={`h-3.5 w-3.5 ${
                                  reward.type === "Charging Milestone"
                                    ? "text-rose-600 dark:text-rose-400"
                                    : reward.type === "Referral Bonus"
                                      ? "text-amber-600 dark:text-amber-400"
                                      : "text-emerald-600 dark:text-emerald-400"
                                }`}
                              />
                            ) : reward.type === "Referral Bonus" ? (
                              <Share2
                                className={`h-3.5 w-3.5 ${
                                  //@ts-ignore
                                  reward.type === "Charging Milestone"
                                    ? "text-rose-600 dark:text-rose-400"
                                    : reward.type === "Referral Bonus"
                                      ? "text-amber-600 dark:text-amber-400"
                                      : "text-emerald-600 dark:text-emerald-400"
                                }`}
                              />
                            ) : (
                              <Award
                                className={`h-3.5 w-3.5 ${
                                  reward.type === "Charging Milestone"
                                    ? "text-rose-600 dark:text-rose-400"
                                    : reward.type === "Referral Bonus"
                                      ? "text-amber-600 dark:text-amber-400"
                                      : "text-emerald-600 dark:text-emerald-400"
                                }`}
                              />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{reward.type}</p>
                            <div className="flex items-center text-xs text-muted-foreground">
                              <Calendar className="mr-1 h-3 w-3" />
                              <span>{reward.date}</span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-0.5">{reward.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">+{reward.amount} SOL</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-center border-t pt-6">
                <Button variant="outline" size="sm">
                  <History className="mr-2 h-4 w-4" />
                  View Complete History
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="redeem" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Redeem Tokens</CardTitle>
                <CardDescription>Use your tokens for rewards and benefits</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-muted rounded-lg p-4 border hover:border-rose-200 dark:hover:border-rose-800 transition-colors cursor-pointer">
                    <div className="flex items-center justify-between mb-3">
                      <div className="rounded-full bg-rose-100 dark:bg-rose-900 p-2">
                        <Zap className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                      </div>
                      <div className="font-bold">50 SOL</div>
                    </div>
                    <h3 className="font-medium mb-1">Free Charging Session</h3>
                    <p className="text-sm text-muted-foreground">
                      Redeem tokens for a complete free charging session at any station
                    </p>
                  </div>

                  <div className="bg-muted rounded-lg p-4 border hover:border-rose-200 dark:hover:border-rose-800 transition-colors cursor-pointer">
                    <div className="flex items-center justify-between mb-3">
                      <div className="rounded-full bg-amber-100 dark:bg-amber-900 p-2">
                        <CreditCard className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div className="font-bold">25 SOL</div>
                    </div>
                    <h3 className="font-medium mb-1">Charging Discount</h3>
                    <p className="text-sm text-muted-foreground">Get 25% off your next 5 charging sessions</p>
                  </div>

                  <div className="bg-muted rounded-lg p-4 border hover:border-rose-200 dark:hover:border-rose-800 transition-colors cursor-pointer">
                    <div className="flex items-center justify-between mb-3">
                      <div className="rounded-full bg-emerald-100 dark:bg-emerald-900 p-2">
                        <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="font-bold">100 SOL</div>
                    </div>
                    <h3 className="font-medium mb-1">Premium Membership</h3>
                    <p className="text-sm text-muted-foreground">
                      One month of premium benefits including priority access
                    </p>
                  </div>

                  <div className="bg-muted rounded-lg p-4 border hover:border-rose-200 dark:hover:border-rose-800 transition-colors cursor-pointer">
                    <div className="flex items-center justify-between mb-3">
                      <div className="rounded-full bg-purple-100 dark:bg-purple-900 p-2">
                        <Gift className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="font-bold">75 SOL</div>
                    </div>
                    <h3 className="font-medium mb-1">Partner Rewards</h3>
                    <p className="text-sm text-muted-foreground">Gift cards and discounts with our retail partners</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-center border-t pt-6">
                <Button>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Browse Reward Marketplace
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Token Transfer</CardTitle>
                <CardDescription>Send tokens to other ChargeSol users</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src="/placeholder.svg?height=40&width=40" alt="User" />
                      <AvatarFallback>AJ</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Enter username or wallet address"
                        className="w-full p-2 rounded-md border bg-background"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <input
                        type="number"
                        placeholder="Amount (SOL)"
                        className="w-full p-2 rounded-md border bg-background"
                      />
                    </div>
                    <Button variant="outline">Transfer</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
