export default function IdentityPage() {
	return (
		<div className="mx-auto max-w-7xl px-6 py-16">
			<span className="tag">Product</span>
			<h1 className="mt-4 text-4xl font-semibold">Digital Identity</h1>
			<p className="mt-3 text-white/75 max-w-3xl">
				Identity journeys for customers and workforce with adaptive authentication and standards-first integrations.
			</p>
			<div className="mt-8 grid md:grid-cols-3 gap-6">
				<div className="glass rounded-2xl p-6"><h3 className="font-semibold">Orchestration</h3><p className="text-white/70 mt-1">Flows across registration, login, step-up, recovery.</p></div>
				<div className="glass rounded-2xl p-6"><h3 className="font-semibold">Standards</h3><p className="text-white/70 mt-1">OIDC, OAuth2, FIDO2, SAML, and SCIM.</p></div>
				<div className="glass rounded-2xl p-6"><h3 className="font-semibold">Fraud signals</h3><p className="text-white/70 mt-1">Device, behavior, and risk-based policies.</p></div>
			</div>
		</div>
	);
}
