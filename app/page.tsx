import Link from "next/link";
import HeroCanvas from "@/components/HeroCanvas";

export default function Home() {
	return (
		<div className="relative">
			{/* Hero */}
			<section className="relative overflow-hidden">
				<HeroCanvas />
				<div className="absolute -z-10 inset-0 shine" />
				<div className="mx-auto max-w-7xl px-6 pt-28 pb-24 md:pt-36 md:pb-32">
					<span className="tag">Futuristic Software</span>
					<h1 className="mt-6 text-4xl md:text-6xl font-semibold tracking-tight">
						A-DappT — building tomorrow’s enterprise systems today
					</h1>
					<p className="mt-6 max-w-2xl text-white/75 text-lg">
						Headquartered in Skopje, North Macedonia. We craft custom enterprise software and flagship platforms—IMS for banks and digital transformation, compliance management, and digital identity.
					</p>
					<div className="mt-10 flex items-center gap-4">
						<a href="#contact" className="btn">Start a conversation</a>
						<Link href="/products/ims" className="text-white/80 hover:text-[var(--accent)]">Explore IMS →</Link>
					</div>
				</div>
			</section>

			{/* Highlights */}
			<section className="mx-auto max-w-7xl px-6 py-14 grid md:grid-cols-3 gap-6">
				<div className="glass rounded-2xl p-6">
					<h3 className="text-xl font-semibold">Initiative Management System (IMS)</h3>
					<p className="mt-2 text-white/70">
						A centralized hub for banking and enterprise change. Govern strategy, steer delivery, and measure impact across portfolios.
					</p>
					<Link href="/products/ims" className="mt-4 inline-block hover:text-[var(--accent)]">Learn more →</Link>
				</div>
				<div className="glass rounded-2xl p-6">
					<h3 className="text-xl font-semibold">Compliance Systems</h3>
					<p className="mt-2 text-white/70">
						Automate policies, controls, evidence, and audits with traceability and real-time risk posture.
					</p>
					<Link href="/products/compliance" className="mt-4 inline-block hover:text-[var(--accent)]">Learn more →</Link>
				</div>
				<div className="glass rounded-2xl p-6">
					<h3 className="text-xl font-semibold">Digital Identity</h3>
					<p className="mt-2 text-white/70">
						Identity orchestration for customer and workforce journeys. Secure, seamless, standards-first.
					</p>
					<Link href="/products/identity" className="mt-4 inline-block hover:text-[var(--accent)]">Learn more →</Link>
				</div>
			</section>

			{/* Trust logos */}
			<section className="mx-auto max-w-7xl px-6 py-6">
				<div className="glass rounded-2xl p-6 flex flex-wrap items-center justify-center gap-8 text-white/50 text-sm">
					<span>Trusted by teams in banking and enterprise</span>
					<span className="h-6 w-24 bg-white/10 rounded" />
					<span className="h-6 w-24 bg-white/10 rounded" />
					<span className="h-6 w-24 bg-white/10 rounded" />
				</div>
			</section>

			{/* Consulting CTA */}
			<section className="mx-auto max-w-7xl px-6 py-14">
				<div className="glass rounded-3xl p-10 md:p-14 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
					<div>
						<h3 className="text-2xl md:text-3xl font-semibold">Transformation, delivered.</h3>
						<p className="mt-3 text-white/70 max-w-2xl">
							Our consulting teams co-create roadmaps, architect modern platforms, and guide operating model change for measurable outcomes.
						</p>
					</div>
					<Link href="/services/consulting" className="btn">Consulting services</Link>
				</div>
			</section>

			{/* Why Skopje */}
			<section className="mx-auto max-w-7xl px-6 py-14">
				<div className="grid md:grid-cols-2 gap-6">
					<div className="glass rounded-2xl p-6">
						<h3 className="text-xl font-semibold">Why Skopje</h3>
						<p className="mt-2 text-white/70">Strategic location, strong engineering talent, and time-zone alignment with Europe enable fast collaboration and cost-effective delivery.</p>
					</div>
					<div className="glass rounded-2xl p-6">
						<h3 className="text-xl font-semibold">How we partner</h3>
						<p className="mt-2 text-white/70">Clear governance, weekly demos, and outcome-led roadmaps. We integrate with your teams and tooling.</p>
					</div>
				</div>
			</section>

			{/* Contact */}
			<section id="contact" className="mx-auto max-w-7xl px-6 py-16">
				<div className="grid md:grid-cols-2 gap-8">
					<div>
						<h3 className="text-2xl font-semibold">Tell us about your initiative</h3>
						<p className="mt-2 text-white/70">We’ll respond within one business day.</p>
					</div>
					<form action="/api/lead" method="post" className="glass rounded-2xl p-6 grid grid-cols-1 gap-4">
						<input name="name" placeholder="Your name" required className="h-11 rounded-xl bg-[#111] border border-white/10 px-4 outline-none focus:border-[var(--accent)]" />
						<input name="email" type="email" placeholder="Work email" required className="h-11 rounded-xl bg-[#111] border border-white/10 px-4 outline-none focus:border-[var(--accent)]" />
						<input name="company" placeholder="Company" className="h-11 rounded-xl bg-[#111] border border-white/10 px-4 outline-none focus:border-[var(--accent)]" />
						<textarea name="message" placeholder="What would you like to achieve?" rows={4} className="rounded-xl bg-[#111] border border-white/10 px-4 py-3 outline-none focus:border-[var(--accent)]" />
						<button className="btn" type="submit">Send</button>
					</form>
				</div>
			</section>
		</div>
	);
}
