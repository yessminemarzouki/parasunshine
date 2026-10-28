import { lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

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
const AdminCategoryShowcase = lazy(
  () => import("./admin/pages/AdminCategoryShowcase"),
);

export default function AdminApp() {
  return (
    <Routes>
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="bundles" element={<AdminBundles />} />
        <Route path="bundle-categories" element={<AdminBundleCategories />} />
        <Route path="stock-requests" element={<AdminStockRequests />} />
        <Route path="promo-codes" element={<AdminPromoCodes />} />
        <Route path="homepage-videos" element={<AdminHomepageVideos />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="reviews" element={<AdminReviews />} />
        <Route path="contacts" element={<AdminContacts />} />
        <Route path="newsletter" element={<AdminNewsletter />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="blog" element={<AdminBlog />} />
        <Route path="hygiene-section" element={<AdminHygieneSection />} />
        <Route path="quiz" element={<AdminQuiz />} />
        <Route path="shipping" element={<AdminShipping />} />
        <Route path="site-settings" element={<AdminSiteSettings />} />
        <Route path="category-showcase" element={<AdminCategoryShowcase />} />
        <Route path="featured-section" element={<AdminFeaturedSection />} />
        <Route path="hero-slides" element={<AdminHeroSlides />} />
        <Route path="promotions" element={<AdminPromotionsLayout />}>
          <Route index element={<Navigate to="banniere" replace />} />
          <Route path="banniere" element={<AdminPromoBanner />} />
          <Route path="top-promo" element={<AdminPromoSection />} />
          <Route path="assistant" element={<AdminPromotions />} />
          <Route path="campagnes" element={<AdminPromoCampaigns />} />
        </Route>
      </Route>
    </Routes>
  );
}
