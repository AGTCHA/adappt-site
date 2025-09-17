export default function ConsultingPage() {
	return (
		<div className="mx-auto max-w-7xl px-6 py-16">
			<span className="tag">Service</span>
			<h1 className="mt-4 text-4xl font-semibold">Consulting Services</h1>
			<p className="mt-3 text-white/75 max-w-3xl">
				From strategy to implementation, our experts partner with your teams to deliver transformation that sticks.
			</p>
			<div className="mt-8 grid md:grid-cols-3 gap-6">
				<div className="glass rounded-2xl p-6"><h3 className="font-semibold">Platform architecture</h3><p className="text-white/70 mt-1">Cloud-native, data, and identity platforms.</p></div>
				<div className="glass rounded-2xl p-6"><h3 className="font-semibold">Operating model</h3><p className="text-white/70 mt-1">Ways of working, governance, and capability building.</p></div>
				<div className="glass rounded-2xl p-6"><h3 className="font-semibold">Value delivery</h3><p className="text-white/70 mt-1">Roadmaps, OKRs, and benefits realization.</p></div>
			</div>
		</div>
	);
}
