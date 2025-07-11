"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Zap, TrendingUp, Clock, Battery, Car } from "lucide-react"

export default function AIPricingPage() {
  const [vehicleType, setVehicleType] = useState("sedan")
  const [batteryLevel, setBatteryLevel] = useState(30)
  const [targetLevel, setTargetLevel] = useState(80)
  const [urgency, setUrgency] = useState(50)
  const [isCalculating, setIsCalculating] = useState(false)
  const [result, setResult] = useState<null | {
    recommendedPrice: number
    estimatedTime: number
    estimatedCost: number
    savings: number
  }>(null)

  const handleCalculate = () => {
    setIsCalculating(true)

    // Simulate AI calculation
    setTimeout(() => {
      // This would be replaced with actual AI calculation in a real app
      const basePrice = 0.25 // Base SOL per kWh
      const urgencyFactor = 1 + (urgency / 100) * 0.5 // 0-50% increase based on urgency
      const timeOfDayDiscount = Math.random() * 0.1 // Random discount up to 10%
      const marketConditionsFactor = 1 - Math.random() * 0.15 // Random market conditions factor

      const recommendedPrice = basePrice * urgencyFactor * (1 - timeOfDayDiscount) * marketConditionsFactor

      // Calculate battery capacity based on vehicle type
      let batteryCapacity = 60 // Default for sedan
      if (vehicleType === "suv") batteryCapacity = 85
      if (vehicleType === "sports") batteryCapacity = 100
      if (vehicleType === "truck") batteryCapacity = 120

      // Calculate kWh needed
      const kwhNeeded = (batteryCapacity * (targetLevel - batteryLevel)) / 100

      // Calculate time based on charger speed (assume 50kW charger)
      const chargerSpeed = 50 // kW
      const estimatedTime = (kwhNeeded / chargerSpeed) * 60 // minutes

      // Calculate cost
      const estimatedCost = kwhNeeded * recommendedPrice

      // Calculate savings compared to average market price (assume 0.30 SOL/kWh)
      const marketPrice = 0.3
      const marketCost = kwhNeeded * marketPrice
      const savings = marketCost - estimatedCost

      setResult({
        recommendedPrice: Number.parseFloat(recommendedPrice.toFixed(4)),
        estimatedTime: Math.round(estimatedTime),
        estimatedCost: Number.parseFloat(estimatedCost.toFixed(4)),
        savings: Number.parseFloat(savings.toFixed(4)),
      })

      setIsCalculating(false)
    }, 2000)
  }

  return (
    <div className="container py-10">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">AI Price Optimizer</h1>
          <p className="text-muted-foreground">
            Get the best charging rates based on real-time market conditions and your specific needs
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Your Charging Preferences</CardTitle>
                <CardDescription>Tell us about your vehicle and charging needs</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Tabs defaultValue="sedan" onValueChange={(value) => setVehicleType(value)}>
                  <Label className="mb-2 block">Vehicle Type</Label>
                  <TabsList className="grid grid-cols-4 w-full">
                    <TabsTrigger value="sedan">Sedan</TabsTrigger>
                    <TabsTrigger value="suv">SUV</TabsTrigger>
                    <TabsTrigger value="sports">Sports</TabsTrigger>
                    <TabsTrigger value="truck">Truck</TabsTrigger>
                  </TabsList>
                </Tabs>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Current Battery Level: {batteryLevel}%</Label>
                      <span className="text-sm text-muted-foreground">{batteryLevel}%</span>
                    </div>
                    <Slider
                      value={[batteryLevel]}
                      min={1}
                      max={99}
                      step={1}
                      onValueChange={(value) => setBatteryLevel(value[0])}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Target Battery Level: {targetLevel}%</Label>
                      <span className="text-sm text-muted-foreground">{targetLevel}%</span>
                    </div>
                    <Slider
                      value={[targetLevel]}
                      min={Math.min(batteryLevel + 1, 100)}
                      max={100}
                      step={1}
                      onValueChange={(value) => setTargetLevel(value[0])}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Charging Urgency</Label>
                    <span className="text-sm text-muted-foreground">
                      {urgency < 33 ? "Low" : urgency < 66 ? "Medium" : "High"}
                    </span>
                  </div>
                  <Slider
                    value={[urgency]}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={(value) => setUrgency(value[0])}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Save Money</span>
                    <span>Charge Faster</span>
                  </div>
                </div>

                <Button onClick={handleCalculate} className="w-full" disabled={isCalculating}>
                  {isCalculating ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Calculating Optimal Price...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="mr-2 h-4 w-4" />
                      Calculate Optimal Price
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className={`h-full ${result ? "bg-rose-50 dark:bg-rose-950/20" : ""}`}>
              <CardHeader>
                <CardTitle>Price Recommendation</CardTitle>
                <CardDescription>AI-optimized pricing based on market conditions</CardDescription>
              </CardHeader>
              <CardContent>
                {result ? (
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-rose-600 dark:text-rose-400 mb-1">
                        {result.recommendedPrice} SOL
                      </div>
                      <p className="text-sm text-muted-foreground">per kWh</p>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">Estimated Time</span>
                        </div>
                        <span className="font-medium">{result.estimatedTime} min</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Zap className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">Estimated Cost</span>
                        </div>
                        <span className="font-medium">{result.estimatedCost} SOL</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <TrendingUp className="mr-2 h-4 w-4 text-emerald-500" />
                          <span className="text-sm">Your Savings</span>
                        </div>
                        <span className="font-medium text-emerald-600 dark:text-emerald-400">{result.savings} SOL</span>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <p className="text-xs text-muted-foreground">
                        Price calculated based on current market conditions, time of day, and network demand. Prices may
                        vary at actual charging stations.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full py-8 text-center text-muted-foreground">
                    <TrendingUp className="h-12 w-12 mb-4 opacity-20" />
                    <p>Enter your preferences and calculate to see AI-optimized pricing</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-10">
          <h2 className="text-2xl font-bold mb-6">How AI Pricing Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <div className="mb-2 w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-rose-600 dark:text-rose-400" />
                </div>
                <CardTitle>Market Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Our AI constantly monitors Solana token prices, energy costs, and network demand to determine optimal
                  pricing.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="mb-2 w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <Battery className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
                <CardTitle>Vehicle Optimization</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We consider your specific vehicle type, battery capacity, and charging needs to provide personalized
                  recommendations.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="mb-2 w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <Car className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <CardTitle>Smart Scheduling</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Our AI can suggest optimal charging times to balance your urgency with the lowest possible prices.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
