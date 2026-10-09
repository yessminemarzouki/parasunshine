<?php

use App\Http\Controllers\Api\FeaturedSectionController;
use App\Http\Controllers\Api\Admin\AdminFeaturedSectionController;
use App\Http\Controllers\Api\CategoryShowcaseController;
use App\Http\Controllers\Api\Admin\AdminCategoryShowcaseController;
use App\Http\Controllers\Api\Admin\AdminStockRequestController;
use App\Http\Controllers\Api\AddressController;
use App\Http\Controllers\Api\QuizController;
use App\Http\Controllers\Api\Admin\AdminQuizController;
use App\Http\Controllers\Api\Admin\AdminPromoSectionController;
use App\Http\Controllers\Api\Admin\AdminHygieneSectionController;
use App\Http\Controllers\Api\Admin\AdminBlogController;
use App\Http\Controllers\Api\BundleController;
use App\Http\Controllers\Api\BundleReviewController;
use App\Http\Controllers\Api\Admin\AdminBundleController;
use App\Http\Controllers\Api\Admin\AdminBundleCategoryController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\AbandonedCartController;
use App\Http\Controllers\Api\WishlistController;
use App\Http\Controllers\Api\ContactController;
use App\Http\Controllers\Api\NewsletterController;
use App\Http\Controllers\Api\Admin\AdminStatsController;
use App\Http\Controllers\Api\Admin\AdminOrderController;
use App\Http\Controllers\Api\Admin\AdminProductController;
use App\Http\Controllers\Api\Admin\AdminUserController;
use App\Http\Controllers\Api\Admin\AdminReviewController;
use App\Http\Controllers\Api\Admin\AdminContactController;
use App\Http\Controllers\Api\Admin\AdminCategoryController;
use App\Http\Controllers\Api\Admin\AdminPromoBannerController;
use App\Http\Controllers\Api\Admin\AdminHeroSlideController;
use App\Http\Controllers\Api\HeroSlideController;
use App\Http\Controllers\Api\Admin\AdminPromotionController;
use App\Http\Controllers\Api\Admin\AdminShippingController;
use App\Http\Controllers\Api\ShippingController;

// ========================================
// AUTHENTIFICATION (publiques)
// ========================================
Route::middleware('throttle:register')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
});

Route::middleware('throttle:6,1')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
});

Route::get('/auth/google', [AuthController::class, 'redirectToGoogle']);
Route::get('/auth/google/callback', [AuthController::class, 'handleGoogleCallback']);
Route::post('/auth/google/exchange', [AuthController::class, 'exchangeGoogleCode']);
Route::post('/password/email', [AuthController::class, 'sendResetLinkEmail']);
Route::post('/password/reset', [AuthController::class, 'resetPassword']);

// ========================================
// ROUTES PROTÉGÉES (connecté)
// ========================================
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::put('/user/profile', [AuthController::class, 'updateProfile']);
    Route::put('/user/password', [AuthController::class, 'updatePassword']);

    Route::middleware('throttle:orders')->group(function () {
        Route::post('/orders', [OrderController::class, 'store']);
    });
    Route::get('/orders', [OrderController::class, 'index']);
    Route::get('/orders/{id}', [OrderController::class, 'show']);

    Route::get('/wishlist', [WishlistController::class, 'index']);
    Route::post('/wishlist', [WishlistController::class, 'store']);
    Route::delete('/wishlist/{productId}', [WishlistController::class, 'destroy']);
    Route::get('/wishlist/check/{productId}', [WishlistController::class, 'check']);

    // Adresses
    Route::get('/addresses', [AddressController::class, 'index']);
    Route::post('/addresses', [AddressController::class, 'store']);
    Route::put('/addresses/{id}', [AddressController::class, 'update']);
    Route::delete('/addresses/{id}', [AddressController::class, 'destroy']);
    Route::put('/addresses/{id}/default', [AddressController::class, 'setDefault']);

    Route::post('/reviews', [ReviewController::class, 'store']);
    Route::put('/reviews/{id}', [ReviewController::class, 'update']);
    Route::delete('/reviews/{id}', [ReviewController::class, 'destroy']);
    Route::get('/reviews/check/{productId}', [ReviewController::class, 'checkUserReview']);

    // Favoris — coffrets
    Route::post('/wishlist/bundle', [WishlistController::class, 'storeBundle']);
    Route::delete('/wishlist/bundle/{bundleId}', [WishlistController::class, 'destroyBundle']);

    // Mes demandes de stock
    Route::get('/my-stock-requests', [ProductController::class, 'myStockRequests']);
});

