import type { MetadataRoute } from "next";
import { site } from "../data/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/daily", "/endless", "/privacy"].map((path) => ({
    url: `${site.url}${path}`,
    changeFrequency: path === "/daily" ? "daily" : "monthly",
    priority: path === "" ? 1 : 0.6,
  }));
}
