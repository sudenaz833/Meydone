/**
 * Global UI style system — Mekanful (Tailwind utility bundles)
 *
 * Semantic colors (pastel):
 * - Primary: pastel blue (sky / blue)
 * - Secondary: pastel pink (pink / rose)
 * - Success: light green (emerald / teal)
 * - Danger: soft red (rose)
 *
 * Buttons: rounded-full, soft shadows, hover lift + active press.
 * Inputs: rounded corners, light border, focus ring “glow” (sky).
 */

// ---------------------------------------------------------------------------
// Layout & surfaces
// ---------------------------------------------------------------------------

export const layoutShell =
  "min-h-screen bg-gradient-to-br from-sky-50 via-pink-50/85 to-sky-100 text-stone-800 antialiased";

export const mainContent =
  "mx-auto w-full max-w-6xl flex-1 px-4 pb-12 pt-4 sm:px-6 sm:pb-16 sm:pt-6";

export const card =
  "rounded-2xl border border-white/80 bg-white/85 p-6 shadow-lg shadow-sky-200/25 backdrop-blur-md sm:p-8";

export const cardAccent =
  "rounded-2xl border border-sky-100/90 bg-gradient-to-br from-sky-50/90 via-white/80 to-pink-50/50 p-6 shadow-lg shadow-sky-200/25 backdrop-blur-sm sm:p-8";

export const cardSearch =
  "rounded-2xl border border-pink-100/80 bg-white/80 p-5 shadow-md shadow-pink-200/25 backdrop-blur-sm sm:p-6";

// ---------------------------------------------------------------------------
// Typography
// ---------------------------------------------------------------------------

export const headingPage =
  "text-3xl font-bold tracking-tight text-stone-800 sm:text-4xl";

export const headingSection = "text-lg font-semibold text-stone-800 sm:text-xl";

export const headingSub = "text-sm font-semibold text-stone-800";

export const textMuted = "text-sm leading-relaxed text-stone-600";

export const textSmall = "text-xs text-stone-500";

export const labelUi = "text-sm font-medium text-stone-600";

export const labelCaps =
  "text-xs font-semibold uppercase tracking-wider text-sky-600/90";

// ---------------------------------------------------------------------------
// Inputs — rounded, light border, focus glow
// ---------------------------------------------------------------------------

export const inputUi =
  "mt-1.5 w-full rounded-xl border border-sky-200/80 bg-white px-4 py-3 text-stone-800 shadow-sm outline-none transition duration-200 placeholder:text-stone-400 focus:border-sky-400 focus:shadow-md focus:shadow-sky-200/40 focus:ring-4 focus:ring-sky-200/45";

export const textareaUi = `${inputUi} resize-y`;

export const selectUi = inputUi;

// ---------------------------------------------------------------------------
// Buttons — rounded-full, hover motion, soft shadows
// ---------------------------------------------------------------------------

const btnMotion =
  "transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none disabled:opacity-50";

export const btnPrimary = `inline-flex min-h-[48px] w-full items-center justify-center rounded-full bg-gradient-to-r from-sky-300 via-sky-400 to-blue-400 px-6 py-3.5 text-sm font-semibold text-white shadow-md shadow-sky-300/35 ${btnMotion}`;

export const btnSecondary = `inline-flex min-h-[48px] w-full items-center justify-center rounded-full border-2 border-pink-200/90 bg-pink-50/90 px-6 py-3.5 text-sm font-semibold text-pink-900 shadow-md shadow-pink-200/25 ${btnMotion} hover:border-pink-300 hover:bg-pink-100/80`;

export const btnInline = `inline-flex items-center justify-center rounded-full bg-gradient-to-r from-sky-400 to-blue-400 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-sky-300/30 ${btnMotion}`;

export const btnSoft = `inline-flex items-center justify-center rounded-full border border-sky-200/90 bg-sky-50/90 px-4 py-2 text-sm font-semibold text-sky-900 shadow-sm shadow-sky-100/50 ${btnMotion} hover:border-sky-300 hover:bg-sky-100/80`;

/** Success */
export const btnAccept = `inline-flex items-center justify-center rounded-full bg-gradient-to-r from-emerald-300 to-teal-300 px-4 py-2 text-sm font-semibold text-emerald-950 shadow-md shadow-emerald-300/30 ${btnMotion}`;

export const btnGhost = `inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium text-stone-600 shadow-sm transition duration-200 hover:bg-sky-50/80 hover:text-sky-800 hover:shadow-md`;

/** Danger — soft red */
export const btnDangerOutline = `inline-flex items-center justify-center rounded-full border border-rose-300/90 bg-rose-50/95 px-4 py-2 text-sm font-semibold text-rose-800 shadow-sm shadow-rose-200/25 ${btnMotion} hover:border-rose-400 hover:bg-rose-100/80`;

export const btnDangerSolid = `inline-flex items-center justify-center rounded-full border border-rose-300 bg-rose-100/80 px-4 py-2 text-sm font-semibold text-rose-900 shadow-sm transition duration-200 hover:bg-rose-200/60 disabled:opacity-50`;

