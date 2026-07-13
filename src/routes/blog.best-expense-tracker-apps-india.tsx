import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const URL = "https://evergree-wealth-track.lovable.app/blog/best-expense-tracker-apps-india";
const TITLE = "Best Expense Tracker Apps in India (2026): Honest Comparison";
const DESCRIPTION =
  "Compare India's top expense trackers — Axio, Walnut, Jupiter, and Evergreen. INR-first, UPI-friendly, privacy-respecting picks reviewed side by side.";

type App = {
  name: string;
  tagline: string;
  strengths: string[];
  tradeoffs: string[];
  upi: boolean;
  multiCurrency: boolean;
  manualEntry: boolean;
  noSmsScraping: boolean;
  bestFor: string;
};

const APPS: App[] = [
  {
    name: "Evergreen",
    tagline: "Calm, INR-first tracking with UPI deep-links and multi-currency support.",
    strengths: [
      "UPI deep-linking — log a spend and open your UPI app in one tap",
      "Multi-currency budgets for travel and NRIs",
      "No SMS scraping — you decide what gets recorded",
      "Clean, distraction-free dashboard",
    ],
    tradeoffs: ["Newer product — smaller community than incumbents"],
    upi: true,
    multiCurrency: true,
    manualEntry: true,
    noSmsScraping: true,
    bestFor: "People who want a calm, private, INR-first tracker that respects their attention.",
  },
  {
    name: "Axio (formerly Walnut)",
    tagline: "Auto-tracks spends from SMS; also offers credit and pay-later.",
    strengths: ["Automatic SMS parsing", "Bill reminders", "Credit products in-app"],
    tradeoffs: [
      "Requires SMS access — heavy permission ask",
      "Bundled lending pushes upsells into a tracker",
    ],
    upi: false,
    multiCurrency: false,
    manualEntry: true,
    noSmsScraping: false,
    bestFor: "Users comfortable trading SMS access for automation and okay with credit prompts.",
  },
  {
    name: "Walnut (legacy)",
    tagline: "The original SMS-based expense tracker; now folded into Axio.",
    strengths: ["Familiar to long-time users", "Simple category views"],
    tradeoffs: ["No longer independently updated", "Same SMS-permission trade-offs as Axio"],
    upi: false,
    multiCurrency: false,
    manualEntry: true,
    noSmsScraping: false,
    bestFor: "Existing users who haven't migrated yet.",
  },
  {
    name: "Jupiter",
    tagline: "Neobank with built-in spend insights on Jupiter account transactions.",
    strengths: ["Automatic insights on Jupiter debit/UPI spends", "Rewards on account usage"],
    tradeoffs: [
      "Insights only cover money moving through a Jupiter account",
      "Not a neutral tracker if you use multiple banks",
    ],
    upi: true,
    multiCurrency: false,
    manualEntry: false,
    noSmsScraping: true,
    bestFor: "Jupiter account holders who want spend analytics tied to their bank.",
  },
];

export const Route = createFileRoute("/blog/best-expense-tracker-apps-india")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:type", content: "article" },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:url", content: URL },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESCRIPTION },
    ],
    links: [{ rel: "canonical", href: URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: TITLE,
          description: DESCRIPTION,
          author: { "@type": "Organization", name: "Evergreen Wealth Track" },
          publisher: {
            "@type": "Organization",
            name: "Evergreen Wealth Track",
            logo: {
              "@type": "ImageObject",
              url: "https://evergree-wealth-track.lovable.app/favicon.ico",
            },
          },
          mainEntityOfPage: URL,
          url: URL,
          about: [
            { "@type": "SoftwareApplication", name: "Evergreen" },
            { "@type": "SoftwareApplication", name: "Axio" },
            { "@type": "SoftwareApplication", name: "Walnut" },
            { "@type": "SoftwareApplication", name: "Jupiter" },
          ],
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            {
              "@type": "Question",
              name: "Which is the best expense tracker app in India?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "It depends on how private you want to be. Axio auto-tracks via SMS, Jupiter is best if you bank with Jupiter, and Evergreen is a calm, INR-first tracker with UPI deep-links and multi-currency support for people who prefer manual, private logging.",
              },
            },
            {
              "@type": "Question",
              name: "Do these apps support UPI?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Evergreen and Jupiter both integrate with UPI. Evergreen deep-links to your UPI app when you log a spend; Jupiter tracks UPI transactions made from a Jupiter account.",
              },
            },
            {
              "@type": "Question",
              name: "Is any of them free?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "All four offer a free tier. Evergreen keeps core tracking, UPI deep-linking, and multi-currency budgets on the free plan.",
              },
            },
          ],
        }),
      },
    ],
  }),
  component: ComparisonPage,
});

