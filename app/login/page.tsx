import { Suspense } from "react";
import LoginForm from "@/components/budget/LoginForm";

export const metadata = {
  title: "Sign In | Family Budget",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[calc(100vh-72px)] flex items-center justify-center">
          <div className="h-8 w-8 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
