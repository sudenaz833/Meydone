import { toTurkishCategory, venueImagePoolKey } from "./category";
import { menuItemName } from "./venueMenu";

export function venueId(venue) {
  const raw = venue?._id ?? venue?.id;
  if (raw == null) return "";
  if (typeof raw === "object") {
    if (raw && typeof raw.$oid === "string") return raw.$oid;
    if (typeof raw.toString === "function") {
      const s = String(raw.toString());
      if (s && s !== "[object Object]") return s;
    }
  }
  return String(raw);
}

/**
 * Mekan için mümkün olduğunca zengin anahtar (aynı isimli iki şube bile ayrışır).
 */
function venueVisualKey(venue) {
  const lat = venue?.location?.lat;
  const lng = venue?.location?.lng;
  const addr = venue?.address && typeof venue.address === "object" ? venue.address : null;
  const owner = venue?.owner;
  const ownerStr =
    owner == null
      ? ""
      : typeof owner === "object"
        ? String(owner._id ?? owner.id ?? "")
        : String(owner);

  return [
    venueId(venue),
    String(venue?.name ?? "").trim(),
    String(venue?.category ?? "").trim(),
    String(addr?.city ?? "").trim(),
    String(addr?.district ?? "").trim(),
    String(addr?.neighborhood ?? "").trim(),
    String(addr?.street ?? "").trim(),
    String(addr?.details ?? "").trim(),
    typeof lat === "number" && !Number.isNaN(lat) ? lat.toFixed(6) : "",
    typeof lng === "number" && !Number.isNaN(lng) ? lng.toFixed(6) : "",
    String(venue?.createdAt ?? ""),
    String(venue?.updatedAt ?? ""),
    ownerStr,
    String(venue?.__v ?? ""),
  ].join("\u241e");
}

function hashToLockNumber(input) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

const Q = "auto=format&fit=crop&w=800&q=80";

const IMAGE_POOLS = {
  restaurant: [
    `https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?${Q}`,
    `https://images.unsplash.com/photo-1555396273-367ea4eb4db5?${Q}`,
    `https://images.unsplash.com/photo-1414235077428-338989a2e8c0?${Q}`,
    `https://images.unsplash.com/photo-1504674900247-0877df9cc836?${Q}`,
  ],
  cafe: [
    `https://images.unsplash.com/photo-1509042239860-f550ce710b93?${Q}`,
    `https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?${Q}`,
    `https://images.unsplash.com/photo-1511920170033-f8396924c348?${Q}`,
    `https://images.unsplash.com/photo-1442512595331-e89e73853f31?${Q}`,
  ],
  bakery: [
    `https://images.unsplash.com/photo-1551024506-0bccd828d307?${Q}`,
    `https://images.unsplash.com/photo-1578985545062-69928b1d9587?${Q}`,
    `https://images.unsplash.com/photo-1486428127577-f67e3eac9838?${Q}`,
    `https://images.unsplash.com/photo-1558961363-fa8fdf82db35?${Q}`,
  ],
  bar: [
    `https://images.unsplash.com/photo-1514362543589-fcb4e31801ad?${Q}`,
    `https://images.unsplash.com/photo-1544943910-4c1dc44aab44?${Q}`,
    `https://images.unsplash.com/photo-1470337458703-46ad1756a187?${Q}`,
  ],
  seafood: [
    `https://images.unsplash.com/photo-1559339352-11d035aa65de?${Q}`,
    `https://images.unsplash.com/photo-1544148105-1d38c03c67f6?${Q}`,
    `https://images.unsplash.com/photo-1551218808-94e220ab7b0b?${Q}`,
  ],
  burger: [
    `https://images.unsplash.com/photo-1568901346375-53c94142ae0a?${Q}`,
    `https://images.unsplash.com/photo-1550547660-d9440dd59f1d?${Q}`,
    `https://images.unsplash.com/photo-1551782450-a2132b4ba21d?${Q}`,
  ],
  casual: [
    `https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?${Q}`,
    `https://images.unsplash.com/photo-1555939594-17394329a0b0?${Q}`,
    `https://images.unsplash.com/photo-1504754524776-8f4f37790e0e?${Q}`,
    `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?${Q}`,
  ],
  default: [
    `https://images.unsplash.com/photo-1567620905732-7d2473d63fd3?${Q}`,
    `https://images.unsplash.com/photo-1546549032-6411b6c54374?${Q}`,
  ],
};

