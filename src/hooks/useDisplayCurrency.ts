import { useEffect, useState } from "react";
import { formatMoney } from "@/lib/currency";
import { convertToINR } from "@/lib/currency.functions";

const KEY = "evergreen_base_currency";
const EVT = "evergreen:base-currency";

export function getStoredBaseCurrency(): string {
  if (typeof window === "undefined") return "INR";
  return localStorage.getItem(KEY) || "INR";
}

export function setStoredBaseCurrency(code: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, code);
  window.dispatchEvent(new CustomEvent(EVT, { detail: code }));
}

/**
 * Reactive display-currency preference. Falls back to INR.
 * All amounts in the app are stored/aggregated in INR; this hook returns
 * a `format(inr)` helper that converts to the user's chosen currency.
 */
export function useDisplayCurrency(rates: Record<string, number> | undefined) {
  const [code, setCode] = useState<string>(() => getStoredBaseCurrency());

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY && e.newValue) setCode(e.newValue);
    };
    const onCustom = (e: Event) => {
      const detail = (e as CustomEvent).detail as string | undefined;
      if (detail) setCode(detail);
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener(EVT, onCustom as EventListener);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(EVT, onCustom as EventListener);
    };
  }, []);

  const format = (inr: number) => {
    if (!rates || code === "INR") return formatMoney(inr, "INR");
    const rate = rates[code];
    if (!rate) return formatMoney(inr, "INR");
    return formatMoney(inr * rate, code);
  };

  const fromCurrency = (amount: number, currency: string) => {
    const inr = convertToINR(amount, currency, rates ?? {});
    return format(inr);
  };

  return { code, setCode: setStoredBaseCurrency, format, fromCurrency };
}
