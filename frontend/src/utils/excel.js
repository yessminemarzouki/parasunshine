import * as XLSX from "xlsx";

export const downloadProductTemplate = () => {
  const headers = [
    "name",
    "reference",
    "price",
    "promo_price",
    "stock",
    "category",
    "brand",
    "description",
    "short_description",
    "is_featured",
    "is_new",
    "is_promo",
    "is_bestseller",
  ];

  const example = [
    "Crème hydratante",
    "REF-001",
    29.9,
    "",
    50,
    "Visage",
    "Avène",
    "Description complète",
    "Description courte",
    0,
    1,
    0,
    0,
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, example]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Produits");
  XLSX.writeFile(wb, "modele_produits.xlsx");
};
