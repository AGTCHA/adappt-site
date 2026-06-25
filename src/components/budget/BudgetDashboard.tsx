"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  FiPlus,
  FiTrash2,
  FiLogOut,
  FiTrendingUp,
  FiTrendingDown,
  FiDollarSign,
  FiPieChart,
} from "react-icons/fi";
import BudgetCharts from "@/components/budget/BudgetCharts";
import {
  EXPENSE_CATEGORIES,
  FREQUENCY_OPTIONS,
  PERSON_OPTIONS,
  formatCurrency,
  monthlyAmount,
  personLabel,
  type BudgetSummary,
  type Expense,
  type Income,
} from "@/lib/budget-types";

type Tab = "overview" | "income" | "expenses";

const inputClass =
  "w-full h-11 px-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-all";

const selectClass =
  "w-full h-11 px-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-all appearance-none cursor-pointer";

export default function BudgetDashboard() {
  const [tab, setTab] = useState<Tab>("overview");
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<BudgetSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const [incomeForm, setIncomeForm] = useState({
    label: "",
    amount: "",
    person: "osler",
    frequency: "monthly",
  });

  const [expenseForm, setExpenseForm] = useState({
    label: "",
    amount: "",
    category: "Groceries",
    person: "joint",
    isRecurring: true,
  });

  const fetchAll = useCallback(async () => {
    const [incRes, expRes, sumRes] = await Promise.all([
      fetch("/api/budget/income"),
      fetch("/api/budget/expenses"),
      fetch("/api/budget/summary"),
    ]);

    if (incRes.ok) setIncomes(await incRes.json());
    if (expRes.ok) setExpenses(await expRes.json());
    if (sumRes.ok) setSummary(await sumRes.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  async function handleLogout() {
    await fetch("/api/auth/login", { method: "DELETE" });
    window.location.href = "/login";
  }

  async function addIncome(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/budget/income", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label: incomeForm.label,
        amount: parseFloat(incomeForm.amount),
        person: incomeForm.person,
        frequency: incomeForm.frequency,
      }),
    });
    if (res.ok) {
      setIncomeForm({ label: "", amount: "", person: "osler", frequency: "monthly" });
      fetchAll();
    }
  }

  async function addExpense(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/budget/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label: expenseForm.label,
        amount: parseFloat(expenseForm.amount),
        category: expenseForm.category,
        person: expenseForm.person,
        isRecurring: expenseForm.isRecurring,
      }),
    });
    if (res.ok) {
      setExpenseForm({
        label: "",
        amount: "",
        category: "Groceries",
        person: "joint",
        isRecurring: true,
      });
      fetchAll();
    }
  }

  async function deleteIncome(id: number) {
    await fetch(`/api/budget/income?id=${id}`, { method: "DELETE" });
    fetchAll();
  }

  async function deleteExpense(id: number) {
    await fetch(`/api/budget/expenses?id=${id}`, { method: "DELETE" });
    fetchAll();
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-72px)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
          <p className="text-white/40 text-sm">Loading your budget…</p>
        </div>
      </div>
    );
  }

  const savingsPositive = (summary?.savings ?? 0) >= 0;

  return (
    <div className="relative min-h-[calc(100vh-72px)]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-32 right-0 h-[500px] w-[500px] rounded-full bg-accent/5 blur-[120px]" />
        <div className="absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-accent-purple/5 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-10">
          <div>
            <span className="tag">Family Finance</span>
            <h1 className="mt-3 text-3xl md:text-4xl font-bold text-white tracking-tight">
              Hutson Budget Tracker
            </h1>
            <p className="mt-2 text-white/50">
              Track income, expenses, and savings for you and your family
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="btn-outline text-sm h-10 px-4">
              Portfolio
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 h-10 px-4 rounded-full border border-white/10 text-white/60 hover:text-white hover:border-white/20 text-sm transition-all"
            >
              <FiLogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </div>

        {/* Summary cards */}
        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            <SummaryCard
              icon={<FiTrendingUp className="w-5 h-5 text-emerald-400" />}
              label="Monthly Income"
              value={formatCurrency(summary.totalIncome)}
              sub={`${summary.incomeCount} source${summary.incomeCount !== 1 ? "s" : ""}`}
              accent="emerald"
            />
            <SummaryCard
              icon={<FiTrendingDown className="w-5 h-5 text-red-400" />}
              label="Total Expenses"
              value={formatCurrency(summary.totalExpenses)}
              sub={`${summary.expenseCount} payment${summary.expenseCount !== 1 ? "s" : ""}`}
              accent="red"
            />
            <SummaryCard
              icon={<FiDollarSign className="w-5 h-5 text-accent" />}
              label="Monthly Savings"
              value={formatCurrency(summary.savings)}
              sub={savingsPositive ? "You're in the green" : "Over budget"}
              accent={savingsPositive ? "blue" : "red"}
            />
            <SummaryCard
              icon={<FiPieChart className="w-5 h-5 text-accent-purple" />}
              label="Savings Rate"
              value={`${summary.savingsRate.toFixed(1)}%`}
              sub="Of total income"
              accent="purple"
            />
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-8 p-1 rounded-2xl bg-white/[0.03] border border-white/[0.06] w-fit">
          {(["overview", "income", "expenses"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium capitalize transition-all ${
                tab === t
                  ? "bg-white/[0.08] text-white shadow-sm"
                  : "text-white/50 hover:text-white/80"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === "overview" && summary && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <BudgetCharts summary={summary} />
          </motion.div>
        )}

        {tab === "income" && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-5 gap-6"
          >
            <form onSubmit={addIncome} className="glass rounded-2xl p-6 lg:col-span-2 h-fit space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <FiPlus className="text-accent-cyan" /> Add Income
              </h3>
              <input
                className={inputClass}
                placeholder="e.g. Salary, Freelance"
                value={incomeForm.label}
                onChange={(e) => setIncomeForm({ ...incomeForm, label: e.target.value })}
                required
              />
              <input
                className={inputClass}
                type="number"
                step="0.01"
                min="0"
                placeholder="Amount ($)"
                value={incomeForm.amount}
                onChange={(e) => setIncomeForm({ ...incomeForm, amount: e.target.value })}
                required
              />
              <select
                className={selectClass}
                value={incomeForm.person}
                onChange={(e) => setIncomeForm({ ...incomeForm, person: e.target.value })}
              >
                {PERSON_OPTIONS.map((p) => (
                  <option key={p.value} value={p.value} className="bg-[#111]">
                    {p.label}
                  </option>
                ))}
              </select>
              <select
                className={selectClass}
                value={incomeForm.frequency}
                onChange={(e) => setIncomeForm({ ...incomeForm, frequency: e.target.value })}
              >
                {FREQUENCY_OPTIONS.map((f) => (
                  <option key={f.value} value={f.value} className="bg-[#111]">
                    {f.label}
                  </option>
                ))}
              </select>
              <button type="submit" className="btn w-full">
                Add Income
              </button>
            </form>

            <div className="lg:col-span-3 space-y-3">
              {incomes.length === 0 ? (
                <EmptyState message="No income entries yet. Add your salary and other income sources." />
              ) : (
                incomes.map((inc) => (
                  <EntryRow
                    key={inc.id}
                    title={inc.label}
                    subtitle={`${personLabel(inc.person)} · ${inc.frequency}`}
                    amount={formatCurrency(monthlyAmount(inc.amount, inc.frequency))}
                    amountNote={`${formatCurrency(inc.amount)} ${inc.frequency}`}
                    onDelete={() => deleteIncome(inc.id)}
                    variant="income"
                  />
                ))
              )}
            </div>
          </motion.div>
        )}

        {tab === "expenses" && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-5 gap-6"
          >
            <form onSubmit={addExpense} className="glass rounded-2xl p-6 lg:col-span-2 h-fit space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <FiPlus className="text-red-400" /> Add Expense
              </h3>
              <input
                className={inputClass}
                placeholder="e.g. Rent, Netflix, Gas"
                value={expenseForm.label}
                onChange={(e) => setExpenseForm({ ...expenseForm, label: e.target.value })}
                required
              />
              <input
                className={inputClass}
                type="number"
                step="0.01"
                min="0"
                placeholder="Amount ($)"
                value={expenseForm.amount}
                onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                required
              />
              <select
                className={selectClass}
                value={expenseForm.category}
                onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
              >
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c} className="bg-[#111]">
                    {c}
                  </option>
                ))}
              </select>
              <select
                className={selectClass}
                value={expenseForm.person}
                onChange={(e) => setExpenseForm({ ...expenseForm, person: e.target.value })}
              >
                {PERSON_OPTIONS.map((p) => (
                  <option key={p.value} value={p.value} className="bg-[#111]">
                    {p.label}
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={expenseForm.isRecurring}
                  onChange={(e) =>
                    setExpenseForm({ ...expenseForm, isRecurring: e.target.checked })
                  }
                  className="w-4 h-4 rounded accent-accent"
                />
                <span className="text-sm text-white/60">Recurring monthly payment</span>
              </label>
              <button type="submit" className="btn w-full">
                Add Expense
              </button>
            </form>

            <div className="lg:col-span-3 space-y-3">
              {expenses.length === 0 ? (
                <EmptyState message="No expenses yet. Log your bills, subscriptions, and payments." />
              ) : (
                expenses.map((exp) => (
                  <EntryRow
                    key={exp.id}
                    title={exp.label}
                    subtitle={`${exp.category} · ${personLabel(exp.person)}${exp.isRecurring ? " · Recurring" : ""}`}
                    amount={formatCurrency(exp.amount)}
                    onDelete={() => deleteExpense(exp.id)}
                    variant="expense"
                  />
                ))
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  accent: "emerald" | "red" | "blue" | "purple";
}) {
  const borderColors = {
    emerald: "hover:border-emerald-500/20",
    red: "hover:border-red-500/20",
    blue: "hover:border-accent/20",
    purple: "hover:border-accent-purple/20",
  };

  return (
    <div
      className={`glass glass-hover rounded-2xl p-5 transition-all ${borderColors[accent]}`}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 rounded-xl bg-white/[0.04]">{icon}</div>
        <span className="text-sm text-white/50">{label}</span>
      </div>
      <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-white/35">{sub}</p>
    </div>
  );
}

function EntryRow({
  title,
  subtitle,
  amount,
  amountNote,
  onDelete,
  variant,
}: {
  title: string;
  subtitle: string;
  amount: string;
  amountNote?: string;
  onDelete: () => void;
  variant: "income" | "expense";
}) {
  return (
    <div className="glass rounded-xl px-5 py-4 flex items-center justify-between gap-4 group">
      <div className="min-w-0">
        <p className="text-white font-medium truncate">{title}</p>
        <p className="text-xs text-white/40 mt-0.5">{subtitle}</p>
      </div>
      <div className="flex items-center gap-4 shrink-0">
        <div className="text-right">
          <p
            className={`font-semibold ${variant === "income" ? "text-emerald-400" : "text-red-400"}`}
          >
            {variant === "income" ? "+" : "-"}{amount}
          </p>
          {amountNote && <p className="text-[10px] text-white/30">{amountNote}</p>}
        </div>
        <button
          onClick={onDelete}
          className="p-2 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
          aria-label="Delete"
        >
          <FiTrash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="glass rounded-2xl p-12 text-center">
      <p className="text-white/30 text-sm max-w-sm mx-auto">{message}</p>
    </div>
  );
}
