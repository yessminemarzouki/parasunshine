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
import Header from "./components/Header";
import Navigation from "./components/Navigation";
import Footer from "./components/Footer";
import ScrollToTop from "./components/ScrollToTop";
import GoogleCallback from "./pages/GoogleCallback";
import FloatingQuizButton from "./components/FloatingQuizButton";
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
    <CartProvider>
      <WishlistProvider>
        <BrowserRouter>
          <NotificationProvider>
            <ScrollToTop />
            <LayoutWrapper>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/products" element={<ProductList />} />
                  <Route path="/products/:slug" element={<ProductDetail />} />
                  <Route path="coffrets" element={<BundleList />} />
                  <Route path="coffrets/:slug" element={<BundleDetail />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route
                    path="/order-confirmation/:orderId"
                    element={<OrderConfirmation />}
                  />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/account" element={<Account />} />
                  <Route
                    path="/account/orders/:orderId"
                    element={<OrderDetail />}
                  />
                  <Route path="/favoris" element={<Wishlist />} />
                  <Route path="/blog" element={<Blog />} />
                  <Route path="/blog/:id" element={<BlogPost />} />
                  <Route path="/quiz" element={<Quiz />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route
                    path="/auth/google/callback"
                    element={<GoogleCallback />}
                  />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/mentions-legales" element={<LegalNotice />} />
                  <Route
                    path="/politique-confidentialite"
                    element={<PrivacyPolicy />}
                  />
                  <Route path="/about" element={<About />} />
                  <Route path="/engagement" element={<Commitments />} />
                  <Route path="/faq" element={<FAQ />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/livraison" element={<Delivery />} />
                  <Route path="/paiement" element={<HowToOrder />} />
                  <Route path="/garantie" element={<Guarantee />} />
                  <Route path="/admin/login" element={<AdminLogin />} />
                  <Route path="/admin" element={<AdminLayout />}>
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route path="orders" element={<AdminOrders />} />
                    <Route path="products" element={<AdminProducts />} />
                    <Route path="bundles" element={<AdminBundles />} />
                    <Route
                      path="bundle-categories"
                      element={<AdminBundleCategories />}
                    />
                    <Route
                      path="stock-requests"
                      element={<AdminStockRequests />}
                    />
                    <Route path="promo-codes" element={<AdminPromoCodes />} />
                    <Route
                      path="homepage-videos"
                      element={<AdminHomepageVideos />}
                    />
                    <Route path="users" element={<AdminUsers />} />
                    <Route path="reviews" element={<AdminReviews />} />
                    <Route path="contacts" element={<AdminContacts />} />
                    <Route path="newsletter" element={<AdminNewsletter />} />
                    <Route path="categories" element={<AdminCategories />} />
                    <Route path="blog" element={<AdminBlog />} />
                    <Route
                      path="hygiene-section"
                      element={<AdminHygieneSection />}
                    />
                    <Route path="quiz" element={<AdminQuiz />} />
                    <Route path="shipping" element={<AdminShipping />} />
                    <Route
                      path="category-showcase"
                      element={<AdminCategoryShowcase />}
                    />
                    <Route
                      path="featured-section"
                      element={<AdminFeaturedSection />}
                    />
                    <Route
                      path="promotions"
                      element={<AdminPromotionsLayout />}
                    >
                      <Route
                        index
                        element={<Navigate to="banniere" replace />}
                      />
                      <Route path="banniere" element={<AdminPromoBanner />} />
                      <Route path="hero-slides" element={<AdminHeroSlides />} />
                      <Route path="top-promo" element={<AdminPromoSection />} />
                      <Route path="assistant" element={<AdminPromotions />} />
                      <Route
                        path="campagnes"
                        element={<AdminPromoCampaigns />}
                      />
                    </Route>
                  </Route>
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </LayoutWrapper>
          </NotificationProvider>
        </BrowserRouter>
      </WishlistProvider>
    </CartProvider>
  );
}

export default App;
