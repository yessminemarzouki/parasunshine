import { Suspense, useState, useEffect } from "react";
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

// Version SSG : on n'affiche ni Header, ni Navigation, ni FloatingQuizButton
// qui utilisent des hooks React Router
function LayoutSsg({ children }) {
  return (
    <div className="app">
      <main className="main-content">{children}</main>
    </div>
  );
}

// Version client : tout est affiché
function LayoutClient({ children }) {
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
}

export default function App() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const Layout = isClient ? LayoutClient : LayoutSsg;

  return (
    <SiteSettingsProvider>
      <CartProvider>
        <WishlistProvider>
          <NotificationProvider>
            <CartNotificationProvider>
              {isClient && <ScrollToTop />}
              <Layout>
                <Suspense fallback={<PageLoader />}>
                  <Outlet />
                </Suspense>
              </Layout>
            </CartNotificationProvider>
          </NotificationProvider>
        </WishlistProvider>
      </CartProvider>
    </SiteSettingsProvider>
  );
}
