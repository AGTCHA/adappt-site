import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/src/components/ui/ThemeProvider";
import { ToastProvider } from "@/src/components/ui/Toast";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Adapt — Recruiting & Fleet Management for Small Trucking Companies",
    template: "%s · Adapt",
  },
  description:
    "Hire drivers faster and keep your trucks on the road. Adapt is the simple recruiting and fleet management platform built for small trucking companies.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} app-backdrop antialiased`}>
        <ThemeProvider>
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