function Yes() {
  return (
    <span className="inline-flex items-center gap-1 text-primary">
      <Check className="h-4 w-4" /> Yes
    </span>
  );
}
function No() {
  return (
    <span className="inline-flex items-center gap-1 text-muted-foreground">
      <X className="h-4 w-4" /> No
    </span>
  );
}

function ComparisonPage() {
  return (
    <article className="mx-auto max-w-4xl px-4 py-12">
      <Link to="/blog">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to blog
        </Button>
      </Link>

      <h1 className="mt-6 font-display text-3xl md:text-4xl">{TITLE}</h1>
      <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
        Looking for the best expense tracker app in India? We compared four popular options —
        Axio, Walnut, Jupiter, and Evergreen — on the things that actually matter to Indian
        users: UPI support, privacy, INR-first design, and multi-currency handling for travel
        and NRIs.
      </p>

      <section className="mt-10">
        <h2 className="font-display text-2xl">At a glance</h2>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="p-3">App</th>
                <th className="p-3">UPI deep-link</th>
                <th className="p-3">Multi-currency</th>
                <th className="p-3">Manual entry</th>
                <th className="p-3">No SMS scraping</th>
              </tr>
            </thead>
            <tbody>
              {APPS.map((a) => (
                <tr key={a.name} className="border-t border-border">
                  <td className="p-3 font-medium">{a.name}</td>
                  <td className="p-3">{a.upi ? <Yes /> : <No />}</td>
                  <td className="p-3">{a.multiCurrency ? <Yes /> : <No />}</td>
                  <td className="p-3">{a.manualEntry ? <Yes /> : <No />}</td>
                  <td className="p-3">{a.noSmsScraping ? <Yes /> : <No />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {APPS.map((a) => (
        <section key={a.name} className="mt-10">
          <h2 className="font-display text-2xl">{a.name}</h2>
          <p className="mt-2 text-muted-foreground">{a.tagline}</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Strengths
              </h3>
              <ul className="mt-2 space-y-1 text-sm">
                {a.strengths.map((s) => (
                  <li key={s} className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Trade-offs
              </h3>
              <ul className="mt-2 space-y-1 text-sm">
                {a.tradeoffs.map((s) => (
                  <li key={s} className="flex gap-2">
                    <X className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p className="mt-4 text-sm">
            <span className="font-semibold">Best for: </span>
            <span className="text-muted-foreground">{a.bestFor}</span>
          </p>
        </section>
      ))}

      <section className="mt-12 rounded-2xl border border-border bg-muted/30 p-6">
        <h2 className="font-display text-2xl">Why we built Evergreen</h2>
        <p className="mt-3 text-muted-foreground">
          Most Indian expense trackers either scrape your SMS inbox or lock you into one bank.
          Evergreen takes the opposite path: a calm, private tracker that speaks INR first,
          deep-links to any UPI app when you log a spend, and handles multi-currency budgets
          for travel and NRIs — without asking to read every message on your phone.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link to="/auth">
            <Button>Try Evergreen free</Button>
          </Link>
          <Link to="/how-it-works">
            <Button variant="outline">How it works</Button>
          </Link>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl">Frequently asked</h2>
        <div className="mt-4 space-y-4 text-sm">
          <div>
            <h3 className="font-semibold">Which is the best expense tracker app in India?</h3>
            <p className="mt-1 text-muted-foreground">
              It depends on how private you want to be. Axio auto-tracks via SMS, Jupiter is
              best if you bank with Jupiter, and Evergreen is the calm, INR-first pick with
              UPI deep-links and multi-currency support.
            </p>
          </div>
          <div>
            <h3 className="font-semibold">Do these apps support UPI?</h3>
            <p className="mt-1 text-muted-foreground">
              Evergreen and Jupiter both work with UPI. Evergreen deep-links to your UPI app
              when you log a spend; Jupiter tracks UPI made from a Jupiter account.
            </p>
          </div>
          <div>
            <h3 className="font-semibold">Is any of them free?</h3>
            <p className="mt-1 text-muted-foreground">
              All four offer a free tier. Evergreen keeps core tracking, UPI deep-linking, and
              multi-currency budgets on the free plan.
            </p>
          </div>
        </div>
      </section>
    </article>
  );
}
