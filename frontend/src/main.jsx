import { ViteReactSSG } from "vite-react-ssg";
import { HelmetProvider } from "react-helmet-async";
import { lazy } from "react";
import App from "./App.jsx";
import "./styles/index.css";

// Pages publiques
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
const BundleList = lazy(() => import("./pages/BundleList"));
const BundleDetail = lazy(() => import("./pages/BundleDetail"));
const GoogleCallback = lazy(() => import("./pages/GoogleCallback"));

// Admin : un seul lazy
const AdminWrapper = lazy(() => import("./AdminWrapper.jsx"));

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
          // Admin : route enfant, donc AdminWrapper n'est monté que sur /admin/*
          { path: "admin/*", element: <AdminWrapper /> },
          { path: "*", element: <NotFound /> },
        ],
      },
    ],
  },
  ({ app }) => <HelmetProvider>{app}</HelmetProvider>,
);
