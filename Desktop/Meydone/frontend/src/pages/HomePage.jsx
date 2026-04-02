import { useEffect, useMemo, useState } from "react";
import { useAuthSyncTick } from "../hooks/useAuthSyncTick";
import { Link, useSearchParams } from "react-router-dom";
import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import api from "../services/api";
import VenueCommentSection from "../components/VenueCommentSection";
import {
  normalizeCategoryKey,
  SEARCH_CATEGORY_OPTIONS,
  toTurkishCategory,
  venueMatchesCategoryParam,
} from "../utils/category";
import { AUTH_TOKEN_KEY } from "../utils/constants";
import { menuItemName } from "../utils/venueMenu";
import { appRoutes } from "../utils/routes";
import {
  alertError,
  alertWarn,
  card,
  headingSection,
  linkAccent,
  messageVenueSearchNotFound,
  textMuted,
  textSmall,
} from "../utils/ui";
import { venueDisplayPhotoUrl, venueFailSafeImageUrl, venueId, venueListCoverUrl } from "../utils/venue";

const ISPARTA_CENTER = { lat: 37.7648, lng: 30.5566 };
const ISTANBUL_CENTER = { lat: 41.0082, lng: 28.9784 };
const NEARBY_RADIUS_KM = 10;
const ISPARTA_RADIUS_KM = 45;
const ISTANBUL_RADIUS_KM = 35;
const MAX_DISPLAY_VENUES = 24;
const HOME_LOGO_SRC =
  "file:///C:/Users/luffy/.cursor/projects/c-Users-luffy-Desktop-meydoneCursoryedek/assets/c__Users_luffy_AppData_Roaming_Cursor_User_workspaceStorage_97059f1d6530a33e4865f6cd38a63653_images_Ekran_g_r_nt_s__2026-03-30_150354-63563db6-38b9-416c-bbd2-8de5098afcf4.png";

function initialFromUser(user) {
  const n = String(user?.name || user?.username || "?").trim();
  return n.slice(0, 1).toUpperCase() || "?";
}

function feedAuthorLabel(user) {
  if (!user || typeof user !== "object") return "Kullanıcı";
  const full = [user.name, user.surname]
    .filter((x) => typeof x === "string" && x.trim())
    .join(" ")
    .trim();
  if (full) return full;
  const u = String(user.username ?? "").trim();
  return u || "Kullanıcı";
}

function feedPostAuthorId(post) {
  const u = post?.user;
  if (!u || typeof u !== "object") return "";
  return String(u._id ?? "");
}

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

function mapsLink(lat, lng) {
  if (typeof lat !== "number" || typeof lng !== "number") return "";
  if (Number.isNaN(lat) || Number.isNaN(lng)) return "";
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

/** Yakın mekanlar paneli — küçük görsel + bilgi. */
function VenueNearbyRow({ venue, distanceKm }) {
  const id = venueId(venue);
  const isLoggedIn =
    typeof window !== "undefined" && !!localStorage.getItem(AUTH_TOKEN_KEY);
  const [imgSrc, setImgSrc] = useState(() => venueListCoverUrl(venue));
  const rating = typeof venue?.rating === "number" && !Number.isNaN(venue.rating) ? venue.rating : 0;
  const content = (
    <>
      <div className="h-16 w-20 shrink-0 overflow-hidden rounded-xl border border-stone-100 bg-stone-100 shadow-inner">
        <img
          src={imgSrc}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setImgSrc(venueFailSafeImageUrl(venue, "nearby"))}
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-stone-800">{venue.name}</p>
        <p className={`text-xs ${textMuted}`}>{toTurkishCategory(venue.category)}</p>
        <p className="mt-1 text-xs font-medium text-stone-600">
          <span className="text-violet-700">{distanceKm.toFixed(2)} km</span>
          <span className="mx-1.5 text-stone-300">·</span>
          <span className="text-amber-700">★ {rating.toFixed(1)}</span>
        </p>
      </div>
    </>
  );

  if (id && isLoggedIn) {
    return (
      <li>
        <Link
          to={appRoutes.venueDetail.replace(":id", id)}
          className="flex gap-3 rounded-xl border border-transparent p-2 transition hover:border-rose-100/80 hover:bg-rose-50/50"
        >
          {content}
        </Link>
      </li>
    );
  }

  return (
    <li
      className="flex gap-3 rounded-xl p-2 opacity-80"
      title={!isLoggedIn ? "Mekana gitmek için önce giriş yapın." : undefined}
    >
      {content}
    </li>
  );
}

