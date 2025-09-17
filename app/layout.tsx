import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "A-DappT — Futuristic Software & Digital Transformation",
	description:
		"A-DappT builds enterprise-grade software: IMS for banks, compliance systems, digital identity, and consulting.",
	metadataBase: new URL("https://adappt.example"),
	icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" className="bg-background text-foreground">
			<body className={`${geistSans.variable} ${geistMono.variable} antialiased`}> 
				<header className="sticky top-0 z-50 border-b border-white/10 bg-black/30 backdrop-blur-md">
					<nav className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
                        <Link href="/" className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg" style={{ background: "linear-gradient(135deg, #1e90ff, #60a5ff)" }} />
							<span className="text-lg font-semibold tracking-wide">A-DappT</span>
						</Link>
						<div className="hidden md:flex items-center gap-8 text-sm">
							<Link href="/products/ims" className="hover:text-[var(--accent)] transition">IMS</Link>
							<Link href="/products/compliance" className="hover:text-[var(--accent)] transition">Compliance</Link>
							<Link href="/products/identity" className="hover:text-[var(--accent)] transition">Digital Identity</Link>
							<Link href="/services/consulting" className="hover:text-[var(--accent)] transition">Consulting</Link>
							<a href="#contact" className="btn h-9 px-4">Contact</a>
						</div>
					</nav>
				</header>
				<main className="min-h-[calc(100vh-160px)]">{children}</main>
				<footer className="border-t border-white/10">
					<div className="mx-auto max-w-7xl px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
						<p className="text-sm text-white/70">© {new Date().getFullYear()} A-DappT DOOEL — Skopje, North Macedonia</p>
						<div className="flex items-center gap-6 text-sm">
							<Link href="/privacy" className="hover:text-[var(--accent)]">Privacy</Link>
							<Link href="/terms" className="hover:text-[var(--accent)]">Terms</Link>
						</div>
					</div>
				</footer>
			</body>
		</html>
	);
}
