// Prix d'un coffret — même règle que le backend (OrderController) :
// promo si promo_price existe ET est inférieur au prix normal.
export const isBundleLike = (p) =>
  !!p &&
  (p.isBundle ||
    p.bundleId != null ||
    "bundle_category_id" in p ||
    "price_mode" in p);

export const getBundlePricing = (bundle) => {
  const price = parseFloat(bundle.price) || 0;
  const promo = parseFloat(bundle.promo_price) || 0;
  const active = promo > 0 && promo < price && bundle.is_promo_active !== false;
  return {
    effective_price: active ? promo : price,
    effective_reference_price: active ? price : null,
    is_promo_active: active,
  };
};

export const withBundlePricing = (bundle) => ({
  ...bundle,
  ...getBundlePricing(bundle),
});
