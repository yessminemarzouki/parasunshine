import { useState, useEffect } from "react";
import { cachedFetch } from "../utils/cache";
import { API_URL } from "../config/api";

export const CAT_ORDER = [
  "soin",
  "solaire",
  "bebe-et-maman",
  "complements-alimentaires",
  "hygiene",
  "paramedicaux",
];

export const sortByOrder = (arr, order, key = "slug") =>
  [...arr].sort((a, b) => {
    const ia = order.indexOf(a[key]);
    const ib = order.indexOf(b[key]);
    if (ia === -1 && ib === -1) return 0;
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });

const STORAGE_KEY = "cached_categories_v2";

// Lit le cache localStorage de façon synchrone, disponible dès le premier
// rendu — évite l'écran "vide" pendant l'attente réseau, contrairement au
// cache en mémoire de cachedFetch qui ne survit pas à un F5.
const readStoredCategories = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export function useCategories() {
  const [categories, setCategories] = useState(() => readStoredCategories());
  const [loading, setLoading] = useState(categories.length === 0);

  useEffect(() => {
    cachedFetch(`${API_URL}/categories`)
      .then((data) => {
        const list = data || [];
        setCategories(list);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
        } catch {
          // Stockage plein ou indisponible — pas bloquant, le cache
          // mémoire de cachedFetch prend le relais pour cette session.
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const sortedCategories = sortByOrder(categories, CAT_ORDER);
  return { categories: sortedCategories, loading };
}
