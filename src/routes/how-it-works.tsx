import { createFileRoute } from "@tanstack/react-router";
import { Wallet, PieChart, Target, Sparkles, ShieldCheck, Globe2, Smartphone, BookOpen, Calculator } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How Evergreen Works — From signup to insight in minutes" },
      { name: "description", content: "Step-by-step: how Evergreen helps you log expenses, plan budgets, manage subscriptions and grow wealth — across currencies, on every device." },
      { property: "og:title", content: "How Evergreen Works — From signup to insight in minutes" },
      { property: "og:description", content: "Sign up, log expenses, set budgets, track subscriptions, see your wealth grow — without spreadsheets." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://solace-nest-scribe.lovable.app/how-it-works" },
      { name: "twitter:title", content: "How Evergreen Works" },
      { name: "twitter:description", content: "Sign up, log expenses, set budgets, track subscriptions, grow your wealth." },
    ],
    links: [{ rel: "canonical", href: "https://solace-nest-scribe.lovable.app/how-it-works" }],
  }),
  component: HowItWorksPage,
});

const steps = [
  {
    n: "01",
    icon: Wallet,
    title: "Create your free account",
    body: "Sign up with email or Google in under 30 seconds. We use row-level security so every row in our database is scoped to your user id — no other account, and no other user, can read your data. We never sell or share your records.",
  },
  {
    n: "02",
    icon: PieChart,
    title: "Log expenses your way",
    body: "Add an expense in any of 150+ currencies. Live FX rates (refreshed hourly from open exchange APIs) auto-convert each entry into your home currency, so your monthly total always reflects reality. Tap the pencil to edit, the trash to delete — instantly.",
  },
  {
    n: "03",
    icon: Target,
    title: "Set monthly & yearly budgets",
    body: "Choose category caps for food, rent, travel, etc. Evergreen projects where you'll land based on current pace, surfaces gentle early warnings at 70% / 90%, and quietly celebrates the months you finish under plan. No red blinking dashboards.",
  },
  {
    n: "04",
    icon: Sparkles,
    title: "Tame subscriptions",
    body: "Track every recurring charge — Netflix, Spotify, gym, cloud — with renewal dates and total monthly outflow. Pay annual plans via UPI deep-link, scan-QR or card (₹29 / ₹49 / ₹99 tiers). Cancel reminders surface a week before each renewal so you stop paying for things you forgot.",
  },
  {
    n: "05",
    icon: Globe2,
    title: "Travel & multi-currency",
    body: "Spent USD in New York or EUR in Paris? Pick the currency in the expense form — Evergreen converts at today's mid-market rate and adds it to your home running total. NRIs see one consolidated view across every country they spend in.",
  },
  {
    n: "06",
    icon: Smartphone,
    title: "UPI Quick Pay (India)",
    body: "Paste any UPI ID or scan a QR — Evergreen opens your favourite UPI app pre-filled with the amount and note, then auto-logs the payment to expenses when you return. Saved UPI IDs in your profile for one-tap reuse.",
  },
  {
    n: "07",
    icon: Calculator,
    title: "Financial calculators",
    body: "Built-in SIP, lump-sum, FD and goal calculators project where this month's choices land you in 5, 10 or 20 years. The shared calculator uses a safe parser — no eval, no script injection.",
  },
  {
    n: "08",
    icon: BookOpen,
    title: "Calm, plain-English content",
    body: "A monthly blog explains one money concept in plain English — no FOMO, no clickbait. Read why we built Evergreen, what we refuse to build, and how to grow wealth without burning out.",
  },
  {
    n: "09",
    icon: ShieldCheck,
    title: "Security you can trust",
    body: "HTTPS everywhere, strict security headers (CSP, HSTS, Permissions-Policy), row-level isolation on every table, hashed webhook signatures, and zero third-party trackers. Your money story stays yours.",
  },
];

function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main>
        <section className="border-b border-border/60 bg-gradient-to-b from-primary/5 to-transparent">
          <div className="mx-auto max-w-4xl px-4 py-16 text-center">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">How it works</p>
            <h1 className="mt-4 font-display text-4xl leading-tight sm:text-5xl">
              How <span className="text-primary">Evergreen</span> works
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground">
              Every feature, explained — so you know exactly what the app does before you sign up.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-16">
          <ol className="grid gap-5 md:grid-cols-2">
            {steps.map(({ n, icon: Icon, title, body }) => (
              <li key={n}>
                <Card className="h-full border-border/60 transition-shadow hover:shadow-lg">
                  <CardContent className="flex h-full gap-4 p-6">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-display text-sm font-semibold text-muted-foreground">{n}</div>
                      <h2 className="mt-1 font-display text-2xl">{title}</h2>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ol>
        </section>

        <section className="border-t border-border/60 bg-muted/40">
          <div className="mx-auto max-w-3xl px-4 py-16 text-center">
            <h2 className="font-display text-3xl sm:text-4xl">That's the whole product.</h2>
            <p className="mt-3 text-muted-foreground">No spreadsheets. No clutter. Just your money, finally making sense — across every currency, on every device.</p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}