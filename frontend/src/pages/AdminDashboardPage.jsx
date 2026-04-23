import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CircleMarker, MapContainer, TileLayer, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import api from "../services/api";
import { toTurkishCategory } from "../utils/category";
import { AUTH_TOKEN_KEY } from "../utils/constants";
import { appRoutes } from "../utils/routes";
import { menuArrayToTextarea, parseMenuTextarea } from "../utils/venueMenu";
import {
  alertError,
  alertSuccess,
  alertWarn,
  btnPrimary,
  card,
  cardAccent,
  codeChip,
  headingPage,
  headingSection,
  inputUi,
  labelUi,
  linkAccent,
  selectUi,
  textMuted,
  textSmall,
  textareaUi,
} from "../utils/ui";

function ownerId(venue) {
  const o = venue?.owner;
  if (!o) return "";
  return String(o._id ?? o);
}

function venueId(v) {
  return String(v?._id ?? v?.id ?? "");
}

const WEEK_DAYS = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];

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

function normalizeHoursObjectToDailyRanges(hoursObj) {
  const dayLabelMap = {
    monday: "Pazartesi",
    tuesday: "Salı",
    wednesday: "Çarşamba",
    thursday: "Perşembe",
    friday: "Cuma",
    saturday: "Cumartesi",
    sunday: "Pazar",
    mon: "Pazartesi",
    tue: "Salı",
    wed: "Çarşamba",
    thu: "Perşembe",
    fri: "Cuma",
    sat: "Cumartesi",
    sun: "Pazar",
    pazartesi: "Pazartesi",
    salı: "Salı",
    sali: "Salı",
    çarşamba: "Çarşamba",
    carsamba: "Çarşamba",
    perşembe: "Perşembe",
    persembe: "Perşembe",
    cuma: "Cuma",
    cumartesi: "Cumartesi",
    pazar: "Pazar",
  };
  const out = createEmptyDailyHours();
  if (!hoursObj || typeof hoursObj !== "object" || Array.isArray(hoursObj)) return out;
  for (const [rawDay, rawRange] of Object.entries(hoursObj)) {
    const key = dayLabelMap[String(rawDay ?? "").trim().toLocaleLowerCase("tr-TR")];
    if (!key) continue;
    const range = String(rawRange ?? "").trim();
    const [open = "", close = ""] = range.split("-").map((x) => String(x ?? "").trim());
    out[key] = { open, close };
  }
  return out;
}

function dailyRangesToHoursObject(dailyHours) {
  return Object.fromEntries(
    Object.entries(dailyHours)
      .map(([day, value]) => {
        const open = String(value?.open ?? "").trim();
        const close = String(value?.close ?? "").trim();
        if (!open || !close) return null;
        return [day, `${open}-${close}`];
      })
      .filter(Boolean),
  );
}

function buildAddressQuery({ city, district, neighborhood, street, details }) {
  return [street, neighborhood, district, city, details]
    .map((x) => String(x ?? "").trim())
    .filter(Boolean)
    .join(", ");
}

