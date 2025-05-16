"use client"

import type React from "react"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  AlertCircle,
  BadgeCheck,
  Car,
  Check,
  CreditCard,
  Edit,
  Eye,
  EyeOff,
  Key,
  Lock,
  Mail,
  Phone,
  Shield,
  User,
  Wallet,
} from "lucide-react"
import { useUser } from "@civic/auth-web3/react"
import { Loader } from "@/components/ui/loader"
import { useWallet } from "@solana/wallet-adapter-react"

// Mock user data
const userData = {
  name: "Alex Johnson",
  email: "alex.johnson@example.com",
  phone: "+1 (555) 123-4567",
  avatar: "/placeholder.svg?height=128&width=128",
  bio: "EV enthusiast and tech lover. Driving electric since 2020.",
  walletAddress: "7X6Ug3Rc9z2QV8C9aBJBzd...",
  civicVerified: true,
  verifiedAttributes: ["identity", "address", "phone"],
  pendingAttributes: ["driver_license"],
  vehicles: [
    {
      id: "v-001",
      name: "Tesla Model Y",
      year: 2023,
      licensePlate: "EV-CHARGE",
      batteryCapacity: 75, // kWh
      connectorTypes: ["Type 2", "CCS"],
    },
  ],
  twoFactorEnabled: true,
  notifications: {
    chargingUpdates: true,
    promotions: false,
    securityAlerts: true,
    tokenRewards: true,
  },
}

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false)
  const [showWalletAddress, setShowWalletAddress] = useState(false)
  const [formData, setFormData] = useState({
    name: userData.name,
    email: userData.email,
    phone: userData.phone,
    bio: userData.bio,
  })


  const {user, isLoading} = useUser();
  const {publicKey} = useWallet();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSaveProfile = () => {
    // In a real app, this would save to the backend
    setIsEditing(false)
    // Update userData with formData
  }

  const toggleWalletVisibility = () => {
    setShowWalletAddress(!showWalletAddress)
  }

  const maskWalletAddress = (address: string) => {
    return `${address.substring(0, 10)}...${address.substring(address.length - 4)}`
  }

  if(isLoading || !user || !publicKey){
    return (
        <div className="flex justify-center h-screen mt-20">
            <Loader />
        </div>
    )
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
          {!isEditing && (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Profile
            </Button>
          )}
        </div>

        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid grid-cols-2 w-full max-w-2xl">
            <TabsTrigger value="personal">Personal Info</TabsTrigger>
            <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
          </TabsList>

          {/* Personal Information Tab */}
          <TabsContent value="personal" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Manage your personal details and preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex flex-col items-center space-y-4">
                    <Avatar className="h-32 w-32">
                      <AvatarImage src={user.picture || "/placeholder.svg"} alt={user.name} />
                      <AvatarFallback className="text-3xl">
                        {user.name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    {isEditing && (
                      <Button variant="outline" size="sm">
                        Change Photo
                      </Button>
                    )}
                  </div>

                  <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        {isEditing ? (
                          <Input
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            placeholder="Your full name"
                          />
                        ) : (
                          <div className="flex items-center h-10 px-3 rounded-md border bg-muted/50">
                            <User className="mr-2 h-4 w-4 text-muted-foreground" />
                            <span>{user.name}</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        {isEditing ? (
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            placeholder="Your email address"
                          />
                        ) : (
                          <div className="flex items-center h-10 px-3 rounded-md border bg-muted/50">
                            <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                            <span>{user.email}</span>
                            {userData.civicVerified && <BadgeCheck className="ml-2 h-4 w-4 text-emerald-500" />}
                          </div>
                        )}
                      </div>


                      <div className="space-y-2">
                        <Label htmlFor="wallet">Wallet Address</Label>
                        <div className="flex items-center h-10 px-3 rounded-md border bg-muted/50">
                          <Wallet className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span>
                            {showWalletAddress ? publicKey.toString() : maskWalletAddress(publicKey.toString())}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="ml-auto h-8 w-8"
                            onClick={toggleWalletVisibility}
                          >
                            {showWalletAddress ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      {isEditing ? (
                        <Textarea
                          id="bio"
                          name="bio"
                          value={formData.bio}
                          onChange={handleInputChange}
                          placeholder="Tell us about yourself"
                          rows={3}
                        />
                      ) : (
                        <div className="p-3 rounded-md border bg-muted/50 min-h-[80px]">{userData.bio}</div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
              {isEditing && (
                <CardFooter className="flex justify-end gap-2 border-t pt-6">
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveProfile}>Save Changes</Button>
                </CardFooter>
              )}
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Manage how you receive updates and alerts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="charging-updates">Charging Updates</Label>
                    <p className="text-sm text-muted-foreground">Receive notifications about your charging sessions</p>
                  </div>
                  <Switch
                    id="charging-updates"
                    checked={userData.notifications.chargingUpdates}
                    onCheckedChange={() => {}}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="token-rewards">Token Rewards</Label>
                    <p className="text-sm text-muted-foreground">Get notified about new rewards and earnings</p>
                  </div>
                  <Switch id="token-rewards" checked={userData.notifications.tokenRewards} onCheckedChange={() => {}} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="security-alerts">Security Alerts</Label>
                    <p className="text-sm text-muted-foreground">Important notifications about your account security</p>
                  </div>
                  <Switch
                    id="security-alerts"
                    checked={userData.notifications.securityAlerts}
                    onCheckedChange={() => {}}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Vehicles Tab */}
          <TabsContent value="vehicles" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>My Vehicles</CardTitle>
                <CardDescription>Manage your electric vehicles</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {userData.vehicles.map((vehicle) => (
                  <div
                    key={vehicle.id}
                    className="bg-muted/50 p-4 rounded-lg border hover:border-rose-200 dark:hover:border-rose-800 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="rounded-full bg-rose-100 dark:bg-rose-900 p-2">
                          <Car className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                        </div>
                        <div>
                          <h3 className="font-medium">{vehicle.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {vehicle.year} • License: {vehicle.licensePlate}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>

                    <Separator className="my-4" />

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Battery Capacity</p>
                        <p className="font-medium">{vehicle.batteryCapacity} kWh</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Connector Types</p>
                        <p className="font-medium">{vehicle.connectorTypes.join(", ")}</p>
                      </div>
                    </div>
                  </div>
                ))}

                <Button className="w-full">
                  <Car className="mr-2 h-4 w-4" />
                  Add New Vehicle
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Manage your account security and authentication methods</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Password</Label>
                      <p className="text-sm text-muted-foreground">Last changed 3 months ago</p>
                    </div>
                    <Button variant="outline">
                      <Lock className="mr-2 h-4 w-4" />
                      Change Password
                    </Button>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Two-Factor Authentication</Label>
                      <p className="text-sm text-muted-foreground">
                        {userData.twoFactorEnabled ? "Enabled via Authenticator App" : "Not enabled"}
                      </p>
                    </div>
                    <Button variant={userData.twoFactorEnabled ? "outline" : "default"}>
                      <Key className="mr-2 h-4 w-4" />
                      {userData.twoFactorEnabled ? "Manage 2FA" : "Enable 2FA"}
                    </Button>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Connected Wallets</Label>
                      <p className="text-sm text-muted-foreground">Manage your connected blockchain wallets</p>
                    </div>
                    <Button variant="outline">
                      <CreditCard className="mr-2 h-4 w-4" />
                      Manage Wallets
                    </Button>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <Label className="text-base">Recent Login Activity</Label>
                    <div className="space-y-2">
                      <div className="bg-muted p-3 rounded-md text-sm">
                        <div className="flex justify-between">
                          <span className="font-medium">San Francisco, CA</span>
                          <span className="text-muted-foreground">Today, 10:32 AM</span>
                        </div>
                        <p className="text-muted-foreground">Chrome on MacOS</p>
                      </div>
                      <div className="bg-muted p-3 rounded-md text-sm">
                        <div className="flex justify-between">
                          <span className="font-medium">San Francisco, CA</span>
                          <span className="text-muted-foreground">Yesterday, 8:15 PM</span>
                        </div>
                        <p className="text-muted-foreground">Mobile App on iOS</p>
                      </div>
                    </div>
                    <Button variant="link" className="px-0">
                      View all login activity
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Account Actions</CardTitle>
                <CardDescription>Manage your account settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full">
                  Download My Data
                </Button>
                <Button variant="destructive" className="w-full">
                  Deactivate Account
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
