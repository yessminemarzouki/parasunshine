import { createContext, useContext, useState, useCallback } from "react";
import CartNotification from "../components/CartNotification";

const CartNotificationContext = createContext(null);

export function CartNotificationProvider({ children }) {
  const [notification, setNotification] = useState(null);

  const showCartNotification = useCallback((product, quantity = 1) => {
    setNotification({ product, quantity });
  }, []);

  const hideCartNotification = useCallback(() => {
    setNotification(null);
  }, []);

  return (
    <CartNotificationContext.Provider
      value={{ showCartNotification, hideCartNotification }}
    >
      {children}
      {notification && (
        <CartNotification
          product={notification.product}
          quantity={notification.quantity}
          isVisible={true}
          onClose={hideCartNotification}
        />
      )}
    </CartNotificationContext.Provider>
  );
}

export function useCartNotification() {
  const ctx = useContext(CartNotificationContext);
  if (!ctx) {
    throw new Error(
      "useCartNotification doit être utilisé dans un CartNotificationProvider",
    );
  }
  return ctx;
}
