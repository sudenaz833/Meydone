/** @typedef {{ name: string; price: number | null }} VenueMenuItem */

const MAX_MENU_ITEMS = 200;
const MAX_NAME_LEN = 160;

/**
 * "Ürün | 45" / "Ürün | 45,50" satırlarını ayırır (frontend parseMenuLine ile uyumlu).
 * @param {string} trimmed
 * @returns {{ name: string; price: number | null } | null}
 */
function parsePipeNamePrice(trimmed) {
  if (!trimmed) return null;
  const pipeIdx = trimmed.lastIndexOf('|');
  if (pipeIdx === -1) {
    return { name: trimmed, price: null };
  }
  const name = trimmed.slice(0, pipeIdx).trim();
  if (!name) return null;
  const pricePart = trimmed
    .slice(pipeIdx + 1)
    .trim()
    .replace(/\s*₺?\s*$/i, '')
    .replace(',', '.');
  const n = Number.parseFloat(pricePart);
  const price = Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : null;
  return { name, price };
}

function clampName(name) {
  if (name.length <= MAX_NAME_LEN) return name;
  return name.slice(0, MAX_NAME_LEN);
}

/**
 * @param {unknown} raw
 * @returns {VenueMenuItem | null}
 */
export function normalizeMenuItem(raw) {
  if (raw == null) return null;
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    const parsed = parsePipeNamePrice(trimmed);
    if (!parsed) return null;
    return { name: clampName(parsed.name), price: parsed.price };
  }
  if (typeof raw === 'object' && !Array.isArray(raw)) {
    let name = String(raw.name ?? '').trim();
    if (!name) return null;
    const priceRaw = raw.price;
    const hasExplicitPrice = priceRaw !== undefined && priceRaw !== null && priceRaw !== '';

    if (!hasExplicitPrice && name.includes('|')) {
      const parsed = parsePipeNamePrice(name);
      if (parsed) {
        return { name: clampName(parsed.name), price: parsed.price };
      }
    }

    const safeName = clampName(name);
    if (!hasExplicitPrice) {
      return { name: safeName, price: null };
    }
    const n = Number(priceRaw);
    if (!Number.isFinite(n) || n < 0 || n > 999999.99) {
      return { name: safeName, price: null };
    }
    return { name: safeName, price: Math.round(n * 100) / 100 };
  }
  return null;
}

/**
 * @param {unknown} menu
 * @returns {VenueMenuItem[]}
 */
export function normalizeVenueMenu(menu) {
  if (!Array.isArray(menu)) return [];
  const out = [];
  for (const raw of menu) {
    if (out.length >= MAX_MENU_ITEMS) break;
    const item = normalizeMenuItem(raw);
    if (item) out.push(item);
  }
  return out;
}

/**
 * Fiyatı olmayan menü kalemlerine örnek TL üretir (yalnızca API cevabı; veritabanına yazılmaz).
 * Aynı ürün adı her zaman aynı tutarı verir (deterministik).
 *
 * - Varsayılan: `NODE_ENV !== 'production'` iken açık.
 * - Kapatmak: `DEMO_MENU_RANDOM_PRICES=0` veya `false`
 * - Üretimde açmak: `DEMO_MENU_RANDOM_PRICES=1` veya `true`
 */
export function shouldFillDemoMenuPrices() {
  const v = String(process.env.DEMO_MENU_RANDOM_PRICES ?? '').trim().toLowerCase();
  if (v === '0' || v === 'false' || v === 'off' || v === 'no') return false;
  if (v === '1' || v === 'true' || v === 'on' || v === 'yes') return true;
  return process.env.NODE_ENV !== 'production';
}

/**
 * Aynı ürün adı → aynı tutar; aralık içinde hafif sapma (5 TL adım).
 * @param {string} name
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function stableDemoPriceInRange(name, min, max) {
  const s = String(name ?? '').trim();
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  const span = max - min + 1;
  let v = min + (h % span);
  v = Math.round(v / 5) * 5;
  return Math.min(max, Math.max(min, v));
}

/**
 * Ürün adına göre makul örnek fiyat (TR piyasasına yakın aralıklar).
 * @param {string} name
 * @returns {number}
 */
