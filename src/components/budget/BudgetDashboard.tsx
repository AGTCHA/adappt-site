"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  FiPlus,
  FiTrash2,
  FiLogOut,
  FiTrendingUp,
  FiTrendingDown,
  FiDollarSign,
  FiPieChart,
  FiX,
  FiArrowUp,
  FiArrowDown,
  FiRepeat,
  FiEdit2,
  FiDownload,
  FiTarget,
} from "react-icons/fi";
import BudgetCharts from "@/components/budget/BudgetCharts";
import {
  EXPENSE_CATEGORIES,
  FREQUENCY_OPTIONS,
  PERSON_OPTIONS,
  formatDate,
  frequencyLabel,
  monthlyAmount,
  personLabel,
  type BudgetSummary,
  type Expense,
  type Income,
  type SavingsGoal,
} from "@/lib/budget-types";
import { CURRENCIES, useCurrency, type CurrencyCode } from "@/lib/currency";

type Tab = "overview" | "income" | "expenses" | "goals";
type ModalKind = null | "income" | "expense" | "goal" | "contribute";

type SortKey = "date" | "amount" | "label";
type SortDir = "asc" | "desc";

const inputClass =
  "w-full h-11 px-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-all";

const selectClass =
  "w-full h-11 px-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-all appearance-none cursor-pointer";

