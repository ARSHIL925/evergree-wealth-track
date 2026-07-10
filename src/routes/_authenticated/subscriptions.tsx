import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Check, Coins, PiggyBank, TrendingDown, Bell, Receipt } from "lucide-react";
import { listMyPayments, listMySubscriptions, createRazorpayOrder } from "@/lib/razorpay.functions";
import { getRates } from "@/lib/currency.functions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { formatINR, formatMoney, CURRENCIES } from "@/lib/currency";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const payQ = queryOptions({ queryKey: ["payments"], queryFn: () => listMyPayments() });
const subQ = queryOptions({ queryKey: ["subscriptions"], queryFn: () => listMySubscriptions() });
const ratesQ = queryOptions({ queryKey: ["rates"], queryFn: () => getRates() });

type Cycle = "monthly" | "yearly" | "one_time";
type Plan = { id: string; name: string; price: number; cycle: Cycle; perks: string[] };
const PLANS: Plan[] = [
  { id: "seed", name: "Seed", price: 0, cycle: "monthly", perks: ["Track expenses in INR", "Basic calculator", "Read the blog", "1 monthly budget"] },
  { id: "spark", name: "Spark", price: 29, cycle: "monthly", perks: ["Everything in Seed", "Multi-currency totals", "UPI Quick Pay logging", "Unlimited monthly budgets"] },
  { id: "grow", name: "Grow", price: 49, cycle: "monthly", perks: ["Everything in Spark", "Yearly budget planner", "SIP & compound calculator", "CSV export"] },
  { id: "pro", name: "Pro", price: 99, cycle: "monthly", perks: ["Everything in Grow", "Monthly email reports", "Priority support", "Early access to new features"] },
];

const SAVINGS = [
  { icon: PiggyBank, title: "See every rupee", body: "Most people leak 8-12% of income to forgotten subscriptions and small UPI taps. Evergreen surfaces them in one view so you can cut what you don't use." },
  { icon: TrendingDown, title: "Budget that bends, not breaks", body: "Set monthly & yearly caps per category. We project where you'll land — gently — so you can course-correct before the month ends, not after." },
  { icon: Bell, title: "No surprise renewals", body: "Track every recurring plan you pay for. Cancel the dead ones in two clicks." },
  { icon: Receipt, title: "Tax-time ready", body: "Categorised, currency-aware logs export to CSV. Hand it to your CA in seconds." },
];
export const Route = createFileRoute("/_authenticated/subscriptions")({
  head: () => ({ meta: [{ title: "Plans — Evergreen" }, { name: "robots", content: "noindex" }] }),
  loader: ({ context }) => Promise.all([
    context.queryClient.ensureQueryData(payQ),
    context.queryClient.ensureQueryData(subQ),
    context.queryClient.ensureQueryData(ratesQ),
  ]),
  errorComponent: ({ error }) => <div className="p-8 text-destructive">{error.message}</div>,
  notFoundComponent: () => <div className="p-8">Not found</div>,
  component: SubsPage,
});

