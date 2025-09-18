import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
	const base = "https://a-dappt.com";
	const now = new Date().toISOString();
	return [
		{ url: `${base}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
		{ url: `${base}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
		{ url: `${base}/services`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
		{ url: `${base}/products/ims`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
		{ url: `${base}/products/compliance`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
		{ url: `${base}/products/identity`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
		{ url: `${base}/services/consulting`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
	];
}

