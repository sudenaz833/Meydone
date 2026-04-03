import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CircleMarker, MapContainer, TileLayer, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import FloatingField from "../components/FloatingField";
import api from "../services/api";
import { appRoutes } from "../utils/routes";
import { parseMenuTextarea } from "../utils/venueMenu";
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

const WEEK_DAYS = [
  "Pazartesi",
  "Salı",
  "Çarşamba",
  "Perşembe",
  "Cuma",
  "Cumartesi",
  "Pazar",
];

function createEmptyDailyHours() {
  return {
    Pazartesi: { open: "", close: "" },
    Salı: { open: "", close: "" },
    Çarşamba: { open: "", close: "" },
    Perşembe: { open: "", close: "" },
    Cuma: { open: "", close: "" },
    Cumartesi: { open: "", close: "" },
    Pazar: { open: "", close: "" },
  };
}

function toBirthDateISO(dateOnly) {
  if (!dateOnly) return "";
  const d = new Date(`${dateOnly}T12:00:00`);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString();
}

function sanitizePersonNameInput(value) {
  // Sadece harf ve boşluk: sayı / özel karakterleri anında temizle.
  return String(value ?? "").replace(/[^A-Za-zÇĞİÖŞÜçğıöşü\s]/g, "");
}

async function reverseGeocode(lat, lng) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
    String(lat),
  )}&lon=${encodeURIComponent(String(lng))}&accept-language=tr`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Konumdan adres alınamadı");
  const data = await res.json();
  const a = data?.address ?? {};
  const city = a.city || a.province || a.state || a.town || a.municipality || "";
  const district =
    a.town ||
    a.city_district ||
    a.county ||
    a.state_district ||
    a.municipality ||
    "";
  const sameCityDistrict =
    String(city).trim().toLocaleLowerCase("tr-TR") ===
    String(district).trim().toLocaleLowerCase("tr-TR");
  return {
    city,
    district: sameCityDistrict ? "" : district,
    neighborhood: a.suburb || a.neighbourhood || a.quarter || "",
    street: a.road || a.pedestrian || a.footway || "",
    details: [a.house_number, a.postcode].filter(Boolean).join(" "),
  };
}

function RegisterVenueMapPicker({ position, onPick }) {
  useMapEvents({
    click(e) {
      const lat = Number(e?.latlng?.lat);
      const lng = Number(e?.latlng?.lng);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        onPick({ lat, lng });
      }
    },
  });
  if (!position) return null;
  return (
    <CircleMarker
      center={[position.lat, position.lng]}
      radius={9}
      pathOptions={{ color: "#8b5cf6", fillColor: "#c4b5fd", fillOpacity: 0.9 }}
    />
  );
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
  const [venueHours, setVenueHours] = useState(createEmptyDailyHours);
  const [venueMenuText, setVenueMenuText] = useState("");
  const [venuePhotoDataUrl, setVenuePhotoDataUrl] = useState("");
  const [venueLocation, setVenueLocation] = useState({ lat: 37.7648, lng: 30.5566 });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleVenueLocationPick(point) {
    setVenueLocation(point);
    try {
      const adr = await reverseGeocode(point.lat, point.lng);
      setVenueCity(adr.city);
      setVenueDistrict(adr.district);
      setVenueNeighborhood(adr.neighborhood);
      setVenueStreet(adr.street);
      setVenueAddressDetails(adr.details);
    } catch {
      // Konum seçimi devam etsin; sadece otomatik adres alınamazsa mevcut girişleri koru.
    }
  }

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
        const hours = Object.fromEntries(
          Object.entries(venueHours)
            .map(([day, value]) => {
              const open = String(value?.open ?? "").trim();
              const close = String(value?.close ?? "").trim();
              if (!open || !close) return null;
              return [day, `${open}-${close}`];
            })
            .filter(Boolean),
        );
        if (Object.keys(hours).length === 0) {
          setError("En az bir gün için çalışma saati girin.");
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
          menu: parseMenuTextarea(venueMenuText),
          photoUrl: venuePhotoDataUrl || undefined,
          location: venueLocation,
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
          <div className="rounded-2xl border border-rose-100/70 bg-violet-50/40 p-4">
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
              onChange={(e) => setName(sanitizePersonNameInput(e.target.value))}
              pattern="^[A-Za-zÇĞİÖŞÜçğıöşü\s]+$"
              title="Ad sadece harf içerebilir"
            />
            <FloatingField
              id="register-surname"
              label="Soyad"
              type="text"
              autoComplete="family-name"
              required
              value={surname}
              onChange={(e) => setSurname(sanitizePersonNameInput(e.target.value))}
              pattern="^[A-Za-zÇĞİÖŞÜçğıöşü\s]+$"
              title="Soyad sadece harf içerebilir"
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
            <div className="space-y-5 rounded-2xl border border-rose-100/70 bg-violet-50/40 p-4">
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
              <div className="space-y-2">
                <label className="block text-sm font-medium text-stone-600">
                  Haritadan mekan konumu seç
                </label>
                <div className="h-64 overflow-hidden rounded-xl border border-rose-200/70 bg-white">
                  <MapContainer
                    center={[venueLocation.lat, venueLocation.lng]}
                    zoom={13}
                    scrollWheelZoom
                    className="h-full w-full"
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <RegisterVenueMapPicker position={venueLocation} onPick={handleVenueLocationPick} />
                  </MapContainer>
                </div>
                <p className="text-xs text-stone-500">
                  Seçilen konum: {venueLocation.lat.toFixed(6)}, {venueLocation.lng.toFixed(6)}
                </p>
              </div>
              <label className="block text-sm font-medium text-stone-600" htmlFor="owner-hours">
                Çalışma saatleri
              </label>
              <div
                id="owner-hours"
                className="mt-1 grid gap-3 rounded-xl border border-rose-200/70 bg-white p-4 text-sm text-stone-800"
              >
                {WEEK_DAYS.map((day) => (
                  <label key={day} className="grid items-center gap-2 sm:grid-cols-[140px_1fr_1fr]">
                    <span className="font-medium text-stone-700">{day}</span>
                    <input
                      type="time"
                      value={venueHours[day]?.open ?? ""}
                      onChange={(e) =>
                        setVenueHours((prev) => ({
                          ...prev,
                          [day]: { ...(prev[day] ?? { open: "", close: "" }), open: e.target.value },
                        }))
                      }
                      className="w-full rounded-lg border border-rose-200/70 bg-white px-3 py-2 text-sm text-stone-800 shadow-sm outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100/80"
                    />
                    <input
                      type="time"
                      value={venueHours[day]?.close ?? ""}
                      onChange={(e) =>
                        setVenueHours((prev) => ({
                          ...prev,
                          [day]: { ...(prev[day] ?? { open: "", close: "" }), close: e.target.value },
                        }))
                      }
                      className="w-full rounded-lg border border-rose-200/70 bg-white px-3 py-2 text-sm text-stone-800 shadow-sm outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100/80"
                    />
                  </label>
                ))}
                <p className="text-xs text-stone-500">
                  Bir gün için açılış ve kapanış saatini birlikte seçin. Boş günler kapalı kabul edilir.
                </p>
              </div>
              <label className="block text-sm font-medium text-stone-600" htmlFor="owner-menu">
                Menü içeriği (her satıra bir ürün; fiyat için &quot;ürün | fiyat&quot;, örn. Çay | 20)
              </label>
              <textarea
                id="owner-menu"
                rows={5}
                value={venueMenuText}
                onChange={(e) => setVenueMenuText(e.target.value)}
                className="mt-1 w-full rounded-xl border border-rose-200/70 bg-white px-4 py-3 text-sm text-stone-800 shadow-sm outline-none focus:border-violet-300 focus:ring-4 focus:ring-violet-100/80"
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
                className="mt-1 block w-full rounded-xl border border-rose-200/70 bg-white px-4 py-3 text-sm text-stone-800 shadow-sm outline-none focus:border-violet-300 focus:ring-4 focus:ring-violet-100/80"
              />
              {venuePhotoDataUrl ? (
                <div className="space-y-2">
                  <img
                    src={venuePhotoDataUrl}
                    alt="Seçilen mekan görseli önizlemesi"
                    className="max-h-44 rounded-xl border border-rose-100/80 object-cover"
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