async function reverseGeocode(lat, lng) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
    String(lat),
  )}&lon=${encodeURIComponent(String(lng))}&accept-language=tr`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Konumdan adres alınamadı");
  const data = await res.json();
  const a = data?.address ?? {};
  const city =
    a.city || a.province || a.state || a.town || a.municipality || "";
  const district =
    a.town ||
    a.city_district ||
    a.county ||
    a.state_district ||
    a.municipality ||
    "";

  // İl ve ilçe aynı gelirse ilçe alanını boş bırak (kullanıcı manuel seçsin).
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

async function forwardGeocode(query) {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&accept-language=tr&countrycodes=tr&q=${encodeURIComponent(
    query,
  )}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Adres konumu bulunamadı");
  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("Adres için konum bulunamadı");
  }
  return { lat: Number(data[0].lat), lng: Number(data[0].lon) };
}

function CreateVenueMapPicker({ position, onPick }) {
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

export default function AdminDashboardPage() {
  const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
  const [user, setUser] = useState(null);
  const [venues, setVenues] = useState([]);
  const [loadStatus, setLoadStatus] = useState("loading");
  const [loadError, setLoadError] = useState("");

  const [selectedId, setSelectedId] = useState("");

  const [hoursByDay, setHoursByDay] = useState(createEmptyDailyHours);
  const [addressCity, setAddressCity] = useState("");
  const [addressDistrict, setAddressDistrict] = useState("");
  const [addressNeighborhood, setAddressNeighborhood] = useState("");
  const [addressStreet, setAddressStreet] = useState("");
  const [addressDetails, setAddressDetails] = useState("");
  const [locationLat, setLocationLat] = useState("");
  const [locationLng, setLocationLng] = useState("");
  const [locationPoint, setLocationPoint] = useState(null);
  const [menuText, setMenuText] = useState("");
  const [photoDataUrl, setPhotoDataUrl] = useState("");
  const [announcementText, setAnnouncementText] = useState("");
  const [announcementPhotoDataUrl, setAnnouncementPhotoDataUrl] = useState("");
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newAddressCity, setNewAddressCity] = useState("");
  const [newAddressDistrict, setNewAddressDistrict] = useState("");
  const [newAddressNeighborhood, setNewAddressNeighborhood] = useState("");
  const [newAddressStreet, setNewAddressStreet] = useState("");
  const [newAddressDetails, setNewAddressDetails] = useState("");
  const [newHoursByDay, setNewHoursByDay] = useState(createEmptyDailyHours);
  const [newMenuText, setNewMenuText] = useState("");
  const [newPhotoDataUrl, setNewPhotoDataUrl] = useState("");
  const [newLocation, setNewLocation] = useState({ lat: 37.7648, lng: 30.5566 });
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [sectionError, setSectionError] = useState("");
  const [busy, setBusy] = useState("");

  const [accountCurrentPassword, setAccountCurrentPassword] = useState("");
  const [accountNewPassword, setAccountNewPassword] = useState("");
  const [accountPasswordBusy, setAccountPasswordBusy] = useState(false);
  const [accountPasswordError, setAccountPasswordError] = useState("");
  const [accountPasswordOk, setAccountPasswordOk] = useState(false);

  const load = useCallback(async () => {
    if (!localStorage.getItem(AUTH_TOKEN_KEY)) {
      setLoadStatus("guest");
      return;
    }
    setLoadStatus("loading");
    setLoadError("");
    try {
      const [meRes, venuesRes] = await Promise.all([
        api.get("/auth/me"),
        api.get("/venues", { params: { limit: 100 } }),
      ]);
      const u = meRes.data?.data?.user ?? null;
      setUser(u);
      const items = venuesRes.data?.data?.items;
      setVenues(Array.isArray(items) ? items : []);
      setLoadStatus("ok");
    } catch (err) {
      setLoadError(err.apiMessage || err.message || "Veriler yüklenemedi");
      setLoadStatus("error");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const ownedVenues = useMemo(() => {
    if (!user?._id) return [];
    const uid = String(user._id);
    return venues.filter((v) => ownerId(v) === uid);
  }, [user, venues]);

  const selectedVenue = useMemo(
    () => ownedVenues.find((v) => venueId(v) === selectedId) ?? null,
    [ownedVenues, selectedId],
  );

  useEffect(() => {
    if (!selectedVenue) {
      setHoursByDay(createEmptyDailyHours());
      setAddressCity("");
      setAddressDistrict("");
      setAddressNeighborhood("");
      setAddressStreet("");
      setAddressDetails("");
      setLocationLat("");
      setLocationLng("");
      setLocationPoint(null);
      setMenuText("");
      setPhotoDataUrl("");
      setAnnouncementText("");
      return;
    }
    setHoursByDay(normalizeHoursObjectToDailyRanges(selectedVenue.hours));
    setAddressCity(selectedVenue.address?.city ?? "");
    setAddressDistrict(selectedVenue.address?.district ?? "");
    setAddressNeighborhood(selectedVenue.address?.neighborhood ?? "");
    setAddressStreet(selectedVenue.address?.street ?? "");
    setAddressDetails(selectedVenue.address?.details ?? "");
    const lat = selectedVenue?.location?.lat;
    const lng = selectedVenue?.location?.lng;
    const hasCoords = typeof lat === "number" && !Number.isNaN(lat) && typeof lng === "number" && !Number.isNaN(lng);
    if (hasCoords) {
      setLocationLat(String(lat));
      setLocationLng(String(lng));
      setLocationPoint({ lat, lng });
    } else {
      setLocationLat("");
      setLocationLng("");
      setLocationPoint(null);
    }
    setMenuText(Array.isArray(selectedVenue.menu) ? menuArrayToTextarea(selectedVenue.menu) : "");
    setPhotoDataUrl(selectedVenue.photoUrl ?? "");
    setAnnouncementText(String(selectedVenue.announcement ?? ""));
    setAnnouncementPhotoDataUrl("");
  }, [selectedVenue]);

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

  async function handlePhotoChange(e, setFn) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSectionError("");
    if (!file.type.startsWith("image/")) {
      setSectionError("Lütfen sadece görsel dosyası seçin.");
      e.target.value = "";
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setSectionError("Mekan fotoğrafı en fazla 5 MB olabilir.");
      e.target.value = "";
      return;
    }
    try {
      const compressed = await resizeImageToDataUrl(file);
      setFn(compressed);
    } catch (err) {
      setSectionError(err.message || "Mekan fotoğrafı işlenemedi.");
    } finally {
      e.target.value = "";
    }
  }

  async function submitAccountPassword(e) {
    e.preventDefault();
    setAccountPasswordError("");
    setAccountPasswordOk(false);
    const newPw = accountNewPassword.trim();
    if (!newPw) {
      setAccountPasswordError("Yeni şifre girin.");
      return;
    }
    if (newPw.length < 8) {
      setAccountPasswordError("Yeni şifre en az 8 karakter olmalıdır.");
      return;
    }
    if (!accountCurrentPassword) {
      setAccountPasswordError("Mevcut şifrenizi girin.");
      return;
    }
    setAccountPasswordBusy(true);
    try {
      await api.put("/users/profile", {
        password: newPw,
        currentPassword: accountCurrentPassword,
      });
      setAccountCurrentPassword("");
      setAccountNewPassword("");
      setAccountPasswordOk(true);
      window.setTimeout(() => setAccountPasswordOk(false), 4000);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("profile-updated"));
      }
      await load();
    } catch (err) {
      setAccountPasswordError(err.apiMessage || err.message || "Şifre güncellenemedi");
    } finally {
      setAccountPasswordBusy(false);
    }
  }

  async function submitHours(e) {
    e.preventDefault();
    setSectionError("");
    setBusy("hours");
    try {
      const hours = dailyRangesToHoursObject(hoursByDay);
      await api.put(`/admin/venues/${selectedId}/hours`, { hours });
      await load();
    } catch (err) {
      setSectionError(err.apiMessage || err.message || "Çalışma saatleri güncellenemedi");
    } finally {
      setBusy("");
    }
  }

  async function submitAddress(e) {
    e.preventDefault();
    setSectionError("");
    setBusy("address");
    try {
      if (!addressCity.trim() || !addressDistrict.trim() || !addressNeighborhood.trim() || !addressStreet.trim()) {
        setSectionError("İl, ilçe, mahalle ve sokak alanları zorunludur.");
        return;
      }
      await api.put(`/admin/venues/${selectedId}/address`, {
        address: {
          city: addressCity.trim(),
          district: addressDistrict.trim(),
          neighborhood: addressNeighborhood.trim(),
          street: addressStreet.trim(),
          details: addressDetails.trim(),
        },
      });
      await load();
    } catch (err) {
      setSectionError(err.apiMessage || err.message || "Adres güncellenemedi");
    } finally {
      setBusy("");
    }
  }

  async function fillAddressFromSelectedLocation() {
    setSectionError("");
    setBusy("reverse-geocode-selected");
    try {
      const lat = Number(locationLat);
      const lng = Number(locationLng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        setSectionError("Önce haritadan geçerli bir konum seçin.");
        return;
      }
      const adr = await reverseGeocode(lat, lng);
      setAddressCity(adr.city);
      setAddressDistrict(adr.district);
      setAddressNeighborhood(adr.neighborhood);
      setAddressStreet(adr.street);
      setAddressDetails(adr.details);
    } catch (err) {
      setSectionError(err.message || "Konumdan adres alınamadı");
    } finally {
      setBusy("");
    }
  }

  async function handleSelectedLocationPick(point) {
    setLocationPoint(point);
    setLocationLat(String(point.lat));
    setLocationLng(String(point.lng));
    try {
      const adr = await reverseGeocode(point.lat, point.lng);
      setAddressCity(adr.city);
      setAddressDistrict(adr.district);
      setAddressNeighborhood(adr.neighborhood);
      setAddressStreet(adr.street);
      setAddressDetails(adr.details);
    } catch {
      // Konum seçimi sürsün; otomatik adres alınamazsa manuel düzenleme yapılabilir.
    }
  }

  async function locateSelectedFromAddress() {
    setSectionError("");
    setBusy("forward-geocode-selected");
    try {
      const q = buildAddressQuery({
        city: addressCity,
        district: addressDistrict,
        neighborhood: addressNeighborhood,
        street: addressStreet,
        details: addressDetails,
      });
      if (!q) {
        setSectionError("Önce adres alanlarını doldurun.");
        return;
      }
      const p = await forwardGeocode(q);
      setLocationPoint(p);
      setLocationLat(String(p.lat));
      setLocationLng(String(p.lng));
    } catch (err) {
      setSectionError(err.message || "Adres konumu bulunamadı");
    } finally {
      setBusy("");
    }
  }

  async function submitLocation(e) {
    e.preventDefault();
    setSectionError("");
    setBusy("location");
    try {
      const lat = Number(locationLat);
      const lng = Number(locationLng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        setSectionError("Geçerli bir konum seçin.");
        return;
      }
      await api.put(`/admin/venues/${selectedId}/location`, {
        location: { lat, lng },
      });
      await load();
    } catch (err) {
      setSectionError(err.apiMessage || err.message || "Konum güncellenemedi");
    } finally {
      setBusy("");
    }
  }

  async function submitMenu(e) {
    e.preventDefault();
    setSectionError("");
    setBusy("menu");
    try {
      const menu = parseMenuTextarea(menuText);
      await api.put(`/admin/venues/${selectedId}/menu`, { menu });
      await load();
    } catch (err) {
      setSectionError(err.apiMessage || err.message || "Menü güncellenemedi");
    } finally {
      setBusy("");
    }
  }

  async function submitPhoto(e) {
    e.preventDefault();
    setSectionError("");
    setBusy("photo");
    try {
      if (!photoDataUrl) {
        setSectionError("Lütfen bir fotoğraf dosyası seçin.");
        return;
      }
      await api.post(`/admin/venues/${selectedId}/photo`, { photoUrl: photoDataUrl });
      await load();
    } catch (err) {
      setSectionError(err.apiMessage || err.message || "Fotoğraf kaydedilemedi");
    } finally {
      setBusy("");
    }
  }

  async function submitAnnouncement(e) {
    e?.preventDefault?.();
    setSectionError("");
    setBusy("announcement");
    try {
      await api.put(`/admin/venues/${selectedId}/announcement`, {
        announcement: announcementText.trim(),
        shareAsPost: true,
        postPhotoUrl: announcementPhotoDataUrl || undefined,
      });
      setAnnouncementText("");
      setAnnouncementPhotoDataUrl("");
      await load();
    } catch (err) {
      setSectionError(err.apiMessage || err.message || "Duyuru güncellenemedi");
    } finally {
      setBusy("");
    }
  }

  async function createVenue(e) {
    e.preventDefault();
    setSectionError("");
    setBusy("create");
    try {
      if (
        !newAddressCity.trim() ||
        !newAddressDistrict.trim() ||
        !newAddressNeighborhood.trim() ||
        !newAddressStreet.trim()
      ) {
        setSectionError("İl, ilçe, mahalle ve sokak alanları zorunludur.");
        return;
      }
      const hours = dailyRangesToHoursObject(newHoursByDay);
      const menu = parseMenuTextarea(newMenuText);
      await api.post("/admin/venues", {
        name: newName.trim(),
        category: newCategory.trim(),
        location: newLocation,
        address: {
          city: newAddressCity.trim(),
          district: newAddressDistrict.trim(),
          neighborhood: newAddressNeighborhood.trim(),
          street: newAddressStreet.trim(),
          details: newAddressDetails.trim(),
        },
        menu,
        hours,
        photoUrl: newPhotoDataUrl || undefined,
      });
      setNewName("");
      setNewCategory("");
      setNewAddressCity("");
      setNewAddressDistrict("");
      setNewAddressNeighborhood("");
      setNewAddressStreet("");
      setNewAddressDetails("");
      setNewHoursByDay(createEmptyDailyHours());
      setNewMenuText("");
      setNewPhotoDataUrl("");
      setNewLocation({ lat: 37.7648, lng: 30.5566 });
      setShowCreateForm(false);
      await load();
    } catch (err) {
      setSectionError(err.apiMessage || err.message || "Mekan eklenemedi");
    } finally {
      setBusy("");
    }
  }

  async function fillNewAddressFromLocation() {
    setSectionError("");
    setBusy("reverse-geocode-new");
    try {
      const lat = Number(newLocation?.lat);
      const lng = Number(newLocation?.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        setSectionError("Önce haritadan geçerli bir konum seçin.");
        return;
      }
      const adr = await reverseGeocode(lat, lng);
      setNewAddressCity(adr.city);
      setNewAddressDistrict(adr.district);
      setNewAddressNeighborhood(adr.neighborhood);
      setNewAddressStreet(adr.street);
      setNewAddressDetails(adr.details);
    } catch (err) {
      setSectionError(err.message || "Konumdan adres alınamadı");
    } finally {
      setBusy("");
    }
  }

  async function handleNewLocationPick(point) {
    setNewLocation(point);
    try {
      const adr = await reverseGeocode(point.lat, point.lng);
      setNewAddressCity(adr.city);
      setNewAddressDistrict(adr.district);
      setNewAddressNeighborhood(adr.neighborhood);
      setNewAddressStreet(adr.street);
      setNewAddressDetails(adr.details);
    } catch {
      // Otomatik adres alınamazsa kullanıcı manuel girebilir.
    }
  }

  async function locateNewFromAddress() {
    setSectionError("");
    setBusy("forward-geocode-new");
    try {
      const q = buildAddressQuery({
        city: newAddressCity,
        district: newAddressDistrict,
        neighborhood: newAddressNeighborhood,
        street: newAddressStreet,
        details: newAddressDetails,
      });
      if (!q) {
        setSectionError("Önce adres alanlarını doldurun.");
        return;
      }
      const p = await forwardGeocode(q);
      setNewLocation(p);
    } catch (err) {
      setSectionError(err.message || "Adres konumu bulunamadı");
    } finally {
      setBusy("");
    }
  }

  async function deleteVenue() {
    if (!selectedId) return;
    const ok = window.confirm("Bu mekanı kalıcı olarak silmek istediğinize emin misiniz?");
    if (!ok) return;
    setSectionError("");
    setBusy("delete");
    try {
      await api.delete(`/admin/venues/${selectedId}`);
      setSelectedId("");
      await load();
    } catch (err) {
      setSectionError(err.apiMessage || err.message || "Mekan silinemedi");
    } finally {
      setBusy("");
    }
  }

  if (loadStatus === "guest") {
    return (
      <section className={card}>
        <h1 className={headingPage}>Yönetim paneli</h1>
        <p className={`mt-3 ${textMuted}`}>
          <Link to={appRoutes.login} className={linkAccent}>
            Giriş yapın
          </Link>{" "}
          — mekana sahip bir yönetici hesabıyla.
        </p>
      </section>
    );
  }

  if (loadStatus === "loading") {
    return <p className={textMuted}>Yükleniyor…</p>;
  }

  if (loadStatus === "error") {
    return (
      <p className={alertError} role="alert">
        {loadError}
      </p>
    );
  }

  if (user?.role !== "admin" && user?.role !== "owner") {
    return (
      <section className={card}>
        <h1 className={headingPage}>Yönetim paneli</h1>
        <p className={`mt-3 ${textMuted}`}>
          Bu alan yalnızca <strong className="text-stone-800">admin/owner</strong> rolündeki hesaplar içindir.
        </p>
        <p className={`mt-4 text-sm ${textMuted}`}>
          Mekan güncellemeleri <code className={codeChip}>/api/admin/venues/:id/…</code> üzerinden yapılır; mekanın{" "}
          <strong className="text-stone-800">sahibi</strong> olmanız gerekir.
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-8">
      <header className={cardAccent}>
        <h1 className={headingPage}>Yönetim paneli</h1>
        <p className={`mt-2 max-w-2xl ${textMuted}`}>
          Sahibi olduğunuz mekanları ekleyin/silin, çalışma saatlerini, adresini, menüsünü ve fotoğrafını güncelleyin.
        </p>
      </header>

      <section className={card} aria-labelledby="account-password-h">
        <h2 id="account-password-h" className={headingSection}>
          Hesap şifresi
        </h2>
        <p className={`mt-2 ${textMuted}`}>
          Giriş şifrenizi buradan güncelleyebilirsiniz. Mevcut şifrenizi doğrulamanız gerekir.
        </p>
        <form className="mt-6 max-w-md space-y-4" onSubmit={submitAccountPassword}>
          <div>
            <label htmlFor="admin-current-password" className={labelUi}>
              Mevcut şifre
            </label>
            <input
              id="admin-current-password"
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              value={accountCurrentPassword}
              onChange={(e) => setAccountCurrentPassword(e.target.value)}
              className={inputUi}
            />
          </div>
          <div>
            <label htmlFor="admin-new-password" className={labelUi}>
              Yeni şifre <span className={`${textSmall} font-normal text-stone-500`}>(en az 8 karakter)</span>
            </label>
            <input
              id="admin-new-password"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={accountNewPassword}
              onChange={(e) => setAccountNewPassword(e.target.value)}
              className={inputUi}
            />
          </div>
          {accountPasswordError ? (
            <p className={alertError} role="alert">
              {accountPasswordError}
            </p>
          ) : null}
          {accountPasswordOk ? (
            <p className={alertSuccess} role="status">
              Şifreniz güncellendi.
            </p>
          ) : null}
          <button type="submit" disabled={accountPasswordBusy} className={btnPrimary}>
            {accountPasswordBusy ? "Kaydediliyor…" : "Şifreyi güncelle"}
          </button>
        </form>
      </section>

      <section className={card} aria-labelledby="create-venue-h">
        <div className="flex items-center justify-between gap-3">
          <h2 id="create-venue-h" className={headingSection}>
            Yeni mekan ekle
          </h2>
          <button
            type="button"
            className={btnPrimary}
            onClick={() => setShowCreateForm((prev) => !prev)}
          >
            {showCreateForm ? "Formu kapat" : "Yeni mekan ekle"}
          </button>
        </div>

        {showCreateForm ? (
          <form className="mt-6 space-y-4" onSubmit={createVenue}>
          <div className="grid gap-4 sm:grid-cols-2">
            <input className={inputUi} placeholder="Mekan adı" value={newName} onChange={(e) => setNewName(e.target.value)} />
            <input className={inputUi} placeholder="Kategori" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <input className={inputUi} placeholder="İl" value={newAddressCity} onChange={(e) => setNewAddressCity(e.target.value)} />
            <input className={inputUi} placeholder="İlçe" value={newAddressDistrict} onChange={(e) => setNewAddressDistrict(e.target.value)} />
            <input
              className={inputUi}
              placeholder="Mahalle"
              value={newAddressNeighborhood}
              onChange={(e) => setNewAddressNeighborhood(e.target.value)}
            />
            <input className={inputUi} placeholder="Sokak" value={newAddressStreet} onChange={(e) => setNewAddressStreet(e.target.value)} />
          </div>
          <input
            className={inputUi}
            placeholder="Adres detay (opsiyonel)"
            value={newAddressDetails}
            onChange={(e) => setNewAddressDetails(e.target.value)}
          />
          <p className={`text-sm ${textMuted}`}>
            Menü: her satır bir ürün; fiyat için <code className={codeChip}>ürün | fiyat</code> (örn. Latte | 45).
          </p>
          <textarea
            className={textareaUi}
            rows={4}
            value={newMenuText}
            onChange={(e) => setNewMenuText(e.target.value)}
            placeholder={"Latte | 45\nCheesecake | 120"}
          />
          <div className="space-y-2">
            <label className={labelUi}>Haritadan konum seç</label>
            <p className={`text-xs ${textMuted}`}>
              Haritaya tıklayarak mekan konumunu belirleyin. Kullanıcılar detay sayfasında Google Haritalar ile açabilir.
            </p>
            <div className="h-64 overflow-hidden rounded-xl border border-rose-100/80">
              <MapContainer
                center={[newLocation.lat, newLocation.lng]}
                zoom={13}
                scrollWheelZoom
                className="h-full w-full"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <CreateVenueMapPicker position={newLocation} onPick={handleNewLocationPick} />
              </MapContainer>
            </div>
            <p className="text-xs text-stone-500">
              Seçilen konum: {newLocation.lat.toFixed(6)}, {newLocation.lng.toFixed(6)}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={fillNewAddressFromLocation}
                disabled={busy === "reverse-geocode-new"}
                className={btnPrimary}
              >
                {busy === "reverse-geocode-new" ? "Dolduruluyor…" : "Konumdan adresi doldur"}
              </button>
              <button
                type="button"
                onClick={locateNewFromAddress}
                disabled={busy === "forward-geocode-new"}
                className={btnPrimary}
              >
                {busy === "forward-geocode-new" ? "Bulunuyor…" : "Adresi haritada bul"}
              </button>
            </div>
          </div>
          <div className="grid gap-3 rounded-xl border border-rose-100/80 bg-white p-4">
            {WEEK_DAYS.map((day) => (
              <label key={`new-${day}`} className="grid items-center gap-2 sm:grid-cols-[120px_1fr_1fr]">
                <span className="text-sm font-medium text-stone-700">{day}</span>
                <input
                  type="time"
                  className={inputUi}
                  value={newHoursByDay[day]?.open ?? ""}
                  onChange={(e) =>
                    setNewHoursByDay((prev) => ({
                      ...prev,
                      [day]: { ...(prev[day] ?? { open: "", close: "" }), open: e.target.value },
                    }))
                  }
                />
                <input
                  type="time"
                  className={inputUi}
                  value={newHoursByDay[day]?.close ?? ""}
                  onChange={(e) =>
                    setNewHoursByDay((prev) => ({
                      ...prev,
                      [day]: { ...(prev[day] ?? { open: "", close: "" }), close: e.target.value },
                    }))
                  }
                />
              </label>
            ))}
            <p className={`text-xs ${textMuted}`}>
              Her gün için açılış ve kapanışı ayrı seçebilirsiniz. Boş günler kapalı kabul edilir.
            </p>
          </div>
          <div>
            <label className={labelUi} htmlFor="new-venue-photo-file">
              Mekan fotoğrafı (opsiyonel)
            </label>
            <input
              id="new-venue-photo-file"
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => handlePhotoChange(e, setNewPhotoDataUrl)}
              className={inputUi}
            />
          </div>
          {newPhotoDataUrl ? (
            <div className="space-y-2">
              <img src={newPhotoDataUrl} alt="Yeni mekan fotoğrafı önizleme" className="max-h-44 rounded-xl border border-rose-100/80 object-cover" />
              <button type="button" onClick={() => setNewPhotoDataUrl("")} className="text-sm font-medium text-rose-700 underline underline-offset-2">
                Fotoğrafı kaldır
              </button>
            </div>
          ) : null}
          <button type="submit" disabled={busy === "create"} className={btnPrimary}>
            {busy === "create" ? "Ekleniyor…" : "Mekan ekle"}
          </button>
          </form>
        ) : (
          <p className={`mt-4 ${textMuted}`}>
            Formu açmak için <strong className="text-stone-700">Yeni mekan ekle</strong> butonuna basın.
          </p>
        )}
      </section>

      <section className={card}>
        <label htmlFor="admin-venue" className={labelUi}>
          Mekan
        </label>
        <select id="admin-venue" className={`${selectUi} mt-2`} value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
          <option value="">Sahibi olduğunuz mekanı seçin…</option>
          {ownedVenues.map((v) => (
            <option key={venueId(v)} value={venueId(v)}>
              {v.name} — {toTurkishCategory(v.category)}
            </option>
          ))}
        </select>
        {ownedVenues.length === 0 ? (
          <p className={`mt-4 ${alertWarn} text-left`}>
            Sahip olduğunuz mekan bulunamadı. Yönetici kaydıyla oluşturulan mekanlar hesabınıza bağlıdır; diğerlerinde{" "}
            <code className={codeChip}>owner</code> olmayabilir ve burada düzenlenemez.
          </p>
        ) : null}
      </section>

      {sectionError ? (
        <p className={alertError} role="alert">
          {sectionError}
        </p>
      ) : null}

      {!selectedId ? (
        <p className={textMuted}>Düzenlemek için bir mekan seçin.</p>
      ) : (
        <div className="space-y-8">
          <section className={card} aria-labelledby="hours-h">
            <h2 id="hours-h" className={headingSection}>
              Çalışma saatleri
            </h2>
            <p className={`mt-2 ${textMuted}`}>Her gün için açılış ve kapanış saatini ayrı ayrı seçin.</p>
            <form className="mt-6 space-y-4" onSubmit={submitHours}>
              <div className="grid gap-3 rounded-xl border border-rose-100/80 bg-white p-4">
                {WEEK_DAYS.map((day) => (
                  <label key={`edit-${day}`} className="grid items-center gap-2 sm:grid-cols-[120px_1fr_1fr]">
                    <span className="text-sm font-medium text-stone-700">{day}</span>
                    <input
                      type="time"
                      className={inputUi}
                      value={hoursByDay[day]?.open ?? ""}
                      onChange={(e) =>
                        setHoursByDay((prev) => ({
                          ...prev,
                          [day]: { ...(prev[day] ?? { open: "", close: "" }), open: e.target.value },
                        }))
                      }
                    />
                    <input
                      type="time"
                      className={inputUi}
                      value={hoursByDay[day]?.close ?? ""}
                      onChange={(e) =>
                        setHoursByDay((prev) => ({
                          ...prev,
                          [day]: { ...(prev[day] ?? { open: "", close: "" }), close: e.target.value },
                        }))
                      }
                    />
                  </label>
                ))}
              </div>
              <button type="submit" disabled={busy === "hours"} className={btnPrimary}>
                {busy === "hours" ? "Kaydediliyor…" : "Çalışma saatlerini güncelle"}
              </button>
            </form>
          </section>

          <section className={card} aria-labelledby="loc-h">
            <h2 id="loc-h" className={headingSection}>
              Adres
            </h2>
            <p className={`mt-2 ${textMuted}`}>İl, ilçe, mahalle, sokak ve detay bilgilerini güncelleyin.</p>
            <form className="mt-6 grid gap-5 sm:grid-cols-2" onSubmit={submitAddress}>
              <div>
                <label htmlFor="admin-city" className={labelUi}>
                  İl
                </label>
                <input
                  id="admin-city"
                  type="text"
                  value={addressCity}
                  onChange={(e) => setAddressCity(e.target.value)}
                  className={inputUi}
                />
              </div>
              <div>
                <label htmlFor="admin-district" className={labelUi}>
                  İlçe
                </label>
                <input
                  id="admin-district"
                  type="text"
                  value={addressDistrict}
                  onChange={(e) => setAddressDistrict(e.target.value)}
                  className={inputUi}
                />
              </div>
              <div>
                <label htmlFor="admin-neighborhood" className={labelUi}>
                  Mahalle
                </label>
                <input
                  id="admin-neighborhood"
                  type="text"
                  value={addressNeighborhood}
                  onChange={(e) => setAddressNeighborhood(e.target.value)}
                  className={inputUi}
                />
              </div>
              <div>
                <label htmlFor="admin-street" className={labelUi}>
                  Sokak
                </label>
                <input
                  id="admin-street"
                  type="text"
                  value={addressStreet}
                  onChange={(e) => setAddressStreet(e.target.value)}
                  className={inputUi}
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="admin-details" className={labelUi}>
                  Adres detay (opsiyonel)
                </label>
                <input
                  id="admin-details"
                  type="text"
                  value={addressDetails}
                  onChange={(e) => setAddressDetails(e.target.value)}
                  className={inputUi}
                />
              </div>
              <div className="sm:col-span-2">
                <button type="submit" disabled={busy === "address"} className={btnPrimary}>
                  {busy === "address" ? "Kaydediliyor…" : "Adresi güncelle"}
                </button>
              </div>
            </form>
          </section>

          <section className={card} aria-labelledby="location-h">
            <h2 id="location-h" className={headingSection}>
              Mekan konumu
            </h2>
            <p className={`mt-2 ${textMuted}`}>
              Haritaya tıklayarak konumu güncelleyin. Bu konum kullanıcı sayfasındaki Google Haritalar bağlantısında kullanılır.
            </p>
            <form className="mt-6 space-y-4" onSubmit={submitLocation}>
              <div className="h-64 overflow-hidden rounded-xl border border-rose-100/80">
                <MapContainer
                  center={
                    locationPoint
                      ? [locationPoint.lat, locationPoint.lng]
                      : [37.7648, 30.5566]
                  }
                  zoom={13}
                  scrollWheelZoom
                  className="h-full w-full"
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <CreateVenueMapPicker
                    position={locationPoint}
                    onPick={handleSelectedLocationPick}
                  />
                </MapContainer>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  className={inputUi}
                  placeholder="Latitude"
                  value={locationLat}
                  onChange={(e) => setLocationLat(e.target.value)}
                />
                <input
                  className={inputUi}
                  placeholder="Longitude"
                  value={locationLng}
                  onChange={(e) => setLocationLng(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={fillAddressFromSelectedLocation}
                  disabled={busy === "reverse-geocode-selected"}
                  className={btnPrimary}
                >
                  {busy === "reverse-geocode-selected" ? "Dolduruluyor…" : "Konumdan adresi doldur"}
                </button>
                <button
                  type="button"
                  onClick={locateSelectedFromAddress}
                  disabled={busy === "forward-geocode-selected"}
                  className={btnPrimary}
                >
                  {busy === "forward-geocode-selected" ? "Bulunuyor…" : "Adresi haritada bul"}
                </button>
              </div>
              <button type="submit" disabled={busy === "location"} className={btnPrimary}>
                {busy === "location" ? "Kaydediliyor…" : "Konumu güncelle"}
              </button>
            </form>
          </section>

          <section className={card} aria-labelledby="menu-h">
            <h2 id="menu-h" className={headingSection}>
              Menü
            </h2>
            <p className={`mt-2 ${textMuted}`}>
              Her satırda bir ürün. İsteğe bağlı fiyat için satır sonunda{" "}
              <strong className="text-stone-700">|</strong> ile ayırın (örn. <code className={codeChip}>Çay | 25</code>
              ).
            </p>
            <form className="mt-6 space-y-4" onSubmit={submitMenu}>
              <textarea
                name="menu"
                rows={8}
                value={menuText}
                onChange={(e) => setMenuText(e.target.value)}
                className={textareaUi}
                placeholder={"Çay | 25\nTürk kahvesi | 40\nSu"}
              />
              <button type="submit" disabled={busy === "menu"} className={btnPrimary}>
                {busy === "menu" ? "Kaydediliyor…" : "Menüyü güncelle"}
              </button>
            </form>
          </section>

          <section className={card} aria-labelledby="announcement-h">
            <h2 id="announcement-h" className={headingSection}>
              Mekan duyuruları
            </h2>
            <p className={`mt-2 ${textMuted}`}>
              Birden fazla duyuru ekleyebilirsiniz. Örn: "17:00-19:00 arası ücretsiz meze vardır."
            </p>
            <form className="mt-6 space-y-4" onSubmit={submitAnnouncement}>
              <textarea
                name="announcement"
                rows={4}
                maxLength={500}
                value={announcementText}
                onChange={(e) => setAnnouncementText(e.target.value)}
                className={textareaUi}
                placeholder="Bugüne özel kampanya duyurusu..."
              />
              <div>
                <label className={labelUi} htmlFor="announcement-photo-file">
                  Gönderi fotoğrafı (opsiyonel)
                </label>
                <input
                  id="announcement-photo-file"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => handlePhotoChange(e, setAnnouncementPhotoDataUrl)}
                  className={inputUi}
                />
              </div>
              {announcementPhotoDataUrl ? (
                <div className="space-y-2">
                  <img
                    src={announcementPhotoDataUrl}
                    alt="Duyuru gönderi fotoğrafı önizleme"
                    className="max-h-44 rounded-xl border border-rose-100/80 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setAnnouncementPhotoDataUrl("")}
                    className="text-sm font-medium text-rose-700 underline underline-offset-2"
                  >
                    Fotoğrafı kaldır
                  </button>
                </div>
              ) : null}
              <button type="submit" disabled={busy === "announcement"} className={btnPrimary}>
                {busy === "announcement" ? "Paylaşılıyor…" : "Duyuru paylaş"}
              </button>
            </form>
            {Array.isArray(selectedVenue?.announcements) && selectedVenue.announcements.length > 0 ? (
              <ul className="mt-6 space-y-3">
                {selectedVenue.announcements.map((a, idx) => (
                  <li key={`${a?.createdAt ?? "a"}-${idx}`} className="rounded-xl border border-amber-100 bg-amber-50/70 px-4 py-3 text-sm text-amber-900">
                    <p>{String(a?.text ?? "").trim()}</p>
                    {a?.createdAt ? (
                      <p className="mt-1 text-xs text-amber-700/80">
                        {new Date(a.createdAt).toLocaleString("tr-TR", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : null}
          </section>

          <section className={card} aria-labelledby="photo-h">
            <h2 id="photo-h" className={headingSection}>
              Mekan fotoğrafı
            </h2>
            <p className={`mt-2 ${textMuted}`}>Galeriden/kameradan dosya seçin. En fazla 5 MB.</p>
            <form className="mt-6 space-y-4" onSubmit={submitPhoto}>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => handlePhotoChange(e, setPhotoDataUrl)}
                className={inputUi}
              />
              <button type="submit" disabled={busy === "photo"} className={btnPrimary}>
                {busy === "photo" ? "Kaydediliyor…" : "Fotoğrafı kaydet"}
              </button>
            </form>
            {photoDataUrl ? (
              <img
                src={photoDataUrl}
                alt="Önizleme"
                className="mt-6 max-h-48 max-w-full rounded-2xl border border-rose-100/80 object-cover shadow-md shadow-rose-100/30"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : null}
          </section>

          <p className={`text-sm ${textMuted}`}>
            <Link to={appRoutes.venueDetail.replace(":id", selectedId)} className={linkAccent}>
              Herkese açık mekan sayfasını görüntüle
            </Link>
          </p>
          <section className={card} aria-labelledby="delete-venue-h">
            <h2 id="delete-venue-h" className={headingSection}>
              Mekanı sil
            </h2>
            <p className={`mt-2 ${textMuted}`}>
              Bu işlem geri alınamaz. Mekana ait puanlar, yorumlar ve favoriler de kaldırılır.
            </p>
            <button
              type="button"
              onClick={deleteVenue}
              disabled={busy === "delete"}
              className={`${btnPrimary} mt-6 bg-gradient-to-r from-rose-400 to-red-500 shadow-rose-300/30`}
            >
              {busy === "delete" ? "Siliniyor…" : "Mekanımı sil"}
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
