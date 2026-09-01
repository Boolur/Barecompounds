import type { MetadataRoute } from "next";
import { getShopProducts } from "@/lib/commerce";

const SITE_URL = "https://barecompounds.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getShopProducts();
  const marketingRoutes = [
    "",
    "/shop",
    "/compounds",
    "/featured-products",
    "/best-sellers",
    "/journal",
    "/research",
    "/coa",
    "/affiliate-program",
    "/help-support",
  ];

  return [
    ...marketingRoutes.map((path) => ({
      url: `${SITE_URL}${path}`,
      changeFrequency: path === "" ? ("weekly" as const) : ("monthly" as const),
      priority: path === "" ? 1 : path === "/shop" ? 0.9 : 0.7,
    })),
    ...products.map((compound) => ({
      url: `${SITE_URL}/compounds/${compound.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
