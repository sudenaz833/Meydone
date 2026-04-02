import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { AUTH_TOKEN_KEY } from "../utils/constants";
import { appRoutes } from "../utils/routes";
import { alertSuccess, innerWell, linkAccent, starOff, starOn, textMuted, textSmall } from "../utils/ui";

function hasToken() {
  return typeof window !== "undefined" && !!localStorage.getItem(AUTH_TOKEN_KEY);
}

export default function VenueRateStars({ venueId, onRated }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [hover, setHover] = useState(0);
  const [selected, setSelected] = useState(0);

  const loggedIn = hasToken();

  async function submit(stars) {
    setError("");
    setSuccess("");
    if (!loggedIn) {
      setError("Bu mekanı puanlamak için giriş yapın.");
      return;
    }
    setBusy(true);
    try {
      const { data } = await api.post(`/venues/${venueId}/rate`, {
        rating: stars,
      });
      const payload = data?.data;
      onRated?.(payload);
      if (payload?.removed) {
        setSelected(0);
        setSuccess("Puanınız kaldırıldı.");
      } else {
        const yourRating = Number(payload?.yourRating);
        setSelected(Number.isFinite(yourRating) ? yourRating : stars);
        setSuccess(
          payload?.updated
            ? `Puanınız ${stars} yıldız olarak güncellendi.`
            : `Bu mekana ${stars} yıldız verdiniz.`,
        );
      }
    } catch (err) {
      setSuccess("");
      setError(err.apiMessage || err.message || "Puan gönderilemedi");
    } finally {
      setBusy(false);
    }
  }

  const activeLevel = hover || selected;

  return (
    <div className="mt-8 border-t border-rose-100/50 pt-8">
      <h3 className="text-sm font-semibold text-stone-800">Bu mekanı puanlayın</h3>
      <p className={`mt-2 ${textSmall}`}>
        1–5 yıldız seçin. Aynı yıldıza tekrar basarsanız puanınızı geri alabilirsiniz.
      </p>

      {!loggedIn ? (
        <div className={`mt-4 ${innerWell}`}>
          <p className={`text-sm ${textMuted}`}>
            <Link to={appRoutes.login} className={linkAccent}>
              Giriş yapın
            </Link>{" "}
            — puan vermek için.
          </p>
        </div>
      ) : (
        <div className="mt-4 flex items-center gap-1" role="group" aria-label="1 ila 5 yıldız arası puanla">
          {[1, 2, 3, 4, 5].map((n) => {
            const filled = activeLevel >= n;
            return (
              <button
                key={n}
                type="button"
                disabled={busy}
                onMouseEnter={() => setHover(n)}
                onMouseLeave={() => setHover(0)}
                onClick={() => submit(n)}
                className={`rounded-2xl p-1.5 text-3xl leading-none transition disabled:opacity-50 ${
                  filled ? starOn : starOff
                } hover:text-amber-400`}
                aria-label={`${n} yıldız`}
              >
                ★
              </button>
            );
          })}
        </div>
      )}

      {error ? (
        <p className="mt-3 text-sm text-rose-800" role="alert">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className={`mt-3 ${alertSuccess}`} role="status">
          {success}
        </p>
      ) : null}
    </div>
  );
}
