import { useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";
import {
  normalizeCategoryKey,
  SEARCH_CATEGORY_OPTIONS,
  toTurkishCategory,
} from "../utils/category";
import { notifyAuthChanged } from "../utils/auth";
import { AUTH_TOKEN_KEY } from "../utils/constants";
import { formatTryPrice, menuItemName, menuItemPrice } from "../utils/venueMenu";
import { appRoutes } from "../utils/routes";
import {
  headerBar,
  navAvatar,
  navLogoutBtn,
  navProfilePill,
  navCategorySelect,
  navSearchInput,
  navSubBar,
  navLinkClass,
} from "../utils/ui";

const SEARCH_DEBOUNCE_MS = 380;
const VENUE_FETCH_LIMIT = 500;
const ISPARTA_CENTER = { lat: 37.7648, lng: 30.5566 };
const ISTANBUL_CENTER = { lat: 41.0082, lng: 28.9784 };
const ISPARTA_RADIUS_KM = 45;
const ISTANBUL_RADIUS_KM = 35;

function useDebouncedValue(value, ms) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), ms);
    return () => window.clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

function initialFromUser(user) {
  const n = (user?.name || user?.username || "?").trim();
  return n.slice(0, 1).toUpperCase() || "?";
}

function profilePhotoFromUser(user) {
  const raw = String(user?.profilePhoto ?? "").trim();
  return raw || "";
}

function startsWithQuery(value, query) {
  const text = String(value ?? "").trim().toLocaleLowerCase("tr-TR");
  if (!text || !query) return false;
  return text.startsWith(query);
}

function menuHasWordStartingWithQuery(value, query) {
  const text = String(value ?? "").trim().toLocaleLowerCase("tr-TR");
  if (!text || !query) return false;
  return text.split(/[^a-z0-9çğıöşü]+/i).some((part) => part.startsWith(query));
}

function venueMatchesSuggestion(venue, query) {
  const name = String(venue?.name ?? "");
  const menu = Array.isArray(venue?.menu) ? venue.menu : [];
  const categoryKey = normalizeCategoryKey(venue?.category);
  const categoryQueryKey = normalizeCategoryKey(query);
  return (
    startsWithQuery(name, query) ||
    (categoryQueryKey ? categoryKey.startsWith(categoryQueryKey) : false) ||
    menu.some((item) => menuHasWordStartingWithQuery(menuItemName(item), query))
  );
}

function haversineKm(a, b) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const p1 = toRad(a.lat);
  const p2 = toRad(b.lat);
  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(p1) * Math.cos(p2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  return R * c;
}

function isCuratedVenue(venue) {
  const city = String(venue?.address?.city ?? "")
    .trim()
    .toLocaleLowerCase("tr-TR");
  if (city === "ısparta" || city === "isparta" || city === "istanbul") return true;
  const lat = venue?.location?.lat;
  const lng = venue?.location?.lng;
  if (typeof lat !== "number" || Number.isNaN(lat)) return false;
  if (typeof lng !== "number" || Number.isNaN(lng)) return false;
  const kmIsparta = haversineKm(ISPARTA_CENTER, { lat, lng });
  if (kmIsparta <= ISPARTA_RADIUS_KM) return true;
  const kmIstanbul = haversineKm(ISTANBUL_CENTER, { lat, lng });
  return kmIstanbul <= ISTANBUL_RADIUS_KM;
}

function getSuggestionMeta(venue, query) {
  const name = String(venue?.name ?? "");
  if (startsWithQuery(name, query)) {
    return { source: "name", label: "Mekan adı" };
  }
  const menu = Array.isArray(venue?.menu) ? venue.menu : [];
  const categoryKey = normalizeCategoryKey(venue?.category);
  const categoryQueryKey = normalizeCategoryKey(query);
  if (categoryQueryKey && categoryKey.startsWith(categoryQueryKey)) {
    return { source: "category", label: `Kategori: ${toTurkishCategory(venue?.category)}` };
  }
  const matchedItem = menu.find((item) => menuHasWordStartingWithQuery(menuItemName(item), query));
  if (matchedItem) {
    const p = formatTryPrice(menuItemPrice(matchedItem));
    const name = menuItemName(matchedItem);
    return { source: "menu", label: p ? `Menü: ${name} · ${p}` : `Menü: ${name}` };
  }
  return null;
}

