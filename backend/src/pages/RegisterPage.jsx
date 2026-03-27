import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import FloatingField from "../components/FloatingField";
import api from "../services/api";
import { appRoutes } from "../utils/routes";
import {
  alertError,
  authBtnPrimary,
  authCardWide,
  authHeading,
  authPageGlow,
  authPageWash,
  authPageWrap,
  authSubtext,
  linkAccent,
  textMuted,
} from "../utils/ui";

function toBirthDateISO(dateOnly) {
  if (!dateOnly) return "";
  const d = new Date(`${dateOnly}T12:00:00`);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString();
}

export default function RegisterPage() {
  const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
  const navigate = useNavigate();
  const [accountType, setAccountType] = useState("user");
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [birthDate, setBirthDate] = useState("");
  const [venueName, setVenueName] = useState("");
  const [venueCategory, setVenueCategory] = useState("");
  const [venueCity, setVenueCity] = useState("");
  const [venueDistrict, setVenueDistrict] = useState("");
  const [venueNeighborhood, setVenueNeighborhood] = useState("");
  const [venueStreet, setVenueStreet] = useState("");
  const [venueAddressDetails, setVenueAddressDetails] = useState("");
  const [venueHoursText, setVenueHoursText] = useState(
    '{\n  "Pazartesi": "09:00-18:00",\n  "Salı": "09:00-18:00"\n}',
  );
  const [venueMenuText, setVenueMenuText] = useState("");
  const [venuePhotoDataUrl, setVenuePhotoDataUrl] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const birthDateISO = toBirthDateISO(birthDate);
    if (!birthDateISO) {
      setError("Geçerli bir doğum tarihi seçin.");
      setSubmitting(false);
      return;
    }

    try {
      const payload = {
        name: name.trim(),
        surname: surname.trim(),
        email: email.trim(),
        username: username.trim(),
        password,
        birthDate: birthDateISO,
        accountType,
      };

      if (accountType === "owner") {
        let hours;
        try {
          hours = JSON.parse(venueHoursText);
        } catch {
          setError("Çalışma saatleri geçerli JSON formatında olmalıdır.");
          setSubmitting(false);
          return;
        }
        if (!hours || typeof hours !== "object" || Array.isArray(hours)) {
          setError("Çalışma saatleri JSON nesnesi olmalıdır.");
          setSubmitting(false);
          return;
        }
        payload.venue = {
          name: venueName.trim(),
          category: venueCategory.trim(),
          address: {
            city: venueCity.trim(),
            district: venueDistrict.trim(),
            neighborhood: venueNeighborhood.trim(),
            street: venueStreet.trim(),
            details: venueAddressDetails.trim(),
          },
          hours,
          menu: venueMenuText
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean),
          photoUrl: venuePhotoDataUrl || undefined,
        };
      }

      await api.post("/auth/register", payload);
      navigate(appRoutes.login, { replace: true });
    } catch (err) {
      setError(err.apiMessage || err.message || "Kayıt başarısız");
    } finally {
      setSubmitting(false);
    }
  }

  function resizeImageToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const maxEdge = 1280;
          const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
          const width = Math.max(1, Math.round(img.width * scale));
          const height = Math.max(1, Math.round(img.height * scale));
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Görsel işlenemedi"));
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", 0.8));
        };
        img.onerror = () => reject(new Error("Görsel okunamadı"));
        img.src = String(reader.result || "");
      };
      reader.onerror = () => reject(new Error("Dosya okunamadı"));
      reader.readAsDataURL(file);
    });
  }

  async function handleVenuePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    if (!file.type.startsWith("image/")) {
      setError("Lütfen sadece görsel dosyası seçin.");
      e.target.value = "";
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setError("Mekan fotoğrafı en fazla 5 MB olabilir.");
      e.target.value = "";
      return;
    }
    try {
      const compressed = await resizeImageToDataUrl(file);
      setVenuePhotoDataUrl(compressed);
    } catch (err) {
      setError(err.message || "Mekan fotoğrafı işlenemedi.");
    } finally {
      e.target.value = "";
    }
  }

  return (
    <div className={authPageWrap}>
      <div className={authPageWash} aria-hidden />
      <div className={authPageGlow} aria-hidden />

      <section className={authCardWide}>
        <h1 className={authHeading}>Hesap oluştur</h1>
        <p className={authSubtext}>
          Meydone&apos;a katılın — işlem bitince giriş sayfasına yönlendirileceksiniz.
        </p>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
          <div className="rounded-2xl border border-sky-100/70 bg-sky-50/45 p-4">
            <p className="text-sm font-semibold text-stone-800">Hesap tipi</p>
            <div className="mt-3 flex flex-wrap gap-3">
              <label className="inline-flex items-center gap-2 text-sm text-stone-700">
                <input
                  type="radio"
                  name="account-type"
                  value="user"
                  checked={accountType === "user"}
                  onChange={(e) => setAccountType(e.target.value)}
                />
                Kullanıcı
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-stone-700">
                <input
                  type="radio"
                  name="account-type"
                  value="owner"
                  checked={accountType === "owner"}
                  onChange={(e) => setAccountType(e.target.value)}
                />
                Mekan sahibi
              </label>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <FloatingField
              id="register-name"
              label="Ad"
              type="text"
              autoComplete="given-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <FloatingField
              id="register-surname"
              label="Soyad"
              type="text"
              autoComplete="family-name"
              required
              value={surname}
              onChange={(e) => setSurname(e.target.value)}
            />
          </div>

          <FloatingField
            id="register-email"
            label="E-posta"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <FloatingField
            id="register-username"
            label="Kullanıcı adı"
            type="text"
            autoComplete="username"
            required
            minLength={3}
            maxLength={30}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            helperText="3–30 karakter: harf, rakam, alt çizgi."
          />

          <FloatingField
            id="register-password"
            label="Şifre"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            helperText="En az 8 karakter."
          />
          <label className="flex items-center gap-2 text-sm text-stone-700">
            <input
              type="checkbox"
              checked={showPassword}
              onChange={(e) => setShowPassword(e.target.checked)}
              className="h-4 w-4 rounded border-stone-300 text-blue-600 focus:ring-blue-500"
            />
            Şifreyi göster
          </label>

          <FloatingField
            id="register-birthdate"
            label="Doğum tarihi"
            type="date"
            required
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
          />

          {accountType === "owner" ? (
            <div className="space-y-5 rounded-2xl border border-sky-100/70 bg-sky-50/45 p-4">
              <p className="text-sm font-semibold text-stone-800">Mekan bilgileri</p>
              <FloatingField
                id="owner-venue-name"
                label="Mekan adı"
                type="text"
                required
                value={venueName}
                onChange={(e) => setVenueName(e.target.value)}
              />
              <FloatingField
                id="owner-venue-category"
                label="Kategori"
                type="text"
                required
                value={venueCategory}
                onChange={(e) => setVenueCategory(e.target.value)}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <FloatingField
                  id="owner-venue-city"
                  label="Şehir"
                  type="text"
                  required
                  value={venueCity}
                  onChange={(e) => setVenueCity(e.target.value)}
                />
                <FloatingField
                  id="owner-venue-district"
                  label="İlçe"
                  type="text"
                  required
                  value={venueDistrict}
                  onChange={(e) => setVenueDistrict(e.target.value)}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <FloatingField
                  id="owner-venue-neighborhood"
                  label="Mahalle"
                  type="text"
                  required
                  value={venueNeighborhood}
                  onChange={(e) => setVenueNeighborhood(e.target.value)}
                />
                <FloatingField
                  id="owner-venue-street"
                  label="Sokak / Cadde"
                  type="text"
                  required
                  value={venueStreet}
                  onChange={(e) => setVenueStreet(e.target.value)}
                />
              </div>
              <FloatingField
                id="owner-venue-address-details"
                label="Adres detay (No, kat vb.)"
                type="text"
                value={venueAddressDetails}
                onChange={(e) => setVenueAddressDetails(e.target.value)}
              />
              <label className="block text-sm font-medium text-stone-600" htmlFor="owner-hours">
                Çalışma saatleri (JSON)
              </label>
              <textarea
                id="owner-hours"
                rows={5}
                value={venueHoursText}
                onChange={(e) => setVenueHoursText(e.target.value)}
                className="mt-1 w-full rounded-xl border border-sky-200/80 bg-white px-4 py-3 font-mono text-sm text-stone-800 shadow-sm outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-200/45"
              />
              <label className="block text-sm font-medium text-stone-600" htmlFor="owner-menu">
                Menü içeriği (her satıra bir ürün)
              </label>
              <textarea
                id="owner-menu"
                rows={5}
                value={venueMenuText}
                onChange={(e) => setVenueMenuText(e.target.value)}
                className="mt-1 w-full rounded-xl border border-sky-200/80 bg-white px-4 py-3 text-sm text-stone-800 shadow-sm outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-200/45"
              />
              <label className="block text-sm font-medium text-stone-600" htmlFor="owner-photo-file">
                Mekan fotoğrafı
              </label>
              <input
                id="owner-photo-file"
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleVenuePhotoChange}
                className="mt-1 block w-full rounded-xl border border-sky-200/80 bg-white px-4 py-3 text-sm text-stone-800 shadow-sm outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-200/45"
              />
              {venuePhotoDataUrl ? (
                <div className="space-y-2">
                  <img
                    src={venuePhotoDataUrl}
                    alt="Seçilen mekan görseli önizlemesi"
                    className="max-h-44 rounded-xl border border-sky-100 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setVenuePhotoDataUrl("")}
                    className="text-sm font-medium text-rose-700 underline underline-offset-2"
                  >
                    Fotoğrafı kaldır
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}

          {error ? (
            <p className={alertError} role="alert">
              {error}
            </p>
          ) : null}

          <button type="submit" disabled={submitting} className={`${authBtnPrimary} mt-1`}>
            {submitting ? "Hesap oluşturuluyor…" : "Üye Ol"}
          </button>
        </form>

        <p className={`mt-10 text-center text-sm ${textMuted}`}>
          Zaten hesabınız var mı?{" "}
          <Link to={appRoutes.login} className={linkAccent}>
            Giriş Yap
          </Link>
        </p>
      </section>
    </div>
  );
}
