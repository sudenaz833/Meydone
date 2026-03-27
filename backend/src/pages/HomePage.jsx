import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import api from "../services/api";
import VenueCommentSection from "../components/VenueCommentSection";
import { normalizeCategoryKey, toTurkishCategory } from "../utils/category";
import { AUTH_TOKEN_KEY } from "../utils/constants";
import { appRoutes } from "../utils/routes";
import { alertError, headingPage, textMuted } from "../utils/ui";

const ISPARTA_CENTER = { lat: 37.7648, lng: 30.5566 };
const NEARBY_RADIUS_KM = 10;
const ISPARTA_RADIUS_KM = 45;

function venueId(venue) {
  const id = venue?._id ?? venue?.id;
  return id != null ? String(id) : "";
}

function initialFromUser(user) {
  const n = String(user?.name || user?.username || "?").trim();
  return n.slice(0, 1).toUpperCase() || "?";
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
  return startsWithQuery(name, q) || menu.some((item) => menuHasWordStartingWithQuery(item, q));
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

function isIspartaVenue(venue) {
  const city = String(venue?.address?.city ?? "")
    .trim()
    .toLocaleLowerCase("tr-TR");
  if (city === "ısparta" || city === "isparta") return true;
  const lat = venue?.location?.lat;
  const lng = venue?.location?.lng;
  if (typeof lat !== "number" || Number.isNaN(lat)) return false;
  if (typeof lng !== "number" || Number.isNaN(lng)) return false;
  const km = haversineKm(ISPARTA_CENTER, { lat, lng });
  return km <= ISPARTA_RADIUS_KM;
}

function mapsLink(lat, lng) {
  if (typeof lat !== "number" || typeof lng !== "number") return "";
  if (Number.isNaN(lat) || Number.isNaN(lng)) return "";
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

function OwnerVenueCard({ venue }) {
  const id = venueId(venue);
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
        const res = await api.get(`/api/venues/${id}/comments`);
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
    <article className="rounded-2xl border border-sky-100 bg-white/85 p-5 shadow-md shadow-sky-200/20">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold text-stone-800">{venue?.name ?? "Mekan"}</p>
          <p className={`text-xs ${textMuted}`}>{toTurkishCategory(venue?.category)}</p>
        </div>
        {id ? (
          <Link to={appRoutes.venueDetail.replace(":id", id)} className="text-sm font-medium text-sky-700 underline">
            Detay
          </Link>
        ) : null}
      </div>
      {venue?.photoUrl ? (
        <img
          src={venue.photoUrl}
          alt={`${venue?.name ?? "Mekan"} görseli`}
          className="mt-4 max-h-64 w-full rounded-xl border border-sky-100 object-cover"
        />
      ) : null}
      <div className="mt-3 rounded-xl border border-sky-100 bg-sky-50/40 px-3 py-2">
        <p className="text-xs font-semibold text-stone-700">Konum</p>
        {fullAddress ? <p className="mt-1 text-sm text-stone-700">{fullAddress}</p> : <p className="mt-1 text-sm text-stone-500">Adres bilgisi yok.</p>}
        {locationUrl ? (
          <a
            href={locationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-block text-xs font-medium text-sky-700 underline"
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
            disableInteractions
          />
        </div>
      ) : null}
    </article>
  );
}

export default function HomePage() {
  const [searchParams] = useSearchParams();
  const nameQ = (searchParams.get("q") ?? "").trim();
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
  const isOwnerHome = currentUser?.role === "owner";

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
    let active = true;

    (async () => {
      setStatus("loading");
      setError("");
      try {
        let items = [];

        if (nameQ) {
          const { data } = await api.get("/api/venues", {
            params: { limit: 500 },
          });
          items = normalizeVenueList(data).filter((v) => {
            const q = String(nameQ ?? "").trim().toLocaleLowerCase("tr-TR");
            if (!q) return true;
            const categoryKey = normalizeCategoryKey(v?.category);
            const categoryQueryKey = normalizeCategoryKey(q);
            return venueMatchesNameOrMenu(v, q) || (categoryQueryKey ? categoryKey.startsWith(categoryQueryKey) : false);
          });
        } else {
          const { data } = await api.get("/api/venues");
          items = normalizeVenueList(data);
        }

        if (currentUser?.role === "owner" || currentUser?.role === "admin") {
          const ownerId = String(currentUser?._id ?? currentUser?.id ?? "");
          items = items.filter((v) => {
            const venueOwner = String(v?.owner?._id ?? v?.owner ?? "");
            return Boolean(ownerId && venueOwner && venueOwner === ownerId);
          });
        } else {
          items = items.filter(isIspartaVenue);
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
  }, [nameQ, currentUser]);

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
        className="pointer-events-none absolute -inset-x-4 -top-2 bottom-0 -z-0 rounded-[2rem] bg-gradient-to-br from-pink-100/50 via-sky-100/40 to-sky-100/50 sm:-inset-x-6"
        aria-hidden
      />

      <div className="relative z-10 flex flex-col gap-8 sm:gap-10">
        <header className="rounded-3xl border border-white/60 bg-gradient-to-br from-sky-100/50 via-white/60 to-pink-100/40 p-6 shadow-lg shadow-sky-200/20 backdrop-blur-md sm:p-8">
          <h1 className={headingPage}>Meydone — mekanları keşfet</h1>
          <p className={`mt-3 max-w-2xl ${textMuted}`}>
            İsme göre aramak için <strong className="font-semibold text-stone-700">üst çubuktaki arama</strong> alanını kullanın.
            Aynı arama kutusunda kategori de yazabilirsiniz (ör. <strong className="font-semibold text-stone-700">tatlı</strong>,{" "}
            <strong className="font-semibold text-stone-700">hızlı yemek</strong>).
          </p>
          {currentUser && currentUser?.role !== "user" ? (
            <div className="mt-5 inline-flex items-center gap-3 rounded-2xl border border-sky-100/80 bg-white/75 px-3 py-2">
              {currentUser.profilePhoto ? (
                <img
                  src={currentUser.profilePhoto}
                  alt="Profil fotoğrafı"
                  className="h-10 w-10 rounded-full border border-sky-100 object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-sky-100 bg-sky-50 text-sm font-semibold text-sky-700">
                  {initialFromUser(currentUser)}
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-stone-800">
                  {currentUser.name || currentUser.username || "Kullanıcı"}
                </p>
                {currentUser?.role !== "owner" ? (
                  <Link to={appRoutes.profile} className="text-xs font-medium text-sky-700 underline underline-offset-2">
                    Profili görüntüle
                  </Link>
                ) : null}
              </div>
            </div>
          ) : null}
        </header>

        <section aria-label="Harita ve yakin mekanlar" className="flex-1 space-y-6">
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
                    <p className={textMuted}>Henüz hesabına bağlı mekan yok.</p>
                  ) : (
                    venues.map((v) => <OwnerVenueCard key={venueId(v) || v?.name} venue={v} />)
                  )}
                </section>
              ) : (
                <>
                  <div className="rounded-2xl border border-sky-100 bg-white/80 p-4 shadow-md shadow-sky-200/20">
                    <div className="flex flex-wrap items-center justify-start gap-3">
                      {isLoggedIn ? (
                        <button
                          type="button"
                          onClick={requestUserLocation}
                          className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-gradient-to-r from-sky-50 to-blue-50 px-5 py-2.5 text-sm font-semibold text-sky-800 shadow-md shadow-sky-200/30 transition hover:-translate-y-0.5 hover:from-sky-100 hover:to-blue-100"
                        >
                          <span aria-hidden>📍</span>
                          Konum erişimine izin ver
                        </button>
                      ) : (
                        <p className={`text-sm ${textMuted}`}>
                          Konuma göre mekanları görmek için{" "}
                          <Link to={appRoutes.login} className="font-semibold text-sky-700 underline underline-offset-2">
                            giriş yapın
                          </Link>
                          .
                        </p>
                      )}
                    </div>
                    {geoError ? <p className={`${alertError} mt-3 mb-0 text-left`}>{geoError}</p> : null}
                  </div>

                  <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(300px,1fr)]">
                    <div className="rounded-2xl border border-sky-100 bg-white/80 p-3 shadow-md shadow-sky-200/20">
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
                              pathOptions={{ color: "#0284c7", fillColor: "#38bdf8", fillOpacity: 0.85 }}
                            >
                              <Popup>
                                <p className="font-semibold">{v.name}</p>
                                <p>{toTurkishCategory(v.category)}</p>
                                {id ? <Link to={appRoutes.venueDetail.replace(":id", id)}>Detaya git</Link> : null}
                              </Popup>
                            </CircleMarker>
                          );
                        })}
                        {userLocation ? (
                          <CircleMarker
                            center={[userLocation.lat, userLocation.lng]}
                            radius={10}
                            pathOptions={{
                              color: usingFallbackLocation ? "#d97706" : "#16a34a",
                              fillColor: usingFallbackLocation ? "#f59e0b" : "#22c55e",
                              fillOpacity: 0.9,
                            }}
                          >
                            <Popup>{usingFallbackLocation ? "Isparta merkez (varsayılan)" : "Konumunuz"}</Popup>
                          </CircleMarker>
                        ) : null}
                      </MapContainer>
                    </div>

                    <div className="rounded-2xl border border-sky-100 bg-white/80 p-5 shadow-md shadow-sky-200/20 lg:max-h-[546px] lg:overflow-auto">
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="text-lg font-semibold text-stone-800">Konumuna göre yakın çevrendeki mekanlar</h2>
                      <select
                        value={nearbySort}
                        onChange={(e) => setNearbySort(e.target.value)}
                        className="rounded-lg border border-sky-200 bg-white px-2.5 py-1.5 text-xs font-medium text-stone-700"
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
                      <ul className="mt-4 divide-y divide-sky-100/60">
                        {nearbyVenues.map(({ venue, distanceKm }) => {
                          const id = venueId(venue);
                          return (
                            <li key={id || venue.name} className="flex items-center justify-between gap-4 py-3">
                              <div className="min-w-0">
                                <p className="truncate font-semibold text-stone-800">{venue.name}</p>
                                <p className={`text-xs ${textMuted}`}>{toTurkishCategory(venue.category)}</p>
                              </div>
                              <div className="shrink-0 text-right">
                                <p className="text-sm font-semibold text-sky-700">{distanceKm.toFixed(2)} km</p>
                                <p className="text-xs text-amber-700">★ {(typeof venue?.rating === "number" ? venue.rating : 0).toFixed(1)}</p>
                                {id ? (
                                  <Link to={appRoutes.venueDetail.replace(":id", id)} className="text-xs text-sky-700 underline">
                                    Ac
                                  </Link>
                                ) : null}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
