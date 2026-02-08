import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/app/", "/login", "/registro", "/auth/", "/api/", "/perfil/", "/calendario/", "/workspace/"],
      },
    ],
    sitemap: "https://tarely.com/sitemap.xml",
  };
}
