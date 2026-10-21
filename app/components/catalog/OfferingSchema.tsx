export default function OfferingSchema({
  kind,
  slug,
  title,
}: {
  kind: "services" | "products";
  slug: string;
  title: string;
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://monetcore.dev",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: kind === "services" ? "Services" : "Products",
        item: `https://monetcore.dev/${kind}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: title,
        item: `https://monetcore.dev/${kind}/${slug}`,
      },
    ],
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
