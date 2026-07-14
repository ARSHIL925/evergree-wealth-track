import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, TrendingUp, CalendarDays, Calendar, Target, Sparkles } from "lucide-react";
import { listBudgets, upsertBudget, deleteBudget, updateBudget } from "@/lib/budgets.functions";
import { listExpenses } from "@/lib/expenses.functions";
import { getRates, convertToINR } from "@/lib/currency.functions";
import { formatINR } from "@/lib/currency";
import { CATEGORIES as SUGGESTED } from "@/lib/categories";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const bQ = queryOptions({ queryKey: ["budgets"], queryFn: () => listBudgets() });
const eQ = queryOptions({ queryKey: ["expenses"], queryFn: () => listExpenses() });
const rQ = queryOptions({ queryKey: ["rates"], queryFn: () => getRates() });

export const Route = createFileRoute("/_authenticated/budget")({
  head: () => ({ meta: [{ title: "Budget — Evergreen" }, { name: "robots", content: "noindex" }] }),
  loader: ({ context }) => Promise.all([
    context.queryClient.ensureQueryData(bQ),
    context.queryClient.ensureQueryData(eQ),
    context.queryClient.ensureQueryData(rQ),
  ]),
  errorComponent: ({ error }) => <div className="p-8 text-destructive">{error.message}</div>,
  notFoundComponent: () => <div className="p-8">Not found</div>,
  component: BudgetPage,
});

type Period = "monthly" | "yearly";

function BudgetPage() {
  const [period, setPeriod] = useState<Period>("monthly");
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-widest text-primary">Budgets</p>
          <h1 className="mt-1 font-display text-3xl md:text-4xl">Plan the month. Plan the year.</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">Set spending caps by category — Evergreen tracks them silently against your real expenses and warns before you overshoot.</p>
        </div>
      </header>

      <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
        <TabsList className="mb-6">
          <TabsTrigger value="monthly" className="gap-2"><Calendar className="h-4 w-4" /> Monthly</TabsTrigger>
          <TabsTrigger value="yearly" className="gap-2"><CalendarDays className="h-4 w-4" /> Yearly</TabsTrigger>
        </TabsList>
        <TabsContent value="monthly"><BudgetBoard period="monthly" /></TabsContent>
        <TabsContent value="yearly"><BudgetBoard period="yearly" /></TabsContent>
      </Tabs>
    </div>
  );
}

function periodWindow(period: Period) {
  const now = new Date();
  if (period === "monthly") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const totalDays = (end.getTime() - start.getTime()) / 86400000;
    const elapsed = Math.max(1, (now.getTime() - start.getTime()) / 86400000);
    return { start, end, totalDays, elapsed };
  }
  const start = new Date(now.getFullYear(), 0, 1);
  const end = new Date(now.getFullYear() + 1, 0, 1);
  const totalDays = (end.getTime() - start.getTime()) / 86400000;
  const elapsed = Math.max(1, (now.getTime() - start.getTime()) / 86400000);
  return { start, end, totalDays, elapsed };
}

