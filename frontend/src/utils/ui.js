/** Tailwind — pastel (gül, lavanta, şeftali, nane) uyumlu sınıflar */

export const headerBar =
  'sticky top-0 z-40 border-b border-rose-100/90 bg-white/80 backdrop-blur-md shadow-sm shadow-rose-100/30';
export const navAvatar =
  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm font-semibold text-violet-700';
export const navLogoutBtn =
  'rounded-lg border border-rose-200/90 bg-rose-50 px-3 py-1.5 text-sm text-rose-900/90 hover:bg-rose-100';
export const navProfilePill =
  'max-w-[10rem] truncate rounded-full border border-violet-200/80 bg-violet-50/90 px-3 py-1 text-xs text-violet-900';
export const navSearchInput =
  'w-full rounded-xl border border-rose-100 bg-white/95 px-3 py-2 text-sm text-stone-700 placeholder:text-stone-400 focus:border-violet-200 focus:outline-none focus:ring-2 focus:ring-violet-100/80';
export const navCategorySelect =
  'shrink-0 rounded-xl border border-rose-100 bg-white/95 px-2.5 py-2 text-sm text-stone-700 focus:border-violet-200 focus:outline-none focus:ring-2 focus:ring-violet-100/80 sm:min-w-[11rem] sm:max-w-[13rem]';
export const navSubBar = 'border-b border-rose-100/70 bg-gradient-to-r from-rose-50/80 via-violet-50/50 to-amber-50/40';
export const navLinkClass = ({ isActive }) =>
  `rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
    isActive
      ? 'bg-rose-200/80 text-rose-900 shadow-sm shadow-rose-100/50'
      : 'text-stone-600 hover:bg-rose-50/90 hover:text-rose-900'
  }`;

/** Arama ile mekan bulunamadığında liste / harita üzerinde gösterilir */
export const messageVenueSearchNotFound =
  "Aradığınız mekan bulunamadı. Hatalı veya eksik bir girdi kullanmış olabilirsiniz; yazımı kontrol edip tekrar deneyin.";

export const alertError =
  'rounded-xl border border-rose-200 bg-rose-50/90 px-3 py-2 text-sm text-rose-800';
export const alertSuccess =
  'rounded-xl border border-emerald-200/90 bg-emerald-50/80 px-3 py-2 text-sm text-emerald-800';
export const alertWarn =
  'rounded-xl border border-amber-200/90 bg-amber-50/90 px-3 py-2 text-sm text-amber-900';

export const headingPage = 'text-2xl font-bold tracking-tight text-violet-950 sm:text-3xl';
export const headingSection = 'text-lg font-semibold text-violet-900';
export const textMuted = 'text-sm text-stone-500';
export const textSmall = 'text-xs text-stone-500';
export const labelCaps = 'text-xs font-semibold uppercase tracking-wide text-violet-600/80';
export const labelUi = 'mb-1 block text-sm font-medium text-stone-700';

export const card =
  'rounded-2xl border border-rose-100/90 bg-white/75 p-6 shadow-md shadow-rose-100/25 backdrop-blur-sm';
export const cardAccent =
  'rounded-2xl border border-violet-200/60 bg-violet-50/50 p-6 shadow-md shadow-violet-100/30';
export const innerWell =
  'rounded-xl border border-rose-100/80 bg-rose-50/40 p-4';
export const codeChip =
  'inline-block rounded-md border border-violet-200/80 bg-violet-50 px-2 py-0.5 font-mono text-xs text-violet-800';
export const pillCategory =
  'inline-flex rounded-full border border-violet-200/70 bg-violet-50 px-2.5 py-0.5 text-xs text-violet-800';

export const linkAccent =
  'font-medium text-violet-600 hover:text-rose-500 underline-offset-4 hover:underline';

export const btnPrimary =
  'inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-rose-300 to-violet-300 px-4 py-2 text-sm font-semibold text-violet-950 shadow-sm shadow-rose-200/40 hover:from-rose-200 hover:to-violet-200 disabled:opacity-50';
export const btnSoft =
  'inline-flex items-center justify-center rounded-xl border border-rose-200/90 bg-white/80 px-3 py-1.5 text-sm text-stone-700 hover:bg-rose-50';
export const btnAccept =
  'inline-flex items-center justify-center rounded-xl bg-emerald-300/90 px-3 py-1.5 text-sm font-medium text-emerald-950 hover:bg-emerald-200';
export const btnDangerOutline =
  'inline-flex items-center justify-center rounded-xl border border-rose-300/80 px-3 py-1.5 text-sm text-rose-800 hover:bg-rose-50';

export const inputUi =
  'mt-1 w-full rounded-xl border border-rose-100 bg-white/90 px-3 py-2 text-sm text-stone-800 focus:border-violet-200 focus:outline-none focus:ring-2 focus:ring-violet-100/80';
export const selectUi = inputUi;
export const textareaUi =
  'mt-1 w-full rounded-xl border border-rose-100 bg-white/90 px-3 py-2 text-sm text-stone-800 focus:border-violet-200 focus:outline-none focus:ring-2 focus:ring-violet-100/80';

export const dangerZone =
  'mt-8 rounded-2xl border border-rose-200/80 bg-rose-50/50 p-4';

export const authPageWrap =
  'relative flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12';
export const authPageWash =
  'pointer-events-none absolute inset-0 bg-gradient-to-b from-rose-100/40 via-violet-50/50 to-amber-50/40';
export const authPageGlow =
  'pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-fuchsia-200/25 blur-3xl';
export const authCard =
  'relative z-10 w-full max-w-md rounded-2xl border border-rose-100/90 bg-white/85 p-8 shadow-xl shadow-rose-100/40 backdrop-blur-sm';
export const authCardWide =
  'relative z-10 w-full max-w-2xl rounded-2xl border border-rose-100/90 bg-white/85 p-8 shadow-xl shadow-rose-100/40 backdrop-blur-sm';
export const authHeading = 'text-2xl font-bold text-violet-950';
export const authSubtext = 'mt-2 text-sm text-stone-500';
export const authBtnPrimary =
  'w-full rounded-xl bg-gradient-to-r from-rose-300 to-violet-300 py-3 text-sm font-semibold text-violet-950 shadow-sm shadow-rose-200/40 hover:from-rose-200 hover:to-violet-200 disabled:opacity-50';

export const starOn = 'text-amber-400';
export const starOff = 'text-stone-300';

export const commentSectionList = 'space-y-3';
export const commentItemCard =
  'rounded-xl border border-rose-100/90 bg-white/70 p-3 shadow-sm shadow-rose-50';
export const commentAvatar =
  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-medium text-violet-800';
export const commentTextBubble = 'text-sm text-stone-700';
