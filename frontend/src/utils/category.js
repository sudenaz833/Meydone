const MAP = {
  restoran: 'Restoran',
  restaurant: 'Restoran',
  kafe: 'Kafe',
  cafe: 'Kafe',
  bar: 'Bar',
  pastane: 'Pastane',
  balik: 'Balık',
  burger: 'Burger',
  kahve: 'Kahve',
  meyhane: 'Meyhane',
  hizliyemek: 'Hızlı yemek',
  hızlıyemek: 'Hızlı yemek',
  fastfood: 'Hızlı yemek',
  evyemekleri: 'Ev yemekleri',
  evyemeği: 'Ev yemekleri',
  evyemegi: 'Ev yemekleri',
};

export function normalizeCategoryKey(cat) {
  return String(cat ?? '')
    .trim()
    .toLocaleLowerCase('tr-TR')
    .replace(/\s+/g, '');
}

/** Üst menü kategori filtresi — URL `cat` parametresi değerleri */
export const SEARCH_CATEGORY_OPTIONS = [
  { value: '', label: 'Tüm kategoriler' },
  { value: 'kafe', label: 'Kafe' },
  { value: 'pastane', label: 'Pastane / Tatlı' },
  { value: 'restoran', label: 'Restoran' },
  { value: 'evyemekleri', label: 'Ev yemekleri' },
  { value: 'hizliyemek', label: 'Hızlı yemek' },
];

const CATEGORY_FILTER_SYNONYMS = {
  kafe: ['kafe', 'cafe', 'kahve'],
  pastane: ['pastane', 'tatlı', 'tatli', 'tatlıcı', 'tatlici'],
  restoran: ['restoran', 'restaurant'],
  evyemekleri: [
    'evyemekleri',
    'evyemeği',
    'evyemegi',
    'evmutfağı',
    'evmutfagi',
  ],
  hizliyemek: [
    'hizliyemek',
    'hızlıyemek',
    'fastfood',
    'fast-food',
    'pizza',
    'kebap',
    'kebab',
    'döner',
    'doner',
    'burger',
  ],
};

/** `cat` URL değerine göre mekan kategorisi eşleşir mi */
export function venueMatchesCategoryParam(venueCategory, catParam) {
  const raw = String(catParam ?? '').trim();
  if (!raw) return true;
  const v = normalizeCategoryKey(venueCategory);
  const f = normalizeCategoryKey(raw);
  const keys = CATEGORY_FILTER_SYNONYMS[f] || [f];
  return keys.some((k) => v === k || (k && v.startsWith(k)));
}

export function toTurkishCategory(cat) {
  const k = normalizeCategoryKey(cat);
  if (!k) return String(cat ?? '');
  if (MAP[k]) return MAP[k];
  const raw = String(cat ?? '').trim();
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

/**
 * Stok mekan görselleri için havuz anahtarı (yemek-içme / mekân teması).
 */
export function venueImagePoolKey(cat) {
  const k = normalizeCategoryKey(cat);
  if (!k) return "default";
  if (["kafe", "cafe", "kahve"].includes(k)) return "cafe";
  if (["pastane", "pastaci", "pastacı", "tatlı", "tatli"].includes(k)) return "bakery";
  if (["bar", "meyhane"].includes(k)) return "bar";
  if (["balik", "balık"].includes(k)) return "seafood";
  if (["burger"].includes(k)) return "burger";
  if (["restoran", "restaurant"].includes(k)) return "restaurant";
  if (["evyemekleri", "evyemeği", "evyemegi", "evmutfağı", "evmutfagi"].includes(k)) return "restaurant";
  if (["hizliyemek", "hızlıyemek", "fastfood", "pizza", "kebap", "kebab"].includes(k)) return "casual";
  return "default";
}
