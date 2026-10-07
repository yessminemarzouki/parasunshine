import { createContext, useContext, useState, useEffect } from "react";
import { saveAbandonedCart } from "../services/api";

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem("pharmasoin_cart");
    return savedCart ? JSON.parse(savedCart) : [];
  });

  // Code promo appliqué : { code, discount_percentage, discount_amount, message }
  const [promoCode, setPromoCode] = useState(null);

  const applyPromoCode = (result) => setPromoCode(result);
  const removePromoCode = () => setPromoCode(null);

  // Persiste dans localStorage
  useEffect(() => {
    localStorage.setItem("pharmasoin_cart", JSON.stringify(cart));
  }, [cart]);

  // Retire le code promo dès que le contenu du panier change (quantité,
  // ajout, suppression) — la réduction doit toujours être revalidée.
  const cartSignature = cart.map((i) => `${i.id}:${i.quantity}`).join(",");
  useEffect(() => {
    setPromoCode(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartSignature]);

  // ✅ Sauvegarde debounced — calcul du total fait localement dans la fonction
  useEffect(() => {
    if (cart.length === 0) return;

    const timer = setTimeout(() => {
      saveCartToBackend(cart);
    }, 3000);

    return () => clearTimeout(timer);
  }, [cart]);

  // ✅ CORRIGÉ : reçoit le cart en paramètre pour éviter la closure stale
  const saveCartToBackend = async (currentCart) => {
    // Calcul du total directement ici — évite le problème de cartTotal non défini
    const total = currentCart.reduce((sum, item) => {
      const price = parseFloat(item.price) || 0;
      const promoPrice = parseFloat(item.promo_price) || 0;
      const finalPrice =
        promoPrice > 0 && promoPrice < price ? promoPrice : price;
      return sum + finalPrice * item.quantity;
    }, 0);

    const cartData = {
      cart_items: currentCart.map((item) => ({
        product_id: item.id, // ✅ nécessaire pour les images dans l'admin
        quantity: item.quantity,
        price: item.promo_price
          ? Math.min(parseFloat(item.price), parseFloat(item.promo_price))
          : parseFloat(item.price),
        name: item.name,
      })),
      total: total,
    };

    try {
      await saveAbandonedCart(cartData);
    } catch {
      // Échec silencieux — la sauvegarde du panier abandonné est une fonctionnalité
      // secondaire, ne doit jamais interrompre l'expérience d'achat.
    }
  };

  const addToCart = (product, quantity = 1, size = null, color = null) => {
    setCart((prev) => {
      const existing = prev.find(
        (i) =>
          i.id === product.id &&
          i.selectedSize === size &&
          i.selectedColor?.hex === color?.hex,
      );
      if (existing) {
        return prev.map((i) =>
          i.id === product.id &&
          i.selectedSize === size &&
          i.selectedColor?.hex === color?.hex
            ? { ...i, quantity: i.quantity + quantity }
            : i,
        );
      }
      return [
        ...prev,
        { ...product, quantity, selectedSize: size, selectedColor: color },
      ];
    });
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.id === productId ? { ...item, quantity } : item,
      ),
    );
  };

  const clearCart = () => {
    setCart([]);
    setPromoCode(null);
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((total, item) => {
    const price = parseFloat(item.price) || 0;
    const promoPrice = parseFloat(item.promo_price) || 0;
    const finalPrice =
      promoPrice > 0 && promoPrice < price ? promoPrice : price;
    return total + finalPrice * item.quantity;
  }, 0);

  // ── Coffrets — ajouté sans toucher à la logique produits existante ──
  // Le panier affiche un coffret comme une seule ligne (id préfixé "bundle-"
  // pour ne jamais entrer en collision avec un id de produit), donc
  // removeFromCart/updateQuantity fonctionnent déjà tels quels dessus.
  const addBundleToCart = (bundle, quantity = 1) => {
    const cartId = `bundle-${bundle.id}`;
    setCart((prev) => {
      const existing = prev.find((i) => i.id === cartId);
      if (existing) {
        return prev.map((i) =>
          i.id === cartId ? { ...i, quantity: i.quantity + quantity } : i,
        );
      }
      return [
        ...prev,
        {
          ...bundle,
          id: cartId,
          bundleId: bundle.id,
          isBundle: true,
          quantity,
        },
      ];
    });
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        addBundleToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartCount,
        cartTotal,
        promoCode,
        applyPromoCode,
        removePromoCode,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
