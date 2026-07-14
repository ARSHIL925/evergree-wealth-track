import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Pencil } from "lucide-react";
import { z } from "zod";
import { listExpenses, addExpense, deleteExpense, updateExpense } from "@/lib/expenses.functions";
import { getRates, convertToINR } from "@/lib/currency.functions";
import { CURRENCIES, formatINR, formatMoney } from "@/lib/currency";
import { CATEGORIES } from "@/lib/categories";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const exQ = queryOptions({ queryKey: ["expenses"], queryFn: () => listExpenses() });
const rQ = queryOptions({ queryKey: ["rates"], queryFn: () => getRates() });

const searchSchema = z.object({ prefill_amount: z.coerce.number().optional(), prefill_note: z.string().optional() });

export const Route = createFileRoute("/_authenticated/expenses")({
  head: () => ({ meta: [{ title: "Expenses — Evergreen" }, { name: "robots", content: "noindex" }] }),
  validateSearch: searchSchema,
  loader: ({ context }) => Promise.all([context.queryClient.ensureQueryData(exQ), context.queryClient.ensureQueryData(rQ)]),
  errorComponent: ({ error }) => <div className="p-8 text-destructive">{error.message}</div>,
  notFoundComponent: () => <div className="p-8">Not found</div>,
  component: ExpensesPage,
});

function ExpensesPage() {
  const { data: expenses } = useSuspenseQuery(exQ);
  const { data: rates } = useSuspenseQuery(rQ);
  const search = Route.useSearch();
  const nav = useNavigate();
  const qc = useQueryClient();
  const [currency, setCurrency] = useState("INR");
  const [category, setCategory] = useState<string>("general");
  const [viewCurrency, setViewCurrency] = useState("USD");
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<null | {
    id: string; amount: number; currency: string; category: string; note: string;
  }>(null);
  const [saving, setSaving] = useState(false);

  const totals = useMemo(() => {
    const inr = expenses.reduce((a, e) => a + convertToINR(Number(e.amount), e.currency, rates.rates), 0);
    const r = rates.rates[viewCurrency] ?? 1;
    return { inr, view: viewCurrency === "INR" ? inr : inr * r };
  }, [expenses, rates, viewCurrency]);

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    setAdding(true);
    try {
      const fd = new FormData(form);
      await addExpense({ data: {
        amount: Number(fd.get("amount")), currency,
        category,
        note: String(fd.get("note") || ""),
      } });
      await qc.invalidateQueries({ queryKey: ["expenses"] });
      form.reset();
      nav({ to: "/expenses", search: {} });
      toast.success("Expense added");
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed"); }
    finally { setAdding(false); }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-widest text-primary">Expenses</p>
          <h1 className="mt-1 font-display text-3xl">Track every rupee.</h1>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="view">View in</Label>
          <Select value={viewCurrency} onValueChange={setViewCurrency}>
            <SelectTrigger id="view" className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>{CURRENCIES.map((c) => <SelectItem key={c.code} value={c.code}>{c.symbol} {c.code}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </header>
      <div className={`grid gap-4 ${viewCurrency === "INR" ? "" : "sm:grid-cols-2"}`}>
        <Card className="border-border/60 bg-gradient-to-br from-primary/5 to-accent/5"><CardContent className="p-6">
          <div className="text-sm text-muted-foreground">Total in INR</div>
          <div className="mt-2 font-display text-3xl">{formatINR(totals.inr)}</div>
        </CardContent></Card>
        {viewCurrency !== "INR" && (
          <Card className="border-border/60"><CardContent className="p-6">
            <div className="text-sm text-muted-foreground">Total in {viewCurrency}</div>
            <div className="mt-2 font-display text-3xl">{formatMoney(totals.view, viewCurrency)}</div>
          </CardContent></Card>
        )}
      </div>
      <Card className="mt-6 border-border/60"><CardContent className="p-6">
        <form onSubmit={handleAdd} className="grid gap-3 sm:grid-cols-5">
          <div className="space-y-1.5"><Label>Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CURRENCIES.map((c) => <SelectItem key={c.code} value={c.code}>{c.symbol} {c.code}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label htmlFor="amount">Amount</Label>
            <Input id="amount" name="amount" type="number" step="0.01" min="0" required defaultValue={search.prefill_amount ?? ""} />
          </div>
          <div className="space-y-1.5"><Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent className="max-h-72">
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label htmlFor="note">Note</Label>
            <Input id="note" name="note" maxLength={280} defaultValue={search.prefill_note ?? ""} />
          </div>
          <div className="flex items-end"><Button type="submit" disabled={adding} className="w-full"><Plus className="mr-1 h-4 w-4" /> Add</Button></div>
        </form>
      </CardContent></Card>
      <Card className="mt-6 border-border/60"><CardContent className="p-0">
        {expenses.length === 0 ? <div className="p-10 text-center text-muted-foreground">No expenses yet. Add your first above.</div> : (
          <ul className="divide-y divide-border">
            {expenses.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-3 p-4 transition-colors active:bg-muted/60">
                <div className="min-w-0">
                  <div className="truncate font-medium">{e.note || e.category}</div>
                  <div className="text-xs text-muted-foreground">{new Date(e.occurred_at).toLocaleString("en-IN")} · {e.category}</div>
                </div>
                <div className="text-right">
                  <div className="font-display text-lg">{formatMoney(Number(e.amount), e.currency)}</div>
                  {e.currency !== "INR" && <div className="text-xs text-muted-foreground">≈ {formatINR(convertToINR(Number(e.amount), e.currency, rates.rates))}</div>}
                </div>
                <Button variant="ghost" size="icon" onClick={async () => {
                  if (!confirm("Delete this expense?")) return;
                  await deleteExpense({ data: { id: e.id } });
                  await qc.invalidateQueries({ queryKey: ["expenses"] });
                }}><Trash2 className="h-4 w-4 text-muted-foreground" /></Button>
                <Button variant="ghost" size="icon" onClick={() => setEditing({
                  id: e.id, amount: Number(e.amount), currency: e.currency,
                  category: e.category, note: e.note ?? "",
                })}><Pencil className="h-4 w-4 text-muted-foreground" /></Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent></Card>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit expense</DialogTitle></DialogHeader>
          {editing && (
            <form
              className="grid gap-3"
              onSubmit={async (ev) => {
                ev.preventDefault();
                setSaving(true);
                try {
                  await updateExpense({ data: { ...editing, amount: Number(editing.amount) } });
                  await qc.invalidateQueries({ queryKey: ["expenses"] });
                  toast.success("Expense updated");
                  setEditing(null);
                } catch (err) { toast.error(err instanceof Error ? err.message : "Failed"); }
                finally { setSaving(false); }
              }}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5"><Label>Currency</Label>
                  <Select value={editing.currency} onValueChange={(v) => setEditing({ ...editing, currency: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CURRENCIES.map((c) => <SelectItem key={c.code} value={c.code}>{c.symbol} {c.code}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5"><Label>Amount</Label>
                  <Input type="number" step="0.01" min="0" value={editing.amount}
                    onChange={(ev) => setEditing({ ...editing, amount: Number(ev.target.value) })} />
                </div>
              </div>
              <div className="space-y-1.5"><Label>Category</Label>
                <Select
                  value={editing.category}
                  onValueChange={(v) => setEditing({ ...editing, category: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-72">
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Note</Label>
                <Input value={editing.note} maxLength={280}
                  onChange={(ev) => setEditing({ ...editing, note: ev.target.value })} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
                <Button type="submit" disabled={saving}>Save changes</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}