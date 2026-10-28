import { ViteReactSSG } from "vite-react-ssg";
import { HelmetProvider } from "react-helmet-async";
import { lazy } from "react";
import App from "./App.jsx";
import "./styles/index.css";
import { Navigate } from "react-router-dom";

// Lazy imports des pages
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

export const createRoot = ViteReactSSG(
  {
    routes: [
      {
        path: "/",
        element: <App />,
        children: [
          { index: true, element: <Home /> },
          { path: "products", element: <ProductList /> },
          { path: "products/:slug", element: <ProductDetail /> },
          { path: "coffrets", element: <BundleList /> },
          { path: "coffrets/:slug", element: <BundleDetail /> },
          { path: "cart", element: <Cart /> },
          { path: "checkout", element: <Checkout /> },
          {
            path: "order-confirmation/:orderId",
            element: <OrderConfirmation />,
          },
          { path: "login", element: <Login /> },
          { path: "register", element: <Register /> },
          { path: "account", element: <Account /> },
          { path: "account/orders/:orderId", element: <OrderDetail /> },
          { path: "favoris", element: <Wishlist /> },
          { path: "blog", element: <Blog /> },
          { path: "blog/:id", element: <BlogPost /> },
          { path: "quiz", element: <Quiz /> },
          { path: "forgot-password", element: <ForgotPassword /> },
          { path: "reset-password", element: <ResetPassword /> },
          { path: "auth/google/callback", element: <GoogleCallback /> },
          { path: "terms", element: <Terms /> },
          { path: "mentions-legales", element: <LegalNotice /> },
          { path: "politique-confidentialite", element: <PrivacyPolicy /> },
          { path: "about", element: <About /> },
          { path: "engagement", element: <Commitments /> },
          { path: "faq", element: <FAQ /> },
          { path: "contact", element: <Contact /> },
          { path: "livraison", element: <Delivery /> },
          { path: "paiement", element: <HowToOrder /> },
          { path: "garantie", element: <Guarantee /> },
          { path: "admin/login", element: <AdminLogin /> },
          {
            path: "admin",
            element: <AdminLayout />,
            children: [
              { path: "dashboard", element: <AdminDashboard /> },
              { path: "orders", element: <AdminOrders /> },
              { path: "products", element: <AdminProducts /> },
              { path: "bundles", element: <AdminBundles /> },
              { path: "bundle-categories", element: <AdminBundleCategories /> },
              { path: "stock-requests", element: <AdminStockRequests /> },
              { path: "promo-codes", element: <AdminPromoCodes /> },
              { path: "homepage-videos", element: <AdminHomepageVideos /> },
              { path: "users", element: <AdminUsers /> },
              { path: "reviews", element: <AdminReviews /> },
              { path: "contacts", element: <AdminContacts /> },
              { path: "newsletter", element: <AdminNewsletter /> },
              { path: "categories", element: <AdminCategories /> },
              { path: "blog", element: <AdminBlog /> },
              { path: "hygiene-section", element: <AdminHygieneSection /> },
              { path: "quiz", element: <AdminQuiz /> },
              { path: "shipping", element: <AdminShipping /> },
              { path: "site-settings", element: <AdminSiteSettings /> },
              { path: "category-showcase", element: <AdminCategoryShowcase /> },
              { path: "featured-section", element: <AdminFeaturedSection /> },
              { path: "hero-slides", element: <AdminHeroSlides /> },
              {
                path: "promotions",
                element: <AdminPromotionsLayout />,
                children: [
                  { index: true, element: <Navigate to="banniere" replace /> },
                  { path: "banniere", element: <AdminPromoBanner /> },
                  { path: "top-promo", element: <AdminPromoSection /> },
                  { path: "assistant", element: <AdminPromotions /> },
                  { path: "campagnes", element: <AdminPromoCampaigns /> },
                ],
              },
            ],
          },
          { path: "*", element: <NotFound /> },
        ],
      },
    ],
  },
  // On enveloppe l'application dans HelmetProvider pour le SEO
  ({ app }) => {
    return <HelmetProvider>{app}</HelmetProvider>;
  },
);
