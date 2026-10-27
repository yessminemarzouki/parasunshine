import { lazy, Suspense } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";
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

// GoogleCallback est maintenant lazy (était en import direct)
const GoogleCallback = lazy(() => import("./pages/GoogleCallback"));

const AdminCategoryShowcase = lazy(
  () => import("./admin/pages/AdminCategoryShowcase"),
);
const Home = lazy(() => import("./pages/Home"));
const ProductList = lazy(() => import("./pages/ProductList"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const OrderConfirmation = lazy(() => import("./pages/OrderConfirmation"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Account = lazy(() => import("./pages/Account"));
const OrderDetail = lazy(() => import("./pages/OrderDetail"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const Quiz = lazy(() => import("./pages/Quiz"));
const Terms = lazy(() => import("./pages/Terms"));
const LegalNotice = lazy(() => import("./pages/LegalNotice"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const About = lazy(() => import("./pages/About"));
const Commitments = lazy(() => import("./pages/Commitments"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Contact = lazy(() => import("./pages/Contact"));
const Delivery = lazy(() => import("./pages/Delivery"));
const HowToOrder = lazy(() => import("./pages/HowToOrder"));
const Guarantee = lazy(() => import("./pages/Guarantee"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AdminLogin = lazy(() => import("./admin/pages/AdminLogin"));
const AdminLayout = lazy(() => import("./admin/components/AdminLayout"));
const AdminDashboard = lazy(() => import("./admin/pages/AdminDashboard"));
const AdminOrders = lazy(() => import("./admin/pages/AdminOrders"));
const AdminProducts = lazy(() => import("./admin/pages/AdminProducts"));
const AdminBundles = lazy(() => import("./admin/pages/AdminBundles"));
const AdminBundleCategories = lazy(
  () => import("./admin/pages/AdminBundleCategories"),
);
const AdminUsers = lazy(() => import("./admin/pages/AdminUsers"));
const AdminReviews = lazy(() => import("./admin/pages/AdminReviews"));
const AdminContacts = lazy(() => import("./admin/pages/AdminContacts"));
const AdminNewsletter = lazy(() => import("./admin/pages/AdminNewsletter"));
const AdminCategories = lazy(() => import("./admin/pages/AdminCategories"));
const AdminPromoBanner = lazy(() => import("./admin/pages/AdminPromoBanner"));
const AdminHeroSlides = lazy(() => import("./admin/pages/AdminHeroSlides"));
const AdminPromoCampaigns = lazy(
  () => import("./admin/pages/AdminPromoCampaigns"),
);
const AdminPromotionsLayout = lazy(
  () => import("./admin/components/AdminPromotionsLayout"),
);
const AdminBlog = lazy(() => import("./admin/pages/AdminBlog"));
const AdminHygieneSection = lazy(
  () => import("./admin/pages/AdminHygieneSection"),
);
const BundleList = lazy(() => import("./pages/BundleList"));
const BundleDetail = lazy(() => import("./pages/BundleDetail"));
const AdminPromoSection = lazy(() => import("./admin/pages/AdminPromoSection"));
const AdminQuiz = lazy(() => import("./admin/pages/AdminQuiz"));
const AdminPromotions = lazy(() => import("./admin/pages/AdminPromotions"));
const AdminShipping = lazy(() => import("./admin/pages/AdminShipping"));
const AdminSiteSettings = lazy(() => import("./admin/pages/AdminSiteSettings"));
const AdminStockRequests = lazy(
  () => import("./admin/pages/AdminStockRequests"),
);
const AdminFeaturedSection = lazy(
  () => import("./admin/pages/AdminFeaturedSection"),
);
const AdminPromoCodes = lazy(() => import("./admin/pages/AdminPromoCodes"));
const AdminHomepageVideos = lazy(
  () => import("./admin/pages/AdminHomepageVideos"),
);

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

function App() {
  return (
    <SiteSettingsProvider>
      <CartProvider>
        <WishlistProvider>
          <BrowserRouter>
            <NotificationProvider>
              <CartNotificationProvider>
                <ScrollToTop />
                <LayoutWrapper>
                  {/* Suspense local par route → le Hero ne bloque plus */}
                  <Routes>
                    <Route
                      path="/"
                      element={
                        <Suspense fallback={<PageLoader />}>
                          <Home />
                        </Suspense>
                      }
                    />
                    <Route
                      path="/products"
                      element={
                        <Suspense fallback={<PageLoader />}>
                          <ProductList />
                        </Suspense>
                      }
                    />
                    <Route
                      path="/products/:slug"
                      element={
                        <Suspense fallback={<PageLoader />}>
                          <ProductDetail />
                        </Suspense>
                      }
                    />
                    <Route
                      path="coffrets"
                      element={
                        <Suspense fallback={<PageLoader />}>
                          <BundleList />
                        </Suspense>
                      }
                    />
                    <Route
                      path="coffrets/:slug"
                      element={
                        <Suspense fallback={<PageLoader />}>
                          <BundleDetail />
                        </Suspense>
                      }
                    />
                    <Route
                      path="/cart"
                      element={
                        <Suspense fallback={<PageLoader />}>
                          <Cart />
                        </Suspense>
                      }
                    />
                    <Route
                      path="/checkout"
                      element={
                        <Suspense fallback={<PageLoader />}>
                          <Checkout />
                        </Suspense>
                      }
                    />
                    <Route
                      path="/order-confirmation/:orderId"
                      element={
                        <Suspense fallback={<PageLoader />}>
                          <OrderConfirmation />
                        </Suspense>
                      }
                    />
                    <Route
                      path="/login"
                      element={
                        <Suspense fallback={<PageLoader />}>
                          <Login />
                        </Suspense>
                      }
                    />
                    <Route
                      path="/register"
                      element={
                        <Suspense fallback={<PageLoader />}>
                          <Register />
                        </Suspense>
                      }
                    />
                    <Route
                      path="/account"
                      element={
                        <Suspense fallback={<PageLoader />}>
                          <Account />
                        </Suspense>
                      }
                    />
                    <Route
                      path="/account/orders/:orderId"
                      element={
                        <Suspense fallback={<PageLoader />}>
                          <OrderDetail />
                        </Suspense>
                      }
                    />
                    <Route
                      path="/favoris"
                      element={
                        <Suspense fallback={<PageLoader />}>
                          <Wishlist />
                        </Suspense>
                      }
                    />
                    <Route
                      path="/blog"
                      element={
                        <Suspense fallback={<PageLoader />}>
                          <Blog />
                        </Suspense>
                      }
                    />
                    <Route
                      path="/blog/:id"
                      element={
                        <Suspense fallback={<PageLoader />}>
                          <BlogPost />
                        </Suspense>
                      }
                    />
                    <Route
                      path="/quiz"
                      element={
                        <Suspense fallback={<PageLoader />}>
                          <Quiz />
                        </Suspense>
                      }
                    />
                    <Route
                      path="/forgot-password"
                      element={
                        <Suspense fallback={<PageLoader />}>
                          <ForgotPassword />
                        </Suspense>
                      }
                    />
                    <Route
                      path="/reset-password"
                      element={
                        <Suspense fallback={<PageLoader />}>
                          <ResetPassword />
                        </Suspense>
                      }
                    />
                    <Route
                      path="/auth/google/callback"
                      element={
                        <Suspense fallback={<PageLoader />}>
                          <GoogleCallback />
                        </Suspense>
                      }
                    />
                    <Route
                      path="/terms"
                      element={
                        <Suspense fallback={<PageLoader />}>
                          <Terms />
                        </Suspense>
                      }
                    />
                    <Route
                      path="/mentions-legales"
                      element={
                        <Suspense fallback={<PageLoader />}>
                          <LegalNotice />
                        </Suspense>
                      }
                    />
                    <Route
                      path="/politique-confidentialite"
                      element={
                        <Suspense fallback={<PageLoader />}>
                          <PrivacyPolicy />
                        </Suspense>
                      }
                    />
                    <Route
                      path="/about"
                      element={
                        <Suspense fallback={<PageLoader />}>
                          <About />
                        </Suspense>
                      }
                    />
                    <Route
                      path="/engagement"
                      element={
                        <Suspense fallback={<PageLoader />}>
                          <Commitments />
                        </Suspense>
                      }
                    />
                    <Route
                      path="/faq"
                      element={
                        <Suspense fallback={<PageLoader />}>
                          <FAQ />
                        </Suspense>
                      }
                    />
                    <Route
                      path="/contact"
                      element={
                        <Suspense fallback={<PageLoader />}>
                          <Contact />
                        </Suspense>
                      }
                    />
                    <Route
                      path="/livraison"
                      element={
                        <Suspense fallback={<PageLoader />}>
                          <Delivery />
                        </Suspense>
                      }
                    />
                    <Route
                      path="/paiement"
                      element={
                        <Suspense fallback={<PageLoader />}>
                          <HowToOrder />
                        </Suspense>
                      }
                    />
                    <Route
                      path="/garantie"
                      element={
                        <Suspense fallback={<PageLoader />}>
                          <Guarantee />
                        </Suspense>
                      }
                    />
                    <Route
                      path="/admin/login"
                      element={
                        <Suspense fallback={<PageLoader />}>
                          <AdminLogin />
                        </Suspense>
                      }
                    />
                    <Route
                      path="/admin"
                      element={
                        <Suspense fallback={<PageLoader />}>
                          <AdminLayout />
                        </Suspense>
                      }
                    >
                      <Route
                        path="dashboard"
                        element={
                          <Suspense fallback={<PageLoader />}>
                            <AdminDashboard />
                          </Suspense>
                        }
                      />
                      <Route
                        path="orders"
                        element={
                          <Suspense fallback={<PageLoader />}>
                            <AdminOrders />
                          </Suspense>
                        }
                      />
                      <Route
                        path="products"
                        element={
                          <Suspense fallback={<PageLoader />}>
                            <AdminProducts />
                          </Suspense>
                        }
                      />
                      <Route
                        path="bundles"
                        element={
                          <Suspense fallback={<PageLoader />}>
                            <AdminBundles />
                          </Suspense>
                        }
                      />
                      <Route
                        path="bundle-categories"
                        element={
                          <Suspense fallback={<PageLoader />}>
                            <AdminBundleCategories />
                          </Suspense>
                        }
                      />
                      <Route
                        path="stock-requests"
                        element={
                          <Suspense fallback={<PageLoader />}>
                            <AdminStockRequests />
                          </Suspense>
                        }
                      />
                      <Route
                        path="promo-codes"
                        element={
                          <Suspense fallback={<PageLoader />}>
                            <AdminPromoCodes />
                          </Suspense>
                        }
                      />
                      <Route
                        path="homepage-videos"
                        element={
                          <Suspense fallback={<PageLoader />}>
                            <AdminHomepageVideos />
                          </Suspense>
                        }
                      />
                      <Route
                        path="users"
                        element={
                          <Suspense fallback={<PageLoader />}>
                            <AdminUsers />
                          </Suspense>
                        }
                      />
                      <Route
                        path="reviews"
                        element={
                          <Suspense fallback={<PageLoader />}>
                            <AdminReviews />
                          </Suspense>
                        }
                      />
                      <Route
                        path="contacts"
                        element={
                          <Suspense fallback={<PageLoader />}>
                            <AdminContacts />
                          </Suspense>
                        }
                      />
                      <Route
                        path="newsletter"
                        element={
                          <Suspense fallback={<PageLoader />}>
                            <AdminNewsletter />
                          </Suspense>
                        }
                      />
                      <Route
                        path="categories"
                        element={
                          <Suspense fallback={<PageLoader />}>
                            <AdminCategories />
                          </Suspense>
                        }
                      />
                      <Route
                        path="blog"
                        element={
                          <Suspense fallback={<PageLoader />}>
                            <AdminBlog />
                          </Suspense>
                        }
                      />
                      <Route
                        path="hygiene-section"
                        element={
                          <Suspense fallback={<PageLoader />}>
                            <AdminHygieneSection />
                          </Suspense>
                        }
                      />
                      <Route
                        path="quiz"
                        element={
                          <Suspense fallback={<PageLoader />}>
                            <AdminQuiz />
                          </Suspense>
                        }
                      />
                      <Route
                        path="shipping"
                        element={
                          <Suspense fallback={<PageLoader />}>
                            <AdminShipping />
                          </Suspense>
                        }
                      />
                      <Route
                        path="site-settings"
                        element={
                          <Suspense fallback={<PageLoader />}>
                            <AdminSiteSettings />
                          </Suspense>
                        }
                      />
                      <Route
                        path="category-showcase"
                        element={
                          <Suspense fallback={<PageLoader />}>
                            <AdminCategoryShowcase />
                          </Suspense>
                        }
                      />
                      <Route
                        path="featured-section"
                        element={
                          <Suspense fallback={<PageLoader />}>
                            <AdminFeaturedSection />
                          </Suspense>
                        }
                      />
                      <Route
                        path="hero-slides"
                        element={
                          <Suspense fallback={<PageLoader />}>
                            <AdminHeroSlides />
                          </Suspense>
                        }
                      />
                      <Route
                        path="promotions"
                        element={
                          <Suspense fallback={<PageLoader />}>
                            <AdminPromotionsLayout />
                          </Suspense>
                        }
                      >
                        <Route
                          index
                          element={<Navigate to="banniere" replace />}
                        />
                        <Route
                          path="banniere"
                          element={
                            <Suspense fallback={<PageLoader />}>
                              <AdminPromoBanner />
                            </Suspense>
                          }
                        />
                        <Route
                          path="top-promo"
                          element={
                            <Suspense fallback={<PageLoader />}>
                              <AdminPromoSection />
                            </Suspense>
                          }
                        />
                        <Route
                          path="assistant"
                          element={
                            <Suspense fallback={<PageLoader />}>
                              <AdminPromotions />
                            </Suspense>
                          }
                        />
                        <Route
                          path="campagnes"
                          element={
                            <Suspense fallback={<PageLoader />}>
                              <AdminPromoCampaigns />
                            </Suspense>
                          }
                        />
                      </Route>
                    </Route>
                    <Route
                      path="*"
                      element={
                        <Suspense fallback={<PageLoader />}>
                          <NotFound />
                        </Suspense>
                      }
                    />
                  </Routes>
                </LayoutWrapper>
              </CartNotificationProvider>
            </NotificationProvider>
          </BrowserRouter>
        </WishlistProvider>
      </CartProvider>
    </SiteSettingsProvider>
  );
}

export default App;
