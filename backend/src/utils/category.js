const CATEGORY_SYNONYMS = {
  restaurant: "restoran",
  restoran: "restoran",
  cafe: "kafe",
  kafe: "kafe",
  "fast food": "hizli_yemek",
  "hızlı yemek": "hizli_yemek",
  hizli_yemek: "hizli_yemek",
  dessert: "tatli",
  tatlı: "tatli",
  tatli: "tatli",
};

const TURKISH_LABELS = {
  restoran: "Restoran",
  kafe: "Kafe",
  hizli_yemek: "Hızlı yemek",
  tatli: "Tatlı",
};

export function normalizeCategoryKey(value) {
  const raw = String(value ?? "").trim().toLocaleLowerCase("tr-TR");
  if (!raw) return "";
  return CATEGORY_SYNONYMS[raw] ?? raw;
}

export function toTurkishCategory(value) {
  const key = normalizeCategoryKey(value);
  return TURKISH_LABELS[key] ?? (String(value ?? "").trim() || "—");
}

export function categoriesMatch(a, b) {
  const left = normalizeCategoryKey(a);
  const right = normalizeCategoryKey(b);
  return Boolean(left && right && left === right);
}