// ========================================
// PRODUITS & CATALOGUE (publiques)
// ========================================
Route::get('/home', [ProductController::class, 'home']);
Route::get('/categories', [ProductController::class, 'categories']);
Route::get('/brands', [ProductController::class, 'brands']);
Route::get('/categories/{slug}/brands', [ProductController::class, 'brandsByCategory']);
Route::get('/products/filter', [ProductController::class, 'filter']);
Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/featured', [ProductController::class, 'featured']);
Route::get('/products/newest', [ProductController::class, 'newest']);
Route::get('/products/promotions', [ProductController::class, 'promotions']);
Route::get('/products/bestsellers', [ProductController::class, 'bestsellers']);
Route::get('/products/search', [ProductController::class, 'search']);
Route::get('/products/{slug}', [ProductController::class, 'show']);
Route::post('/products/{id}/notify', [ProductController::class, 'notifyMe']);
Route::get('/products/{productId}/reviews', [ReviewController::class, 'index']);
Route::get('/hygiene-section', [AdminHygieneSectionController::class, 'public']);
Route::get('/category-showcase', [CategoryShowcaseController::class, 'show']);
Route::get('/featured-section', [FeaturedSectionController::class, 'show']);
Route::get('/homepage-videos', [\App\Http\Controllers\Api\HomepageVideoController::class, 'index']);
Route::get('/hero-slides', [HeroSlideController::class, 'index']);
// ========================================
// COFFRETS (publiques)
// ========================================
Route::get('/bundles', [BundleController::class, 'index']);
Route::get('/bundles/{slug}', [BundleController::class, 'show']);
Route::get('/bundle-categories', [BundleController::class, 'categories']);
Route::get('/bundles/{bundleId}/reviews', [BundleReviewController::class, 'index']);
Route::post('/bundles/{id}/notify', [BundleController::class, 'notifyMe']);
Route::post('/promo-codes/validate', [\App\Http\Controllers\Api\PromoCodeController::class, 'validateCode']);
Route::middleware('throttle:10,1')->group(function () {
    Route::post('/bundle-reviews', [BundleReviewController::class, 'store']);
});

// ========================================
// PANIER ABANDONNÉ (public)
// ========================================
Route::middleware('throttle:30,1')->group(function () {
    Route::post('/abandoned-cart', [AbandonedCartController::class, 'store']);
});

// ========================================
// CONTACT & NEWSLETTER (publiques)
// ========================================
Route::middleware('throttle:10,1')->group(function () {
    Route::post('/contact', [ContactController::class, 'store']);
});
Route::middleware('throttle:10,1')->group(function () {
    Route::post('/newsletter/subscribe', [NewsletterController::class, 'subscribe']);
    Route::post('/newsletter/unsubscribe', [NewsletterController::class, 'unsubscribe']);
});
Route::get('/promo-banner', [AdminPromoBannerController::class, 'show']);
Route::get('/blog', [AdminBlogController::class, 'publicIndex']);
Route::get('/blog/{id}', [AdminBlogController::class, 'publicShow']);
Route::get('/promo-section', [AdminPromoSectionController::class, 'public']);
Route::get('/shipping-settings', [ShippingController::class, 'show']);
Route::get('/quiz/solutions', [QuizController::class, 'solutions']);
Route::get('/quiz/solutions/{slug}/questions', [QuizController::class, 'questions']);
Route::middleware('throttle:20,1')->group(function () {
    Route::post('/quiz/submit', [QuizController::class, 'submit']);
});


