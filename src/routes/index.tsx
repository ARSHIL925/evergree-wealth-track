import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Sprout, Shield, Wallet, Sparkles, Calculator, IndianRupee, BookOpen, Target, Smartphone, CheckCircle2, Quote } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Evergreen Wealth Track — Mindful money, INR-first" },
      { name: "description", content: "Track expenses across currencies (INR default), pay subscriptions via UPI, calculate, and read curated personal-finance writing — all in one calm dashboard." },
      { property: "og:title", content: "Evergreen Wealth Track — Mindful money, INR-first" },
      { property: "og:description", content: "Track expenses across currencies (INR default), pay subscriptions via UPI, calculate, and read curated personal-finance writing — all in one calm dashboard." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://solace-nest-scribe.lovable.app/" },
      { name: "twitter:title", content: "Evergreen Wealth Track — Mindful money, INR-first" },
      { name: "twitter:description", content: "Track expenses across currencies (INR default), pay subscriptions via UPI, calculate, and read curated personal-finance writing — all in one calm dashboard." },
    ],
    links: [{ rel: "canonical", href: "https://solace-nest-scribe.lovable.app/" }],
  }),
  component: Landing,
});

const principles = [
  { icon: Sprout, title: "Calm over urgent", body: "Money is a long game. We surface trends, not panic — no red blinking dashboards." },
  { icon: Shield, title: "Your data, locked", body: "Row-level rules mean nobody — not even other users — can read your numbers." },
  { icon: IndianRupee, title: "INR is home", body: "Defaults are Indian. Lakhs, crores, UPI deep-links, RBI-style number formatting." },
  { icon: Sparkles, title: "Humane defaults", body: "Sensible categories, gentle reminders, and zero dark patterns to nudge subscriptions." },
];

const features = [
  { icon: Wallet, title: "Multi-currency expenses", body: "Log in any currency, see totals in INR. Auto-refreshed FX rates." },
  { icon: Calculator, title: "Built-in calculator", body: "Basic + financial math. One click sends a number into your expense log." },
  { icon: IndianRupee, title: "UPI & card subscriptions", body: "Pay via UPI deep link, scan QR, or Razorpay cards/netbanking." },
  { icon: Target, title: "Monthly & yearly budgets", body: "Set category caps. We project where you'll land, gently — no panic alerts." },
  { icon: Smartphone, title: "UPI Quick Pay", body: "Open any UPI app pre-filled, scan a QR, and auto-log to expenses." },
  { icon: BookOpen, title: "Calm, plain-English content", body: "No clickbait, no FOMO. Read why we built this — and what we refuse to build." },
];

const steps = [
  { n: "01", title: "Sign in free", body: "Email or Google. No card, no upsell modal. You're in." },
  { n: "02", title: "Log a rupee", body: "Type an amount or open UPI Quick Pay. We sort the rest into your dashboard." },
  { n: "03", title: "Set a budget", body: "Pick a category cap. Evergreen quietly projects whether you'll land over or under." },
];

