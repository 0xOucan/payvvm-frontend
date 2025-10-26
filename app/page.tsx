import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, Zap, DollarSign, Activity } from "lucide-react"
import { siteConfig } from "@/config/site"

export default function HomePage() {
  return (
    <div className="container mx-auto px-4">
      {/* Hero Section */}
      <section className="py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight glitch-hover">
            <span className="text-balance">Gasless PYUSD, wallet-first.</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto text-balance">
            Smart-contract native. No new infra. EVVM inside.
            <br />
            Data powered by Envio HyperSync.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button asChild size="lg" className="w-full sm:w-auto glitch-hover font-mono">
              <Link href="/dashboard">
                Launch PayVVM
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>

            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto font-mono bg-transparent">
              <Link href="/explorer">Open Explorer</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24">
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Card className="pixel-border bg-card/50 backdrop-blur">
            <CardHeader>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="font-mono">Gasless by EVVM</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-pretty leading-relaxed">
                <strong>Sign → Execute → Confirm.</strong>
                <br />
                Users sign EIP-191 messages, and Fishers handle on-chain execution.
                <br />
                No gas, no friction — just instant PYUSD movement.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="pixel-border bg-card/50 backdrop-blur">
            <CardHeader>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="font-mono">PYUSD-Native</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-pretty leading-relaxed">
                <strong>Stable USD experience.</strong>
                <br />
                Built for payments today, with payroll and subscriptions coming soon.
                <br />
                Every transaction uses PYUSD at its core.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="pixel-border bg-card/50 backdrop-blur">
            <CardHeader>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Activity className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="font-mono">HyperSync Live</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-pretty leading-relaxed">
                <strong>Real-time, high-speed blockchain data.</strong>
                <br />
                Stats and history are streamed via Envio HyperSync,
                <br />
                offering 2000× faster reads and smooth analytics.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Disclaimer & Footer */}
      <section className="py-16 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs text-muted-foreground text-center mb-8">{siteConfig.disclaimer}</p>

          <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
            <Link
              href={siteConfig.links.docs.evvm}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              EVVM Docs
            </Link>
            <Link
              href={siteConfig.links.docs.hypersync}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              HyperSync Docs
            </Link>
            <Link
              href={siteConfig.links.github}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              GitHub
            </Link>
            <Link
              href={siteConfig.links.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Twitter
            </Link>
            <Link href="/privacy" className="text-muted-foreground hover:text-primary transition-colors">
              Privacy
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
