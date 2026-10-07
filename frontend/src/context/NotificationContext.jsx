import { createContext, useContext, useState } from "react";
import CartNotification from "../components/CartNotification";

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification must be used within NotificationProvider");
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notification, setNotification] = useState({
    isVisible: false,
    product: null,
    quantity: 1,
  });

  const showNotification = (product, quantity = 1) => {
    setNotification({
      isVisible: true,
      product,
      quantity,
    });

    // Ferme automatiquement après 5 secondes
    setTimeout(() => {
      hideNotification();
    }, 5000);
  };

  const hideNotification = () => {
    setNotification({
      isVisible: false,
      product: null,
      quantity: 1,
    });
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}

      {/* Pop-up globale unique */}
      <CartNotification
        product={notification.product}
        quantity={notification.quantity}
        isVisible={notification.isVisible}
        onClose={hideNotification}
      />
    </NotificationContext.Provider>
  );
};