function Landing() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1">
        <section className="gradient-hero relative overflow-hidden">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:gap-12 md:py-24">
            <div className="flex flex-col justify-center">
              <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground glass-card">
                <span className="h-1.5 w-1.5 rounded-full bg-success" /> Built for India, ready for the world
              </div>
              <h1 className="font-display text-4xl font-semibold leading-[1.05] md:text-6xl">
                Money, but{" "}
                <span className="bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent">evergreen</span>.
              </h1>
              <p className="mt-5 max-w-lg text-lg text-muted-foreground">
                Track expenses across currencies, pay with UPI, set calm monthly &amp; yearly budgets — all from one humane dashboard. No anxiety. No dark patterns.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/auth">
                  <Button size="lg" className="rounded-full shadow-soft">
                    Start free <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/blog">
                  <Button size="lg" variant="outline" className="rounded-full">Why Evergreen?</Button>
                </Link>
              </div>
              <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                {["INR-first", "UPI & cards", "Bank-grade RLS", "Light + dark"].map((t) => (
                  <li key={t} className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-success" /> {t}</li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <Card className="glass-card border-border/60 shadow-soft">
                <CardContent className="p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">November totals</span>
                    <span className="rounded-full bg-success/15 px-2 py-0.5 text-xs font-medium text-success-foreground">on track</span>
                  </div>
                  <div className="font-display text-4xl">₹ 42,318.00</div>
                  <div className="mt-1 text-xs text-muted-foreground">across 24 transactions in 3 currencies</div>
                  <div className="mt-6 grid grid-cols-3 gap-3 text-center">
                    {["Food", "Rent", "Travel"].map((c, i) => (
                      <div key={c} className="rounded-xl bg-muted/60 p-3">
                        <div className="text-xs text-muted-foreground">{c}</div>
                        <div className="mt-1 font-display text-lg">₹{[8210, 22000, 4108][i].toLocaleString("en-IN")}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 rounded-xl border border-border/60 bg-card/70 p-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Monthly budget</span><span>₹ 42,318 / ₹ 55,000</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent" style={{ width: "77%" }} />
                    </div>
                    <div className="mt-2 text-[11px] text-muted-foreground">projected ₹ 51,200 — under plan</div>
                  </div>
                </CardContent>
              </Card>
              <div aria-hidden className="pointer-events-none absolute -bottom-6 -right-6 -z-10 h-40 w-40 rounded-full bg-accent/30 blur-3xl" />
              <div aria-hidden className="pointer-events-none absolute -top-10 -left-10 -z-10 h-44 w-44 rounded-full bg-primary/20 blur-3xl" />
            </div>
          </div>
          <div className="border-t border-border/60 bg-background/50 backdrop-blur">
            <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-8 text-center md:grid-cols-4">
              {[
                { k: "12+", v: "currencies, INR default" },
                { k: "UPI", v: "deep links & QR" },
                { k: "2", v: "budget horizons (month + year)" },
                { k: "100%", v: "row-level isolation" },
              ].map((s) => (
                <div key={s.v}>
                  <div className="font-display text-3xl text-primary">{s.k}</div>
                  <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{s.v}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-20">
          <div className="mb-12 max-w-2xl">
            <p className="text-sm font-medium uppercase tracking-widest text-primary">Our principles</p>
            <h2 className="mt-2 font-display text-3xl md:text-4xl">What we built — and what we chose not to.</h2>
            <p className="mt-3 text-muted-foreground">Every product makes trade-offs. Here is what we hold sacred, and the shortcuts we refuse to take.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {principles.map((p) => (
              <Card key={p.title} className="border-border/60 transition-all hover:shadow-soft">
                <CardContent className="flex gap-4 p-6">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><p.icon className="h-5 w-5" /></div>
                  <div>
                    <h3 className="font-display text-lg">{p.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{p.body}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="bg-muted/30">
          <div className="mx-auto max-w-6xl px-4 py-20">
            <div className="mb-12 max-w-2xl">
              <p className="text-sm font-medium uppercase tracking-widest text-primary">Features</p>
              <h2 className="mt-2 font-display text-3xl md:text-4xl">Quiet tools that do the loud work.</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f) => (
                <Card key={f.title} className="border-border/60">
                  <CardContent className="p-6">
                    <div className="grid h-11 w-11 place-items-center rounded-xl bg-accent/20 text-accent-foreground"><f.icon className="h-5 w-5" /></div>
                    <h3 className="mt-4 font-display text-lg">{f.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-20">
          <div className="mb-12 max-w-2xl">
            <p className="text-sm font-medium uppercase tracking-widest text-primary">How it works</p>
            <h2 className="mt-2 font-display text-3xl md:text-4xl">Three quiet steps. That's it.</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {steps.map((s) => (
              <Card key={s.n} className="relative overflow-hidden border-border/60">
                <CardContent className="p-6">
                  <div className="font-display text-5xl text-primary/70">{s.n}</div>
                  <h3 className="mt-2 font-display text-xl">{s.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="bg-gradient-to-b from-background to-muted/30">
          <div className="mx-auto max-w-4xl px-4 py-20">
            <Card className="border-border/60">
              <CardContent className="p-8 md:p-10">
                <Quote className="h-8 w-8 text-primary/60" />
                <p className="mt-3 font-display text-2xl leading-snug md:text-3xl">"Every other money app shouted at me. This one just shows me where my month is going — and stops there."</p>
                <p className="mt-4 text-sm text-muted-foreground">— Early user, Bengaluru</p>
              </CardContent>
            </Card>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}