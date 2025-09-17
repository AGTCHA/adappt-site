import Link from "next/link";

export default function IMSPage() {
	return (
		<div className="mx-auto max-w-7xl px-6 py-16">
			<span className="tag">Product</span>
			<h1 className="mt-4 text-4xl font-semibold">Initiative Management System (IMS)</h1>
			<p className="mt-3 text-white/75 max-w-3xl">
				A centralized hub for banks and enterprises to orchestrate strategy, investment, delivery, and benefits—turning transformation into repeatable success.
			</p>

			<div className="mt-10 grid md:grid-cols-3 gap-6">
				<div className="glass rounded-2xl p-6">
					<h3 className="font-semibold">Portfolio governance</h3>
					<p className="text-white/70 mt-1">From ideas to outcomes with stage gates, OKRs, and benefits maps.</p>
				</div>
				<div className="glass rounded-2xl p-6">
					<h3 className="font-semibold">Risk & compliance</h3>
					<p className="text-white/70 mt-1">Integrated controls, audit trails, and policy alignment across initiatives.</p>
				</div>
				<div className="glass rounded-2xl p-6">
					<h3 className="font-semibold">Insights & telemetry</h3>
					<p className="text-white/70 mt-1">Real-time dashboards on spend, velocity, value, and change adoption.</p>
				</div>
			</div>

			<div className="mt-10">
				<Link href="#contact" className="btn">Request a demo</Link>
			</div>
		</div>
	);
}
