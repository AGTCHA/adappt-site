import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
	const base = "https://a-dappt.com";
	const now = new Date().toISOString();
	return [
		{ url: `${base}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
		{ url: `${base}/projects`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
		{ url: `${base}/projects/forgedrive`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
		{ url: `${base}/projects/strategyflow`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
		{ url: `${base}/projects/agentchain`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
		{ url: `${base}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
		{ url: `${base}/experience`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
		{ url: `${base}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
	];
}