export function navLinkClass({ isActive }) {
  return `rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
    isActive
      ? "bg-gradient-to-r from-sky-400 to-blue-400 text-white shadow-md shadow-sky-300/35"
      : "text-stone-600 hover:bg-sky-50/90 hover:text-sky-800 hover:shadow-sm"
  }`;
}

// ---------------------------------------------------------------------------
// Chrome (header / footer / nav search)
// ---------------------------------------------------------------------------

export const headerBar =
  "sticky top-0 z-50 border-b border-white/50 bg-gradient-to-r from-sky-100/50 via-pink-100/35 to-sky-100/45 shadow-[0_8px_32px_rgba(56,189,248,0.12)] backdrop-blur-xl backdrop-saturate-150";

export const navSubBar = "border-t border-white/35 bg-white/25 backdrop-blur-md";

export const navSearchInput =
  "h-11 w-full min-w-0 rounded-full border border-sky-200/70 bg-white/60 px-4 py-2 text-sm text-stone-800 shadow-inner shadow-sky-100/40 outline-none transition duration-200 placeholder:text-stone-400 focus:border-sky-400 focus:bg-white focus:shadow-md focus:shadow-sky-200/35 focus:ring-2 focus:ring-sky-200/50";

export const navAvatar =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/80 bg-gradient-to-br from-sky-200/90 to-pink-200/80 text-sm font-bold text-sky-900 shadow-md shadow-sky-200/30";

export const navProfilePill =
  "flex items-center gap-2 rounded-full border border-sky-200/55 bg-white/45 px-2 py-1.5 shadow-sm shadow-sky-200/20 backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-sky-300/80 hover:bg-white/70 hover:shadow-md";

export const navLogoutBtn =
  "rounded-full border border-rose-200/80 bg-white/50 px-4 py-2 text-sm font-semibold text-stone-700 shadow-sm backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-rose-50/70 hover:shadow-md";

export const footerBar =
  "mt-auto border-t border-white/60 bg-white/50 py-8 text-center text-sm text-stone-500 backdrop-blur-md";

// ---------------------------------------------------------------------------
// Links & chips
// ---------------------------------------------------------------------------

export const linkAccent =
  "font-semibold text-sky-700 underline decoration-sky-300 underline-offset-2 transition duration-200 hover:text-pink-600";

export const linkMuted =
  "font-medium text-sky-600 underline decoration-sky-200 underline-offset-2 hover:text-sky-900";

export const codeChip =
  "rounded-lg bg-sky-100/90 px-2 py-0.5 font-mono text-xs text-sky-900";

// ---------------------------------------------------------------------------
// Alerts
// ---------------------------------------------------------------------------

export const alertError =
  "rounded-xl border border-rose-200/90 bg-rose-50/95 px-4 py-3 text-center text-sm text-rose-900 shadow-sm shadow-rose-100/50";

export const alertSuccess =
  "rounded-xl border border-emerald-200/90 bg-emerald-50/95 px-4 py-3 text-sm text-emerald-900 shadow-sm shadow-emerald-100/40";

export const alertWarn =
  "rounded-xl border border-amber-200/90 bg-amber-50/90 px-4 py-3 text-sm text-amber-950 shadow-sm";

export const demoBanner =
  "rounded-xl border border-amber-100/90 bg-gradient-to-r from-amber-50/90 to-orange-50/60 px-4 py-3 text-xs text-amber-950 shadow-sm";

// ---------------------------------------------------------------------------
// Venue / home
// ---------------------------------------------------------------------------

export const venueCardOuter =
  "group relative overflow-hidden rounded-2xl border border-white/75 bg-gradient-to-b from-white/95 via-white/90 to-sky-50/20 shadow-lg shadow-sky-200/20 backdrop-blur-sm transition-all duration-300 ease-out hover:-translate-y-2 hover:border-sky-200/90 hover:shadow-2xl hover:shadow-sky-200/25";

export const venueCardInnerLink =
  "block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent";

export const homeVenuesPanel =
  "rounded-3xl border border-white/60 bg-gradient-to-br from-sky-100/35 via-pink-100/25 to-sky-100/30 p-5 shadow-inner shadow-white/40 backdrop-blur-sm sm:p-7 md:p-8";

export const starOn = "text-amber-400";
export const starOff = "text-stone-200";

export const pillCategory =
  "inline-flex rounded-full bg-pink-100/85 px-3 py-1 text-xs font-medium text-pink-900";

export const divider = "divide-y divide-sky-100/60";

export const innerWell =
  "rounded-xl border border-sky-100/70 bg-sky-50/45 p-4 sm:p-5";

// ---------------------------------------------------------------------------
// Comments
// ---------------------------------------------------------------------------

