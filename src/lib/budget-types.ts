export const EXPENSE_CATEGORIES = [
  "Housing",
  "Utilities",
  "Groceries",
  "Transport",
  "Insurance",
  "Healthcare",
  "Childcare",
  "Education",
  "Entertainment",
  "Dining Out",
  "Shopping",
  "Subscriptions",
  "Savings",
  "Other",
] as const;

export const PERSON_OPTIONS = [
  { value: "osler", label: "Osler" },
  { value: "wife", label: "Wife" },
  { value: "joint", label: "Joint / Family" },
] as const;

export const FREQUENCY_OPTIONS = [
  { value: "monthly", label: "Monthly" },
  { value: "weekly", label: "Weekly" },
  { value: "yearly", label: "Yearly" },
  { value: "one-time", label: "One-time" },
] as const;

export type Income = {
  id: number;
  label: string;
  amount: number;
  person: string;
  frequency: string;
  createdAt: string;
};

export type Expense = {
  id: number;
  label: string;
  amount: number;
  category: string;
  person: string;
  date: string;
  isRecurring: boolean;
  createdAt: string;
};

export type SavingsGoal = {
  id: number;
  name: string;
  target: number;
  saved: number;
  createdAt: string;
  updatedAt: string;
};

export type BudgetSummary = {
  totalIncome: number;
  totalExpenses: number;
  recurringExpenses: number;
  oneTimeExpenses: number;
  savings: number;
  savingsRate: number;
  incomeByPerson: Record<string, number>;
  expensesByCategory: Record<string, number>;
  expensesByPerson: Record<string, number>;
  incomeCount: number;
  expenseCount: number;
};

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatCurrencyCompact(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function frequencyLabel(frequency: string) {
  return FREQUENCY_OPTIONS.find((f) => f.value === frequency)?.label ?? frequency;
}

export function personLabel(person: string) {
  return PERSON_OPTIONS.find((p) => p.value === person)?.label ?? person;
}

export function monthlyAmount(amount: number, frequency: string) {
  switch (frequency) {
    case "weekly":
      return amount * 4.33;
    case "yearly":
      return amount / 12;
    case "one-time":
      return amount;
    default:
      return amount;
  }
}

export const CHART_COLORS = [
  "#1e90ff",
  "#06b6d4",
  "#8b5cf6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
  "#6366f1",
  "#14b8a6",
  "#f97316",
];
