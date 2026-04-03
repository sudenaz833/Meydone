import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CircleMarker, MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useAuthSyncTick } from "../hooks/useAuthSyncTick";
import VenueCommentSection from "../components/VenueCommentSection";
import VenueFavoriteToggle from "../components/VenueFavoriteToggle";
import VenueRateStars from "../components/VenueRateStars";
import api from "../services/api";
import { toTurkishCategory } from "../utils/category";
import { appRoutes } from "../utils/routes";
import { venueDisplayPhotoUrl, venueFailSafeImageUrl } from "../utils/venue";
import { formatTryPrice, menuItemName, menuItemPrice } from "../utils/venueMenu";
import {
  alertError,
  card,
  headingSection,
  labelCaps,
  linkAccent,
  starOff,
  starOn,
  textMuted,
} from "../utils/ui";

function formatRating(value) {
  if (value == null || typeof value !== "number" || Number.isNaN(value)) return null;
  return value.toFixed(2);
}

function mapsLink(lat, lng) {
  if (typeof lat !== "number" || typeof lng !== "number") return null;
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

function osmLink(lat, lng) {
  if (typeof lat !== "number" || typeof lng !== "number") return null;
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=15/${lat}/${lng}`;
}

function formatHoursLabel(day, hours) {
  const dayLabelMap = {
    mon: "Pazartesi",
    monday: "Pazartesi",
    tue: "Salı",
    tuesday: "Salı",
    wed: "Çarşamba",
    wednesday: "Çarşamba",
    thu: "Perşembe",
    thursday: "Perşembe",
    fri: "Cuma",
    friday: "Cuma",
    sat: "Cumartesi",
    saturday: "Cumartesi",
    sun: "Pazar",
    sunday: "Pazar",
    pazartesi: "Pazartesi",
    sali: "Salı",
    salı: "Salı",
    carsamba: "Çarşamba",
    çarsamba: "Çarşamba",
    çarşamba: "Çarşamba",
    persembe: "Perşembe",
    perşembe: "Perşembe",
    cuma: "Cuma",
    cumartesi: "Cumartesi",
    pazar: "Pazar",
  };
  const key = String(day ?? "").toLowerCase();
  const label = dayLabelMap[key] || String(day ?? "Gün");
  return { label, value: String(hours ?? "Kapalı") };
}

export default function VenueDetailPage() {
  useAuthSyncTick();
  const { id } = useParams();
  const [venue, setVenue] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [ratingStats, setRatingStats] = useState(null);
  const [comments, setComments] = useState([]);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [heroSrc, setHeroSrc] = useState("");

  useEffect(() => {
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
    if (!id) return;
    let active = true;

    (async () => {
      setStatus("loading");
      setError("");
      setVenue(null);
      setRatingStats(null);
      setComments([]);

      try {
        const venueRes = await api.get(`/venues/${id}`);
        if (!active) return;

        setVenue(venueRes.data?.data?.venue ?? null);
        setHeroSrc(venueDisplayPhotoUrl(venueRes.data?.data?.venue ?? null));

        const [ratingOut, commentsOut] = await Promise.allSettled([
          api.get(`/venues/${id}/average-rating`),
          api.get(`/venues/${id}/comments`),
        ]);

        if (!active) return;

        if (ratingOut.status === "fulfilled") {
          setRatingStats(ratingOut.value.data?.data ?? null);
        }
        if (commentsOut.status === "fulfilled") {
          const raw = commentsOut.value.data?.data?.items;
          setComments(Array.isArray(raw) ? raw : []);
        }

        setStatus("success");
      } catch (err) {
        if (!active) return;
        setStatus("error");
        setError(err.apiMessage || err.message || "Mekan yüklenemedi");
      }
    })();

    return () => {
      active = false;
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

  const displayAverage = useMemo(() => {
    const count = ratingStats?.ratingCount;
    const fromStats = ratingStats?.averageRating;
    if (typeof count === "number" && count === 0) {
      return null;
    }
    if (fromStats != null && typeof fromStats === "number") {
      return formatRating(fromStats);
    }
    const vr = venue?.rating;
    if (typeof vr === "number" && !Number.isNaN(vr) && vr > 0) {
      return formatRating(vr);
    }
    return null;
  }, [ratingStats, venue]);

  const venueRatingLabel = formatRating(venue?.rating);
  const ownerInteractionBlocked = currentUser?.role === "owner";
  const isOwnVenue = useMemo(() => {
    if (!venue || currentUser?.role !== "owner") return false;
    const o = venue.owner;
    const oid = o != null && typeof o === "object" && o._id != null ? String(o._id) : String(o ?? "");
    const uid = String(currentUser?._id ?? currentUser?.id ?? "");
    return Boolean(oid && uid && oid === uid);
  }, [venue, currentUser]);
  const ownerCommentSocialBlocked = ownerInteractionBlocked && !isOwnVenue;

  async function handleVenueRated(payload) {
    if (payload?.venue) {
      setVenue(payload.venue);
    }
    if (!id) return;
    try {
      const { data } = await api.get(`/venues/${id}/average-rating`);
      setRatingStats(data?.data ?? null);
    } catch {
      /* keep previous stats */
    }
  }

  if (!id) {
    return (
      <p className={textMuted} role="alert">
        Mekan kimliği eksik.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <nav className={`text-sm ${textMuted}`}>
        <Link to={appRoutes.home} className={linkAccent}>
          Anasayfa
        </Link>
        <span className="mx-2 text-stone-400">/</span>
        <span className="font-medium text-stone-800">Mekan</span>
      </nav>

      {status === "loading" ? <p className={textMuted}>Mekan yükleniyor…</p> : null}

      {status === "error" ? (
        <p className={alertError} role="alert">
          {error}
        </p>
      ) : null}

      {status === "success" && venue ? (
        <>
          <header className={card}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h1 className="text-3xl font-bold tracking-tight text-stone-800 sm:text-4xl">{venue.name}</h1>
                <p className={`mt-2 text-lg ${textMuted}`}>{toTurkishCategory(venue.category)}</p>
                {Array.isArray(venue?.announcements) && venue.announcements.length > 0 ? (
                  <div className="mt-3 space-y-2">
                    {venue.announcements.map((a, idx) => (
                      <p key={`${a?.createdAt ?? "announcement"}-${idx}`} className="rounded-2xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-sm font-medium text-amber-900">
                        📢 {String(a?.text ?? "").trim()}
                      </p>
                    ))}
                  </div>
                ) : String(venue?.announcement ?? "").trim() ? (
                  <p className="mt-3 rounded-2xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-sm font-medium text-amber-900">
                    📢 {String(venue.announcement).trim()}
                  </p>
                ) : null}
              </div>
              {!ownerInteractionBlocked ? <VenueFavoriteToggle venueId={id} /> : null}
            </div>
            <img
              src={heroSrc || venueDisplayPhotoUrl(venue)}
              alt=""
              className="mt-6 max-h-64 w-full rounded-2xl border border-rose-100/70 object-cover shadow-md shadow-rose-100/35"
              onError={() => setHeroSrc(venueFailSafeImageUrl(venue, "detail"))}
            />
          </header>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className={card} aria-labelledby="venue-info-heading">
              <h2 id="venue-info-heading" className={headingSection}>
                Mekan bilgileri
              </h2>
              <dl className="mt-5 space-y-4 text-sm">
                <div>
                  <dt className={labelCaps}>Kategori</dt>
                  <dd className="mt-1 text-stone-800">{toTurkishCategory(venue.category)}</dd>
                </div>
                <div>
                  <dt className={labelCaps}>Kayıtlı puan (mekan)</dt>
                  <dd className="mt-1 text-stone-800">
                    {venueRatingLabel != null ? (
                      <span className={`font-semibold ${starOn}`}>★ {venueRatingLabel}</span>
                    ) : (
                      "—"
                    )}
                  </dd>
                </div>
                {Array.isArray(venue.menu) && venue.menu.length > 0 ? (
                  <div>
                    <dt className={labelCaps}>Menü</dt>
                    <dd className="mt-2 text-stone-800">
                      <p className={`mb-3 text-xs ${textMuted}`}>
                        Yemek ve içecekler; fiyatı eklenmiş ürünlerde TL tutarı gösterilir.
                      </p>
                      <ul
                        className="max-h-[28rem] divide-y divide-rose-100/90 overflow-y-auto rounded-xl border border-rose-100/80 bg-white/60 pr-1"
                        aria-label="Mekan menüsü"
                      >
                        {venue.menu.map((item, idx) => {
                          const label = menuItemName(item) || "—";
                          const priceStr = formatTryPrice(menuItemPrice(item));
                          return (
                            <li
                              key={`${label}-${idx}`}
                              className="flex items-baseline justify-between gap-4 py-2.5 pl-3 pr-2 text-sm sm:py-3"
                            >
                              <span className="min-w-0 flex-1 leading-snug text-stone-800">{label}</span>
                              <span
                                className={`shrink-0 tabular-nums text-sm font-semibold ${
                                  priceStr ? "text-violet-800" : textMuted
                                }`}
                              >
                                {priceStr || "—"}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </dd>
                  </div>
                ) : null}
                {venue.hours && typeof venue.hours === "object" && Object.keys(venue.hours).length > 0 ? (
                  <div>
                    <dt className={labelCaps}>Çalışma saatleri</dt>
                    <dd className="mt-2">
                      <ul className="grid gap-2 sm:grid-cols-2">
                        {Object.entries(venue.hours).map(([day, hours]) => {
                          const row = formatHoursLabel(day, hours);
                          return (
                            <li
                              key={day}
                              className="flex items-center justify-between rounded-xl border border-rose-100/80 bg-white/80 px-3 py-2 text-xs shadow-sm shadow-rose-50/50"
                            >
                              <span className="font-semibold text-stone-700">{row.label}</span>
                              <span className="font-mono text-stone-600">{row.value}</span>
                            </li>
                          );
                        })}
                      </ul>
                    </dd>
                  </div>
                ) : null}
                {fullAddress ? (
                  <div>
                    <dt className={labelCaps}>Adres</dt>
                    <dd className="mt-1 text-stone-800">{fullAddress}</dd>
                  </div>
                ) : null}
              </dl>
            </section>

            <section className={card} aria-labelledby="ratings-heading">
              <h2 id="ratings-heading" className={headingSection}>
                Puanlar
              </h2>
              <p className={`mt-2 ${textMuted}`}>Bu mekana verilen kullanıcı puanlarından hesaplanır.</p>
              <dl className="mt-5 space-y-4">
                <div>
                  <dt className={labelCaps}>Ortalama puan</dt>
                  <dd className="mt-2 text-2xl font-semibold text-amber-600">
                    {displayAverage != null ? (
                      <>
                        <span aria-hidden>★</span> {displayAverage}
                        <span className="sr-only"> 5 üzerinden</span>
                      </>
                    ) : (
                      <span className={`text-base font-normal ${textMuted}`}>Henüz puan yok</span>
                    )}
                  </dd>
                  {displayAverage != null ? (
                    <div className="mt-2 flex gap-0.5 text-xl" aria-hidden>
                      {Array.from({ length: 5 }, (_, i) => {
                        const v = Number.parseFloat(displayAverage);
                        const filled = i < Math.round(v);
                        return (
                          <span key={i} className={filled ? starOn : starOff}>
                            ★
                          </span>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
                <div>
                  <dt className={labelCaps}>Puan sayısı</dt>
                  <dd className="mt-1 text-stone-800">
                    {typeof ratingStats?.ratingCount === "number" ? ratingStats.ratingCount : "—"}
                  </dd>
                </div>
              </dl>

              {!ownerInteractionBlocked ? <VenueRateStars venueId={id} onRated={handleVenueRated} /> : null}
            </section>
          </div>

          <section className={card} aria-labelledby="map-heading">
            <h2 id="map-heading" className={headingSection}>
              Konum
            </h2>
            {mapsLink(lat, lng) ? (
              <>
                <div className="mt-4 overflow-hidden rounded-2xl border border-rose-100/80">
                  <MapContainer
                    center={[lat, lng]}
                    zoom={15}
                    scrollWheelZoom
                    className="h-64 w-full"
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <CircleMarker
                      center={[lat, lng]}
                      radius={9}
                      pathOptions={{ color: "#8b5cf6", fillColor: "#c4b5fd", fillOpacity: 0.88 }}
                    />
                  </MapContainer>
                </div>
                <p className="mt-4 flex flex-wrap gap-4 text-sm">
                  <a href={mapsLink(lat, lng)} target="_blank" rel="noopener noreferrer" className={linkAccent}>
                    Google Haritalar&apos;da aç
                  </a>
                </p>
              </>
            ) : (
              <p className={`mt-3 ${textMuted}`}>Bu mekan için harita konumu yok.</p>
            )}
          </section>

          <VenueCommentSection
            venueId={id}
            comments={comments}
            setComments={setComments}
            disableInteractions={ownerCommentSocialBlocked}
            disableRootCommentForm={ownerInteractionBlocked}
          />
        </>
      ) : null}

      {status === "success" && !venue ? <p className={textMuted}>Mekan yüklenemedi.</p> : null}
    </div>
  );
}
