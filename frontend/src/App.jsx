import { Suspense } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { CartProvider } from "./context/CartContext";
import { NotificationProvider } from "./context/NotificationContext";
import { WishlistProvider } from "./context/WishlistContext";
import { SiteSettingsProvider } from "./context/SiteSettingsContext";
import Header from "./components/Header";
import Navigation from "./components/Navigation";
import Footer from "./components/Footer";
import { CartNotificationProvider } from "./context/CartNotificationContext";
import ScrollToTop from "./components/ScrollToTop";
import FloatingQuizButton from "./components/FloatingQuizButton";

const PageLoader = () => (
  <div
    style={{
      minHeight: "60vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <div className="spinner"></div>
  </div>
);

const LayoutWrapper = ({ children }) => {
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith("/admin");

  return (
    <div className="app">
      {!isAdminPath && <Header />}
      {!isAdminPath && <Navigation />}
      <main className={isAdminPath ? "" : "main-content"}>{children}</main>
      {!isAdminPath && <Footer />}
      {!isAdminPath && <FloatingQuizButton />}
    </div>
  );
};

export default function App() {
  return (
    <SiteSettingsProvider>
      <CartProvider>
        <WishlistProvider>
          <NotificationProvider>
            <CartNotificationProvider>
              <ScrollToTop />
              <LayoutWrapper>
                <Suspense fallback={<PageLoader />}>
                  <Outlet />
                </Suspense>
              </LayoutWrapper>
            </CartNotificationProvider>
          </NotificationProvider>
        </WishlistProvider>
      </CartProvider>
    </SiteSettingsProvider>
  );
}
