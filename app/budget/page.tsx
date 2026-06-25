import BudgetDashboard from "@/components/budget/BudgetDashboard";

export const metadata = {
  title: "Family Budget | Osler Hutson",
  robots: { index: false, follow: false },
};

export default function BudgetPage() {
  return <BudgetDashboard />;
}
