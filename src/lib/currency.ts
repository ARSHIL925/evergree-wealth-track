export const CURRENCIES = [
  { code: "INR", symbol: "₹", label: "Indian Rupee" },
  { code: "USD", symbol: "$", label: "US Dollar" },
  { code: "EUR", symbol: "€", label: "Euro" },
  { code: "GBP", symbol: "£", label: "British Pound" },
  { code: "AED", symbol: "د.إ", label: "UAE Dirham" },
  { code: "JPY", symbol: "¥", label: "Japanese Yen" },
  { code: "SGD", symbol: "S$", label: "Singapore Dollar" },
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number]["code"];

export function formatMoney(amount: number, code: string = "INR") {
  const locale = code === "INR" ? "en-IN" : "en-US";
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency: code, maximumFractionDigits: 2 }).format(amount);
  } catch {
    return `${code} ${amount.toFixed(2)}`;
  }
}

/** Quick INR formatter using lakh/crore grouping. */
export function formatINR(amount: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(amount);
}