function OwnerVenueCard({ venue }) {
  const id = venueId(venue);
  const [heroSrc, setHeroSrc] = useState(() => venueDisplayPhotoUrl(venue));
  const [comments, setComments] = useState([]);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let active = true;
    let timer = null;
    if (!id) {
      setComments([]);
      setStatus("success");
      return;
    }

    const loadComments = async (first = false) => {
      if (first) setStatus("loading");
      try {
        const res = await api.get(`/venues/${id}/comments`);
        if (!active) return;
        const items = Array.isArray(res.data?.data?.items) ? res.data.data.items : [];
        setComments(items);
        setStatus("success");
      } catch {
        if (!active) return;
        setComments([]);
        setStatus("error");
      }
    };

    loadComments(true);
    timer = window.setInterval(() => loadComments(false), 20000);

    return () => {
      active = false;
      if (timer) window.clearInterval(timer);
    };
  }, [id]);

  const lat = venue?.location?.lat;
  const lng = venue?.location?.lng;
  const address = venue?.address && typeof venue.address === "object" ? venue.address : null;
  const fullAddress = [
    address?.street,
    address?.neighborhood,
    address?.district,
    address?.city,
    address?.details,
  ]
    .filter((v) => typeof v === "string" && v.trim())
    .join(", ");
  const locationUrl = mapsLink(lat, lng);

  return (
    <article className="rounded-2xl border border-rose-100/90 bg-white/85 p-5 shadow-md shadow-rose-100/30">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold text-stone-800">{venue?.name ?? "Mekan"}</p>
          <p className={`text-xs ${textMuted}`}>{toTurkishCategory(venue?.category)}</p>
        </div>
        {id ? (
          <Link to={appRoutes.venueDetail.replace(":id", id)} className="text-sm font-medium text-violet-700 underline">
            Detay
          </Link>
        ) : null}
      </div>
      <img
        src={heroSrc}
        alt={`${venue?.name ?? "Mekan"} görseli`}
        className="mt-4 max-h-80 w-full rounded-xl border border-rose-100 object-cover"
        onError={() => setHeroSrc(venueFailSafeImageUrl(venue, "owner-card"))}
      />
      <div className="mt-3 rounded-xl border border-rose-100/80 bg-violet-50/40 px-3 py-2">
        <p className="text-xs font-semibold text-stone-700">Konum</p>
        {fullAddress ? <p className="mt-1 text-sm text-stone-700">{fullAddress}</p> : <p className="mt-1 text-sm text-stone-500">Adres bilgisi yok.</p>}
        {locationUrl ? (
          <a
            href={locationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-block text-xs font-medium text-violet-700 underline"
          >
            Google Haritalar&apos;da aç
          </a>
        ) : null}
      </div>
      {id ? (
        <div className="mt-4">
          {status === "loading" ? <p className={textMuted}>Yorumlar yükleniyor…</p> : null}
          {status === "error" ? <p className={textMuted}>Yorumlar alınamadı.</p> : null}
          <VenueCommentSection
            venueId={id}
            comments={comments}
            setComments={setComments}
            hideRating
            disableInteractions={false}
            disableRootCommentForm
          />
        </div>
      ) : null}
    </article>
  );
}

