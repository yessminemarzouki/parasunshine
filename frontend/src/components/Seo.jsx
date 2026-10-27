import { Helmet } from "react-helmet-async";

const SITE_URL = "https://www.parasunshine.tn";
const SITE_NAME = "ParaSunshine";
const DEFAULT_TITLE = "ParaSunshine - Parapharmacie en ligne en Tunisie";
const DEFAULT_DESC =
  "ParaSunshine, votre parapharmacie en ligne en Tunisie : soins visage, solaire, capillaire, bébé & maman, hygiène. Produits 100% authentiques, livraison rapide.";
const DEFAULT_IMAGE = `${SITE_URL}/android-chrome-512x512.png`;

export default function Seo({
  title,
  description = DEFAULT_DESC,
  image = DEFAULT_IMAGE,
  url,
  type = "website",
  noindex = false,
  jsonLd,
}) {
  const fullTitle = title ? `${title} - ${SITE_NAME}` : DEFAULT_TITLE;
  // Canonical propre : on retire les paramètres de tri/pagination pour éviter le duplicate content
  const canonical = url ? `${SITE_URL}${url.split("?")[0]}` : SITE_URL;
  // Après const canonical = ...
  const breadcrumb =
    url?.startsWith("/products") && url?.includes("category=")
      ? {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Accueil",
              item: SITE_URL,
            },
            {
              "@type": "ListItem",
              position: 2,
              name: "Produits",
              item: `${SITE_URL}/products`,
            },
            {
              "@type": "ListItem",
              position: 3,
              name: title || "Catégorie",
            },
          ],
        }
      : null;
  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />

      {noindex && <meta name="robots" content="noindex, nofollow" />}

      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={canonical} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {(() => {
        const schemas = [];
        if (Array.isArray(jsonLd)) schemas.push(...jsonLd);
        else if (jsonLd) schemas.push(jsonLd);
        if (breadcrumb) schemas.push(breadcrumb);

        return schemas.map((ld, i) => (
          <script key={i} type="application/ld+json">
            {JSON.stringify(ld)}
          </script>
        ));
      })()}
    </Helmet>
  );
}
