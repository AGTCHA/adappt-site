import type { Metadata } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/AppShell";
import { Analytics } from "@vercel/analytics/react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});


export const metadata: Metadata = {
  title: "Osler Hutson | Full-Stack Software Engineer",
  description:
    "Full-stack software engineer who built a multi-tenant SaaS platform from the ground up — four interconnected web applications, 480,000+ lines of production code, and 1,600+ releases in under four months.",
  metadataBase: new URL("https://a-dappt.com"),
  icons: { icon: "/favicon.ico" },
  openGraph: {
    title: "Osler Hutson | Full-Stack Software Engineer",
    description:
      "Builder of production-grade SaaS platforms. React, TypeScript, Node.js, PostgreSQL.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Osler Hutson | Full-Stack Software Engineer",
    description:
      "Builder of production-grade SaaS platforms. React, TypeScript, Node.js, PostgreSQL.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-background text-foreground">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} antialiased`}
      >
        <AppShell>{children}</AppShell>
        <Analytics />
      </body>
    </html>
  );
}