function BudgetBoard({ period }: { period: Period }) {
  const qc = useQueryClient();
  const { data: budgets } = useSuspenseQuery(bQ);
  const { data: expenses } = useSuspenseQuery(eQ);
  const { data: rates } = useSuspenseQuery(rQ);
  const [editing, setEditing] = useState<{ id: string; category: string; amount_inr: number } | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [lastAdded, setLastAdded] = useState<Record<string, number>>(() => {
    if (typeof window === "undefined") return {};
    try { return JSON.parse(localStorage.getItem("evergreen_budget_last_added") || "{}"); }
    catch { return {}; }
  });
  const recordLastAdded = (id: string, amt: number) => {
    setLastAdded((prev) => {
      const next = { ...prev, [id]: amt };
      if (typeof window !== "undefined") localStorage.setItem("evergreen_budget_last_added", JSON.stringify(next));
      return next;
    });
  };

  const win = useMemo(() => periodWindow(period), [period]);

  const periodBudgets = budgets.filter((b) => b.period === period);

  const spentByCategory = useMemo(() => {
    const map = new Map<string, number>();
    let overall = 0;
    for (const e of expenses) {
      const t = new Date(e.occurred_at).getTime();
      if (t < win.start.getTime() || t >= win.end.getTime()) continue;
      const inr = convertToINR(Number(e.amount), e.currency, rates.rates);
      overall += inr;
      const cat = (e.category || "general").toLowerCase();
      map.set(cat, (map.get(cat) ?? 0) + inr);
    }
    map.set("overall", overall);
    return map;
  }, [expenses, rates, win]);

  const totals = useMemo(() => {
    const planned = periodBudgets.reduce((a, b) => a + Number(b.amount_inr), 0);
    const overall = spentByCategory.get("overall") ?? 0;
    const pace = (win.elapsed / win.totalDays);
    const projected = pace > 0 ? overall / pace : 0;
    return { planned, overall, projected };
  }, [periodBudgets, spentByCategory, win]);

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard icon={Target} label={`${period === "monthly" ? "This month" : "This year"} planned`} value={formatINR(totals.planned)} hint={`${periodBudgets.length} budget${periodBudgets.length === 1 ? "" : "s"}`} />
        <SummaryCard icon={TrendingUp} label="Spent so far" value={formatINR(totals.overall)} hint={`${Math.round((win.elapsed / win.totalDays) * 100)}% of period elapsed`} />
        <SummaryCard icon={Sparkles} label="Projected at this pace" value={formatINR(totals.projected)} hint={totals.planned > 0 ? (totals.projected > totals.planned ? "over plan — slow down" : "under plan — nice") : "set a budget below"} tone={totals.planned > 0 && totals.projected > totals.planned ? "warn" : "good"} />
      </div>

      <AddBudget period={period} onAdded={async (cat, amt) => {
        await qc.invalidateQueries({ queryKey: ["budgets"] });
        const fresh = await qc.fetchQuery(bQ);
        const match = fresh.find((x) => x.period === period && x.category === cat.toLowerCase().trim());
        if (match) recordLastAdded(match.id, amt);
      }} />

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {periodBudgets.length === 0 ? (
          <Card className="border-dashed border-border md:col-span-2"><CardContent className="p-10 text-center text-muted-foreground">No {period} budgets yet. Add one above — start with "overall" to cap your total spend.</CardContent></Card>
        ) : periodBudgets.map((b) => {
          const spent = spentByCategory.get(b.category.toLowerCase()) ?? 0;
          const cap = Number(b.amount_inr);
          const added = lastAdded[b.id] ?? cap;
          const pct = cap > 0 ? Math.min(100, (spent / cap) * 100) : 0;
          const overshoot = spent > cap;
          const pace = (win.elapsed / win.totalDays);
          const projected = pace > 0 ? spent / pace : 0;
          return (
            <Card key={b.id} className={`border-border/60 transition-all active:scale-[0.99] ${overshoot ? "ring-1 ring-destructive/40" : ""}`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-display text-lg capitalize">{b.category}</h3>
                      {overshoot && <Badge variant="destructive">Over</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground">{formatINR(added)} of {formatINR(cap)}</div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => {
                      setEditing({ id: b.id, category: b.category, amount_inr: cap });
                      setEditAmount(String(cap));
                    }}><Pencil className="h-4 w-4 text-muted-foreground" /></Button>
                    <Button size="icon" variant="ghost" onClick={async () => {
                      if (!confirm("Delete this budget?")) return;
                      await deleteBudget({ data: { id: b.id } });
                      qc.invalidateQueries({ queryKey: ["budgets"] });
                    }}><Trash2 className="h-4 w-4 text-muted-foreground" /></Button>
                  </div>
                </div>
                <Progress value={pct} className={`mt-3 ${overshoot ? "[&>div]:bg-destructive" : ""}`} />
                <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                  <span>{Math.round(pct)}% used</span>
                  <span>projection: {formatINR(projected)}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="capitalize">Edit {editing?.category} budget</DialogTitle></DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="edit-amt">New cap (₹)</Label>
            <Input id="edit-amt" type="number" min="1" step="0.01" value={editAmount}
              onChange={(e) => setEditAmount(e.target.value.replace(/^0+(?=\d)/, ""))} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={async () => {
              const amt = Number(editAmount);
              if (!amt || amt <= 0) { toast.error("Enter a positive amount"); return; }
              if (!editing) return;
              await updateBudget({ data: { id: editing.id, amount_inr: amt } });
              recordLastAdded(editing.id, amt);
              await qc.invalidateQueries({ queryKey: ["budgets"] });
              toast.success("Budget updated");
              setEditing(null);
            }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, hint, tone }: { icon: typeof Target; label: string; value: string; hint: string; tone?: "good" | "warn" }) {
  return (
    <Card className="border-border/60">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground"><Icon className="h-4 w-4 text-primary" /> {label}</div>
        <div className={`mt-2 font-display text-3xl ${tone === "warn" ? "text-destructive" : ""}`}>{value}</div>
        <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
      </CardContent>
    </Card>
  );
}

import { CATEGORIES as SUGGESTED } from "@/lib/categories";

function AddBudget({ period, onAdded }: { period: Period; onAdded: (category: string, amount: number) => void }) {
  const [category, setCategory] = useState("general");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const amt = Number(amount);
    if (!amt || amt <= 0) { toast.error("Enter an amount"); return; }
    setBusy(true);
    try {
      await upsertBudget({ data: { period, category: category.toLowerCase().trim(), amount_inr: amt } });
      toast.success(`${period === "monthly" ? "Monthly" : "Yearly"} budget saved`);
      setAmount("");
      onAdded(category, amt);
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed"); }
    finally { setBusy(false); }
  };

  return (
    <Card className="mt-6 border-border/60 bg-gradient-to-br from-primary/5 to-accent/5">
      <CardContent className="p-6">
        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SUGGESTED.map((c) => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="amt">Cap (₹)</Label>
            <Input id="amt" type="number" inputMode="decimal" min="1" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={period === "monthly" ? "e.g. 25000" : "e.g. 300000"} />
          </div>
          <div className="flex items-end"><Button type="submit" disabled={busy} className="w-full"><Plus className="mr-1 h-4 w-4" /> Save budget</Button></div>
        </form>
        <p className="mt-3 text-xs text-muted-foreground">Tip: pick the same category you use in Expenses. Add the same category again to grow the cap — Evergreen sums the amounts.</p>
      </CardContent>
    </Card>
  );
}