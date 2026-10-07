// Système de cache simple en mémoire pour les endpoints publics en lecture seule
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch avec cache automatique
 * @param {string} url - URL à fetcher
 * @returns {Promise} Data
 */
export const cachedFetch = async (url) => {
  const cached = cache.get(url);

  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  // cache: "no-store" empêche le navigateur de servir une réponse HTTP
  // mise en cache pour cette requête — garantit qu'on obtient toujours
  // les données fraîches du serveur, le cache applicatif (Map ci-dessus)
  // gérant déjà la mise en cache côté app pendant 5 minutes.
  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();

  cache.set(url, {
    data,
    timestamp: Date.now(),
  });

  return data;
};

/**
 * Vider le cache (utile après ajout au panier, etc.)
 */
export const clearCache = () => {
  cache.clear();
};

/**
 * Vider une URL spécifique du cache
 * @param {string} url - URL à supprimer du cache
 */
export const clearCacheUrl = (url) => {
  cache.delete(url);
};
