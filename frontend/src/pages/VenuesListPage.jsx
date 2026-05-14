import { useEffect, useState } from "react";
import { useAuthSyncTick } from "../hooks/useAuthSyncTick";
import { Link, useSearchParams } from "react-router-dom";
import VenueBrowseCard from "../components/VenueBrowseCard";
import api from "../services/api";
import {
  normalizeCategoryKey,
  SEARCH_CATEGORY_OPTIONS,
  venueMatchesCategoryParam,
} from "../utils/category";
import { AUTH_TOKEN_KEY } from "../utils/constants";
import { appRoutes } from "../utils/routes";
import { alertError, alertWarn, headingPage, messageVenueSearchNotFound, textMuted } from "../utils/ui";
import { venueId } from "../utils/venue";
import { menuItemName } from "../utils/venueMenu";

const ISPARTA_CENTER = { lat: 37.7648, lng: 30.5566 };
const ISTANBUL_CENTER = { lat: 41.0082, lng: 28.9784 };
const ISPARTA_RADIUS_KM = 45;
const ISTANBUL_RADIUS_KM = 35;
const MAX_DISPLAY_VENUES = 24;

function normalizeVenueList(payload) {
  const items = payload?.data?.items;
  return Array.isArray(items) ? items : [];
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

function venueMatchesNameOrMenu(venue, query) {
  const q = String(query ?? "").trim().toLocaleLowerCase("tr-TR");
  if (!q) return true;
  const name = String(venue?.name ?? "");
  const menu = Array.isArray(venue?.menu) ? venue.menu : [];
  return (
    startsWithQuery(name, q) || menu.some((item) => menuHasWordStartingWithQuery(menuItemName(item), q))
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
  if (city === "ısparta" || city === "isparta") return true;
  if (city === "istanbul") return true;
  const lat = venue?.location?.lat;
  const lng = venue?.location?.lng;
  if (typeof lat !== "number" || Number.isNaN(lat)) return false;
  if (typeof lng !== "number" || Number.isNaN(lng)) return false;
  const kmIsparta = haversineKm(ISPARTA_CENTER, { lat, lng });
  if (kmIsparta <= ISPARTA_RADIUS_KM) return true;
  const kmIstanbul = haversineKm(ISTANBUL_CENTER, { lat, lng });
  return kmIstanbul <= ISTANBUL_RADIUS_KM;
}

export default function VenuesListPage() {
  useAuthSyncTick();
  const [searchParams] = useSearchParams();
  const nameQ = (searchParams.get("q") ?? "").trim();
  const categoryParamRaw = (searchParams.get("cat") ?? "").trim();
  const categoryParam = SEARCH_CATEGORY_OPTIONS.some((o) => o.value === categoryParamRaw)
    ? categoryParamRaw
    : "";
  const hasActiveSearchOrFilter = Boolean(nameQ || categoryParam);
  const isLoggedIn =
    typeof window !== "undefined" && !!localStorage.getItem(AUTH_TOKEN_KEY);

  const [venues, setVenues] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const hasToken =
      typeof window !== "undefined" && !!localStorage.getItem(AUTH_TOKEN_KEY);
    if (!hasToken) {
      setCurrentUser(null);
      return;
    }
    let active = true;
    api
      .get("/auth/me")
      .then((res) => {
        if (!active) return;
        setCurrentUser(res.data?.data?.user ?? null);
      })
      .catch(() => {
        if (active) setCurrentUser(null);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!isLoggedIn) {
      setVenues([]);
      setError("");
      setStatus("success");
      return;
    }

    let active = true;

    (async () => {
      setStatus("loading");
      setError("");
      try {
        let items = [];

        const hasTextQ = Boolean(nameQ);
        const hasCatQ = Boolean(categoryParam);

        if (hasTextQ || hasCatQ) {
          const { data } = await api.get("/venues", {
            params: { limit: 500 },
          });
          items = normalizeVenueList(data);
          if (hasTextQ) {
            items = items.filter((v) => {
              const q = String(nameQ ?? "").trim().toLocaleLowerCase("tr-TR");
              if (!q) return true;
              const categoryKey = normalizeCategoryKey(v?.category);
              const categoryQueryKey = normalizeCategoryKey(q);
              return (
                venueMatchesNameOrMenu(v, q) ||
                (categoryQueryKey ? categoryKey.startsWith(categoryQueryKey) : false)
              );
            });
          }
          if (hasCatQ) {
            items = items.filter((v) => venueMatchesCategoryParam(v?.category, categoryParam));
          }
        } else {
          const { data } = await api.get("/venues");
          items = normalizeVenueList(data);
        }

        if (currentUser?.role === "owner" || currentUser?.role === "admin") {
          const ownerId = String(currentUser?._id ?? currentUser?.id ?? "");
          items = items.filter((v) => {
            const venueOwner = String(v?.owner?._id ?? v?.owner ?? "");
            return Boolean(ownerId && venueOwner && venueOwner === ownerId);
          });
        } else {
          items = items.filter(isCuratedVenue);

          // İstanbul'dan birkaç örnek gösterirken listeyi üst sınırlıyoruz.
          const isIstanbulCity = (v) =>
            String(v?.address?.city ?? "")
              .trim()
              .toLocaleLowerCase("tr-TR") === "istanbul";

          const sortByRatingThenDate = (a, b) => {
            const ra = typeof a?.rating === "number" && !Number.isNaN(a.rating) ? a.rating : 0;
            const rb = typeof b?.rating === "number" && !Number.isNaN(b.rating) ? b.rating : 0;
            if (rb !== ra) return rb - ra;

            const ta = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
            const tb = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
            const tfa = Number.isFinite(ta) ? ta : 0;
            const tfb = Number.isFinite(tb) ? tb : 0;
            return tfb - tfa;
          };

          const allSorted = items.slice().sort(sortByRatingThenDate);
          let picked = allSorted.slice(0, MAX_DISPLAY_VENUES);

          const MIN_ISTANBUL_VENUES = 3;
          const allIstanbulCount = allSorted.filter(isIstanbulCity).length;
          const minIstanbul = Math.min(MIN_ISTANBUL_VENUES, allIstanbulCount);

          let istCount = picked.filter(isIstanbulCity).length;
          if (istCount < minIstanbul) {
            const pickedIds = new Set(picked.map((v) => venueId(v)));
            const remainingIstanbul = allSorted
              .filter(isIstanbulCity)
              .filter((v) => !pickedIds.has(venueId(v)));

            for (const v of remainingIstanbul) {
              if (istCount >= minIstanbul) break;
              const replaceIdx = [...picked.keys()].reverse().find((idx) => !isIstanbulCity(picked[idx]));
              if (replaceIdx == null) break;

              const old = picked[replaceIdx];
              picked[replaceIdx] = v;
              pickedIds.delete(venueId(old));
              pickedIds.add(venueId(v));
              istCount += 1;
            }
          }

          items = picked;
        }

        if (!active) return;
        setVenues(items);
        setStatus("success");
      } catch (err) {
        if (!active) return;
        setVenues([]);
        setStatus("error");
        setError(err.apiMessage || err.message || "Mekanlar yüklenemedi");
      }
    })();

    return () => {
      active = false;
    };
  }, [nameQ, categoryParam, currentUser, isLoggedIn]);

  return (
    <div className="relative flex min-h-[calc(100vh-14rem)] flex-col gap-8 sm:gap-10">
      <div
        className="pointer-events-none absolute -inset-x-4 -top-2 bottom-0 -z-0 rounded-[2rem] bg-gradient-to-br from-rose-100/40 via-violet-100/30 to-amber-50/50 sm:-inset-x-6"
        aria-hidden
      />

      <div className="relative z-10 flex flex-col gap-8 sm:gap-10">
        <header className="rounded-3xl border border-rose-100/60 bg-gradient-to-br from-rose-50/90 via-white/80 to-violet-50/50 p-6 shadow-lg shadow-rose-100/30 backdrop-blur-md sm:p-8">
          <h1 className={headingPage}>Mekanlar</h1>
          <p className={`mt-3 max-w-2xl ${textMuted}`}>
            Isparta ve İstanbul&apos;daki seçili mekanları fotoğraflarıyla gezin. Üst çubuktan kategori seçip daraltabilir, arama kutusuyla isim veya menüde arayabilirsiniz.
            Harita için{" "}
            <Link to={appRoutes.home} className="font-semibold text-violet-700 underline underline-offset-2">
              anasayfaya
            </Link>{" "}
            dönün.
          </p>
        </header>

        <section aria-label="Mekan listesi" className="flex-1 space-y-6">
          {!isLoggedIn ? (
            <p className="rounded-2xl border border-amber-200/80 bg-amber-50/80 px-6 py-12 text-center text-amber-900">
              Mekanları görüntüleyebilmek için önce{" "}
              <Link to={appRoutes.login} className="font-semibold underline underline-offset-2">
                giriş yap
              </Link>
              .
            </p>
          ) : null}

          {status === "loading" ? (
            <p className={`text-center ${textMuted}`}>Mekanlar yükleniyor…</p>
          ) : null}

          {status === "error" ? (
            <p className={alertError} role="alert">
              {error}
            </p>
          ) : null}

          {isLoggedIn && status === "success" ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-end justify-between gap-3">
                {venues.length > 0 ? (
                  <p className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-semibold text-stone-600">
                    {venues.length} mekan
                  </p>
                ) : null}
              </div>
              {venues.length === 0 ? (
                <p
                  className={
                    hasActiveSearchOrFilter
                      ? `${alertWarn} px-6 py-12 text-center font-medium`
                      : `rounded-2xl border border-dashed border-stone-200 bg-white/80 px-6 py-12 text-center ${textMuted}`
                  }
                  role={hasActiveSearchOrFilter ? "alert" : undefined}
                >
                  {hasActiveSearchOrFilter
                    ? messageVenueSearchNotFound
                    : "Listelenecek mekan bulunamadı. Arama terimini değiştirip tekrar deneyin."}
                </p>
              ) : (
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                  {venues.map((v) => (
                    <VenueBrowseCard key={venueId(v) || v?.name} venue={v} />
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
