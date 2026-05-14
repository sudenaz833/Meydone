import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { toTurkishCategory } from "../utils/category";
import { AUTH_TOKEN_KEY } from "../utils/constants";
import { appRoutes } from "../utils/routes";
import { venueFailSafeImageUrl, venueId, venueListCoverUrl } from "../utils/venue";

/** Liste / keşif için görsel kart (fotoğraf, kategori, puan). */
export default function VenueBrowseCard({ venue }) {
  const id = venueId(venue);
  
  // Dış fonksiyonun obje döndürme ihtimaline karşı String koruması
  const [imgSrc, setImgSrc] = useState(() => {
    const url = venueListCoverUrl(venue);
    return typeof url === "string" ? url : "";
  });

  // venue değiştiğinde imgSrc'yi güvenle güncelle
  useEffect(() => {
    const url = venueListCoverUrl(venue);
    setImgSrc(typeof url === "string" ? url : "");
  }, [venue]);

  const isLoggedIn =
    typeof window !== "undefined" && !!localStorage.getItem(AUTH_TOKEN_KEY);
    
  const rating =
    typeof venue?.rating === "number" && !Number.isNaN(venue.rating) ? venue.rating : null;
    
  const address = venue?.address && typeof venue.address === "object" ? venue.address : null;
  
  // Adres alanlarının nesne değil, kesinlikle string olduğunu garantiye alıyoruz
  const district = address?.district && typeof address.district === "string" ? address.district : "";
  const city = address?.city && typeof address.city === "string" ? address.city : "";
  const cityLine = [district, city].filter((x) => x.trim()).join(" · ");

  // Kategori fonksiyonunun nesne döndürme ihtimaline karşı string koruması
  const getCategoryLabel = () => {
    const cat = toTurkishCategory(venue?.category);
    if (typeof cat === "object") {
      return "Genel Mekan"; // Eğer backend'den kategori yerine yanlışlıkla obje dönerse çökmesin
    }
    return String(cat || "Mekan");
  };

  const inner = (
    <>
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-100">
        <img
          src={String(imgSrc || "")} // Kesinlikle string olduğundan emin oluyoruz
          alt=""
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          onError={() => {
            const fallback = venueFailSafeImageUrl(venue, "card");
            setImgSrc(typeof fallback === "string" ? fallback : "");
          }}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-violet-950/25 via-transparent to-transparent opacity-90" />
        {rating != null ? (
          <span className="absolute right-2.5 top-2.5 rounded-full bg-white/95 px-2.5 py-0.5 text-xs font-bold tabular-nums text-amber-700 shadow-sm ring-1 ring-rose-100">
            ★ {rating.toFixed(1)}
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4 pt-3">
        <h3 className="line-clamp-2 text-base font-semibold leading-snug text-violet-950 group-hover:text-rose-700">
          {typeof venue?.name === "string" ? venue.name : "Mekan"}
        </h3>
        <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
          {getCategoryLabel()}
        </p>
        {cityLine ? <p className="line-clamp-1 text-xs text-stone-400">{cityLine}</p> : null}
        <span className="mt-auto pt-2 text-sm font-semibold text-violet-700 group-hover:underline">
          İncele →
        </span>
      </div>
    </>
  );

  if (id && isLoggedIn) {
    return (
      <Link
        to={appRoutes.venueDetail.replace(":id", String(id))}
        className="group flex flex-col overflow-hidden rounded-2xl border border-rose-100/90 bg-white/90 shadow-md shadow-rose-100/40 outline-none ring-rose-100/50 transition hover:-translate-y-1 hover:border-violet-200/80 hover:shadow-lg hover:shadow-violet-100/50 focus-visible:ring-2 focus-visible:ring-violet-200/50"
      >
        {inner}
      </Link>
    );
  }

  return (
    <div
      className="flex flex-col overflow-hidden rounded-2xl border border-rose-100/90 bg-white/90 opacity-95 shadow-md shadow-rose-100/30"
      title={!isLoggedIn ? "Mekana gitmek için önce giriş yapın." : undefined}
    >
      {inner}
    </div>
  );
}