function SubsPage() {
  const { data: payments } = useSuspenseQuery(payQ);
  const { data: subs } = useSuspenseQuery(subQ);
  const { data: rates } = useSuspenseQuery(ratesQ);
  const [displayCurrency, setDisplayCurrency] = useState("INR");
  const fx = rates.rates[displayCurrency] ?? 1;
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <header className="mb-8">
        <p className="text-sm font-medium uppercase tracking-widest text-primary">Plans</p>
        <h1 className="mt-1 font-display text-3xl md:text-4xl">Choose how you support Evergreen.</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Demo billing only — no real money changes hands. Each demo "subscribe" awards you in-app 🪙 tokens (₹1 ≈ 10 tokens) so you can try every premium feature risk-free.
        </p>
        <div className="mt-4 flex items-center gap-2">
          <Label htmlFor="disp" className="text-sm">Show prices in</Label>
          <Select value={displayCurrency} onValueChange={setDisplayCurrency}>
            <SelectTrigger id="disp" className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>{CURRENCIES.map((c) => <SelectItem key={c.code} value={c.code}>{c.symbol} {c.code}</SelectItem>)}</SelectContent>
          </Select>
          {displayCurrency !== "INR" && (
            <span className="text-xs text-muted-foreground">Live FX · billed in INR</span>
          )}
        </div>
      </header>
      <section className="mb-10 rounded-3xl border border-border/60 bg-gradient-to-br from-primary/5 via-accent/5 to-background p-6 md:p-8">
        <h2 className="font-display text-2xl">How Evergreen saves you money</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">A ₹49/month plan that quietly recovers ₹2,000/month of small leaks pays for itself ~40× over. Here's how.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SAVINGS.map((s) => (
            <div key={s.title} className="rounded-2xl border border-border/60 bg-card/70 p-4">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><s.icon className="h-5 w-5" /></div>
              <h3 className="mt-3 font-display text-base">{s.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>
      </section>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {PLANS.map((p) => <PlanCard key={p.id} plan={p} active={subs.some((s) => s.plan === p.id && s.status === "active")} displayCurrency={displayCurrency} fx={fx} />)}
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        Split-pay: a plan total in your local currency converts at the live INR FX rate, but the actual charge is always in INR. Example: ₹49 ≈ {formatMoney(49 * fx, displayCurrency)}.
      </p>
      <h2 className="mt-12 font-display text-2xl">Payment history</h2>
      <Card className="mt-4 border-border/60"><CardContent className="p-0">
        {payments.length === 0 ? <div className="p-8 text-center text-muted-foreground">No payments yet.</div> : (
          <ul className="divide-y divide-border">
            {payments.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <div className="font-medium">{formatINR(Number(p.amount_inr))} <Badge variant="outline" className="ml-2 capitalize">{p.method}</Badge></div>
                  <div className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleString("en-IN")} · {p.notes}</div>
                </div>
                <Badge variant={p.status === "paid" ? "default" : "secondary"}>{p.status}</Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent></Card>
    </div>
  );
}

function PlanCard({ plan, active, displayCurrency, fx }: { plan: Plan; active: boolean; displayCurrency: string; fx: number }) {
  return (
    <Card className={`border-border/60 ${plan.id === "pro" ? "shadow-soft ring-2 ring-primary/30" : ""}`}>
      <CardContent className="flex h-full flex-col p-6">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-xl">{plan.name}</h3>
          {active && <Badge className="bg-success text-success-foreground">Active</Badge>}
        </div>
        <div className="mt-3 font-display text-3xl">{plan.price === 0 ? "Free" : formatINR(plan.price)}</div>
        <div className="text-xs capitalize text-muted-foreground">
          {plan.cycle.replace("_", " ")}
          {plan.price > 0 && displayCurrency !== "INR" && (
            <span className="ml-1">· ≈ {formatMoney(plan.price * fx, displayCurrency)}</span>
          )}
        </div>
        <ul className="mt-4 space-y-2 text-sm">
          {plan.perks.map((p) => <li key={p} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 text-success" /> {p}</li>)}
        </ul>
        <div className="mt-6 flex-1" />
        {plan.price === 0 ? <Button variant="outline" disabled>Current</Button> : <PayDialog plan={plan} />}
      </CardContent>
    </Card>
  );
}

function PayDialog({ plan }: { plan: Plan }) {
  const qc = useQueryClient();
  const [loading, setLoading] = useState(false);

  const handleDemoPay = async () => {
    setLoading(true);
    try {
      // Demo-only: server returns demo:true when no Razorpay keys are set,
      // which records a "demo_mode" payment row. We then award in-app tokens.
      await createRazorpayOrder({
        data: { plan: plan.id as "seed" | "spark" | "grow" | "pro", billing_cycle: plan.cycle },
      });
      const tokens = plan.price * 10;
      if (typeof window !== "undefined") {
        const cur = Number(localStorage.getItem("evergreen_tokens") ?? "0");
        localStorage.setItem("evergreen_tokens", String(cur + tokens));
      }
      toast.success(`Demo payment recorded — you earned ${tokens} 🪙 tokens`);
      await qc.invalidateQueries({ queryKey: ["payments"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not record demo payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleDemoPay} disabled={loading} className="w-full">
      <Coins className="mr-2 h-4 w-4" /> Get {plan.price * 10} tokens (demo)
    </Button>
  );
}