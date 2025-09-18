export default function AboutPage() {
	return (
		<div className="mx-auto max-w-7xl px-6 py-16">
			<span className="tag">About</span>
			<h1 className="mt-4 text-4xl font-semibold">A-DappT</h1>
			<p className="mt-3 text-white/75 max-w-3xl">
				Headquartered in Skopje, North Macedonia, A-DappT designs and builds modern enterprise software. We combine product engineering, platform architecture, and transformation expertise to help regulated industries move faster—safely.
			</p>

			<div className="mt-10 grid md:grid-cols-3 gap-6">
				<div className="glass rounded-2xl p-6">
					<h3 className="font-semibold">Mission</h3>
					<p className="text-white/70 mt-1">Turn strategy into outcomes through usable platforms and measurable change.</p>
				</div>
				<div className="glass rounded-2xl p-6">
					<h3 className="font-semibold">Approach</h3>
					<p className="text-white/70 mt-1">Small, senior teams; iterative delivery; strong governance and security by design.</p>
				</div>
				<div className="glass rounded-2xl p-6">
					<h3 className="font-semibold">Focus</h3>
					<p className="text-white/70 mt-1">Banking and regulated enterprises—initiatives, compliance, identity, and operating model change.</p>
				</div>
			</div>

			<div className="mt-12 grid md:grid-cols-2 gap-8">
				<div className="glass rounded-2xl p-6">
					<h3 className="font-semibold">Leadership</h3>
					<p className="text-white/70 mt-2">Our leaders are hands-on architects and product builders who have delivered large-scale platforms for banks and global enterprises. We value pragmatism, clarity, and outcomes.</p>
				</div>
				<div className="glass rounded-2xl p-6">
					<h3 className="font-semibold">How we work</h3>
					<ul className="text-white/70 mt-2 list-disc pl-5 space-y-1">
						<li>Co-create strategy and guardrails</li>
						<li>Compose platforms with reusable capabilities</li>
						<li>Instrument for value, risk, and adoption</li>
						<li>Transfer capability to your teams</li>
					</ul>
				</div>
			</div>
		</div>
	);
}

