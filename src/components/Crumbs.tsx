import { breadcrumbJsonLd, jsonLd } from "@/lib/seo";

/** BreadcrumbList JSON-LD for a top-level page: Home → this page. */
export default function Crumbs({ name, path }: { name: string; path: string }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbJsonLd([{ name: "Home", path: "/" }, { name, path }])) }}
    />
  );
}
