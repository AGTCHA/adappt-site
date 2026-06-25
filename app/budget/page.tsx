import BudgetDashboard from "@/components/budget/BudgetDashboard";
import { CurrencyProvider } from "@/lib/currency";

export const metadata = {
  title: "Family Budget | Osler Hutson",
  robots: { index: false, follow: false },
};

export default function BudgetPage() {
  return (
    <CurrencyProvider>
      <BudgetDashboard />
    </CurrencyProvider>
  );
}
