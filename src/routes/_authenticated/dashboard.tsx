import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions, useQueryClient } from "@tanstack/react-query";
import { Suspense, useEffect, useState } from "react";
import { toast } from "sonner";
import QRCode from "qrcode";
import { Wallet, Calculator, IndianRupee, BookOpen, Smartphone, ExternalLink, Target } from "lucide-react";
import { listExpenses, addExpense } from "@/lib/expenses.functions";
import { listMySubscriptions } from "@/lib/razorpay.functions";
import { getRates, convertToINR } from "@/lib/currency.functions";

import { useDisplayCurrency } from "@/hooks/useDisplayCurrency";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const expensesQuery = queryOptions({ queryKey: ["expenses"], queryFn: () => listExpenses() });
const subsQuery = queryOptions({ queryKey: ["subscriptions"], queryFn: () => listMySubscriptions() });
const ratesQuery = queryOptions({ queryKey: ["rates"], queryFn: () => getRates() });

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Evergreen" }, { name: "description", content: "Your money at a glance." }, { name: "robots", content: "noindex" }] }),
  loader: ({ context }) => Promise.all([
    context.queryClient.ensureQueryData(expensesQuery),
    context.queryClient.ensureQueryData(subsQuery),
    context.queryClient.ensureQueryData(ratesQuery),
  ]),
  errorComponent: ({ error }) => <div className="p-8 text-destructive">{error.message}</div>,
  notFoundComponent: () => <div className="p-8">Not found</div>,
  component: Dashboard,
});

function Dashboard() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <header className="mb-8">
        <p className="text-sm font-medium uppercase tracking-widest text-primary">Dashboard</p>
        <h1 className="mt-1 font-display text-3xl md:text-4xl">Welcome back.</h1>
      </header>
      <Suspense fallback={<Skeleton className="h-40 w-full" />}><Stats /></Suspense>
      <UpiQuickPay />
      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { to: "/expenses", icon: Wallet, label: "Track an expense" },
          { to: "/budget", icon: Target, label: "Set a budget" },
          { to: "/calculator", icon: Calculator, label: "Open calculator" },
          { to: "/subscriptions", icon: IndianRupee, label: "Manage plans" },
          { to: "/blog", icon: BookOpen, label: "Why Evergreen?" },
        ].map((q) => (
          <Link key={q.to} to={q.to as never}>
            <Card className="h-full border-border/60 transition-all hover:shadow-soft">
              <CardContent className="flex items-center gap-3 p-5">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><q.icon className="h-5 w-5" /></div>
                <span className="font-medium">{q.label}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

function Stats() {
  const { data: expenses } = useSuspenseQuery(expensesQuery);
  const { data: subs } = useSuspenseQuery(subsQuery);
  const { data: rates } = useSuspenseQuery(ratesQuery);
  const display = useDisplayCurrency(rates.rates);
  const totalINR = expenses.reduce((acc, e) => acc + convertToINR(Number(e.amount), e.currency, rates.rates), 0);
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  const thisMonth = expenses.filter((e) => new Date(e.occurred_at) >= monthStart)
    .reduce((acc, e) => acc + convertToINR(Number(e.amount), e.currency, rates.rates), 0);
  const active = subs.filter((s) => s.status === "active").length;
  const hint = display.code === "INR" ? "across all currencies → INR" : `converted to ${display.code} at live rates`;
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <StatCard label="All-time spent" value={display.format(totalINR)} hint={`${expenses.length} transactions`} />
      <StatCard label="This month" value={display.format(thisMonth)} hint={hint} />
      <StatCard label="Active plans" value={String(active)} hint={subs.length === 0 ? "no subscriptions yet" : `${subs.length} total`} />
    </div>
  );
}

function StatCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <Card className="border-border/60">
      <CardContent className="p-6">
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="mt-2 font-display text-3xl">{value}</div>
        <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
      </CardContent>
    </Card>
  );
}

function UpiQuickPay() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [payee, setPayee] = useState("");
  const [note, setNote] = useState("");
  const [qr, setQr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const amt = Number(amount) || 0;
  const upiId = payee.trim() || "merchant@upi";
  const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payee.split("@")[0] || "Payee")}&am=${amt}&cu=INR&tn=${encodeURIComponent(note || "Quick pay")}`;

  useEffect(() => {
    if (!open || amt <= 0) { setQr(null); return; }
    QRCode.toDataURL(upiUrl, { width: 200, margin: 1 }).then(setQr).catch(() => setQr(null));
  }, [open, upiUrl, amt]);

  const logExpense = async () => {
    if (amt <= 0) { toast.error("Enter an amount"); return; }
    setBusy(true);
    try {
      await addExpense({ data: {
        amount: amt, currency: "INR",
        category: "UPI",
        note: `${payee.trim() ? "To " + payee.trim() : "UPI payment"}${note ? " · " + note : ""}`,
      } });
      await qc.invalidateQueries({ queryKey: ["expenses"] });
      toast.success("Logged to expenses");
      setOpen(false); setAmount(""); setPayee(""); setNote("");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
    finally { setBusy(false); }
  };

  return (
    <Card className="mt-8 overflow-hidden border-border/60 bg-gradient-to-br from-primary/10 via-accent/5 to-background">
      <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/15 text-primary"><Smartphone className="h-6 w-6" /></div>
          <div>
            <h2 className="font-display text-xl">UPI Quick Pay</h2>
            <p className="mt-1 text-sm text-muted-foreground">Pay any UPI ID instantly — we'll log it to expenses for you.</p>
          </div>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="rounded-full shadow-soft"><Smartphone className="mr-2 h-4 w-4" /> Pay & track</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>UPI Quick Pay</DialogTitle>
              <DialogDescription>Opens your UPI app, then logs the amount to your expenses.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-3">
              <div className="grid gap-1.5"><Label htmlFor="upi-amt">Amount (₹)</Label>
                <Input id="upi-amt" type="number" inputMode="decimal" min="1" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 250" />
              </div>
              <div className="grid gap-1.5"><Label htmlFor="upi-payee">Payee UPI ID</Label>
                <Input id="upi-payee" value={payee} onChange={(e) => setPayee(e.target.value)} placeholder="name@bank" />
              </div>
              <div className="grid gap-1.5"><Label htmlFor="upi-note">Note (optional)</Label>
                <Input id="upi-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={120} placeholder="Groceries, rent, coffee…" />
              </div>
              {qr && (
                <div className="rounded-2xl border border-border/60 bg-card p-3 text-center">
                  <img src={qr} alt="UPI QR" className="mx-auto rounded-lg bg-white p-2" />
                  <p className="mt-2 text-xs text-muted-foreground">Scan with any UPI app</p>
                </div>
              )}
              <div className="flex flex-wrap gap-2 pt-2">
                <a href={upiUrl} className="flex-1">
                  <Button type="button" variant="outline" className="w-full" disabled={amt <= 0}><ExternalLink className="mr-2 h-4 w-4" /> Open UPI app</Button>
                </a>
                <Button type="button" onClick={logExpense} disabled={busy || amt <= 0} className="flex-1">Log to expenses</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}