export default function AppHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchWrapRef = useRef(null);
  const notifWrapRef = useRef(null);

  const loggedIn =
    typeof window !== "undefined" && !!localStorage.getItem(AUTH_TOKEN_KEY);

  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState(null);
  const [allVenues, setAllVenues] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [commentLikeNotifications, setCommentLikeNotifications] = useState([]);
  const [commentReplyNotifications, setCommentReplyNotifications] = useState([]);
  const [venueAnnouncementNotifications, setVenueAnnouncementNotifications] = useState([]);
  const [incomingFriendRequests, setIncomingFriendRequests] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [seenNotificationKeys, setSeenNotificationKeys] = useState(() => new Set());
  const [friendActionBusyId, setFriendActionBusyId] = useState(null);
  const [incomingFriendRequestCount, setIncomingFriendRequestCount] = useState(0);
  const isOwner = user?.role === "owner";
  const isAdminOnly = user?.role === "admin";
  const profileNavTarget =
    user?.role === "admin" || user?.role === "owner" ? appRoutes.admin : appRoutes.profile;
  const profileNavTitle = user?.role === "admin" || user?.role === "owner" ? "Yönetim" : "Profil";

  const qFromUrl = searchParams.get("q") ?? "";
  const catFromUrl = searchParams.get("cat") ?? "";
  const categoryUrlValid = SEARCH_CATEGORY_OPTIONS.some((o) => o.value === catFromUrl)
    ? catFromUrl
    : "";
  const [searchDraft, setSearchDraft] = useState(qFromUrl);
  const debouncedSearch = useDebouncedValue(searchDraft, SEARCH_DEBOUNCE_MS);
  const suggestionQuery = searchDraft.trim().toLocaleLowerCase("tr-TR");

  const suggestions = useMemo(() => {
    if (!suggestionQuery) return [];
    const list = allVenues
      .map((v) => ({ venue: v, meta: getSuggestionMeta(v, suggestionQuery) }))
      .filter((row) => venueMatchesSuggestion(row.venue, suggestionQuery) && row.meta)
      .slice(0, 10);
    return list;
  }, [allVenues, suggestionQuery]);

  const notificationKeys = useMemo(
    () =>
      [
        ...commentLikeNotifications.map((item) =>
          String(
            item?.commentId && item?.updatedAt
              ? `comment_${item.commentId}_${item.updatedAt}`
              : `comment_${item?.commentId ?? item?.updatedAt ?? ""}`,
          ),
        ),
        ...commentReplyNotifications.map((item) =>
          String(
            item?.commentId && item?.updatedAt
              ? `reply_${item.commentId}_${item.updatedAt}`
              : `reply_${item?.commentId ?? item?.updatedAt ?? ""}`,
          ),
        ),
        ...venueAnnouncementNotifications.map((item) =>
          String(
            item?.venueId && item?.updatedAt
              ? `venue_${item.venueId}_${item.updatedAt}`
              : `venue_${item?.venueId ?? item?.updatedAt ?? ""}`,
          ),
        ),
        ...incomingFriendRequests.map((req) =>
          String(req?._id ? `friend_${req._id}` : ""),
        ),
      ].filter(Boolean),
    [commentLikeNotifications, commentReplyNotifications, venueAnnouncementNotifications, incomingFriendRequests],
  );

  const unreadNotificationCount = useMemo(() => {
    return notificationKeys.filter((k) => k && !seenNotificationKeys.has(k)).length;
  }, [notificationKeys, seenNotificationKeys]);

  const seenStorageKey = useMemo(() => {
    const uid = String(user?._id ?? user?.id ?? "");
    return uid ? `seen-notifications:${uid}` : "";
  }, [user?._id, user?.id]);

  useEffect(() => {
    setSearchDraft(qFromUrl);
  }, [qFromUrl]);

  useEffect(() => {
    let active = true;
    api
      .get("/venues", { params: { limit: VENUE_FETCH_LIMIT } })
      .then((res) => {
        const items = Array.isArray(res.data?.data?.items) ? res.data.data.items : [];
        if (active) setAllVenues(items.filter(isCuratedVenue));
      })
      .catch(() => {
        if (active) setAllVenues([]);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    function onPointerDown(e) {
      if (!searchWrapRef.current?.contains(e.target)) {
        setShowSuggestions(false);
      }
      if (!notifWrapRef.current?.contains(e.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  useEffect(() => {
    if (!loggedIn) {
      setCommentLikeNotifications([]);
      setCommentReplyNotifications([]);
      setVenueAnnouncementNotifications([]);
      setIncomingFriendRequests([]);
      setSeenNotificationKeys(new Set());
      return;
    }
    let active = true;
    let timer = null;

    const loadNotifications = async () => {
      try {
        const calls = [
          api.get("/notifications/comment-likes"),
          api.get("/notifications/comment-replies"),
          api.get("/notifications/venue-announcements"),
        ];
        if (!isOwner && !isAdminOnly) calls.push(api.get("/friends/pending"));
        const [likesRes, repliesRes, venueRes, pendingRes] = await Promise.all(calls);
        const likeItems = Array.isArray(likesRes.data?.data?.items) ? likesRes.data.data.items : [];
        const replyItems = Array.isArray(repliesRes.data?.data?.items) ? repliesRes.data.data.items : [];
        const venueItems = Array.isArray(venueRes.data?.data?.items) ? venueRes.data.data.items : [];
        const incoming = Array.isArray(pendingRes?.data?.data?.incoming) ? pendingRes.data.data.incoming : [];
        if (active) {
          setCommentLikeNotifications(likeItems);
          setCommentReplyNotifications(replyItems);
          setVenueAnnouncementNotifications(venueItems);
          setIncomingFriendRequests(incoming);
        }
      } catch {
        if (active) {
          setCommentLikeNotifications([]);
          setCommentReplyNotifications([]);
          setVenueAnnouncementNotifications([]);
          setIncomingFriendRequests([]);
        }
      }
    };

    loadNotifications();
    timer = window.setInterval(loadNotifications, 20000);

    return () => {
      active = false;
      if (timer) window.clearInterval(timer);
    };
  }, [loggedIn, isOwner, isAdminOnly]);

  useEffect(() => {
    if (!loggedIn || isOwner || isAdminOnly) {
      setIncomingFriendRequestCount(0);
      return;
    }
    let active = true;
    let timer = null;
    const loadPendingCount = async () => {
      try {
        const res = await api.get("/friends/pending");
        const incoming = Array.isArray(res.data?.data?.incoming) ? res.data.data.incoming : [];
        if (active) setIncomingFriendRequestCount(incoming.length);
      } catch {
        if (active) setIncomingFriendRequestCount(0);
      }
    };
    loadPendingCount();
    timer = window.setInterval(loadPendingCount, 20000);
    return () => {
      active = false;
      if (timer) window.clearInterval(timer);
    };
  }, [loggedIn, isOwner, isAdminOnly]);

  useEffect(() => {
    if (!showNotifications) return;
    setSeenNotificationKeys((prev) => {
      const next = new Set(prev);
      notificationKeys.forEach((k) => {
        if (k) next.add(k);
      });
      return next;
    });
  }, [showNotifications, notificationKeys]);

  useEffect(() => {
    if (!seenStorageKey) return;
    try {
      const raw = localStorage.getItem(seenStorageKey);
      if (!raw) return;
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        setSeenNotificationKeys(new Set(arr.map((v) => String(v))));
      }
    } catch {
      // ignore storage parse errors
    }
  }, [seenStorageKey]);

  useEffect(() => {
    if (!seenStorageKey) return;
    try {
      localStorage.setItem(seenStorageKey, JSON.stringify(Array.from(seenNotificationKeys)));
    } catch {
      // ignore storage write errors
    }
  }, [seenStorageKey, seenNotificationKeys]);

  useEffect(() => {
    if (!loggedIn) {
      setIsAdmin(false);
      setUser(null);
      return;
    }
    let active = true;
    api
      .get("/auth/me")
      .then((res) => {
        const u = res.data?.data?.user ?? null;
        if (!active) return;
        setUser(u);
        setIsAdmin(u?.role === "admin" || u?.role === "owner");
      })
      .catch(() => {
        if (active) {
          setUser(null);
          setIsAdmin(false);
        }
      });
    return () => {
      active = false;
    };
  }, [loggedIn]);

  useEffect(() => {
    function onProfileUpdated(e) {
      const updated = e?.detail;
      if (!updated || typeof updated !== "object") return;
      setUser((prev) => ({ ...(prev || {}), ...updated }));
      setIsAdmin(updated?.role === "admin" || updated?.role === "owner");
    }
    window.addEventListener("profile-updated", onProfileUpdated);
    return () => window.removeEventListener("profile-updated", onProfileUpdated);
  }, []);

  useEffect(() => {
    const trimmed = debouncedSearch.trim();
    if (trimmed === qFromUrl.trim()) return;

    // Anasayfa veya Mekanlar sayfasindayken arama sorgusunu URL'e senkronla.
    if (location.pathname !== appRoutes.home && location.pathname !== appRoutes.venues) return;

    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (trimmed) next.set("q", trimmed);
        else next.delete("q");
        return next;
      },
      { replace: true },
    );
  }, [debouncedSearch, qFromUrl, location.pathname, setSearchParams]);

  function onCategoryChange(e) {
    if (!loggedIn) return;
    const nextCat = e.target.value;
    const qs = new URLSearchParams();
    const qTrim = searchDraft.trim();
    if (qTrim) qs.set("q", qTrim);
    if (nextCat) qs.set("cat", nextCat);
    const str = qs.toString();
    const onSearchPage =
      location.pathname === appRoutes.home || location.pathname === appRoutes.venues;
    const path = onSearchPage ? location.pathname : appRoutes.venues;
    navigate({ pathname: path, search: str ? `?${str}` : "" }, { replace: true });
    setShowSuggestions(false);
  }

  function logout() {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    setUser(null);
    setIsAdmin(false);
    setCommentLikeNotifications([]);
    setCommentReplyNotifications([]);
    setVenueAnnouncementNotifications([]);
    setIncomingFriendRequests([]);
    setIncomingFriendRequestCount(0);
    setShowNotifications(false);
    setSeenNotificationKeys(new Set());
    notifyAuthChanged();
    navigate(appRoutes.home, { replace: true });
  }

  function onSearchSubmit(e) {
    e.preventDefault();
    if (!loggedIn) {
      navigate(appRoutes.login);
      return;
    }
    const trimmed = searchDraft.trim();
    const next = new URLSearchParams();
    if (trimmed) next.set("q", trimmed);
    if (categoryUrlValid) next.set("cat", categoryUrlValid);
    const qs = next.toString();
    const path =
      location.pathname === appRoutes.venues ? appRoutes.venues : appRoutes.home;
    navigate({ pathname: path, search: qs ? `?${qs}` : "" }, { replace: true });
    setShowSuggestions(false);
  }

  function selectSuggestion(venue) {
    if (!loggedIn) {
      navigate(appRoutes.login);
      return;
    }
    const selectedName = String(venue?.name ?? "").trim();
    if (!selectedName) return;
    const selectedId = String(venue?._id ?? venue?.id ?? "").trim();
    setSearchDraft(selectedName);
    if (selectedId) {
      navigate(appRoutes.venueDetail.replace(":id", selectedId));
      setShowSuggestions(false);
      return;
    }
    const next = new URLSearchParams();
    next.set("q", selectedName);
    if (categoryUrlValid) next.set("cat", categoryUrlValid);
    const qs = next.toString();
    navigate({ pathname: appRoutes.home, search: qs ? `?${qs}` : "" }, { replace: true });
    setShowSuggestions(false);
  }

  async function respondToFriendRequest(requestId, action) {
    if (!requestId) return;
    setFriendActionBusyId(requestId);
    try {
      await api.put(`/friends/accept/${requestId}`, { action });
      setIncomingFriendRequests((prev) => prev.filter((r) => String(r?._id) !== String(requestId)));
    } catch {
      // Keep silent in header; user can retry from Friends page.
    } finally {
      setFriendActionBusyId(null);
    }
  }

  return (
    <header className={headerBar}>
      <div className="mx-auto w-full max-w-6xl px-4 py-3 sm:px-6">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <Link
            to={appRoutes.home}
            className="shrink-0 bg-gradient-to-r from-violet-500 via-rose-400 to-amber-300 bg-clip-text text-xl font-bold tracking-tight text-transparent sm:text-2xl"
          >
            Meydone
          </Link>

          <form
            role="search"
            aria-label="Mekan ara ve kategoriye göre filtrele"
            className="order-3 flex w-full min-w-0 flex-col gap-2 sm:order-none sm:mx-auto sm:max-w-2xl sm:flex-1 sm:flex-row sm:items-stretch md:max-w-3xl"
            onSubmit={onSearchSubmit}
            ref={searchWrapRef}
          >
            <div className="relative min-w-0 flex-1">
              <input
                name="q"
                type="search"
                autoComplete="off"
                placeholder={loggedIn ? "Mekan adı veya menüde ara…" : "Arama için önce giriş yapın"}
                value={searchDraft}
                disabled={!loggedIn}
                onFocus={() => setShowSuggestions(loggedIn)}
                onChange={(e) => {
                  if (!loggedIn) return;
                  setSearchDraft(e.target.value);
                  setShowSuggestions(true);
                }}
                className={navSearchInput}
              />
              {loggedIn && showSuggestions && suggestions.length > 0 ? (
                <ul className="absolute z-40 mt-2 max-h-72 w-full overflow-auto rounded-2xl border border-rose-100 bg-white/95 p-1 shadow-lg shadow-rose-200/25 backdrop-blur-sm">
                  {suggestions.map(({ venue, meta }) => {
                    const id = String(venue?._id ?? venue?.id ?? `${venue?.name}-${venue?.category}`);
                    const name = String(venue?.name ?? "Adsız mekan");
                    const category = toTurkishCategory(venue?.category);
                    return (
                      <li key={id}>
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => selectSuggestion(venue)}
                          className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm hover:bg-rose-50/90"
                        >
                          <span className="min-w-0">
                            <span className="block truncate font-medium text-stone-800">{name}</span>
                            <span className="block truncate text-xs text-stone-500">{category}</span>
                          </span>
                          <span className="ml-3 shrink-0 rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700">
                            {meta?.label}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </div>
            <label className="sr-only" htmlFor="nav-category-filter">
              Kategoriye göre filtrele
            </label>
            <select
              id="nav-category-filter"
              name="cat"
              value={categoryUrlValid}
              disabled={!loggedIn}
              onChange={onCategoryChange}
              className={navCategorySelect}
              aria-label="Kategoriye göre filtrele"
            >
              {SEARCH_CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value || "all"} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </form>

          <div className="ml-auto flex shrink-0 items-center gap-2 sm:ml-0">
            {loggedIn ? (
              <>
                {!isOwner ? (
                  <div className="relative" ref={notifWrapRef}>
                    <button
                      type="button"
                      onClick={() => setShowNotifications((s) => !s)}
                      className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-red-200/80 bg-white/80 text-red-700 shadow-sm transition hover:bg-red-50/90"
                      aria-label="Bildirimler"
                      title="Bildirimler"
                    >
                      <span aria-hidden>🔔</span>
                      {unreadNotificationCount > 0 ? (
                        <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-sm">
                          {unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}
                        </span>
                      ) : null}
                    </button>
                    {showNotifications ? (
                      <div className="absolute right-0 z-50 mt-2 w-80 max-w-[85vw] rounded-2xl border border-rose-100 bg-white/95 p-2 shadow-xl shadow-rose-200/25 backdrop-blur-sm">
                      <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-violet-700">
                        Bildirimler
                      </p>
                      {incomingFriendRequests.length > 0 ? (
                        <ul className="mb-1 max-h-40 overflow-auto">
                          {incomingFriendRequests.slice(0, 5).map((req) => {
                            const key = String(req?._id ?? Math.random());
                            const from = req?.from;
                            const name = from?.name || from?.username || "Kullanıcı";
                            return (
                              <li key={key} className="rounded-xl px-2 py-2 text-sm hover:bg-rose-50/90">
                                <p className="font-medium text-stone-800">Yeni arkadaşlık isteği</p>
                                <p className="mt-1 text-xs text-stone-600">
                                  {name}
                                  {from?.username ? ` (@${from.username})` : ""}
                                </p>
                                <div className="mt-2 flex gap-2">
                                  <button
                                    type="button"
                                    disabled={friendActionBusyId === String(req?._id)}
                                    onClick={() => respondToFriendRequest(String(req?._id), "accept")}
                                    className="rounded-lg bg-emerald-200/70 px-2.5 py-1 text-xs font-semibold text-emerald-900 hover:bg-emerald-200 disabled:opacity-60"
                                  >
                                    Kabul et
                                  </button>
                                  <button
                                    type="button"
                                    disabled={friendActionBusyId === String(req?._id)}
                                    onClick={() => respondToFriendRequest(String(req?._id), "reject")}
                                    className="rounded-lg bg-rose-100/80 px-2.5 py-1 text-xs font-semibold text-stone-700 hover:bg-rose-200/60 disabled:opacity-60"
                                  >
                                    Reddet
                                  </button>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      ) : null}
                      {venueAnnouncementNotifications.length > 0 ? (
                        <ul className="mb-1 max-h-44 overflow-auto">
                          {venueAnnouncementNotifications.slice(0, 8).map((item) => {
                            const key = String(item.venueId ?? item.updatedAt ?? Math.random());
                            const venueName = item?.venue?.name ?? "Mekan";
                            const when = item?.updatedAt
                              ? new Date(item.updatedAt).toLocaleString("tr-TR", {
                                  dateStyle: "short",
                                  timeStyle: "short",
                                })
                              : "";
                            return (
                              <li key={key} className="rounded-xl px-2 py-2 text-sm hover:bg-rose-50/90">
                                <p className="font-medium text-stone-800">Mekan duyurusu: {venueName}</p>
                                <p className="mt-1 text-xs text-stone-700">{String(item?.announcement ?? "")}</p>
                                {when ? <p className="mt-1 text-[11px] text-stone-400">{when}</p> : null}
                              </li>
                            );
                          })}
                        </ul>
                      ) : null}
                      {commentReplyNotifications.length > 0 ? (
                        <ul className="mb-1 max-h-56 overflow-auto">
                          {commentReplyNotifications.slice(0, 8).map((item) => {
                            const key = String(item.commentId ?? item.updatedAt ?? Math.random());
                            const venueName = item?.venue?.name ?? "Mekan";
                            const byName =
                              item?.replyBy?.username
                                ? `@${item.replyBy.username}`
                                : item?.replyBy?.name || "Bir kullanıcı";
                            const when = item?.updatedAt
                              ? new Date(item.updatedAt).toLocaleString("tr-TR", {
                                  dateStyle: "short",
                                  timeStyle: "short",
                                })
                              : "";
                            return (
                              <li key={`reply-${key}`} className="rounded-xl px-2 py-2 text-sm hover:bg-rose-50/90">
                                <p className="font-medium text-stone-800">
                                  {venueName} yorumuna cevap geldi.
                                </p>
                                <p className="mt-1 text-xs text-stone-600">Cevaplayan: {byName}</p>
                                {item?.replyPreview ? (
                                  <p className="mt-1 text-xs text-stone-700">
                                    Cevap: "{item.replyPreview}"
                                  </p>
                                ) : null}
                                {item?.commentPreview ? (
                                  <p className="mt-1 text-xs text-stone-500">
                                    Yorumun: "{item.commentPreview}"
                                  </p>
                                ) : null}
                                {when ? <p className="mt-1 text-[11px] text-stone-400">{when}</p> : null}
                              </li>
                            );
                          })}
                        </ul>
                      ) : null}
                      {commentLikeNotifications.length === 0 && commentReplyNotifications.length === 0 ? (
                        incomingFriendRequests.length === 0 && venueAnnouncementNotifications.length === 0 ? (
                          <p className="px-2 py-3 text-sm text-stone-500">Henüz bildirim yok.</p>
                        ) : null
                      ) : (
                        <ul className="max-h-72 overflow-auto">
                          {commentLikeNotifications.slice(0, 8).map((item) => {
                            const key = String(item.commentId ?? item.updatedAt ?? Math.random());
                            const venueName = item?.venue?.name ?? "Mekan";
                            const likeCount = Number(item?.likeCount ?? 0);
                            const likers = Array.isArray(item?.likers) ? item.likers : [];
                            const likerNames = likers
                              .slice(0, 2)
                              .map((u) => {
                                const uname = String(u?.username ?? "").trim();
                                if (uname) return `@${uname}`;
                                const n = String(u?.name ?? "").trim();
                                return n || "Bir kullanıcı";
                              })
                              .join(", ");
                            const likerExtra = likeCount > 2 ? ` ve ${likeCount - 2} kişi daha` : "";
                            const when = item?.updatedAt
                              ? new Date(item.updatedAt).toLocaleString("tr-TR", {
                                  dateStyle: "short",
                                  timeStyle: "short",
                                })
                              : "";
                            return (
                              <li key={key} className="rounded-xl px-2 py-2 text-sm hover:bg-rose-50/90">
                                <p className="font-medium text-stone-800">
                                  {venueName} yorumun beğenildi ({likeCount}).
                                </p>
                                {item?.commentPreview ? (
                                  <p className="mt-1 text-xs text-stone-700">
                                    Yorumun: "{item.commentPreview}"
                                  </p>
                                ) : null}
                                {likerNames ? (
                                  <p className="mt-1 text-xs text-stone-600">
                                    Beğenen: {likerNames}
                                    {likerExtra}
                                  </p>
                                ) : null}
                                {when ? <p className="mt-1 text-[11px] text-stone-400">{when}</p> : null}
                              </li>
                            );
                          })}
                        </ul>
                      )}
                      </div>
                    ) : null}
                  </div>
                ) : null}
                <Link
                  to={profileNavTarget}
                  className={navProfilePill}
                  title={profileNavTitle}
                >
                  <span className={navAvatar} aria-hidden>
                    {profilePhotoFromUser(user) ? (
                      <img
                        src={profilePhotoFromUser(user)}
                        alt=""
                        className="h-full w-full rounded-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      initialFromUser(user)
                    )}
                  </span>
                  <span className="hidden max-w-[7rem] truncate text-sm font-semibold text-stone-800 sm:inline">
                    {user?.name || user?.username || "Profil"}
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className={navLogoutBtn}
                >
                  Çıkış Yap
                </button>
              </>
            ) : (
              <>
                <NavLink to={appRoutes.login} className={navLinkClass}>
                  Giriş Yap
                </NavLink>
                <NavLink to={appRoutes.register} className={navLinkClass}>
                  Üye Ol
                </NavLink>
              </>
            )}
          </div>
        </div>
      </div>

      <div className={navSubBar}>
        <nav
          className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-1 px-4 py-2.5 sm:justify-start sm:px-6"
          aria-label="Ana gezinme"
        >
          <NavLink
            to={{ pathname: appRoutes.home, search: location.search }}
            className={navLinkClass}
          >
            Anasayfa
          </NavLink>
          {!isOwner ? (
            <NavLink
              to={{ pathname: appRoutes.venues, search: location.search }}
              className={navLinkClass}
            >
              Mekanlar
            </NavLink>
          ) : null}
          {loggedIn && !isOwner && !isAdminOnly ? (
            <NavLink to={appRoutes.friends} className={navLinkClass}>
              <span className="inline-flex items-center gap-1.5">
                <span>Arkadaşlar</span>
                {incomingFriendRequestCount > 0 ? (
                  <span className="inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-rose-400 px-1 text-[10px] font-bold text-white shadow-sm">
                    {incomingFriendRequestCount > 9 ? "9+" : incomingFriendRequestCount}
                  </span>
                ) : null}
              </span>
            </NavLink>
          ) : null}
          {loggedIn && isAdmin ? (
            <NavLink to={appRoutes.admin} className={navLinkClass}>
              Yönetim
            </NavLink>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
