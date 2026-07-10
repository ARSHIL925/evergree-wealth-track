import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Delete, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatINR } from "@/lib/currency";

export const Route = createFileRoute("/_authenticated/calculator")({
  head: () => ({ meta: [{ title: "Calculator — Evergreen" }, { name: "robots", content: "noindex" }] }),
  errorComponent: ({ error }) => <div className="p-8 text-destructive">{error.message}</div>,
  notFoundComponent: () => <div className="p-8">Not found</div>,
  component: CalcPage,
});

function CalcPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <header className="mb-8">
        <p className="text-sm font-medium uppercase tracking-widest text-primary">Calculator</p>
        <h1 className="mt-1 font-display text-3xl">Crunch the numbers.</h1>
      </header>
      <Tabs defaultValue="basic">
        <TabsList className="grid w-full grid-cols-2"><TabsTrigger value="basic">Basic</TabsTrigger><TabsTrigger value="sip">SIP / Compound</TabsTrigger></TabsList>
        <TabsContent value="basic"><BasicCalc /></TabsContent>
        <TabsContent value="sip"><SipCalc /></TabsContent>
      </Tabs>
    </div>
  );
}

function BasicCalc() {
  const [expr, setExpr] = useState("");
  const [result, setResult] = useState<number | null>(null);
  const nav = useNavigate();
  const press = (k: string) => setExpr((e) => e + k);
  const clear = () => { setExpr(""); setResult(null); };
  const back = () => setExpr((e) => e.slice(0, -1));
  const equals = () => {
    try {
      const v = safeEvaluate(expr);
      setResult(Number.isFinite(v) ? v : null);
    } catch { setResult(null); }
  };
  const keys = ["7","8","9","/","4","5","6","*","1","2","3","-",".","0","%","+"];
  return (
    <Card className="mt-4 border-border/60"><CardContent className="p-6">
      <Input value={expr} onChange={(e) => setExpr(e.target.value)} placeholder="0" className="h-14 text-right font-display text-2xl" />
      {result !== null && <div className="mt-2 text-right font-display text-3xl text-primary">= {result.toLocaleString("en-IN")}</div>}
      <div className="mt-4 grid grid-cols-4 gap-2">
        {keys.map((k) => <Button key={k} type="button" variant="outline" onClick={() => press(k)} className="h-14 text-lg">{k}</Button>)}
        <Button type="button" variant="secondary" onClick={back} className="h-14"><Delete className="h-4 w-4" /></Button>
        <Button type="button" variant="secondary" onClick={clear} className="h-14">C</Button>
        <Button type="button" onClick={equals} className="col-span-2 h-14 text-lg">=</Button>
      </div>
      <Button type="button" className="mt-4 w-full" variant="outline" disabled={result === null}
        onClick={() => result !== null && nav({ to: "/expenses", search: { prefill_amount: Number(result.toFixed(2)), prefill_note: `From calculator: ${expr}` } })}
      ><Plus className="mr-1 h-4 w-4" /> Add result as expense</Button>
    </CardContent></Card>
  );
}

/**
 * Safe arithmetic evaluator (shunting-yard + RPN).
 * Supports + - * / % and parentheses on numeric input only.
 * No JS engine evaluation — cannot execute arbitrary code.
 */
