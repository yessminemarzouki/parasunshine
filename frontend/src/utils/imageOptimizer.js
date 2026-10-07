/**
 * Optimise les URLs d'images externes
 */
export const optimizeImageUrl = (url, width = 800, quality = 80) => {
  if (!url) return url;

  // Pour Unsplash
  if (url.includes("unsplash.com")) {
    return `${url}?w=${width}&q=${quality}&fm=webp&auto=format`;
  }

  // Pour les autres
  return url;
};
