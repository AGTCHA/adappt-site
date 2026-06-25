import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
	return {
		rules: {
			userAgent: "*",
			allow: "/",
			disallow: ["/budget", "/login", "/api/budget", "/api/auth"],
		},
		sitemap: "https://a-dappt.com/sitemap.xml",
	};
}



