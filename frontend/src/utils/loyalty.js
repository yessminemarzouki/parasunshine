/**
 * Calcule les points de fidélité et la valeur en dinars
 * @param {number} price - Prix du produit en DT
 * @returns {object} - { points, value }
 */
export const calculateLoyalty = (price) => {
  const points = Math.floor(price); // 1 DT = 1 point
  const value = points * 0.03; // 1 point = 0.030 DT (30 millimes)

  return {
    points,
    value: value.toFixed(3), // Format tunisien avec 3 décimales
  };
};

/**
 * Calcule les points de fidélité pour un panier complet
 * @param {number} totalAmount - Montant total du panier en DT
 * @returns {object} - { points, value }
 */
export const calculateCartLoyalty = (totalAmount) => {
  return calculateLoyalty(totalAmount);
};
