import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { ShieldTick, Sms, ArrowRight, Refresh2 } from "iconsax-react"

export default function DesignSystemPage() {
  return (
    <div className="min-h-screen bg-background text-foreground p-8 space-y-12 pb-24">
      <header className="max-w-4xl mx-auto space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Design System Showcase</h1>
        <p className="text-xl text-muted-foreground">
          Visual verification and regression testing ground for Gopal Cake Shop ERP components.
        </p>
      </header>

      <main className="max-w-4xl mx-auto space-y-16">
        {/* Colors */}
        <section className="space-y-6">
          <div className="border-b pb-4">
            <h2 className="text-2xl font-semibold">1. Colors & Theme Tokens</h2>
            <p className="text-muted-foreground mt-1">Testing semantic color assignments (var(--color))</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <ColorSwatch name="Primary" bgClass="bg-primary" textClass="text-primary-foreground" />
            <ColorSwatch name="Secondary" bgClass="bg-secondary" textClass="text-secondary-foreground" />
            <ColorSwatch name="Accent" bgClass="bg-accent" textClass="text-accent-foreground" />
            <ColorSwatch name="Muted" bgClass="bg-muted" textClass="text-muted-foreground" />
            
            <ColorSwatch name="Success" bgClass="bg-success" textClass="text-white" />
            <ColorSwatch name="Warning" bgClass="bg-warning" textClass="text-white" />
            <ColorSwatch name="Destructive" bgClass="bg-destructive" textClass="text-destructive-foreground" />
            <ColorSwatch name="Info" bgClass="bg-info" textClass="text-white" />
          </div>
        </section>

        {/* Typography */}
        <section className="space-y-6">
          <div className="border-b pb-4">
            <h2 className="text-2xl font-semibold">2. Typography</h2>
          </div>
          <div className="space-y-6 p-6 rounded-[var(--radius)] border bg-card text-card-foreground shadow-sm">
            <div>
              <span className="text-sm text-muted-foreground block mb-2">Heading 1 (h1)</span>
              <h1 className="text-4xl font-bold">The quick brown fox jumps over the lazy dog.</h1>
            </div>
            <div>
              <span className="text-sm text-muted-foreground block mb-2">Heading 2 (h2)</span>
              <h2 className="text-3xl font-semibold">The quick brown fox jumps over the lazy dog.</h2>
            </div>
            <div>
              <span className="text-sm text-muted-foreground block mb-2">Heading 3 (h3)</span>
              <h3 className="text-2xl font-semibold">The quick brown fox jumps over the lazy dog.</h3>
            </div>
            <div>
              <span className="text-sm text-muted-foreground block mb-2">Body (p)</span>
              <p className="text-base leading-relaxed">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
              </p>
            </div>
          </div>
        </section>

        {/* Badges */}
        <section className="space-y-6">
          <div className="border-b pb-4">
            <h2 className="text-2xl font-semibold">3. Badges</h2>
          </div>
          <div className="flex flex-wrap gap-4 p-6 rounded-[var(--radius)] border bg-card text-card-foreground shadow-sm">
            <Badge variant="default">Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="info">Info</Badge>
          </div>
        </section>

        {/* Buttons */}
        <section className="space-y-6">
          <div className="border-b pb-4">
            <h2 className="text-2xl font-semibold">4. Buttons</h2>
            <p className="text-muted-foreground mt-1">All variants, sizes, and states.</p>
          </div>
          
          <div className="grid gap-8 p-6 rounded-[var(--radius)] border bg-card text-card-foreground shadow-sm">
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Variants</h4>
              <div className="flex flex-wrap gap-4 items-center">
                <Button variant="default">Default</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="link">Link</Button>
                <Button variant="destructive">Destructive</Button>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Sizes</h4>
              <div className="flex flex-wrap gap-4 items-center">
                <Button size="sm">Small</Button>
                <Button size="default">Default</Button>
                <Button size="lg">Large</Button>
                <Button size="icon" aria-label="Action"><ShieldTick /></Button>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">With Icons & States</h4>
              <div className="flex flex-wrap gap-4 items-center">
                <Button>
                  <Sms className="mr-2 h-4 w-4" /> Login with Email
                </Button>
                <Button variant="secondary">
                  Continue <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button disabled>
                  <Refresh2 className="mr-2 h-4 w-4 animate-spin" />
                  Please wait
                </Button>
                <Button variant="outline" disabled>Disabled</Button>
              </div>
            </div>
          </div>
        </section>

        {/* Cards */}
        <section className="space-y-6">
          <div className="border-b pb-4">
            <h2 className="text-2xl font-semibold">5. Cards (Level 2 Elevation)</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Order #10042</CardTitle>
                <CardDescription>Placed 15 minutes ago</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">2x Chocolate Truffle Cake (1kg)</p>
                <p className="text-sm mt-1">1x Vanilla Cupcake Box</p>
              </CardContent>
              <CardFooter className="flex justify-between border-t pt-6">
                <Badge variant="warning">Preparing</Badge>
                <Button variant="outline" size="sm">View Details</Button>
              </CardFooter>
            </Card>

            <Card className="bg-primary text-primary-foreground border-transparent">
              <CardHeader>
                <CardTitle className="text-primary-foreground">Premium Member</CardTitle>
                <CardDescription className="text-primary-foreground/80">Loyalty points available</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">1,250 pts</div>
              </CardContent>
              <CardFooter>
                <Button variant="secondary" className="w-full">Redeem Now</Button>
              </CardFooter>
            </Card>
          </div>
        </section>

      </main>
    </div>
  )
}

function ColorSwatch({ name, bgClass, textClass }: { name: string, bgClass: string, textClass: string }) {
  return (
    <div className={`p-4 rounded-[var(--radius)] border shadow-sm flex flex-col justify-between h-24 ${bgClass} ${textClass}`}>
      <span className="font-medium text-sm">{name}</span>
      <span className="text-xs opacity-80">{bgClass}</span>
    </div>
  )
}
