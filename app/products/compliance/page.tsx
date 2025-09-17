export default function CompliancePage() {
	return (
		<div className="mx-auto max-w-7xl px-6 py-16">
			<span className="tag">Product</span>
			<h1 className="mt-4 text-4xl font-semibold">Compliance Management</h1>
			<p className="mt-3 text-white/75 max-w-3xl">
				Unify policies, controls, evidence, and audits with automation and continuous assurance.
			</p>
			<div className="mt-8 grid md:grid-cols-3 gap-6">
				<div className="glass rounded-2xl p-6"><h3 className="font-semibold">Control library</h3><p className="text-white/70 mt-1">Reusable, mapped to standards and internal policies.</p></div>
				<div className="glass rounded-2xl p-6"><h3 className="font-semibold">Evidence capture</h3><p className="text-white/70 mt-1">Automated checks and human attestations with traceability.</p></div>
				<div className="glass rounded-2xl p-6"><h3 className="font-semibold">Audit workspace</h3><p className="text-white/70 mt-1">Findings, remediation, and reporting simplified.</p></div>
			</div>
		</div>
	);
}