// ========================================
// ROUTES ADMIN (connecté + role admin)
// ========================================
Route::prefix('admin')->middleware(['auth:sanctum', 'admin', 'throttle:120,1'])->group(function () {

    // Stats
    Route::get('/stats', [AdminStatsController::class, 'index']);
    Route::get('/stats/badges', [AdminStatsController::class, 'badges']);

    // Promo Banner
    Route::get('/promo-banner', [AdminPromoBannerController::class, 'show']);
    Route::put('/promo-banner', [AdminPromoBannerController::class, 'update']);

    // Hero Slides (Carrousel)
    Route::get('/hero-slides', [AdminHeroSlideController::class, 'index']);
    Route::post('/hero-slides', [AdminHeroSlideController::class, 'store']);
    Route::post('/hero-slides/{heroSlide}', [AdminHeroSlideController::class, 'update']);
    Route::delete('/hero-slides/{heroSlide}', [AdminHeroSlideController::class, 'destroy']);
    Route::patch('/hero-slides/{heroSlide}/toggle', [AdminHeroSlideController::class, 'toggle']);
    Route::post('/hero-slides/reorder', [AdminHeroSlideController::class, 'reorder']);

    // Commandes
    Route::get('/orders', [AdminOrderController::class, 'index']);
    Route::get('/orders/{order}', [AdminOrderController::class, 'show']);
    Route::put('/orders/{order}/status', [AdminOrderController::class, 'updateStatus']);
    // ── Produits (toutes les routes AVANT {product} doivent être déclarées en premier) ──
    Route::get('/products/export', [AdminProductController::class, 'exportExcel']);   // ← AJOUT
    Route::post('/products/import', [AdminProductController::class, 'importCsv']);
    Route::post('/products/import-main-images-zip', [AdminProductController::class, 'importMainImagesZip']);
    Route::post('/products/import-optional-images-zip', [AdminProductController::class, 'importOptionalImagesZip']);
    Route::post('/products/bulk-destroy', [AdminProductController::class, 'bulkDestroy']);
    Route::post('/products/bulk-toggle', [AdminProductController::class, 'bulkToggle']);
    Route::get('/products', [AdminProductController::class, 'index']);
    Route::get('/products/{product}', [AdminProductController::class, 'show']);
    Route::post('/products', [AdminProductController::class, 'store']);
    Route::put('/products/{product}', [AdminProductController::class, 'update']);
    Route::post('/products/{product}', [AdminProductController::class, 'update']);
    Route::get('/products/{product}/stats', [AdminProductController::class, 'stats']);

    // Utilisateurs
    Route::get('/users', [AdminUserController::class, 'index']);
    Route::get('/users/{user}', [AdminUserController::class, 'show']);

    // Avis
    Route::get('/reviews', [AdminReviewController::class, 'index']);
    Route::put('/reviews/{review}/approve', [AdminReviewController::class, 'approve']);
    Route::put('/reviews/{review}/reject', [AdminReviewController::class, 'reject']);

    // Adresses
    Route::get('/addresses', [AddressController::class, 'index']);
    Route::post('/addresses', [AddressController::class, 'store']);
    Route::put('/addresses/{id}', [AddressController::class, 'update']);
    Route::delete('/addresses/{id}', [AddressController::class, 'destroy']);
    Route::put('/addresses/{id}/default', [AddressController::class, 'setDefault']);

    // Contacts
    Route::get('/contacts', [AdminContactController::class, 'contacts']);
    Route::get('/contacts/{contact}', [AdminContactController::class, 'showContact']);
    Route::put('/contacts/{contact}/read', [AdminContactController::class, 'markRead']);

    // Newsletter
    Route::get('/newsletter', [AdminContactController::class, 'newsletter']);

    // Catégories
    Route::get('/categories', [AdminCategoryController::class, 'categories']);
    Route::post('/categories', [AdminCategoryController::class, 'storeCategory']);
    Route::put('/categories/{category}', [AdminCategoryController::class, 'updateCategory']);
    Route::post('/categories/reorder', [AdminCategoryController::class, 'reorderCategories']);
    Route::put('/categories/{category}/brands', [AdminCategoryController::class, 'syncCategoryBrands']);

    // Marques
    Route::get('/brands/export', [AdminCategoryController::class, 'exportBrandsExcel']);
    Route::get('/brands/export-logos-zip', [AdminCategoryController::class, 'exportBrandLogosZip']);
    Route::post('/brands/import', [AdminCategoryController::class, 'importBrandsExcel']);
    Route::post('/brands/import-logos-zip', [AdminCategoryController::class, 'importBrandLogosZip']);
    Route::get('/brands', [AdminCategoryController::class, 'brands']);
    Route::post('/brands', [AdminCategoryController::class, 'storeBrand']);
    Route::put('/brands/{brand}', [AdminCategoryController::class, 'updateBrand']);
    // Coffrets
    Route::get('/bundles-for-menu', [AdminBundleController::class, 'bundlesForMenu']);
    Route::get('/bundles/products/search', [AdminBundleController::class, 'searchProducts']);
    Route::get('/bundles', [AdminBundleController::class, 'index']);
    Route::get('/bundles/{bundle}', [AdminBundleController::class, 'show']);
    Route::post('/bundles', [AdminBundleController::class, 'store']);
    Route::post('/bundles/{bundle}', [AdminBundleController::class, 'update']);

    // Catégories de coffrets
    Route::get('/bundle-categories', [AdminBundleCategoryController::class, 'index']);
    Route::post('/bundle-categories', [AdminBundleCategoryController::class, 'store']);
    Route::put('/bundle-categories/{bundleCategory}', [AdminBundleCategoryController::class, 'update']);
    Route::post('/bundle-categories/reorder', [AdminBundleCategoryController::class, 'reorder']);

    // Blog
    Route::get('/blog', [AdminBlogController::class, 'index']);
    Route::post('/blog', [AdminBlogController::class, 'store']);
    Route::post('/blog/{blogPost}', [AdminBlogController::class, 'update']);
    Route::put('/blog/{blogPost}/toggle-visible', [AdminBlogController::class, 'toggleVisible']);
    Route::put('/blog/toggle-section', [AdminBlogController::class, 'toggleSection']);

    // Hygiene Section
    Route::get('/hygiene-section', [AdminHygieneSectionController::class, 'index']);
    Route::get('/hygiene-section/{hygieneSection}', [AdminHygieneSectionController::class, 'show']);
    Route::post('/hygiene-section', [AdminHygieneSectionController::class, 'store']);
    Route::post('/hygiene-section/{hygieneSection}', [AdminHygieneSectionController::class, 'update']);
    Route::post('/hygiene-section/reorder', [AdminHygieneSectionController::class, 'reorder']);

    // Promo Section
    Route::get('/promo-section', [AdminPromoSectionController::class, 'show']);
    Route::put('/promo-section', [AdminPromoSectionController::class, 'update']);
    Route::get('/promo-section/products', [AdminPromoSectionController::class, 'searchProducts']);
    Route::post('/promo-section/products/{product}', [AdminPromoSectionController::class, 'addProduct']);
    Route::post('/promo-section/add-all-promoted', [AdminPromoSectionController::class, 'addAllPromoted']);

    // Assistant Promotions (recherche intelligente + application groupée)
    Route::get('/promotions/search', [AdminPromotionController::class, 'search']);
    Route::post('/promotions/apply', [AdminPromotionController::class, 'apply']);
    Route::post('/promotions/remove', [AdminPromotionController::class, 'remove']);

    // Livraison
    Route::get('/shipping-settings', [AdminShippingController::class, 'show']);
    Route::put('/shipping-settings', [AdminShippingController::class, 'update']);

    // Quiz — Solutions (parcours)
    Route::get('/quiz/solutions', [AdminQuizController::class, 'solutions']);
    Route::post('/quiz/solutions', [AdminQuizController::class, 'storeSolution']);
    Route::post('/quiz/solutions/{solution}', [AdminQuizController::class, 'updateSolution']);
    Route::patch('/quiz/solutions/{solution}/toggle', [AdminQuizController::class, 'toggleSolutionActive']);

    // Quiz — Questions (par solution)
    Route::get('/quiz/solutions/{solution}/questions', [AdminQuizController::class, 'questions']);
    Route::get('/quiz/solutions/{solution}/suggested-tags', [AdminQuizController::class, 'suggestTags']);
    Route::post('/quiz/questions', [AdminQuizController::class, 'storeQuestion']);
    Route::put('/quiz/questions/{question}', [AdminQuizController::class, 'updateQuestion']);
    Route::patch('/quiz/questions/{question}/toggle', [AdminQuizController::class, 'toggleQuestionActive']);

    // Category Showcase
    Route::get('/category-showcase', [AdminCategoryShowcaseController::class, 'index']);
    Route::post('/category-showcase', [AdminCategoryShowcaseController::class, 'store']);
    Route::post('/category-showcase/{categoryShowcase}', [AdminCategoryShowcaseController::class, 'update']);
    Route::post('/category-showcase/reorder', [AdminCategoryShowcaseController::class, 'reorder']);

    // Featured Section
    Route::get('/featured-section', [AdminFeaturedSectionController::class, 'show']);
    Route::put('/featured-section', [AdminFeaturedSectionController::class, 'update']);
    Route::get('/featured-section/products/search', [AdminFeaturedSectionController::class, 'searchProducts']);
    Route::post('/featured-section/products/{product}', [AdminFeaturedSectionController::class, 'addProduct']);

    // Vidéos page d'accueil
    Route::get('/homepage-video-positions', [\App\Http\Controllers\Api\Admin\AdminHomepageVideoController::class, 'positions']);
    Route::get('/homepage-videos', [\App\Http\Controllers\Api\Admin\AdminHomepageVideoController::class, 'index']);
    Route::post('/homepage-videos', [\App\Http\Controllers\Api\Admin\AdminHomepageVideoController::class, 'store']);
    Route::patch('/homepage-videos/{homepageVideo}/toggle', [\App\Http\Controllers\Api\Admin\AdminHomepageVideoController::class, 'toggleActive']);

    // Stock Requests
    Route::get('/stock-requests', [AdminStockRequestController::class, 'index']);
    Route::put('/stock-requests/{id}/notified', [AdminStockRequestController::class, 'markNotified']);
    Route::post('/stock-requests/{id}/send-email', [AdminStockRequestController::class, 'sendAvailabilityEmail']);

    // Codes promo
    Route::get('/promo-codes', [\App\Http\Controllers\Api\Admin\AdminPromoCodeController::class, 'index']);
    Route::post('/promo-codes', [\App\Http\Controllers\Api\Admin\AdminPromoCodeController::class, 'store']);
    Route::put('/promo-codes/{promoCode}', [\App\Http\Controllers\Api\Admin\AdminPromoCodeController::class, 'update']);
    Route::patch('/promo-codes/{promoCode}/toggle', [\App\Http\Controllers\Api\Admin\AdminPromoCodeController::class, 'toggleActive']);

    // Campagnes de promotion
    Route::get('/promo-campaigns', [\App\Http\Controllers\Api\Admin\AdminPromoCampaignController::class, 'index']);
    Route::post('/promo-campaigns', [\App\Http\Controllers\Api\Admin\AdminPromoCampaignController::class, 'store']);
    Route::put('/promo-campaigns/{promoCampaign}', [\App\Http\Controllers\Api\Admin\AdminPromoCampaignController::class, 'update']);
    Route::patch('/promo-campaigns/{promoCampaign}/toggle', [\App\Http\Controllers\Api\Admin\AdminPromoCampaignController::class, 'toggleActive']);
    Route::get('/promo-campaigns/{promoCampaign}/products', [\App\Http\Controllers\Api\Admin\AdminPromoCampaignController::class, 'products']);
    Route::get('/promo-campaigns/{promoCampaign}/search', [\App\Http\Controllers\Api\Admin\AdminPromoCampaignController::class, 'searchAvailable']);
    Route::post('/promo-campaigns/{promoCampaign}/products', [\App\Http\Controllers\Api\Admin\AdminPromoCampaignController::class, 'addProducts']);
    Route::post('/promo-campaigns/{promoCampaign}/products/remove', [\App\Http\Controllers\Api\Admin\AdminPromoCampaignController::class, 'removeProducts']);

    // ════════════════════════════════════════════════════════
    // ACTIONS DESTRUCTIVES — throttle renforcé (20 req/min)
    // ════════════════════════════════════════════════════════
    Route::middleware('throttle:20,1')->group(function () {

        // Commandes
        Route::delete('/orders/{order}', [AdminOrderController::class, 'destroy']);

        // Produits
        Route::delete('/products/{product}', [AdminProductController::class, 'destroy']);

        // Utilisateurs
        Route::delete('/users/{user}', [AdminUserController::class, 'destroy']);

        // Avis
        Route::delete('/reviews/{review}', [AdminReviewController::class, 'destroy']);
        Route::post('/reviews/bulk-approve', [AdminReviewController::class, 'bulkApprove']);
        Route::post('/reviews/bulk-reject', [AdminReviewController::class, 'bulkReject']);
        Route::post('/reviews/bulk-destroy', [AdminReviewController::class, 'bulkDestroy']);

        // Contacts / Newsletter
        Route::delete('/contacts/{contact}', [AdminContactController::class, 'deleteContact']);
        Route::delete('/newsletter/{subscriber}', [AdminContactController::class, 'deleteSubscriber']);
        Route::post('/contacts/bulk-read', [AdminContactController::class, 'bulkMarkRead']);
        Route::post('/contacts/bulk-destroy', [AdminContactController::class, 'bulkDestroy']);
        Route::post('/newsletter/bulk-destroy', [AdminContactController::class, 'bulkDeleteSubscribers']);

        // Catégories / Marques
        Route::delete('/categories/{category}', [AdminCategoryController::class, 'destroyCategory']);
        Route::delete('/brands/{brand}', [AdminCategoryController::class, 'destroyBrand']);
        // Coffrets
        Route::delete('/bundles/{bundle}', [AdminBundleController::class, 'destroy']);
        Route::delete('/bundle-categories/{bundleCategory}', [AdminBundleCategoryController::class, 'destroy']);

        // Hygiene Section
        Route::delete('/hygiene-section/{hygieneSection}', [AdminHygieneSectionController::class, 'destroy']);

        // Blog
        Route::delete('/blog/{blogPost}', [AdminBlogController::class, 'destroy']);
        Route::post('/blog/bulk-destroy', [AdminBlogController::class, 'bulkDestroy']);
        Route::post('/blog/bulk-toggle-visible', [AdminBlogController::class, 'bulkToggleVisible']);

        // Promo Section
        Route::delete('/promo-section/products/{product}', [AdminPromoSectionController::class, 'removeProduct']);

        // Featured Section
        Route::delete('/featured-section/products/{product}', [AdminFeaturedSectionController::class, 'removeProduct']);

        // Category Showcase
        Route::delete('/category-showcase/{categoryShowcase}', [AdminCategoryShowcaseController::class, 'destroy']);

        // Stock Requests
        Route::delete('/stock-requests/{id}', [AdminStockRequestController::class, 'destroy']);

        // Quiz
        Route::delete('/quiz/solutions/{solution}', [AdminQuizController::class, 'destroySolution']);
        Route::delete('/quiz/questions/{question}', [AdminQuizController::class, 'destroyQuestion']);

        // Codes promo
        Route::delete('/promo-codes/{promoCode}', [\App\Http\Controllers\Api\Admin\AdminPromoCodeController::class, 'destroy']);

        // Campagnes de promotion
        Route::delete('/promo-campaigns/{promoCampaign}', [\App\Http\Controllers\Api\Admin\AdminPromoCampaignController::class, 'destroy']);

        // Vidéos page d'accueil
        Route::delete('/homepage-videos/{homepageVideo}', [\App\Http\Controllers\Api\Admin\AdminHomepageVideoController::class, 'destroy']);
    });
});
