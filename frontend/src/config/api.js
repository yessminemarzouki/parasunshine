// Chaîne vide explicite (VITE_API_URL="") = URLs relatives, gérées par le
// proxy Vite en dev — ne surtout pas utiliser le fallback || dans ce cas,
// une chaîne vide est "falsy" en JS et déclencherait le fallback à tort.
let baseUrl;
if (import.meta.env.VITE_API_URL !== undefined) {
  baseUrl = import.meta.env.VITE_API_URL;
} else if (import.meta.env.DEV) {
  // En dev uniquement : fallback pratique vers localhost
  baseUrl = "http://localhost";
} else {
  // En production : refuser de builder un site cassé
  throw new Error(
    "VITE_API_URL manquant. Crée un fichier .env.production (ou .env) " +
      "avec VITE_API_URL=https://www.parasunshine.tn avant de builder.",
  );
}

export const BASE_URL = baseUrl;
export const API_URL = `${BASE_URL}/api`;
export const STORAGE_URL = `${BASE_URL}/storage`;
