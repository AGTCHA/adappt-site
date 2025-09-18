import Link from "next/link";

export default function ServicesOverview() {
	return (
		<div className="mx-auto max-w-7xl px-6 py-16">
			<span className="tag">Services</span>
			<h1 className="mt-4 text-4xl font-semibold">What we do</h1>
			<p className="mt-3 text-white/75 max-w-3xl">
				We deliver platforms and capabilities that accelerate transformation—combining product development with operating model change.
			</p>

			<div className="mt-10 grid md:grid-cols-2 gap-6">
				<div className="glass rounded-2xl p-6">
					<h3 className="text-xl font-semibold">Custom Software & Platforms</h3>
					<ul className="text-white/70 mt-2 list-disc pl-5 space-y-1">
						<li>Initiative Management Systems (IMS)</li>
						<li>Compliance management & controls automation</li>
						<li>Digital identity and access orchestration</li>
					</ul>
					<div className="mt-4"><Link href="/products/ims" className="hover:text-[var(--accent)]">Explore IMS →</Link></div>
				</div>
				<div className="glass rounded-2xl p-6">
					<h3 className="text-xl font-semibold">Consulting & Delivery</h3>
					<ul className="text-white/70 mt-2 list-disc pl-5 space-y-1">
						<li>Platform and data architecture</li>
						<li>Security, risk, and compliance enablement</li>
						<li>Operating model and change management</li>
					</ul>
					<div className="mt-4"><Link href="/services/consulting" className="hover:text-[var(--accent)]">Consulting services →</Link></div>
				</div>
			</div>

			<div className="mt-12 glass rounded-3xl p-8">
				<h3 className="text-xl font-semibold">Engagement model</h3>
				<p className="text-white/70 mt-2">Start with a discovery sprint to shape outcomes and roadmap; continue with product increments measured against OKRs.</p>
				<div className="mt-4"><a href="#contact" className="btn">Start a discovery</a></div>
			</div>
		</div>
	);
}