const labelClass = "block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wide";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function csvEscape(value: string | number) {
  const s = String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export default function BudgetDashboard() {
  const { currency, setCurrency, format, toUsd, toDisplay, isLive, rates } = useCurrency();

  const [tab, setTab] = useState<Tab>("overview");
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [summary, setSummary] = useState<BudgetSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [modal, setModal] = useState<ModalKind>(null);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [contributeGoal, setContributeGoal] = useState<SavingsGoal | null>(null);

  const [expSort, setExpSort] = useState<{ key: SortKey; dir: SortDir }>({
    key: "date",
    dir: "desc",
  });
  const [monthFilter, setMonthFilter] = useState<string>("all");

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
    isRecurring: false,
    date: todayISO(),
  });
  const [goalForm, setGoalForm] = useState({ name: "", target: "", saved: "" });
  const [contributeAmount, setContributeAmount] = useState("");

  const fetchAll = useCallback(async () => {
    const [incRes, expRes, goalRes, sumRes] = await Promise.all([
      fetch("/api/budget/income"),
      fetch("/api/budget/expenses"),
      fetch("/api/budget/goals"),
      fetch("/api/budget/summary"),
    ]);
    if (incRes.ok) setIncomes(await incRes.json());
    if (expRes.ok) setExpenses(await expRes.json());
    if (goalRes.ok) setGoals(await goalRes.json());
    if (sumRes.ok) setSummary(await sumRes.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  function closeModal() {
    setModal(null);
    setEditingIncome(null);
    setEditingExpense(null);
    setEditingGoal(null);
    setContributeGoal(null);
  }

  async function handleLogout() {
    await fetch("/api/auth/login", { method: "DELETE" });
    window.location.href = "/login";
  }

  // ---- Income ----
  function openAddIncome() {
    setEditingIncome(null);
    setIncomeForm({ label: "", amount: "", person: "osler", frequency: "monthly" });
    setModal("income");
  }
  function openEditIncome(inc: Income) {
    setEditingIncome(inc);
    setIncomeForm({
      label: inc.label,
      amount: String(Number(toDisplay(inc.amount).toFixed(2))),
      person: inc.person,
      frequency: inc.frequency,
    });
    setModal("income");
  }
  async function submitIncome(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      label: incomeForm.label,
      amount: toUsd(parseFloat(incomeForm.amount)),
      person: incomeForm.person,
      frequency: incomeForm.frequency,
    };
    const res = editingIncome
      ? await fetch("/api/budget/income", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingIncome.id, ...payload }),
        })
      : await fetch("/api/budget/income", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
    setSaving(false);
    if (res.ok) {
      closeModal();
      fetchAll();
    }
  }
  async function deleteIncome(id: number) {
    await fetch(`/api/budget/income?id=${id}`, { method: "DELETE" });
    fetchAll();
  }

  // ---- Expense ----
  function openAddExpense() {
    setEditingExpense(null);
    setExpenseForm({
      label: "",
      amount: "",
      category: "Groceries",
      person: "joint",
      isRecurring: false,
      date: todayISO(),
    });
    setModal("expense");
  }
  function openEditExpense(exp: Expense) {
    setEditingExpense(exp);
    setExpenseForm({
      label: exp.label,
      amount: String(Number(toDisplay(exp.amount).toFixed(2))),
      category: exp.category,
      person: exp.person,
      isRecurring: exp.isRecurring,
      date: exp.date.slice(0, 10),
    });
    setModal("expense");
  }
  async function submitExpense(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      label: expenseForm.label,
      amount: toUsd(parseFloat(expenseForm.amount)),
      category: expenseForm.category,
      person: expenseForm.person,
      isRecurring: expenseForm.isRecurring,
      date: expenseForm.date,
    };
    const res = editingExpense
      ? await fetch("/api/budget/expenses", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingExpense.id, ...payload }),
        })
      : await fetch("/api/budget/expenses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
    setSaving(false);
    if (res.ok) {
      closeModal();
      fetchAll();
    }
  }
  async function deleteExpense(id: number) {
    await fetch(`/api/budget/expenses?id=${id}`, { method: "DELETE" });
    fetchAll();
  }

  // ---- Goals ----
  function openAddGoal() {
    setEditingGoal(null);
    setGoalForm({ name: "", target: "", saved: "" });
    setModal("goal");
  }
  function openEditGoal(goal: SavingsGoal) {
    setEditingGoal(goal);
    setGoalForm({
      name: goal.name,
      target: String(Number(toDisplay(goal.target).toFixed(2))),
      saved: String(Number(toDisplay(goal.saved).toFixed(2))),
    });
    setModal("goal");
  }
  async function submitGoal(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      name: goalForm.name,
      target: toUsd(parseFloat(goalForm.target)),
      saved: goalForm.saved ? toUsd(parseFloat(goalForm.saved)) : 0,
    };
    const res = editingGoal
      ? await fetch("/api/budget/goals", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingGoal.id, ...payload }),
        })
      : await fetch("/api/budget/goals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
    setSaving(false);
    if (res.ok) {
      closeModal();
      fetchAll();
    }
  }
  function openContribute(goal: SavingsGoal) {
    setContributeGoal(goal);
    setContributeAmount("");
    setModal("contribute");
  }
  async function submitContribute(e: React.FormEvent) {
    e.preventDefault();
    if (!contributeGoal) return;
    setSaving(true);
    const addUsd = toUsd(parseFloat(contributeAmount));
    const res = await fetch("/api/budget/goals", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: contributeGoal.id,
        saved: contributeGoal.saved + addUsd,
      }),
    });
    setSaving(false);
    if (res.ok) {
      closeModal();
      fetchAll();
    }
  }
  async function deleteGoal(id: number) {
    await fetch(`/api/budget/goals?id=${id}`, { method: "DELETE" });
    fetchAll();
  }

  // ---- Derived ----
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    expenses.forEach((e) => set.add(e.date.slice(0, 7)));
    return Array.from(set).sort().reverse();
  }, [expenses]);

  const filteredSortedExpenses = useMemo(() => {
    let list = [...expenses];
    if (monthFilter !== "all") {
      list = list.filter((e) => e.date.slice(0, 7) === monthFilter);
    }
    list.sort((a, b) => {
      let cmp = 0;
      if (expSort.key === "amount") cmp = a.amount - b.amount;
      else if (expSort.key === "label") cmp = a.label.localeCompare(b.label);
      else cmp = new Date(a.date).getTime() - new Date(b.date).getTime();
      return expSort.dir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [expenses, monthFilter, expSort]);

  function toggleSort(key: SortKey) {
    setExpSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: key === "label" ? "asc" : "desc" },
    );
  }

  function exportCsv() {
    const cur = currency;
    const header = [
      "Type",
      "Date",
      "Description",
      "Category",
      "Person",
      "Frequency",
      "Recurring",
      "Amount (USD)",
      `Amount (${cur})`,
    ];
    const rows: (string | number)[][] = [];
    incomes.forEach((i) => {
      rows.push([
        "Income",
        i.createdAt.slice(0, 10),
        i.label,
        "",
        personLabel(i.person),
        frequencyLabel(i.frequency),
        "",
        i.amount.toFixed(2),
        toDisplay(i.amount).toFixed(2),
      ]);
    });
    expenses.forEach((e) => {
      rows.push([
        "Expense",
        e.date.slice(0, 10),
        e.label,
        e.category,
        personLabel(e.person),
        "",
        e.isRecurring ? "Yes" : "No",
        e.amount.toFixed(2),
        toDisplay(e.amount).toFixed(2),
      ]);
    });
    const csv = [header, ...rows]
      .map((r) => r.map(csvEscape).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hutson-budget-${todayISO()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-8">
          <div>
            <span className="tag">Family Finance</span>
            <h1 className="mt-3 text-3xl md:text-4xl font-bold text-white tracking-tight">
              Hutson Budget Tracker
            </h1>
            <p className="mt-2 text-white/50">
              Track income, expenses, and savings for you and your family
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <CurrencySelect value={currency} onChange={setCurrency} isLive={isLive} rates={rates} />
            <button
              onClick={exportCsv}
              className="flex items-center gap-2 h-10 px-4 rounded-full border border-white/10 text-white/60 hover:text-white hover:border-white/20 text-sm transition-all"
              title="Export all transactions as CSV"
            >
              <FiDownload className="w-4 h-4" /> Export
            </button>
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

        {/* Primary actions */}
        <div className="flex flex-wrap gap-3 mb-8">
          <button
            onClick={openAddIncome}
            className="flex items-center gap-2 h-11 px-5 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 hover:bg-emerald-500/25 font-medium text-sm transition-all"
          >
            <FiPlus className="w-4 h-4" /> Add Income
          </button>
          <button
            onClick={openAddExpense}
            className="flex items-center gap-2 h-11 px-5 rounded-xl bg-red-500/15 border border-red-500/25 text-red-300 hover:bg-red-500/25 font-medium text-sm transition-all"
          >
            <FiPlus className="w-4 h-4" /> Add Expense / Payment
          </button>
          <button
            onClick={openAddGoal}
            className="flex items-center gap-2 h-11 px-5 rounded-xl bg-accent/15 border border-accent/25 text-accent hover:bg-accent/25 font-medium text-sm transition-all"
          >
            <FiTarget className="w-4 h-4" /> Add Savings Goal
          </button>
        </div>

        {/* Summary cards */}
        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            <SummaryCard
              icon={<FiTrendingUp className="w-5 h-5 text-emerald-400" />}
              label="Monthly Income"
              value={format(summary.totalIncome)}
              sub={`${summary.incomeCount} source${summary.incomeCount !== 1 ? "s" : ""}`}
              accent="emerald"
            />
            <SummaryCard
              icon={<FiTrendingDown className="w-5 h-5 text-red-400" />}
              label="Total Expenses"
              value={format(summary.totalExpenses)}
              sub={`${summary.expenseCount} payment${summary.expenseCount !== 1 ? "s" : ""}`}
              accent="red"
            />
            <SummaryCard
              icon={<FiDollarSign className="w-5 h-5 text-accent" />}
              label="Monthly Savings"
              value={format(summary.savings)}
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
        <div className="flex flex-wrap gap-1 mb-6 p-1 rounded-2xl bg-white/[0.03] border border-white/[0.06] w-fit">
          {(
            [
              ["overview", "Overview"],
              ["income", "Income"],
              ["expenses", "Expenses & Payments"],
              ["goals", "Savings Goals"],
            ] as [Tab, string][]
          ).map(([t, label]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                tab === t
                  ? "bg-white/[0.08] text-white shadow-sm"
                  : "text-white/50 hover:text-white/80"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Overview */}
        {tab === "overview" && summary && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <BudgetCharts summary={summary} />
          </motion.div>
        )}

        {/* Income */}
        {tab === "income" && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            {incomes.length === 0 ? (
              <EmptyState
                message="No income yet."
                actionLabel="Add Income"
                onAction={openAddIncome}
              />
            ) : (
              <div className="glass rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/[0.06] text-white/40 text-xs uppercase tracking-wide">
                        <Th>Source</Th>
                        <Th>Person</Th>
                        <Th>Frequency</Th>
                        <Th className="text-right">Amount</Th>
                        <Th className="text-right">Monthly equiv.</Th>
                        <Th className="text-right">Actions</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {incomes.map((inc) => (
                        <tr
                          key={inc.id}
                          className="border-b border-white/[0.04] hover:bg-white/[0.02] group"
                        >
                          <Td className="font-medium text-white">{inc.label}</Td>
                          <Td className="text-white/60">{personLabel(inc.person)}</Td>
                          <Td className="text-white/60">{frequencyLabel(inc.frequency)}</Td>
                          <Td className="text-right text-white/80">{format(inc.amount)}</Td>
                          <Td className="text-right font-semibold text-emerald-400">
                            {format(monthlyAmount(inc.amount, inc.frequency))}
                          </Td>
                          <Td className="text-right">
                            <RowActions
                              onEdit={() => openEditIncome(inc)}
                              onDelete={() => deleteIncome(inc.id)}
                            />
                          </Td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Expenses */}
        {tab === "expenses" && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            {expenses.length === 0 ? (
              <EmptyState
                message="No expenses or payments logged yet."
                actionLabel="Add Expense"
                onAction={openAddExpense}
              />
            ) : (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <label className="text-sm text-white/50">Month</label>
                  <select
                    className="h-9 px-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-accent/40 cursor-pointer"
                    value={monthFilter}
                    onChange={(e) => setMonthFilter(e.target.value)}
                  >
                    <option value="all" className="bg-[#111]">
                      All months
                    </option>
                    {availableMonths.map((m) => (
                      <option key={m} value={m} className="bg-[#111]">
                        {new Date(m + "-01").toLocaleDateString("en-US", {
                          month: "long",
                          year: "numeric",
                        })}
                      </option>
                    ))}
                  </select>
                  <span className="text-xs text-white/30">
                    {filteredSortedExpenses.length} payment
                    {filteredSortedExpenses.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="glass rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/[0.06] text-white/40 text-xs uppercase tracking-wide">
                          <SortableTh
                            label="Date"
                            active={expSort.key === "date"}
                            dir={expSort.dir}
                            onClick={() => toggleSort("date")}
                          />
                          <SortableTh
                            label="Description"
                            active={expSort.key === "label"}
                            dir={expSort.dir}
                            onClick={() => toggleSort("label")}
                          />
                          <Th>Category</Th>
                          <Th>Person</Th>
                          <Th>Type</Th>
                          <SortableTh
                            label="Amount"
                            align="right"
                            active={expSort.key === "amount"}
                            dir={expSort.dir}
                            onClick={() => toggleSort("amount")}
                          />
                          <Th className="text-right">Actions</Th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSortedExpenses.map((exp) => (
                          <tr
                            key={exp.id}
                            className="border-b border-white/[0.04] hover:bg-white/[0.02] group"
                          >
                            <Td className="text-white/60 whitespace-nowrap">
                              {formatDate(exp.date)}
                            </Td>
                            <Td className="font-medium text-white">{exp.label}</Td>
                            <Td>
                              <span className="inline-block px-2 py-0.5 rounded-md bg-white/[0.05] text-white/60 text-xs">
                                {exp.category}
                              </span>
                            </Td>
                            <Td className="text-white/60">{personLabel(exp.person)}</Td>
                            <Td>
                              {exp.isRecurring ? (
                                <span className="inline-flex items-center gap-1 text-accent-cyan text-xs">
                                  <FiRepeat className="w-3 h-3" /> Recurring
                                </span>
                              ) : (
                                <span className="text-white/40 text-xs">One-time</span>
                              )}
                            </Td>
                            <Td className="text-right font-semibold text-red-400 whitespace-nowrap">
                              -{format(exp.amount)}
                            </Td>
                            <Td className="text-right">
                              <RowActions
                                onEdit={() => openEditExpense(exp)}
                                onDelete={() => deleteExpense(exp.id)}
                              />
                            </Td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* Goals */}
        {tab === "goals" && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            {goals.length === 0 ? (
              <EmptyState
                message="No savings goals yet. Set a target like an emergency fund or a vacation."
                actionLabel="Add Savings Goal"
                onAction={openAddGoal}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {goals.map((goal) => {
                  const pct =
                    goal.target > 0
                      ? Math.min(100, (goal.saved / goal.target) * 100)
                      : 0;
                  const complete = pct >= 100;
                  return (
                    <div key={goal.id} className="glass rounded-2xl p-6 group">
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-white">{goal.name}</h3>
                          <p className="text-sm text-white/50 mt-0.5">
                            {format(goal.saved)} of {format(goal.target)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEditGoal(goal)}
                            className="p-2 rounded-lg text-white/30 hover:text-white hover:bg-white/[0.06] transition-all"
                            aria-label="Edit goal"
                          >
                            <FiEdit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteGoal(goal.id)}
                            className="p-2 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all"
                            aria-label="Delete goal"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="h-3 rounded-full bg-white/[0.05] overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            complete
                              ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
                              : "bg-gradient-to-r from-accent to-accent-cyan"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <span
                          className={`text-sm font-medium ${
                            complete ? "text-emerald-400" : "text-white/70"
                          }`}
                        >
                          {complete ? "Goal reached! 🎉" : `${pct.toFixed(0)}% funded`}
                        </span>
                        <button
                          onClick={() => openContribute(goal)}
                          className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-white/[0.05] border border-white/[0.08] text-white/70 hover:text-white hover:bg-white/[0.08] text-xs font-medium transition-all"
                        >
                          <FiPlus className="w-3.5 h-3.5" /> Add funds
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {modal === "income" && (
          <Modal
            title={editingIncome ? "Edit Income" : "Add Income"}
            onClose={closeModal}
          >
            <form onSubmit={submitIncome} className="space-y-4">
              <div>
                <label className={labelClass}>Source</label>
                <input
                  className={inputClass}
                  placeholder="e.g. Salary, Freelance, Rental"
                  value={incomeForm.label}
                  onChange={(e) => setIncomeForm({ ...incomeForm, label: e.target.value })}
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className={labelClass}>Amount ({CURRENCIES[currency].symbol} {currency})</label>
                <input
                  className={inputClass}
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={incomeForm.amount}
                  onChange={(e) => setIncomeForm({ ...incomeForm, amount: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Person</label>
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
                </div>
                <div>
                  <label className={labelClass}>Frequency</label>
                  <select
                    className={selectClass}
                    value={incomeForm.frequency}
                    onChange={(e) =>
                      setIncomeForm({ ...incomeForm, frequency: e.target.value })
                    }
                  >
                    {FREQUENCY_OPTIONS.map((f) => (
                      <option key={f.value} value={f.value} className="bg-[#111]">
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button type="submit" disabled={saving} className="btn w-full disabled:opacity-60">
                {saving ? "Saving…" : editingIncome ? "Save Changes" : "Add Income"}
              </button>
            </form>
          </Modal>
        )}

        {modal === "expense" && (
          <Modal
            title={editingExpense ? "Edit Expense" : "Add Expense / Payment"}
            onClose={closeModal}
          >
            <form onSubmit={submitExpense} className="space-y-4">
              <div>
                <label className={labelClass}>Description</label>
                <input
                  className={inputClass}
                  placeholder="e.g. Rent, Groceries, Netflix"
                  value={expenseForm.label}
                  onChange={(e) => setExpenseForm({ ...expenseForm, label: e.target.value })}
                  required
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>
                    Amount ({CURRENCIES[currency].symbol} {currency})
                  </label>
                  <input
                    className={inputClass}
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className={labelClass}>Date</label>
                  <input
                    className={inputClass}
                    type="date"
                    value={expenseForm.date}
                    onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Category</label>
                  <select
                    className={selectClass}
                    value={expenseForm.category}
                    onChange={(e) =>
                      setExpenseForm({ ...expenseForm, category: e.target.value })
                    }
                  >
                    {EXPENSE_CATEGORIES.map((c) => (
                      <option key={c} value={c} className="bg-[#111]">
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Person</label>
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
                </div>
              </div>
              <label className="flex items-center gap-3 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={expenseForm.isRecurring}
                  onChange={(e) =>
                    setExpenseForm({ ...expenseForm, isRecurring: e.target.checked })
                  }
                  className="w-4 h-4 rounded accent-accent"
                />
                <span className="text-sm text-white/60">
                  Recurring monthly payment (counts toward monthly budget)
                </span>
              </label>
              <button type="submit" disabled={saving} className="btn w-full disabled:opacity-60">
                {saving ? "Saving…" : editingExpense ? "Save Changes" : "Add Expense"}
              </button>
            </form>
          </Modal>
        )}

        {modal === "goal" && (
          <Modal
            title={editingGoal ? "Edit Savings Goal" : "Add Savings Goal"}
            onClose={closeModal}
          >
            <form onSubmit={submitGoal} className="space-y-4">
              <div>
                <label className={labelClass}>Goal name</label>
                <input
                  className={inputClass}
                  placeholder="e.g. Emergency Fund, Vacation, New Car"
                  value={goalForm.name}
                  onChange={(e) => setGoalForm({ ...goalForm, name: e.target.value })}
                  required
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>
                    Target ({CURRENCIES[currency].symbol})
                  </label>
                  <input
                    className={inputClass}
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={goalForm.target}
                    onChange={(e) => setGoalForm({ ...goalForm, target: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className={labelClass}>
                    Saved so far ({CURRENCIES[currency].symbol})
                  </label>
                  <input
                    className={inputClass}
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={goalForm.saved}
                    onChange={(e) => setGoalForm({ ...goalForm, saved: e.target.value })}
                  />
                </div>
              </div>
              <button type="submit" disabled={saving} className="btn w-full disabled:opacity-60">
                {saving ? "Saving…" : editingGoal ? "Save Changes" : "Add Goal"}
              </button>
            </form>
          </Modal>
        )}

        {modal === "contribute" && contributeGoal && (
          <Modal title={`Add funds to ${contributeGoal.name}`} onClose={closeModal}>
            <form onSubmit={submitContribute} className="space-y-4">
              <p className="text-sm text-white/50">
                Currently {format(contributeGoal.saved)} of {format(contributeGoal.target)} saved.
              </p>
              <div>
                <label className={labelClass}>
                  Amount to add ({CURRENCIES[currency].symbol} {currency})
                </label>
                <input
                  className={inputClass}
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={contributeAmount}
                  onChange={(e) => setContributeAmount(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <button type="submit" disabled={saving} className="btn w-full disabled:opacity-60">
                {saving ? "Saving…" : "Add Funds"}
              </button>
            </form>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

function CurrencySelect({
  value,
  onChange,
  isLive,
  rates,
}: {
  value: CurrencyCode;
  onChange: (c: CurrencyCode) => void;
  isLive: boolean;
  rates: Record<CurrencyCode, number>;
}) {
  return (
    <div className="flex items-center gap-2">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as CurrencyCode)}
        className="h-10 px-3 rounded-full bg-white/[0.04] border border-white/10 text-white/80 text-sm focus:outline-none focus:border-accent/40 cursor-pointer"
        title={
          isLive
            ? `Live rate: 1 USD = ${rates[value].toFixed(value === "MKD" ? 1 : 3)} ${value}`
            : "Using fallback rates"
        }
      >
        {(Object.keys(CURRENCIES) as CurrencyCode[]).map((c) => (
          <option key={c} value={c} className="bg-[#111]">
            {CURRENCIES[c].symbol} {c}
          </option>
        ))}
      </select>
    </div>
  );
}

function Th({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <th className={`px-5 py-3 text-left font-medium ${className}`}>{children}</th>;
}

function SortableTh({
  label,
  active,
  dir,
  onClick,
  align = "left",
}: {
  label: string;
  active: boolean;
  dir: SortDir;
  onClick: () => void;
  align?: "left" | "right";
}) {
  return (
    <th className={`px-5 py-3 font-medium ${align === "right" ? "text-right" : "text-left"}`}>
      <button
        onClick={onClick}
        className={`inline-flex items-center gap-1 hover:text-white/80 transition-colors ${
          active ? "text-white/80" : ""
        } ${align === "right" ? "flex-row-reverse" : ""}`}
      >
        {label}
        {active &&
          (dir === "asc" ? (
            <FiArrowUp className="w-3 h-3" />
          ) : (
            <FiArrowDown className="w-3 h-3" />
          ))}
      </button>
    </th>
  );
}

function Td({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={`px-5 py-3.5 ${className}`}>{children}</td>;
}

function RowActions({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="inline-flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-all">
      <button
        onClick={onEdit}
        className="p-2 rounded-lg text-white/30 hover:text-accent-cyan hover:bg-white/[0.06] transition-all"
        aria-label="Edit"
      >
        <FiEdit2 className="w-4 h-4" />
      </button>
      <button
        onClick={onDelete}
        className="p-2 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all"
        aria-label="Delete"
      >
        <FiTrash2 className="w-4 h-4" />
      </button>
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
    <div className={`glass glass-hover rounded-2xl p-5 transition-all ${borderColors[accent]}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 rounded-xl bg-white/[0.04]">{icon}</div>
        <span className="text-sm text-white/50">{label}</span>
      </div>
      <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-white/35">{sub}</p>
    </div>
  );
}

function EmptyState({
  message,
  actionLabel,
  onAction,
}: {
  message: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="glass rounded-2xl p-12 text-center">
      <p className="text-white/40 text-sm mb-5">{message}</p>
      <button onClick={onAction} className="btn inline-flex items-center gap-2">
        <FiPlus className="w-4 h-4" /> {actionLabel}
      </button>
    </div>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-md glass rounded-2xl p-6 border border-white/[0.08]"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06] transition-all"
            aria-label="Close"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}
