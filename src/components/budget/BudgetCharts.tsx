"use client";

import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  CHART_COLORS,
  formatCurrency,
  personLabel,
  type BudgetSummary,
} from "@/lib/budget-types";

type ChartTooltipProps = {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; payload?: { fill?: string } }>;
};

function ChartTooltip({ active, payload }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="glass rounded-xl px-4 py-3 text-sm shadow-xl">
      <p className="text-white/60">{item.name}</p>
      <p className="text-white font-semibold">{formatCurrency(item.value ?? 0)}</p>
    </div>
  );
}

function toChartData(record: Record<string, number>) {
  return Object.entries(record)
    .filter(([, value]) => value > 0)
    .map(([name, value]) => ({
      name: personLabel(name),
      value: Math.round(value * 100) / 100,
    }))
    .sort((a, b) => b.value - a.value);
}

function categoryChartData(record: Record<string, number>) {
  return Object.entries(record)
    .filter(([, value]) => value > 0)
    .map(([name, value]) => ({
      name,
      value: Math.round(value * 100) / 100,
    }))
    .sort((a, b) => b.value - a.value);
}

export default function BudgetCharts({ summary }: { summary: BudgetSummary }) {
  const incomeData = toChartData(summary.incomeByPerson);
  const expensePersonData = toChartData(summary.expensesByPerson);
  const categoryData = categoryChartData(summary.expensesByCategory);

  const overviewData = [
    { name: "Income", amount: summary.totalIncome, fill: "#10b981" },
    { name: "Expenses", amount: summary.totalExpenses, fill: "#ef4444" },
    { name: "Savings", amount: Math.max(0, summary.savings), fill: "#1e90ff" },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Overview bar chart */}
      <div className="glass rounded-2xl p-6 lg:col-span-2">
        <h3 className="text-lg font-semibold text-white mb-1">Monthly Overview</h3>
        <p className="text-sm text-white/40 mb-6">Income vs expenses vs savings</p>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={overviewData} barCategoryGap="20%">
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 13 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 12 }}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
              <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                {overviewData.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Income by person */}
      <div className="glass rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-1">Income Sources</h3>
        <p className="text-sm text-white/40 mb-4">Monthly equivalent by person</p>
        {incomeData.length === 0 ? (
          <div className="h-[240px] flex items-center justify-center text-white/30 text-sm">
            Add income entries to see this chart
          </div>
        ) : (
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={incomeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {incomeData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                <Legend
                  formatter={(value) => (
                    <span className="text-white/60 text-xs">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Expenses by category */}
      <div className="glass rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-1">Spending by Category</h3>
        <p className="text-sm text-white/40 mb-4">Where your money goes</p>
        {categoryData.length === 0 ? (
          <div className="h-[240px] flex items-center justify-center text-white/30 text-sm">
            Add expenses to see this chart
          </div>
        ) : (
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[(i + 3) % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                <Legend
                  formatter={(value) => (
                    <span className="text-white/60 text-xs">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Expenses by person */}
      {expensePersonData.length > 0 && (
        <div className="glass rounded-2xl p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-white mb-1">Expenses by Person</h3>
          <p className="text-sm text-white/40 mb-6">Who the spending is assigned to</p>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={expensePersonData} layout="vertical" barCategoryGap="15%">
                <XAxis
                  type="number"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 12 }}
                  tickFormatter={(v) => `$${v}`}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 13 }}
                  width={100}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                <Bar dataKey="value" radius={[0, 8, 8, 0]} fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
