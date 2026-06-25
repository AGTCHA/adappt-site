"use client";

import { usePathname } from "next/navigation";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPortalLogin = pathname === "/login";

  if (isPortalLogin) {
    return <main className="min-h-screen bg-[#050505]">{children}</main>;
  }

  return (
    <>
      <Navigation />
      <main className="min-h-screen pt-[72px]">{children}</main>
      <Footer />
    </>
  );
}
