export default function InsightsPage() {
	return (
		<div className="mx-auto max-w-7xl px-6 py-16">
			<span className="tag">Insights</span>
			<h1 className="mt-4 text-4xl font-semibold">Articles & updates</h1>
			<p className="mt-3 text-white/75 max-w-3xl">Perspectives on enterprise software, transformation, and platform architecture.</p>
			<div className="mt-10 grid md:grid-cols-3 gap-6">
				<div className="glass rounded-2xl p-6">
					<h3 className="font-semibold">Coming soon</h3>
					<p className="text-white/70 mt-1">We’re preparing our first posts. Have a topic in mind? Suggest it via the contact form.</p>
				</div>
			</div>
		</div>
	);
}

