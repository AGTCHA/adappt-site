import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function monthlyAmount(amount: number, frequency: string) {
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

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [incomes, expenses] = await Promise.all([
    prisma.income.findMany(),
    prisma.expense.findMany(),
  ]);

  const totalIncome = incomes.reduce(
    (sum, i) => sum + monthlyAmount(i.amount, i.frequency),
    0,
  );

  const recurringExpenses = expenses
    .filter((e) => e.isRecurring)
    .reduce((sum, e) => sum + e.amount, 0);

  const oneTimeExpenses = expenses
    .filter((e) => !e.isRecurring)
    .reduce((sum, e) => sum + e.amount, 0);

  const totalExpenses = recurringExpenses + oneTimeExpenses;
  const savings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? (savings / totalIncome) * 100 : 0;

  const incomeByPerson = incomes.reduce(
    (acc, i) => {
      const key = i.person;
      acc[key] = (acc[key] ?? 0) + monthlyAmount(i.amount, i.frequency);
      return acc;
    },
    {} as Record<string, number>,
  );

  const expensesByCategory = expenses.reduce(
    (acc, e) => {
      acc[e.category] = (acc[e.category] ?? 0) + e.amount;
      return acc;
    },
    {} as Record<string, number>,
  );

  const expensesByPerson = expenses.reduce(
    (acc, e) => {
      acc[e.person] = (acc[e.person] ?? 0) + e.amount;
      return acc;
    },
    {} as Record<string, number>,
  );

  return NextResponse.json({
    totalIncome,
    totalExpenses,
    recurringExpenses,
    oneTimeExpenses,
    savings,
    savingsRate,
    incomeByPerson,
    expensesByCategory,
    expensesByPerson,
    incomeCount: incomes.length,
    expenseCount: expenses.length,
  });
}
