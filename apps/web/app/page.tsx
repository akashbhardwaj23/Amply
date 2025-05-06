import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronRight, Zap, MapPin, Shield, Coins } from "lucide-react"
import { HeroSection } from "@/components/hero-section"
import { FeatureCard } from "@/components/feature-card"


export default function Home() {

  return (
    <div className="flex flex-col">
      <HeroSection />
      <section className="container py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">Revolutionizing EV Charging on Solana</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            ChargeSol combines blockchain technology with AI to create the most efficient, transparent, and rewarding EV
            charging network.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <FeatureCard
            icon={<MapPin className="h-10 w-10 text-rose-500" />}
            title="Find Nearby Stations"
            description="AI-powered search helps you find the closest and most suitable charging stations for your vehicle."
          />
          <FeatureCard
            icon={<Zap className="h-10 w-10 text-amber-500" />}
            title="Optimal Pricing"
            description="Our AI analyzes market conditions to offer you the best possible charging rates."
          />
          <FeatureCard
            icon={<Shield className="h-10 w-10 text-emerald-500" />}
            title="Secure Escrow"
            description="All transactions are secured through our Solana-based escrow system for peace of mind."
          />
          <FeatureCard
            icon={<Coins className="h-10 w-10 text-purple-500" />}
            title="Token Rewards"
            description="Earn tokens by using the network or referring others, redeemable for charging credits."
          />
        </div>
      </section>

      <section className="bg-muted py-20">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1">
              <h2 className="text-3xl font-bold tracking-tight mb-4">Register Your Charging Station</h2>
              <p className="text-muted-foreground mb-6">
                Own an EV charger? Join our network and start earning Solana tokens for every charging session. Our
                platform handles payments, scheduling, and customer service.
              </p>
              <Button asChild size="lg">
                <Link href="/register-station">
                  Register Now <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="flex-1 rounded-lg overflow-hidden shadow-xl">
              <img
                src="/placeholder.svg?height=400&width=600"
                alt="EV Charging Station"
                className="w-full h-auto object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="container py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">How It Works</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col items-center text-center p-6">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900 flex items-center justify-center mb-4">
              <span className="text-rose-600 dark:text-rose-300 font-bold">1</span>
            </div>
            <h3 className="text-xl font-bold mb-2">Find a Station</h3>
            <p className="text-muted-foreground">
              Use our map or voice commands to locate the nearest charging station that meets your needs.
            </p>
          </div>

          <div className="flex flex-col items-center text-center p-6">
            <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center mb-4">
              <span className="text-amber-600 dark:text-amber-300 font-bold">2</span>
            </div>
            <h3 className="text-xl font-bold mb-2">Connect & Pay</h3>
            <p className="text-muted-foreground">
              Connect to the station and pay securely with Solana. Our escrow system ensures fair transactions.
            </p>
          </div>

          <div className="flex flex-col items-center text-center p-6">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center mb-4">
              <span className="text-emerald-600 dark:text-emerald-300 font-bold">3</span>
            </div>
            <h3 className="text-xl font-bold mb-2">Earn Rewards</h3>
            <p className="text-muted-foreground">
              Earn tokens for every charging session and boost your earnings through our referral program.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