export default function HomePage() {
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
  const [userLocation, setUserLocation] = useState(null);
  const [geoError, setGeoError] = useState("");
  const [usingFallbackLocation, setUsingFallbackLocation] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [nearbySort, setNearbySort] = useState("distance");
  const [feedPosts, setFeedPosts] = useState([]);
  const [feedStatus, setFeedStatus] = useState("idle");
  const isOwnerHome = currentUser?.role === "owner";
  const showFriendsFeed = Boolean(isLoggedIn && currentUser?.role === "user" && !isOwnerHome);
  const currentUserId = String(currentUser?._id ?? currentUser?.id ?? "");

  function requestUserLocation() {
    if (!isLoggedIn) {
      setGeoError("Konum erişimi için önce giriş yapın.");
      return;
    }
    setLocationEnabled(true);
    if (!navigator.geolocation) {
      setUserLocation(ISPARTA_CENTER);
      setUsingFallbackLocation(true);
      setGeoError("Tarayıcı konum desteği vermiyor. Isparta merkez kullanılıyor.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setUsingFallbackLocation(false);
        setGeoError("");
      },
      () => {
        setUserLocation(ISPARTA_CENTER);
        setUsingFallbackLocation(true);
        setGeoError("Konum alınamadı. Isparta merkez kullanılıyor.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

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
    if (!showFriendsFeed || status !== "success") return undefined;
    let active = true;
    setFeedStatus("loading");
    api
      .get("/posts/feed", { params: { limit: 30 } })
      .then((res) => {
        if (!active) return;
        const items = res.data?.data?.items;
        setFeedPosts(Array.isArray(items) ? items : []);
        setFeedStatus("success");
      })
      .catch(() => {
        if (!active) return;
        setFeedPosts([]);
        setFeedStatus("error");
      });
    return () => {
      active = false;
    };
  }, [showFriendsFeed, status]);

  useEffect(() => {
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

          // "Çok fazla mekan" hissini azaltmak için üst sınırlıyoruz
          // ama kullanıcıya İstanbul'dan birkaç örnek de göstermek için en az birkaçını koruyoruz.
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
  }, [nameQ, categoryParam, currentUser]);

  useEffect(() => {
    setUserLocation(ISPARTA_CENTER);
    setUsingFallbackLocation(true);
    setGeoError("");
  }, []);

  const venuesWithCoords = useMemo(
    () =>
      venues.filter(
        (v) =>
          typeof v?.location?.lat === "number" &&
          !Number.isNaN(v.location.lat) &&
          typeof v?.location?.lng === "number" &&
          !Number.isNaN(v.location.lng),
      ),
    [venues],
  );

  const mapCenter = useMemo(() => {
    if (userLocation) return [userLocation.lat, userLocation.lng];
    if (venuesWithCoords.length > 0) return [venuesWithCoords[0].location.lat, venuesWithCoords[0].location.lng];
    return [41.0082, 28.9784];
  }, [userLocation, venuesWithCoords]);

  const nearbyVenues = useMemo(() => {
    if (!locationEnabled || !userLocation) return [];
    return venuesWithCoords
      .map((v) => ({
        venue: v,
        distanceKm: haversineKm(userLocation, { lat: v.location.lat, lng: v.location.lng }),
        averageRating:
          typeof v?.rating === "number" && !Number.isNaN(v.rating) ? v.rating : 0,
      }))
      .filter((row) => row.distanceKm <= NEARBY_RADIUS_KM)
      .sort((a, b) => {
        if (nearbySort === "rating") {
          if (b.averageRating !== a.averageRating) {
            return b.averageRating - a.averageRating;
          }
          return a.distanceKm - b.distanceKm;
        }
        return a.distanceKm - b.distanceKm;
      })
      .slice(0, 100);
  }, [locationEnabled, nearbySort, userLocation, venuesWithCoords]);

  return (
    <div className="relative flex min-h-[calc(100vh-14rem)] flex-col gap-8 sm:gap-10">
      <div
        className="pointer-events-none absolute -inset-x-4 -top-2 bottom-0 -z-0 rounded-[2rem] bg-gradient-to-br from-rose-100/40 via-violet-100/30 to-amber-50/50 sm:-inset-x-6"
        aria-hidden
      />

      <div className="relative z-10 flex flex-col gap-8 sm:gap-10">
        <header className="rounded-3xl border border-rose-100/60 bg-gradient-to-br from-rose-50/90 via-white/80 to-violet-50/50 p-6 shadow-lg shadow-rose-100/30 backdrop-blur-md sm:p-8">
          <img
            src={HOME_LOGO_SRC}
            alt="Meydone"
            className="h-20 w-auto max-w-full rounded-md object-contain sm:h-24"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
          <p className={`mt-3 max-w-2xl ${textMuted}`}>
            Anasayfada yalnızca <strong className="font-semibold text-violet-800">harita</strong> görünür. Fotoğraflı mekan listesi için
            üst menüden{" "}
            <Link to={appRoutes.venues} className="font-semibold text-violet-800 underline underline-offset-2">
              Mekanlar
            </Link>
            &apos;a gidin. Haritada işaretçilere tıklayarak
            detaya gidebilirsiniz. Arama ile haritadaki mekanları daraltabilirsiniz (ör.{" "}
            <strong className="font-semibold text-violet-800">tatlı</strong>, <strong className="font-semibold text-violet-800">hızlı yemek</strong>
            ).
          </p>
          {currentUser && currentUser?.role !== "user" ? (
            <div className="mt-5 inline-flex items-center gap-3 rounded-2xl border border-rose-100/80 bg-white/80 px-3 py-2">
              {currentUser.profilePhoto ? (
                <img
                  src={currentUser.profilePhoto}
                  alt="Profil fotoğrafı"
                  className="h-10 w-10 rounded-full border border-rose-100 object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-violet-100 bg-violet-50 text-sm font-semibold text-violet-700">
                  {initialFromUser(currentUser)}
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-stone-800">
                  {currentUser.name || currentUser.username || "Kullanıcı"}
                </p>
                {currentUser?.role === "admin" ? (
                  <Link to={appRoutes.admin} className="text-xs font-medium text-violet-700 underline underline-offset-2">
                    Yönetime git
                  </Link>
                ) : currentUser?.role !== "owner" ? (
                  <Link to={appRoutes.profile} className="text-xs font-medium text-violet-700 underline underline-offset-2">
                    Profili görüntüle
                  </Link>
                ) : null}
              </div>
            </div>
          ) : null}
        </header>

        <section aria-label="Harita" className="flex-1 space-y-6">
          {status === "loading" ? (
            <p className={`text-center ${textMuted}`}>Mekanlar yükleniyor…</p>
          ) : null}

          {status === "error" ? (
            <p className={alertError} role="alert">
              {error}
            </p>
          ) : null}

          {status === "success" ? (
            <div className="space-y-6">
              {isOwnerHome ? (
                <section className="space-y-4">
                  <h2 className="text-lg font-semibold text-stone-800">Kendi mekanların</h2>
                  {venues.length === 0 ? (
                    hasActiveSearchOrFilter ? (
                      <p className={`${alertWarn} px-4 py-3`} role="alert">
                        {messageVenueSearchNotFound}
                      </p>
                    ) : (
                      <p className={textMuted}>Henüz hesabına bağlı mekan yok.</p>
                    )
                  ) : (
                    venues.map((v) => <OwnerVenueCard key={venueId(v) || v?.name} venue={v} />)
                  )}
                </section>
              ) : (
                <>
                  {hasActiveSearchOrFilter && venues.length === 0 ? (
                    <p className={`${alertWarn} px-4 py-3`} role="alert">
                      {messageVenueSearchNotFound}
                    </p>
                  ) : null}
                  <div className="rounded-2xl border border-rose-100/90 bg-white/85 p-4 shadow-md shadow-rose-100/30">
                    <div className="flex flex-wrap items-center justify-start gap-3">
                      {isLoggedIn ? (
                        <button
                          type="button"
                          onClick={requestUserLocation}
                          className="inline-flex items-center gap-2 rounded-full border border-rose-200/80 bg-gradient-to-r from-rose-100/70 to-violet-100/70 px-5 py-2.5 text-sm font-semibold text-violet-900 shadow-md shadow-rose-100/40 transition hover:-translate-y-0.5 hover:from-rose-100 hover:to-violet-100"
                        >
                          <span aria-hidden>📍</span>
                          Konum erişimine izin ver
                        </button>
                      ) : (
                        <p className={`text-sm ${textMuted}`}>
                          Konum açmak için önce{" "}
                          <Link to={appRoutes.login} className="font-semibold text-violet-700 underline underline-offset-2">
                            giriş yap
                          </Link>
                          .
                        </p>
                      )}
                    </div>
                    {geoError ? <p className={`${alertError} mt-3 mb-0 text-left`}>{geoError}</p> : null}
                  </div>

                  <section aria-label="Harita" className="space-y-4">
                    <div>
                      <h2 className="text-xl font-bold tracking-tight text-violet-950">Harita</h2>
                      <p className={`mt-1 max-w-xl text-sm ${textMuted}`}>
                        Anasayfada Isparta ve İstanbul&apos;daki seçili mekanları haritada görün; işaretçilere tıklayarak detaya gidebilirsiniz.
                      </p>
                    </div>
                    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(300px,1fr)]">
                    <div className="rounded-2xl border border-rose-100/90 bg-white/85 p-3 shadow-md shadow-rose-100/30">
                      <MapContainer
                        center={mapCenter}
                        zoom={13}
                        scrollWheelZoom
                        className="h-[520px] w-full rounded-xl"
                      >
                        <TileLayer
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        {venuesWithCoords.map((v) => {
                          const id = venueId(v);
                          return (
                            <CircleMarker
                              key={id || v.name}
                              center={[v.location.lat, v.location.lng]}
                              radius={9}
                              pathOptions={{ color: "#8b5cf6", fillColor: "#c4b5fd", fillOpacity: 0.88 }}
                            >
                              <Popup>
                                <p className="font-semibold">{v.name}</p>
                                <p>{toTurkishCategory(v.category)}</p>
                                {id && isLoggedIn ? <Link to={appRoutes.venueDetail.replace(":id", id)}>Detaya git</Link> : null}
                              </Popup>
                            </CircleMarker>
                          );
                        })}
                        {userLocation ? (
                          <CircleMarker
                            center={[userLocation.lat, userLocation.lng]}
                            radius={10}
                            pathOptions={{
                              color: usingFallbackLocation ? "#fb923c" : "#5eead4",
                              fillColor: usingFallbackLocation ? "#fcd34d" : "#99f6e4",
                              fillOpacity: 0.92,
                            }}
                          >
                            <Popup>{usingFallbackLocation ? "Isparta merkez (varsayılan)" : "Konumunuz"}</Popup>
                          </CircleMarker>
                        ) : null}
                      </MapContainer>
                    </div>

                    <div className="rounded-2xl border border-rose-100/90 bg-white/85 p-5 shadow-md shadow-rose-100/30 lg:max-h-[546px] lg:overflow-auto">
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="text-lg font-semibold text-stone-800">Konumuna göre yakın çevrendeki mekanlar</h2>
                      <select
                        value={nearbySort}
                        onChange={(e) => setNearbySort(e.target.value)}
                        className="rounded-lg border border-rose-200/80 bg-white/95 px-2.5 py-1.5 text-xs font-medium text-stone-700"
                        aria-label="Yakın mekan sıralama türü"
                      >
                        <option value="distance">Mesafe (yakından uzağa)</option>
                        <option value="rating">Ortalama puan (yüksekten düşüğe)</option>
                      </select>
                    </div>
                    {!locationEnabled ? (
                      <p className={`mt-3 ${textMuted}`}>Yakındaki mekanları görmek için önce "Konum erişimine izin ver" butonuna basın.</p>
                    ) : nearbyVenues.length === 0 ? (
                      <p className={`mt-3 ${textMuted}`}>10 km çevrende uygun mekan bulunamadı.</p>
                    ) : (
                      <ul className="mt-4 space-y-1">
                        {nearbyVenues.map(({ venue, distanceKm }) => (
                          <VenueNearbyRow key={venueId(venue) || venue.name} venue={venue} distanceKm={distanceKm} />
                        ))}
                      </ul>
                    )}
                    </div>
                    </div>
                  </section>

                  {showFriendsFeed ? (
                    <section aria-labelledby="friends-feed-heading" className={`${card} space-y-4`}>
                      <div>
                        <h2 id="friends-feed-heading" className={headingSection}>
                          Arkadaş akışı
                        </h2>
                        <p className={`mt-1 text-sm ${textMuted}`}>
                          Arkadaşlarınızın ve kendi paylaşımlarınız burada listelenir. Yeni gönderi için{" "}
                          <Link to={appRoutes.profile} className={`font-semibold ${linkAccent}`}>
                            profil
                          </Link>
                          sayfasına gidin.
                        </p>
                      </div>
                      {feedStatus === "loading" ? (
                        <p className={textMuted}>Gönderiler yükleniyor…</p>
                      ) : null}
                      {feedStatus === "error" ? (
                        <p className={alertError} role="alert">
                          Gönderiler yüklenemedi.
                        </p>
                      ) : null}
                      {feedStatus === "success" && feedPosts.length === 0 ? (
                        <p className={textMuted}>
                          Henüz akışta gönderi yok. Arkadaş ekleyin veya profilden paylaşım oluşturun.
                        </p>
                      ) : null}
                      {feedStatus === "success" && feedPosts.length > 0 ? (
                        <ul className="divide-y divide-rose-100/60">
                          {feedPosts.map((post, fIdx) => {
                            const pid = String(post?._id ?? "");
                            const author = post?.user;
                            const aid = feedPostAuthorId(post);
                            const isMine = Boolean(currentUserId && aid && aid === currentUserId);
                            const profileTo = isMine
                              ? appRoutes.profile
                              : aid
                                ? appRoutes.friendProfile.replace(":id", aid)
                                : appRoutes.profile;
                            return (
                              <li key={pid || `feed-${fIdx}`} className="py-5 first:pt-0">
                                <div className="flex items-start gap-3">
                                  {author?.profilePhoto ? (
                                    <img
                                      src={author.profilePhoto}
                                      alt=""
                                      className="h-10 w-10 shrink-0 rounded-full border border-rose-100 object-cover"
                                    />
                                  ) : (
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-violet-100 bg-violet-50 text-sm font-semibold text-violet-700">
                                      {initialFromUser(author)}
                                    </div>
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold text-stone-800">
                                      <Link to={profileTo} className={`hover:underline ${linkAccent}`}>
                                        {feedAuthorLabel(author)}
                                      </Link>
                                      {isMine ? (
                                        <span className={`ml-2 font-normal ${textSmall}`}>(sen)</span>
                                      ) : null}
                                    </p>
                                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-stone-800">
                                      {post?.text ?? ""}
                                    </p>
                                    {post?.photoUrl ? (
                                      <img
                                        src={post.photoUrl}
                                        alt=""
                                        className="mt-3 max-h-96 w-full max-w-md rounded-xl border border-rose-100/80 object-cover"
                                      />
                                    ) : null}
                                    {post?.locationLat != null && post?.locationLng != null ? (
                                      <p className={`mt-3 ${textMuted}`}>
                                        <a
                                          href={`https://www.openstreetmap.org/?mlat=${encodeURIComponent(String(post.locationLat))}&mlon=${encodeURIComponent(String(post.locationLng))}#map=15/${encodeURIComponent(String(post.locationLat))}/${encodeURIComponent(String(post.locationLng))}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className={linkAccent}
                                        >
                                          Konum (harita)
                                        </a>
                                      </p>
                                    ) : null}
                                    <p className={`mt-2 ${textSmall}`}>
                                      {post?.createdAt
                                        ? new Date(post.createdAt).toLocaleString("tr-TR", {
                                            dateStyle: "medium",
                                            timeStyle: "short",
                                          })
                                        : ""}
                                    </p>
                                  </div>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      ) : null}
                    </section>
                  ) : null}
                </>
              )}
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