export const commentSectionList =
  "relative overflow-hidden rounded-3xl border border-white/55 bg-gradient-to-br from-sky-50/35 via-pink-50/25 to-sky-50/30 p-5 shadow-inner shadow-sky-100/45 backdrop-blur-sm sm:p-7";

export const commentItemCard =
  "rounded-2xl border border-white/75 bg-white/60 p-4 shadow-lg shadow-sky-200/10 backdrop-blur-md transition duration-200 hover:border-sky-200/55 hover:bg-white/75 hover:shadow-sky-200/15 sm:p-5";

export const commentTextBubble =
  "rounded-3xl rounded-tl-md border border-white/85 bg-gradient-to-br from-white/95 via-pink-50/40 to-sky-50/45 px-4 py-3.5 text-sm leading-relaxed text-stone-700 shadow-sm shadow-pink-100/30";

export const commentAvatar =
  "flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white/90 bg-gradient-to-br from-sky-200/90 to-pink-200/75 text-base font-bold text-sky-900 shadow-md shadow-sky-200/30";

// ---------------------------------------------------------------------------
// Danger zone (account delete)
// ---------------------------------------------------------------------------

export const dangerZone =
  "rounded-2xl border border-rose-200/90 bg-gradient-to-br from-rose-50/90 to-orange-50/40 p-6 shadow-md shadow-rose-200/20 sm:p-8";

// ---------------------------------------------------------------------------
// Auth pages
// ---------------------------------------------------------------------------

export const authPageWrap =
  "relative flex min-h-[calc(100vh-14rem)] w-full flex-col items-center justify-center px-4 py-12 sm:py-16";

export const authPageGlow =
  "pointer-events-none absolute inset-x-4 top-1/4 -z-10 h-64 max-w-xl rounded-full bg-gradient-to-r from-pink-200/50 via-sky-200/45 to-blue-200/45 blur-3xl sm:inset-x-auto sm:left-1/2 sm:w-[min(42rem,90vw)] sm:-translate-x-1/2";

export const authPageWash =
  "pointer-events-none absolute inset-0 -z-20 bg-gradient-to-br from-sky-50/85 via-transparent to-pink-50/70";

export const authCard =
  "relative w-full max-w-md rounded-3xl border border-white/60 bg-white/65 p-7 shadow-xl shadow-sky-200/15 backdrop-blur-2xl sm:p-9";

export const authCardWide =
  "relative w-full max-w-lg rounded-3xl border border-white/60 bg-white/65 p-7 shadow-xl shadow-sky-200/15 backdrop-blur-2xl sm:p-9";

export const authFloatInput =
  "peer min-h-[52px] w-full rounded-xl border border-sky-200/70 bg-white/85 px-4 pb-2.5 pt-5 text-[15px] text-stone-800 shadow-sm outline-none transition-all duration-200 placeholder:text-transparent focus:border-sky-400 focus:bg-white focus:shadow-md focus:shadow-sky-200/35 focus:ring-4 focus:ring-sky-200/45";

export const authFloatLabel =
  "pointer-events-none absolute left-3 top-1/2 z-10 max-w-[calc(100%-1.5rem)] origin-left -translate-y-1/2 truncate rounded-md bg-gradient-to-b from-white via-white to-white/90 px-1.5 text-[15px] text-stone-500 transition-all duration-200 ease-out peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-xs peer-focus:font-semibold peer-focus:text-sky-600 peer-[&:not(:placeholder-shown)]:top-0 peer-[&:not(:placeholder-shown)]:-translate-y-1/2 peer-[&:not(:placeholder-shown)]:text-xs peer-[&:not(:placeholder-shown)]:font-medium peer-[&:not(:placeholder-shown)]:text-stone-700";

export const authFloatLabelDate =
  "pointer-events-none absolute left-3 top-0 z-10 -translate-y-1/2 rounded-md bg-gradient-to-b from-white to-white/95 px-1.5 text-xs font-semibold text-sky-600";

export const authHeading =
  "text-center text-2xl font-bold tracking-tight text-stone-800 sm:text-3xl";

export const authSubtext = "mt-2 text-center text-sm leading-relaxed text-stone-600";

const authBtnMotion =
  "transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none disabled:opacity-50";

export const authBtnPrimary = `inline-flex min-h-[52px] w-full items-center justify-center rounded-full bg-gradient-to-r from-sky-300 via-sky-400 to-blue-400 px-6 py-3.5 text-sm font-semibold text-white shadow-md shadow-sky-300/35 ${authBtnMotion}`;

export const authBtnSecondary = `inline-flex min-h-[52px] w-full items-center justify-center rounded-full border-2 border-pink-200/85 bg-pink-50/60 px-6 py-3.5 text-sm font-semibold text-pink-900 shadow-sm shadow-pink-100/50 backdrop-blur-sm ${authBtnMotion} hover:border-pink-300 hover:bg-pink-100/70`;

export const authDemoNote =
  "rounded-xl border border-amber-100/80 bg-amber-50/50 px-4 py-3 text-center text-xs leading-relaxed text-amber-950/90 shadow-sm";