function safeEvaluate(input: string): number {
  const src = input.trim();
  if (!src) throw new Error("empty");
  if (!/^[\d+\-*/(). %]+$/.test(src)) throw new Error("invalid characters");

  type Tok = { t: "num"; v: number } | { t: "op"; v: string } | { t: "("; } | { t: ")"; };
  const tokens: Tok[] = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === " ") { i++; continue; }
    if (c === "(") { tokens.push({ t: "(" }); i++; continue; }
    if (c === ")") { tokens.push({ t: ")" }); i++; continue; }
    if ("+-*/%".includes(c)) {
      // unary minus / plus
      const prev = tokens[tokens.length - 1];
      const isUnary = !prev || (prev as { t: string }).t === "op" || (prev as { t: string }).t === "(";
      if ((c === "-" || c === "+") && isUnary) {
        tokens.push({ t: "num", v: 0 });
      }
      tokens.push({ t: "op", v: c });
      i++;
      continue;
    }
    if (/[\d.]/.test(c)) {
      let j = i;
      while (j < src.length && /[\d.]/.test(src[j])) j++;
      const n = Number(src.slice(i, j));
      if (!Number.isFinite(n)) throw new Error("bad number");
      tokens.push({ t: "num", v: n });
      i = j;
      continue;
    }
    throw new Error("unexpected char");
  }

  const prec: Record<string, number> = { "+": 1, "-": 1, "*": 2, "/": 2, "%": 2 };
  const out: Tok[] = [];
  const ops: Tok[] = [];
  for (const tok of tokens) {
    if (tok.t === "num") out.push(tok);
    else if (tok.t === "op") {
      while (ops.length) {
        const top = ops[ops.length - 1];
        if (top.t === "op" && prec[top.v] >= prec[tok.v]) out.push(ops.pop()!);
        else break;
      }
      ops.push(tok);
    } else if (tok.t === "(") ops.push(tok);
    else if (tok.t === ")") {
      while (ops.length && ops[ops.length - 1].t !== "(") out.push(ops.pop()!);
      if (!ops.length) throw new Error("mismatched paren");
      ops.pop();
    }
  }
  while (ops.length) {
    const t = ops.pop()!;
    if (t.t === "(" || t.t === ")") throw new Error("mismatched paren");
    out.push(t);
  }

  const stack: number[] = [];
  for (const tok of out) {
    if (tok.t === "num") stack.push(tok.v);
    else if (tok.t === "op") {
      const b = stack.pop();
      const a = stack.pop();
      if (a === undefined || b === undefined) throw new Error("bad expr");
      switch (tok.v) {
        case "+": stack.push(a + b); break;
        case "-": stack.push(a - b); break;
        case "*": stack.push(a * b); break;
        case "/": stack.push(b === 0 ? NaN : a / b); break;
        case "%": stack.push(a * (b / 100)); break;
        default: throw new Error("bad op");
      }
    }
  }
  if (stack.length !== 1) throw new Error("bad expr");
  return stack[0];
}

function SipCalc() {
  const [monthly, setMonthly] = useState(5000);
  const [years, setYears] = useState(10);
  const [rate, setRate] = useState(12);
  const n = years * 12;
  const r = rate / 100 / 12;
  const fv = r === 0 ? monthly * n : monthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
  const invested = monthly * n;
  return (
    <Card className="mt-4 border-border/60"><CardContent className="space-y-4 p-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Monthly investment (₹)" value={monthly} onChange={setMonthly} />
        <Field label="Duration (years)" value={years} onChange={setYears} />
        <Field label="Expected return (%)" value={rate} onChange={setRate} step="0.1" />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Invested" value={formatINR(invested)} />
        <Stat label="Future value" value={formatINR(fv)} highlight />
        <Stat label="Returns" value={formatINR(fv - invested)} />
      </div>
    </CardContent></Card>
  );
}
function Field({ label, value, onChange, step = "1" }: { label: string; value: number; onChange: (n: number) => void; step?: string }) {
  // Show the typed string (without forcing a leading zero), but always emit a number.
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input
        type="number"
        step={step}
        min="0"
        value={value === 0 ? "" : String(value)}
        placeholder="0"
        onChange={(e) => {
          const raw = e.target.value.replace(/^0+(?=\d)/, "");
          onChange(raw === "" ? 0 : Number(raw) || 0);
        }}
      />
    </div>
  );
}
function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (<div className={`rounded-xl p-4 ${highlight ? "bg-primary/10 text-primary" : "bg-muted/60"}`}>
    <div className="text-xs text-muted-foreground">{label}</div>
    <div className="mt-1 font-display text-xl">{value}</div></div>);
}