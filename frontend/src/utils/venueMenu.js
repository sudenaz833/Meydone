/**
 * @param {unknown} item
 * @returns {string}
 */
export function menuItemName(item) {
  if (item == null) return "";
  if (typeof item === "string") {
    const parsed = parseMenuLine(item);
    return parsed ? parsed.name : String(item).trim();
  }
  if (typeof item === "object" && item !== null && !Array.isArray(item)) {
    const rawName = String(item.name ?? "").trim();
    if (!rawName) return "";
    if (rawName.includes("|")) {
      const parsed = parseMenuLine(rawName);
      if (parsed?.name) return parsed.name;
    }
    return rawName;
  }
  return "";
}

/**
 * @param {unknown} item
 * @returns {number | null}
 */
export function menuItemPrice(item) {
  if (typeof item === "string") {
    const parsed = parseMenuLine(item);
    if (parsed && parsed.price != null && Number.isFinite(parsed.price)) return parsed.price;
    return null;
  }
  if (item != null && typeof item === "object" && !Array.isArray(item)) {
    if ("price" in item) {
      const p = item.price;
      if (p !== undefined && p !== null && p !== "") {
        const n = Number(p);
        if (Number.isFinite(n)) return n;
      }
    }
    const rawName = String(item.name ?? "").trim();
    if (rawName.includes("|")) {
      const parsed = parseMenuLine(rawName);
      if (parsed && parsed.price != null && Number.isFinite(parsed.price)) return parsed.price;
    }
    return null;
  }
  return null;
}

/**
 * @param {number | null | undefined} price
 * @returns {string}
 */
export function formatTryPrice(price) {
  if (price == null || !Number.isFinite(Number(price))) return "";
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 2,
  }).format(Number(price));
}

/**
 * Satır: "Ürün adı" veya "Ürün adı | 45" veya "Ürün | 45,50"
 * @param {string} line
 * @returns {{ name: string; price: number | null } | null}
 */
export function parseMenuLine(line) {
  const trimmed = String(line ?? "").trim();
  if (!trimmed) return null;
  const pipeIdx = trimmed.lastIndexOf("|");
  if (pipeIdx === -1) {
    return { name: trimmed, price: null };
  }
  const name = trimmed.slice(0, pipeIdx).trim();
  if (!name) return null;
  const pricePart = trimmed
    .slice(pipeIdx + 1)
    .trim()
    .replace(/\s*₺?\s*$/i, "")
    .replace(",", ".");
  const n = Number.parseFloat(pricePart);
  const price = Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : null;
  return { name, price };
}

/**
 * @param {string} text
 * @returns {{ name: string; price: number | null }[]}
 */
export function parseMenuTextarea(text) {
  return String(text ?? "")
    .split("\n")
    .map((line) => parseMenuLine(line))
    .filter(Boolean);
}

/**
 * @param {unknown} item
 * @returns {string}
 */
export function menuItemToTextareaLine(item) {
  const name = menuItemName(item);
  if (!name) return "";
  const price = menuItemPrice(item);
  if (price != null && Number.isFinite(price)) {
    return `${name} | ${price}`;
  }
  return name;
}

/**
 * @param {unknown[]} menu
 * @returns {string}
 */
export function menuArrayToTextarea(menu) {
  if (!Array.isArray(menu)) return "";
  return menu.map((item) => menuItemToTextareaLine(item)).filter(Boolean).join("\n");
}
