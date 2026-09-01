import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/account",
        "/checkout",
        "/track",
        "/reset-password",
        "/staff-invite",
      ],
    },
    sitemap: "https://barecompounds.com/sitemap.xml",
  };
}
