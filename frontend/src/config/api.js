// Chaîne vide explicite (VITE_API_URL="") = URLs relatives, gérées par le
// proxy Vite en dev — ne surtout pas utiliser le fallback || dans ce cas,
// une chaîne vide est "falsy" en JS et déclencherait le fallback à tort.
export const BASE_URL =
  import.meta.env.VITE_API_URL !== undefined
    ? import.meta.env.VITE_API_URL
    : "http://localhost";
export const API_URL = `${BASE_URL}/api`;
export const STORAGE_URL = `${BASE_URL}/storage`;