const MENU_KEYWORD_POOLS = [
  { re: /(baklava|künefe|kunefe|profiterol|pasta|tatlı|tatli|sütlaç|sutlac|dondurma|çikolata|cikolata)/i, key: "bakery" },
  { re: /(latte|espresso|americano|cappuccino|kahve|coffee|cold brew|v60|filtre)/i, key: "cafe" },
  { re: /(burger|cheese burger|cheeseburger|whopper)/i, key: "burger" },
  { re: /(pizza|margarita|pepperoni|dominos)/i, key: "casual" },
  { re: /(kebap|adana|urfa|lahmacun|tantuni|döner|doner|köfte|kofte|ızgara|izgara)/i, key: "restaurant" },
  { re: /(midye|kalamar|ahtapot|balık|balik|deniz)/i, key: "seafood" },
];

const NAME_KEYWORD_POOLS = [
  { re: /(kahve|coffee|roast|roastery|espresso|cafe|kafe)/i, key: "cafe" },
  { re: /(burger|hamburger)/i, key: "burger" },
  { re: /(pizza|pizzeria)/i, key: "casual" },
  { re: /(tatlı|tatli|baklava|güllüoğlu|gulluoglu|mado|pastane|pasta|künefe|kunefe)/i, key: "bakery" },
  { re: /(kebap|ocakbaşı|ocakbasi|adana|urfa|lahmacun|döner|doner|tantuni|köfte|kofte)/i, key: "restaurant" },
  { re: /(balık|balik|seafood|fish)/i, key: "seafood" },
];

function pickThemedStockUrl(venue, variant = "") {
  const nameText = String(venue?.name ?? "");
  const menuText = Array.isArray(venue?.menu)
    ? venue.menu.map((item) => menuItemName(item)).filter(Boolean).join(" ")
    : "";
  const matchedByName = NAME_KEYWORD_POOLS.find((rule) => rule.re.test(nameText));
  const matchedByMenu = MENU_KEYWORD_POOLS.find((rule) => rule.re.test(menuText));
  const poolKey = matchedByName?.key ?? matchedByMenu?.key ?? venueImagePoolKey(venue?.category);
  const pool = IMAGE_POOLS[poolKey] ?? IMAGE_POOLS.default;
  const key = `${venueVisualKey(venue)}${variant ? `\u241e${variant}` : ""}`;
  const h = hashToLockNumber(`${key}\u241e${poolKey}`);
  const idx = h % pool.length;
  return pool[idx];
}

/**
 * Detay: yüklenen fotoğraf varsa onu kullan; yoksa mekân/yemek temalı, mekana özel stok görsel.
 */
export function venueDisplayPhotoUrl(venue) {
  const raw = String(venue?.photoUrl ?? "").trim();
  if (raw) return raw;
  return pickThemedStockUrl(venue);
}

/**
 * Liste / yakın mekan satırı:
 * - Mekanın kendi fotoğrafı varsa onu kullan
 * - Yoksa temalı stok görsel kullan
 */
export function venueListCoverUrl(venue) {
  const raw = String(venue?.photoUrl ?? "").trim();
  if (raw) return raw;
  return pickThemedStockUrl(venue);
}

function toSafeText(value) {
  return encodeURIComponent(String(value ?? "").trim() || "Mekan");
}

/**
 * Ağ görselleri yüklenmezse kullanılacak garanti fallback görsel.
 */
export function venueFailSafeImageUrl(venue, variant = "cover") {
  const category = toTurkishCategory(venue?.category) || "Mekan";
  const title = String(venue?.name ?? "").trim();
  const text = title ? `${category} - ${title}` : category;
  return `https://placehold.co/800x600/png?text=${toSafeText(text)}&font=montserrat`;
}
