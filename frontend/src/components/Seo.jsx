import { Helmet } from "react-helmet-async";

const SITE_URL = "https://www.parasunshine.tn";
const SITE_NAME = "ParaSunshine";
const DEFAULT_TITLE = "ParaSunshine - Votre Parapharmacie en Ligne";
const DEFAULT_DESC =
  "Parapharmacie en ligne en Tunisie - Produits de qualité, livraison rapide et paiement sécurisé.";
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
  const canonical = url ? `${SITE_URL}${url}` : SITE_URL;

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

      {Array.isArray(jsonLd)
        ? jsonLd.map((ld, i) => (
            <script key={i} type="application/ld+json">
              {JSON.stringify(ld)}
            </script>
          ))
        : jsonLd && (
            <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
          )}
    </Helmet>
  );
}
