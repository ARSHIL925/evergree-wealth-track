import { createServerFn } from "@tanstack/react-start";

type RatesPayload = { base: string; rates: Record<string, number>; fetched_at: string };

let cache: { at: number; data: RatesPayload } | null = null;
const TTL = 1000 * 60 * 60; // 1h — keep rates fresh

export const getRates = createServerFn({ method: "GET" }).handler(async (): Promise<RatesPayload> => {
  if (cache && Date.now() - cache.at < TTL) return cache.data;
  const sources = [
    "https://open.er-api.com/v6/latest/INR",
    "https://api.exchangerate.host/latest?base=INR",
  ];
  for (const url of sources) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const json = (await res.json()) as { base?: string; base_code?: string; rates?: Record<string, number> };
      const rates = json.rates ?? {};
      if (!rates.USD) continue;
      const data: RatesPayload = {
        base: json.base || json.base_code || "INR",
        rates,
        fetched_at: new Date().toISOString(),
      };
      cache = { at: Date.now(), data };
      return data;
    } catch { /* try next */ }
  }
  {
    // graceful fallback — static approx rates
    const data: RatesPayload = {
      base: "INR",
      rates: { INR: 1, USD: 0.012, EUR: 0.011, GBP: 0.0094, AED: 0.044, JPY: 1.83, SGD: 0.016 },
      fetched_at: new Date().toISOString(),
    };
    cache = { at: Date.now(), data };
    return data;
  }
});

/** Convert any currency amount to INR using rates with INR as base. */
export function convertToINR(amount: number, fromCurrency: string, rates: Record<string, number>): number {
  if (fromCurrency === "INR") return amount;
  const r = rates[fromCurrency];
  if (!r) return amount;
  return amount / r;
}