function pseudoRandomTryFromName(name) {
  const n = String(name ?? '').trim().toLocaleLowerCase('tr-TR');

  if (/^su$|şişe su|damacana|pet su/i.test(n)) return stableDemoPriceInRange(name, 12, 32);
  if (/çay|bitki çayı|bitki cayi|earl grey|english breakfast/i.test(n)) return stableDemoPriceInRange(name, 18, 48);
  if (
    /americano|latte|cappuccino|espresso|mocha|frappe|frappé|cold brew|flat white|macchiato|mistik|raf coffee/i.test(
      n,
    )
  ) {
    return stableDemoPriceInRange(name, 60, 115);
  }
  if (/türk kahvesi|turk kahvesi|filtre kahve|fincan kahve/i.test(n)) return stableDemoPriceInRange(name, 45, 78);
  if (/kahve/i.test(n)) return stableDemoPriceInRange(name, 50, 95);
  if (/milkshake|milk shake/i.test(n)) return stableDemoPriceInRange(name, 85, 145);
  if (/kola|gazoz|sprite|fanta|ice tea|ice-tea|ayran|şalgam|salgam|limonata|smoothie|icetea/i.test(n)) {
    return stableDemoPriceInRange(name, 28, 58);
  }
  if (/çorba|corba|mercimek|tarhana|işkembe|iskembe/i.test(n)) return stableDemoPriceInRange(name, 55, 98);
  if (/salata/i.test(n)) return stableDemoPriceInRange(name, 88, 168);
  if (
    /tatlı|tatli|baklava|künefe|kunefe|profiterol|dondurma|pasta|sütlaç|sutlac|cheesecake|kurabiye|cookie|mozaik|trileçe|trilece|magnolia|brownie/i.test(
      n,
    )
  ) {
    return stableDemoPriceInRange(name, 72, 185);
  }
  if (/kahvaltı|kahvalti|menemen|omlet|omlette|serpme|köy kahvaltısı|koy kahvaltisi/i.test(n)) {
    return stableDemoPriceInRange(name, 135, 265);
  }
  if (/mezze|meze tabağı|humus|cacık|çoban salata|coban salata/i.test(n)) return stableDemoPriceInRange(name, 95, 195);
  if (/patates|soğan halkası|sogan halkasi|çıtır|citir|nugget|mozzarella stick|sosis/i.test(n)) {
    return stableDemoPriceInRange(name, 58, 118);
  }
  if (/pizza/i.test(n)) return stableDemoPriceInRange(name, 235, 395);
  if (/burger|hamburger|cheeseburger|whopper|double burger/i.test(n)) return stableDemoPriceInRange(name, 165, 285);
  if (
    /kebap|kebab|adana|urfa|şaşlık|saslik|şiş|sis\b|köfte|kofte|ızgara|izgara|tavuk kanat|karışık ızgara|karisik izgara|ali nazik|patlıcan kebap|patlican kebap/i.test(
      n,
    )
  ) {
    return stableDemoPriceInRange(name, 195, 385);
  }
  if (/lahmacun|pide|kıymalı pide|kiymali pide/i.test(n)) return stableDemoPriceInRange(name, 88, 178);
  if (/dürüm|durum|tantuni|wrap/i.test(n)) return stableDemoPriceInRange(name, 118, 198);
  if (/makarna|mantı|manti|penne|spagetti|fettuccine|börek|borek/i.test(n)) return stableDemoPriceInRange(name, 138, 258);
  if (/balık|balik|levrek|çupra|cupra|hamsi|kalamar|midye/i.test(n)) return stableDemoPriceInRange(name, 215, 395);
  if (/midye|kokoreç|kokorec|kumru|tost|sandviç|sandwich/i.test(n)) return stableDemoPriceInRange(name, 65, 165);

  return stableDemoPriceInRange(name, 95, 235);
}

/**
 * @param {VenueMenuItem[]} items
 * @returns {VenueMenuItem[]}
 */
export function fillDemoMenuPricesIfMissing(items) {
  if (!shouldFillDemoMenuPrices() || !Array.isArray(items)) return items;
  return items.map((item) => {
    if (!item || typeof item !== 'object') return item;
    const name = String(item.name ?? '').trim();
    if (!name) return item;
    const p = item.price;
    if (p !== undefined && p !== null && p !== '' && Number.isFinite(Number(p))) {
      return item;
    }
    const n = pseudoRandomTryFromName(name);
    return { ...item, price: Math.round(Number(n) * 100) / 100 };
  });
}

/**
 * İstemciye giden menü: normalize + isteğe bağlı örnek fiyatlar.
 * @param {unknown} menu
 * @returns {VenueMenuItem[]}
 */
export function venueMenuForClientResponse(menu) {
  return fillDemoMenuPricesIfMissing(normalizeVenueMenu(menu));
}

/**
 * Express-validator custom: accepts legacy string lines or { name, price }.
 * @param {unknown} menu
 */
export function assertMenuRequestArray(menu) {
  if (!Array.isArray(menu)) {
    throw new Error('menu must be an array');
  }
  if (menu.length > MAX_MENU_ITEMS) {
    throw new Error(`menu must have at most ${MAX_MENU_ITEMS} items`);
  }
  for (const item of menu) {
    if (typeof item === 'string') {
      if (item.length > 500) {
        throw new Error('each menu string must be at most 500 characters');
      }
      continue;
    }
    if (item && typeof item === 'object' && !Array.isArray(item)) {
      if (typeof item.name !== 'string') {
        throw new Error('each menu object must have a string name');
      }
      const p = item.price;
      if (p !== undefined && p !== null && p !== '') {
        const n = Number(p);
        if (!Number.isFinite(n)) {
          throw new Error('menu item price must be a finite number');
        }
      }
      continue;
    }
    throw new Error('each menu item must be a string or an object with name (and optional price)');
  }
}
