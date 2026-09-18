import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          "/manager/",
          "/chef/",
          "/driver/",
          "/delivery/",
          "/supplier/",
          "/vendor/",
          "/sales/",
          "/customer/",
          "/checkout/",
          "/order/",
          "/orders/",
          "/forgot-password/",
          "/design-system/",
          "/docs/",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          "/manager/",
          "/chef/",
          "/driver/",
          "/delivery/",
          "/supplier/",
          "/vendor/",
          "/sales/",
          "/customer/",
          "/checkout/",
        ],
      },
      {
        userAgent: "Bingbot",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          "/manager/",
          "/chef/",
          "/driver/",
        ],
      },
    ],
    sitemap: "https://gopalcakeshop.com/sitemap.xml",
    host: "https://gopalcakeshop.com",
  };
}
