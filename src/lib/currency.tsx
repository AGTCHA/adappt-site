"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type CurrencyCode = "USD" | "EUR" | "MKD";

export const CURRENCIES: Record<
  CurrencyCode,
  { label: string; symbol: string; locale: string; fractionDigits: number }
> = {
  USD: { label: "US Dollar", symbol: "$", locale: "en-US", fractionDigits: 2 },
  EUR: { label: "Euro", symbol: "€", locale: "de-DE", fractionDigits: 2 },
  MKD: { label: "Macedonian Denar", symbol: "ден", locale: "mk-MK", fractionDigits: 0 },
};

// Fallback rates per 1 USD (mid-market, ~Jun 2026). Live rates override these.
const FALLBACK_RATES: Record<CurrencyCode, number> = {
  USD: 1,
  EUR: 0.88,
  MKD: 53.0,
};

const STORAGE_CURRENCY = "budget_currency";
const STORAGE_RATES = "budget_rates_v1";
const RATES_TTL_MS = 1000 * 60 * 60 * 12; // refresh twice a day

type Rates = Record<CurrencyCode, number>;

type CurrencyContextValue = {
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
  rates: Rates;
  ratesUpdated: number | null;
  isLive: boolean;
  /** Format a USD base amount in the selected display currency. */
  format: (amountUsd: number) => string;
  /** Format compactly (e.g. for chart axes) in the selected currency. */
  formatCompact: (amountUsd: number) => string;
  /** Convert a USD base amount into the selected display currency value. */
  toDisplay: (amountUsd: number) => number;
  /** Convert a value entered in the selected currency back to USD base. */
  toUsd: (amountInCurrency: number) => number;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>("USD");
  const [rates, setRates] = useState<Rates>(FALLBACK_RATES);
  const [ratesUpdated, setRatesUpdated] = useState<number | null>(null);
  const [isLive, setIsLive] = useState(false);

  // Load persisted preferences on mount
  useEffect(() => {
    try {
      const savedCur = localStorage.getItem(STORAGE_CURRENCY) as CurrencyCode | null;
      if (savedCur && savedCur in CURRENCIES) setCurrencyState(savedCur);

      const cached = localStorage.getItem(STORAGE_RATES);
      if (cached) {
        const parsed = JSON.parse(cached) as { rates: Rates; ts: number };
        if (parsed.rates) {
          setRates({ ...FALLBACK_RATES, ...parsed.rates });
          setRatesUpdated(parsed.ts);
          setIsLive(true);
        }
        if (Date.now() - parsed.ts < RATES_TTL_MS) return; // still fresh
      }
    } catch {
      /* ignore */
    }
    void fetchRates();
  }, []);

  async function fetchRates() {
    try {
      const res = await fetch("https://open.er-api.com/v6/latest/USD");
      if (!res.ok) return;
      const data = (await res.json()) as { rates?: Record<string, number> };
      if (!data.rates) return;
      const next: Rates = {
        USD: 1,
        EUR: data.rates.EUR ?? FALLBACK_RATES.EUR,
        MKD: data.rates.MKD ?? FALLBACK_RATES.MKD,
      };
      const ts = Date.now();
      setRates(next);
      setRatesUpdated(ts);
      setIsLive(true);
      localStorage.setItem(STORAGE_RATES, JSON.stringify({ rates: next, ts }));
    } catch {
      /* keep fallback */
    }
  }

  const setCurrency = (c: CurrencyCode) => {
    setCurrencyState(c);
    try {
      localStorage.setItem(STORAGE_CURRENCY, c);
    } catch {
      /* ignore */
    }
  };

  const value = useMemo<CurrencyContextValue>(() => {
    const rate = rates[currency] ?? FALLBACK_RATES[currency];
    const meta = CURRENCIES[currency];

    const format = (amountUsd: number) =>
      new Intl.NumberFormat(meta.locale, {
        style: "currency",
        currency,
        minimumFractionDigits: meta.fractionDigits,
        maximumFractionDigits: meta.fractionDigits,
      }).format(amountUsd * rate);

    const formatCompact = (amountUsd: number) => {
      const v = amountUsd * rate;
      const abs = Math.abs(v);
      if (abs >= 1000) {
        return `${meta.symbol}${(v / 1000).toFixed(1)}k`;
      }
      return `${meta.symbol}${v.toFixed(0)}`;
    };

    return {
      currency,
      setCurrency,
      rates,
      ratesUpdated,
      isLive,
      format,
      formatCompact,
      toDisplay: (amountUsd: number) => amountUsd * rate,
      toUsd: (amountInCurrency: number) => amountInCurrency / rate,
    };
  }, [currency, rates, ratesUpdated, isLive]);

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return ctx;
}
