import Link from "next/link"
import { Button } from "@repo/ui/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/ui/card"
import { CheckCircle2 } from "lucide-react"

export default function SuccessPage() {
  return (
    <div className="container py-20">
      <div className="max-w-md mx-auto text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-emerald-100 dark:bg-emerald-900/30 p-3">
            <CheckCircle2 className="h-12 w-12 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Registration Successful!</CardTitle>
            <CardDescription>Your charging station has been submitted for verification</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-muted-foreground">
              Our team will review your submission within 24-48 hours. Once approved, your station will appear on the
              map and be available for users to find and use.
            </p>

            <div className="bg-muted p-4 rounded-lg text-left">
              <h3 className="font-medium mb-2">Next Steps:</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <span className="mr-2">1.</span>
                  <span>Complete your wallet setup to receive payments</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">2.</span>
                  <span>Set up your notification preferences</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">3.</span>
                  <span>Share your referral code to earn bonus tokens</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col space-y-3">
              <Button asChild>
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/">Return to Home</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
