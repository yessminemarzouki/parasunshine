import { createContext, useContext, useState, useEffect } from "react";
import {
  getWishlist,
  addToWishlist as addToWishlistAPI,
  removeFromWishlist as removeFromWishlistAPI,
  addBundleToWishlistApi as addBundleToWishlistAPI,
  removeBundleFromWishlistApi as removeBundleFromWishlistAPI,
} from "../services/api";

const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(false);
  const wishlistCount = wishlist.length;

  // Charger les favoris au montage si connecté
  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      loadWishlist();
    }
  }, []);

  const loadWishlist = async () => {
    try {
      setLoading(true);
      const data = await getWishlist();
      setWishlist(data.wishlists || []);
    } catch {
      setWishlist([]);
    } finally {
      setLoading(false);
    }
  };

  // 🚀 AJOUT OPTIMISTE
  const addToWishlist = async (productId) => {
    // ✅ Vérifier AVANT d'ajouter
    const alreadyExists = wishlist.some(
      (item) => item.product_id === productId,
    );

    if (alreadyExists) {
      return { success: true }; // Déjà ajouté, pas d'erreur
    }

    try {
      // 1️⃣ MISE À JOUR IMMÉDIATE DE L'UI
      const tempItem = {
        product_id: productId,
        id: Date.now(), // ID temporaire
      };

      setWishlist((prev) => [...prev, tempItem]);

      // 2️⃣ Appel API
      const response = await addToWishlistAPI(productId);

      // 3️⃣ Remplacer l'item temporaire par le vrai
      setWishlist((prev) =>
        prev.map((item) =>
          item.id === tempItem.id ? response.wishlist : item,
        ),
      );

      return { success: true };
    } catch (error) {
      // ❌ Annuler l'ajout optimiste
      setWishlist((prev) =>
        prev.filter((item) => item.product_id !== productId),
      );

      return {
        success: false,
        error: error.response?.data?.message || "Erreur lors de l'ajout",
      };
    }
  };

  // 🚀 SUPPRESSION OPTIMISTE
  const removeFromWishlist = async (productId) => {
    // ✅ Vérifier AVANT de supprimer
    const exists = wishlist.some((item) => item.product_id === productId);

    if (!exists) {
      return { success: true }; // Déjà supprimé, pas d'erreur
    }

    // Sauvegarder l'ancien état pour rollback
    const previousWishlist = [...wishlist];

    try {
      // 1️⃣ MISE À JOUR IMMÉDIATE DE L'UI
      setWishlist((prev) =>
        prev.filter((item) => item.product_id !== productId),
      );

      // 2️⃣ Appel API
      await removeFromWishlistAPI(productId);

      return { success: true };
    } catch (error) {
      // ❌ Restaurer l'état précédent
      setWishlist(previousWishlist);

      return {
        success: false,
        error: error.response?.data?.message || "Erreur lors de la suppression",
      };
    }
  };

  const isInWishlist = (productId) => {
    return wishlist.some((item) => item.product_id === productId);
  };

  // 🚀 AJOUT OPTIMISTE — coffret
  const addBundleToWishlist = async (bundleId) => {
    const alreadyExists = wishlist.some((item) => item.bundle_id === bundleId);

    if (alreadyExists) {
      return { success: true };
    }

    try {
      const tempItem = {
        bundle_id: bundleId,
        id: Date.now(),
      };

      setWishlist((prev) => [...prev, tempItem]);

      const response = await addBundleToWishlistAPI(bundleId);

      setWishlist((prev) =>
        prev.map((item) =>
          item.id === tempItem.id ? response.wishlist : item,
        ),
      );

      return { success: true };
    } catch (error) {
      setWishlist((prev) => prev.filter((item) => item.bundle_id !== bundleId));

      return {
        success: false,
        error: error.response?.data?.message || "Erreur lors de l'ajout",
      };
    }
  };

  // 🚀 SUPPRESSION OPTIMISTE — coffret
  const removeBundleFromWishlist = async (bundleId) => {
    const exists = wishlist.some((item) => item.bundle_id === bundleId);

    if (!exists) {
      return { success: true };
    }

    const previousWishlist = [...wishlist];

    try {
      setWishlist((prev) => prev.filter((item) => item.bundle_id !== bundleId));

      await removeBundleFromWishlistAPI(bundleId);

      return { success: true };
    } catch (error) {
      setWishlist(previousWishlist);

      return {
        success: false,
        error: error.response?.data?.message || "Erreur lors de la suppression",
      };
    }
  };

  const isBundleInWishlist = (bundleId) => {
    return wishlist.some((item) => item.bundle_id === bundleId);
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        wishlistCount,
        loading,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        addBundleToWishlist,
        removeBundleFromWishlist,
        isBundleInWishlist,
        loadWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within WishlistProvider");
  }
  return context;
};
