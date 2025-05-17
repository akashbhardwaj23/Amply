import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"

export default function EscrowTransactionsPage() {
  return (
    <div className="container py-8">
      <Button variant="ghost" asChild className="mb-6">
        <Link href="/escrow">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Escrow
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>Detailed view of all your escrow transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Detailed transaction history will be displayed here.</p>
        </CardContent>
      </Card>
    </div>
  )
}
