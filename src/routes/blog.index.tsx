import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck, IndianRupee, Sprout, Calculator, Smartphone, Target, BookOpen, Heart, Lock, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/blog/")({
  head: () => ({
    meta: [
      { title: "Why Evergreen? — Calm, India-first personal finance" },
      { name: "description", content: "Why we built Evergreen: India-first money tools, calm by default, your data locked down, and zero dark patterns." },
      { property: "og:title", content: "Why Evergreen? — Calm, India-first personal finance" },
      { property: "og:description", content: "India-first, calm, and honest personal-finance tools." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://evergree-wealth-track.lovable.app/blog" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Why Evergreen? — Calm, India-first personal finance" },
      { name: "twitter:description", content: "India-first, calm, and honest personal-finance tools." },
    ],
    links: [{ rel: "canonical", href: "https://evergree-wealth-track.lovable.app/blog" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: "Why Evergreen? — Calm, India-first personal finance",
          description:
            "Why we built Evergreen: India-first money tools, calm by default, your data locked down, and zero dark patterns.",
          author: { "@type": "Organization", name: "Evergreen" },
          publisher: { "@type": "Organization", name: "Evergreen" },
          mainEntityOfPage: "https://evergree-wealth-track.lovable.app/blog",
        }),
      },
    ],
  }),
  component: WhyEvergreen,
});

const REASONS = [
  { icon: IndianRupee, title: "INR is home, not an afterthought", body: "Lakhs, crores, UPI links and Indian number formatting are baked in. Multi-currency is one click away when you need it." },
  { icon: ShieldCheck, title: "Bank-grade isolation", body: "Row-level security means even other signed-in users — and our own analytics — can't read your numbers." },
  { icon: Target, title: "Budgets that actually behave", body: "Set monthly or yearly caps. We compare them to real spend and project where you'll land — no nagging notifications." },
  { icon: Smartphone, title: "Real UPI, not a screenshot", body: "Tap to open any UPI app with the amount pre-filled, scan the QR, or paste a transaction ref. Every payment lands in expenses automatically." },
  { icon: Calculator, title: "A calculator that respects you", body: "Basic math plus SIP and compound interest. Convert a calculation into a logged expense with one click." },
  { icon: BookOpen, title: "Calm content, not clickbait", body: "We refuse to push fear-driven finance content. The pages you read are short, plain-English, and useful." },
  { icon: Lock, title: "Your data is yours, period", body: "Sign-in via Google or email. No re-selling, no shady analytics SDKs, export anytime." },
  { icon: Heart, title: "Zero dark patterns", body: "No fake countdowns, no manipulative upsells. Free tier stays genuinely usable, paid tiers earn their keep." },
  { icon: Sparkles, title: "Built in the open", body: "We ship visible changes monthly, document what we won't build, and let you keep a Lifetime plan with one honest price." },
];

function WhyEvergreen() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <header className="mb-10 border-b border-border/60 pb-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground">
          <Sprout className="h-3.5 w-3.5 text-primary" /> Our story
        </div>
        <h1 className="mt-4 font-display text-4xl md:text-5xl">Why Evergreen?</h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
          Personal finance apps got loud, anxious, and sneaky. Evergreen is the opposite — a calm, India-first money tool built by people who got tired of being shouted at by their dashboards.
        </p>
      </header>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {REASONS.map((r) => (
          <Card key={r.title} className="group h-full border-border/60 transition-all hover:-translate-y-0.5 hover:shadow-soft">
            <CardContent className="flex h-full flex-col gap-3 p-6">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <r.icon className="h-5 w-5" />
              </div>
              <h2 className="font-display text-lg leading-snug">{r.title}</h2>
              <p className="text-sm text-muted-foreground">{r.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-12 rounded-3xl border border-border/60 bg-gradient-to-br from-primary/10 via-accent/5 to-background p-8 text-center">
        <h2 className="font-display text-2xl md:text-3xl">Money you don't have to think about every day.</h2>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">Sign in free, log your first expense, set a budget — and let Evergreen do the quiet math in the background.</p>
      </div>
    </div>
  );
}