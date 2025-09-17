import Link from "next/link";

export default function ThankYou() {
	return (
		<div className="mx-auto max-w-3xl px-6 py-24 text-center">
			<h1 className="text-3xl font-semibold">Thank you</h1>
			<p className="mt-3 text-white/70">We received your message and will reach out shortly.</p>
			<Link href="/" className="btn mt-8">Back to home</Link>
		</div>
	);
}
