import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { toTurkishCategory } from "../utils/category";
import { appRoutes } from "../utils/routes";
import {
  card,
  cardAccent,
  headingPage,
  pillCategory,
  textMuted,
  alertError,
  linkAccent,
  venueCardOuter,
  venueCardInnerLink,
} from "../utils/ui";

function statusLabel(status) {
  if (status === "loading") return "Yükleniyor…";
  if (status === "success") return "Başarılı";
  if (status === "error") return "Hata";
  if (status === "idle") return "Beklemede";
  return status;
}

export default function VenuesPage() {
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [venues, setVenues] = useState([]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setStatus("loading");
        const { data } = await api.get("/api/venues", { params: { limit: 300 } });
        const items = data?.data?.items;
        if (active) setVenues(Array.isArray(items) ? items : []);
        if (active) setStatus("success");
      } catch (err) {
        if (!active) return;
        setStatus("error");
        setError(err?.response?.data?.message || "Mekanlar yüklenemedi");
      }
    };

    load();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-8">
      <header className={cardAccent}>
        <h1 className={headingPage}>Mekanlar</h1>
        <p className={`mt-2 max-w-xl ${textMuted}`}>
          Sistemdeki mekanları burada görebilir, tıklayarak detay sayfasına gidebilirsin. Keşif için{" "}
          <Link to={appRoutes.home} className={linkAccent}>
            Anasayfa
          </Link>
          &apos;yı da kullanabilirsin.
        </p>
      </header>

      <section className={card}>
        <p className={`${textMuted} font-medium`}>Durum: <span className="text-sky-700">{statusLabel(status)}</span></p>
        {status === "error" ? (
          <p className={`${alertError} mt-4 text-left`} role="alert">
            {error}
          </p>
        ) : null}
        {status === "success" && venues.length === 0 ? <p className={`mt-4 ${textMuted}`}>Mekan bulunamadı.</p> : null}
        {status === "success" && venues.length > 0 ? (
          <ul className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {venues.map((v) => {
              const id = String(v?._id ?? v?.id ?? "");
              const photoUrl = typeof v?.photoUrl === "string" && v.photoUrl.trim() ? v.photoUrl.trim() : "";
              return (
                <li key={id || v?.name}>
                  <article className={`${venueCardOuter} flex flex-col`}>
                    <Link to={id ? appRoutes.venueDetail.replace(":id", id) : appRoutes.home} className={venueCardInnerLink}>
                      {photoUrl ? (
                        <div className="relative h-44 w-full overflow-hidden bg-sky-100/45 sm:h-48">
                          <img
                            src={photoUrl}
                            alt=""
                            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                            loading="lazy"
                          />
                          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-sky-950/15 via-transparent to-transparent" />
                        </div>
                      ) : (
                        <div className="relative flex h-44 w-full items-center justify-center overflow-hidden bg-gradient-to-br from-sky-200/50 via-pink-100/45 to-blue-100/45 sm:h-48">
                          <span className="text-sm font-medium text-sky-700/90">Mekan görseli yok</span>
                        </div>
                      )}
                      <div className="p-4 pt-3 sm:p-5 sm:pt-4">
                        <h2 className="line-clamp-2 text-lg font-bold leading-snug tracking-tight text-stone-800 sm:text-xl">
                          {v?.name ?? "Mekan"}
                        </h2>
                        <p className="mt-2">
                          <span className={pillCategory}>{toTurkishCategory(v?.category ?? "")}</span>
                        </p>
                      </div>
                    </Link>
                  </article>
                </li>
              );
            })}
          </ul>
        ) : null}
      </section>
    </div>
  );
}
