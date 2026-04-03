import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { AUTH_TOKEN_KEY } from "../utils/constants";
import { appRoutes } from "../utils/routes";
import { linkAccent, textMuted } from "../utils/ui";

function hasToken() {
  return typeof window !== "undefined" && !!localStorage.getItem(AUTH_TOKEN_KEY);
}

export default function VenueFavoriteToggle({
  venueId,
  isFavorite: controlledFavorite,
  onFavoriteChange,
  compact = false,
  className = "",
}) {
  const navigate = useNavigate();
  const isControlled = controlledFavorite !== undefined;

  const [internalFavorite, setInternalFavorite] = useState(false);
  const [loading, setLoading] = useState(!isControlled);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isControlled) {
      setLoading(false);
      return;
    }
    if (!venueId) {
      setLoading(false);
      return;
    }
    if (!hasToken()) {
      setInternalFavorite(false);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    api
      .get("/favorites")
      .then((r) => {
        const items = r.data?.data?.items ?? [];
        const vid = String(venueId);
        const found = items.some((f) => String(f.venue?._id ?? f.venue) === vid);
        if (active) setInternalFavorite(found);
      })
      .catch(() => {
        if (active) setInternalFavorite(false);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [venueId, isControlled]);

  const isFavorite = isControlled ? controlledFavorite : internalFavorite;

  async function toggle() {
    setError("");
    if (!venueId) return;
    if (!hasToken()) {
      navigate(appRoutes.login);
      return;
    }

    setBusy(true);
    const next = !isFavorite;
    try {
      if (next) {
        await api.post("/favorites", { venue: venueId });
        if (isControlled) {
          onFavoriteChange?.(true);
        } else {
          setInternalFavorite(true);
        }
      } else {
        await api.delete(`/favorites/${venueId}`);
        if (isControlled) {
          onFavoriteChange?.(false);
        } else {
          setInternalFavorite(false);
        }
      }
    } catch (err) {
      if (err.response?.status === 409 && next) {
        if (isControlled) onFavoriteChange?.(true);
        else setInternalFavorite(true);
      } else if (err.response?.status === 404 && !next) {
        if (isControlled) onFavoriteChange?.(false);
        else setInternalFavorite(false);
      } else {
        setError(err.apiMessage || err.message || "Favoriler güncellenemedi");
      }
    } finally {
      setBusy(false);
    }
  }

  const label = isFavorite ? "Favorilerden çıkar" : "Favorilere ekle";
  const heart = isFavorite ? "♥" : "♡";

  if (loading && !isControlled) {
    return compact ? (
      <span
        className={`inline-block h-11 w-11 animate-pulse rounded-full border border-rose-100 bg-violet-50/70 ${className}`}
      />
    ) : (
      <span className={`text-sm ${textMuted} ${className}`}>…</span>
    );
  }

  if (!hasToken() && compact) {
    return (
      <Link
        to={appRoutes.login}
        className={`inline-flex h-11 w-11 items-center justify-center rounded-full border border-pink-200/80 bg-white/90 text-lg text-rose-400 shadow-sm shadow-pink-200/30 transition hover:border-pink-300 hover:bg-pink-50/50 ${className}`}
        aria-label="Favorilere eklemek için giriş yapın"
        title="Favorilere eklemek için giriş yapın"
      >
        ♡
      </Link>
    );
  }

  if (!hasToken() && !compact) {
    return (
      <p className={`text-sm ${textMuted} ${className}`}>
        <Link to={appRoutes.login} className={linkAccent}>
          Giriş yapın
        </Link>{" "}
        — bu mekanı favorilere eklemek için.
      </p>
    );
  }

  return (
    <div className={className}>
      <button
        type="button"
        disabled={busy}
        onClick={toggle}
        className={
          compact
            ? `inline-flex h-11 w-11 items-center justify-center rounded-full border text-lg shadow-md transition duration-200 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:hover:translate-y-0 ${
                isFavorite
                  ? "border-rose-200/90 bg-gradient-to-br from-rose-50 to-pink-50 text-rose-600 shadow-rose-200/40"
                  : "border-rose-100/90 bg-white/95 text-rose-400 shadow-rose-100/30 hover:border-rose-200 hover:bg-rose-50/50"
              }`
            : `inline-flex min-h-[48px] items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold shadow-md transition duration-200 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:hover:translate-y-0 ${
                isFavorite
                  ? "border-rose-200/90 bg-gradient-to-r from-rose-50 to-pink-50 text-rose-800 shadow-rose-200/30"
                  : "border-rose-100/90 bg-white/95 text-stone-700 shadow-rose-100/30 hover:border-rose-200 hover:bg-rose-50/60"
              }`
        }
        aria-pressed={isFavorite}
        aria-label={label}
        title={label}
      >
        <span aria-hidden>{heart}</span>
        {!compact ? <span>{isFavorite ? "Favorilere eklendi" : "Mekanı favorilere ekle"}</span> : null}
      </button>
      {error ? (
        <p className="mt-2 text-xs text-rose-800" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
