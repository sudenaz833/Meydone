import { useCallback, useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import api from "../services/api";
import { notifyAuthChanged } from "../utils/auth";
import { toTurkishCategory } from "../utils/category";
import { AUTH_TOKEN_KEY } from "../utils/constants";
import { appRoutes } from "../utils/routes";
import {
  alertError,
  alertSuccess,
  alertWarn,
  btnDangerOutline,
  btnPrimary,
  card,
  codeChip,
  dangerZone,
  headingPage,
  headingSection,
  innerWell,
  inputUi,
  labelCaps,
  labelUi,
  linkAccent,
  pillCategory,
  textMuted,
  textSmall,
} from "../utils/ui";

function venueRefId(venue) {
  if (!venue) return "";
  return String(venue._id ?? venue);
}

function formatDate(value) {
  if (value == null) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("tr-TR", { dateStyle: "long" });
}

export default function ProfilePage() {
  const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [posts, setPosts] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [removingId, setRemovingId] = useState(null);

  const [formName, setFormName] = useState("");
  const [formSurname, setFormSurname] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formProfilePhoto, setFormProfilePhoto] = useState("");
  const [formProfileVisibility, setFormProfileVisibility] = useState("public");
  const [formCommentVisibility, setFormCommentVisibility] = useState("friends_only");
  const [formLocationVisibility, setFormLocationVisibility] = useState("friends_only");
  const [formCurrentPassword, setFormCurrentPassword] = useState("");
  const [formNewPassword, setFormNewPassword] = useState("");
  const [deleteEmailConfirm, setDeleteEmailConfirm] = useState("");
  const [saveStatus, setSaveStatus] = useState("idle");
  const [saveError, setSaveError] = useState("");
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [postText, setPostText] = useState("");
  const [postPhotoDataUrl, setPostPhotoDataUrl] = useState("");
  const [postBusy, setPostBusy] = useState(false);
  const [postError, setPostError] = useState("");
  const [postDeleteBusyId, setPostDeleteBusyId] = useState(null);
  const [sharePostWithLocation, setSharePostWithLocation] = useState(true);
  const [locationBusy, setLocationBusy] = useState(false);
  const [locationMsg, setLocationMsg] = useState("");

  const loadData = useCallback(async () => {
    if (!localStorage.getItem(AUTH_TOKEN_KEY)) {
      setStatus("guest");
      return;
    }
    setStatus("loading");
    setError("");
    try {
      const [meRes, favRes, postsRes] = await Promise.all([
        api.get("/auth/me"),
        api.get("/favorites"),
        api.get("/posts/me"),
      ]);
      const u = meRes.data?.data?.user ?? null;
      setUser(u);
      if (u) {
        setFormName(u.name ?? "");
        setFormSurname(u.surname ?? "");
        setFormPhone(u.phone ?? "");
        setFormProfilePhoto(u.profilePhoto ?? "");
        setFormProfileVisibility(String(u.profileVisibility ?? "public"));
        setFormCommentVisibility(String(u.commentVisibility ?? "friends_only"));
        setFormLocationVisibility(String(u.locationVisibility ?? "friends_only"));
      }
      const items = favRes.data?.data?.items;
      setFavorites(Array.isArray(items) ? items : []);
      const postItems = postsRes.data?.data?.items;
      setPosts(Array.isArray(postItems) ? postItems : []);
      setStatus("ok");
    } catch (err) {
      setError(err.apiMessage || err.message || "Profil yüklenemedi");
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleUpdateProfile(e) {
    e.preventDefault();
    setSaveError("");
    setSaveStatus("saving");
    try {
      const payload = {
        name: formName.trim(),
        surname: formSurname.trim(),
        profileVisibility: formProfileVisibility,
        commentVisibility: formCommentVisibility,
        locationVisibility: formLocationVisibility,
      };

      const phoneTrim = formPhone.trim();
      if (phoneTrim) {
        payload.phone = phoneTrim;
      }

      const photoTrim = formProfilePhoto.trim();
      const currentPhoto = String(user?.profilePhoto ?? "").trim();
      if (photoTrim !== currentPhoto) {
        payload.profilePhoto = photoTrim;
      }

      const newPw = formNewPassword.trim();
      if (newPw) {
        payload.password = newPw;
        payload.currentPassword = formCurrentPassword;
      }

      const { data } = await api.put("/users/profile", payload);
      const updated = data?.data?.user;
      if (updated) {
        setUser(updated);
        setFormName(updated.name ?? "");
        setFormSurname(updated.surname ?? "");
        setFormPhone(updated.phone ?? "");
        setFormProfilePhoto(updated.profilePhoto ?? "");
        setFormProfileVisibility(String(updated.profileVisibility ?? "public"));
        setFormCommentVisibility(String(updated.commentVisibility ?? "friends_only"));
        setFormLocationVisibility(String(updated.locationVisibility ?? "friends_only"));
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("profile-updated", { detail: updated }));
        }
      }
      setFormCurrentPassword("");
      setFormNewPassword("");
      setSaveStatus("saved");
      window.setTimeout(() => setSaveStatus("idle"), 2500);
    } catch (err) {
      setSaveError(err.apiMessage || err.message || "Profil güncellenemedi");
      setSaveStatus("idle");
    }
  }

  function handleUpdateMyLocation() {
    setLocationMsg("");
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocationMsg("Tarayıcınız konum paylaşımını desteklemiyor.");
      return;
    }
    setLocationBusy(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { data } = await api.put("/users/location", {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
          const updated = data?.data?.user;
          if (updated) {
            setUser(updated);
          }
          setLocationMsg("Konum güncellendi.");
          window.setTimeout(() => setLocationMsg(""), 4000);
        } catch (err) {
          setLocationMsg(err.apiMessage || err.message || "Konum kaydedilemedi");
        } finally {
          setLocationBusy(false);
        }
      },
      (geoErr) => {
        setLocationBusy(false);
        setLocationMsg(
          geoErr?.message === "User denied Geolocation"
            ? "Konum izni reddedildi."
            : geoErr?.message || "Konum alınamadı.",
        );
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 60000 },
    );
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

  async function handleProfilePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSaveError("");
    if (!file.type.startsWith("image/")) {
      setSaveError("Lütfen sadece görsel dosyası seçin.");
      e.target.value = "";
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setSaveError("Profil fotoğrafı en fazla 5 MB olabilir.");
      e.target.value = "";
      return;
    }
    try {
      const compressed = await resizeImageToDataUrl(file);
      setFormProfilePhoto(compressed);
    } catch (err) {
      setSaveError(err.message || "Profil fotoğrafı işlenemedi.");
    } finally {
      e.target.value = "";
    }
  }

  async function handlePostPhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPostError("");
    if (!file.type.startsWith("image/")) {
      setPostError("Lütfen sadece görsel dosyası seçin.");
      e.target.value = "";
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setPostError("Paylaşım fotoğrafı en fazla 5 MB olabilir.");
      e.target.value = "";
      return;
    }
    try {
      const compressed = await resizeImageToDataUrl(file);
      setPostPhotoDataUrl(compressed);
    } catch (err) {
      setPostError(err.message || "Paylaşım fotoğrafı işlenemedi.");
    } finally {
      e.target.value = "";
    }
  }

  async function createPost(e) {
    e.preventDefault();
    setPostError("");
    const text = postText.trim();
    if (!text) {
      setPostError("Paylaşım metni boş olamaz.");
      return;
    }
    setPostBusy(true);
    try {
      let lat;
      let lng;
      if (sharePostWithLocation) {
        if (typeof navigator === "undefined" || !navigator.geolocation) {
          setPostError("Konum bu tarayıcıda desteklenmiyor; kutuyu kaldırıp konumsuz paylaşın.");
          return;
        }
        try {
          const pos = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 20000,
              maximumAge: 0,
            });
          });
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
        } catch {
          setPostError(
            "Konum izni verilmedi veya alınamadı. Tarayıcıda konuma izin verin ya da “konumu ekle” seçeneğini kapatıp tekrar deneyin.",
          );
          return;
        }
      }

      const payload = {
        text,
        photoUrl: postPhotoDataUrl || undefined,
      };
      if (lat != null && lng != null) {
        payload.lat = lat;
        payload.lng = lng;
      }

      const { data } = await api.post("/posts", payload);
      const created = data?.data?.post;
      if (created) {
        setPosts((prev) => [created, ...prev]);
      } else {
        await loadData();
      }
      setPostText("");
      setPostPhotoDataUrl("");
    } catch (err) {
      setPostError(err.apiMessage || err.message || "Paylaşım gönderilemedi");
    } finally {
      setPostBusy(false);
    }
  }

  async function deletePost(postId) {
    const ok = window.confirm(
      "Bu paylaşımı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.",
    );
    if (!ok) return;

    setPostError("");
    setPostDeleteBusyId(postId);
    try {
      await api.delete(`/posts/${postId}`);
      setPosts((prev) => prev.filter((p) => String(p?._id) !== String(postId)));
    } catch (err) {
      setPostError(err.apiMessage || err.message || "Paylaşım silinemedi");
    } finally {
      setPostDeleteBusyId(null);
    }
  }

  async function handleDeleteAccount() {
    const ok = window.confirm(
      "Hesabınızı kalıcı olarak silmek istiyor musunuz? Bu işlem geri alınamaz. Yorumlarınız, puanlarınız, favorileriniz ve arkadaşlıklarınız kaldırılır.",
    );
    if (!ok) return;

    const typedEmail = deleteEmailConfirm.trim().toLowerCase();
    const accountEmail = String(user?.email ?? "").trim().toLowerCase();
    if (!typedEmail) {
      setError("Hesabinizi silmek icin e-posta dogrulamasi gerekli.");
      return;
    }
    if (typedEmail !== accountEmail) {
      setError("Girdiginiz e-posta hesaptaki e-posta ile eslesmiyor.");
      return;
    }

    setDeleteBusy(true);
    setError("");
    try {
      await api.delete("/users/account", {
        data: { email: deleteEmailConfirm.trim() },
      });
      localStorage.removeItem(AUTH_TOKEN_KEY);
      notifyAuthChanged();
      navigate(appRoutes.home, { replace: true });
    } catch (err) {
      setError(err.apiMessage || err.message || "Hesap silinemedi");
    } finally {
      setDeleteBusy(false);
    }
  }

  async function removeFavorite(venueId) {
    setRemovingId(venueId);
    try {
      await api.delete(`/favorites/${venueId}`);
      setFavorites((prev) => prev.filter((f) => venueRefId(f.venue) !== String(venueId)));
    } catch (err) {
      setError(err.apiMessage || err.message || "Favori kaldırılamadı");
    } finally {
      setRemovingId(null);
    }
  }

  if (status === "guest") {
    return (
      <section className={card}>
        <h1 className={headingPage}>Profil</h1>
        <p className={`mt-3 ${textMuted}`}>
          <Link to={appRoutes.login} className={linkAccent}>
            Giriş yapın
          </Link>{" "}
          — hesabınızı ve favori mekanlarınızı görün.
        </p>
      </section>
    );
  }

  if (status === "loading") {
    return <p className={textMuted}>Profil yükleniyor…</p>;
  }

  if (status === "error" && !user) {
    return (
      <p className={alertError} role="alert">
        {error}
      </p>
    );
  }

  if (user?.role === "owner" || user?.role === "admin") {
    return <Navigate to={appRoutes.admin} replace />;
  }

  return (
    <div className="space-y-8">
      <section className={card}>
        <h1 className={headingPage}>Profil</h1>
        <p className={`mt-2 ${textMuted}`}>Hesap bilgileriniz (bazı alanlar salt okunur).</p>
        <div className="mt-6 flex items-center gap-3">
          {user?.profilePhoto ? (
            <img
              src={user.profilePhoto}
              alt="Profil fotoğrafı"
              className="h-16 w-16 rounded-full border border-rose-100/80 object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-rose-100/80 bg-violet-50 text-lg font-semibold text-violet-700">
              {(user?.name || user?.username || "?").slice(0, 1).toUpperCase()}
            </div>
          )}
          <p className={textMuted}>Profil fotoğrafınız</p>
        </div>

        <dl className="mt-8 grid gap-5 sm:grid-cols-2">
          <div>
            <dt className={labelCaps}>E-posta</dt>
            <dd className="mt-1 text-stone-800">{user?.email ?? "—"}</dd>
          </div>
          <div>
            <dt className={labelCaps}>Kullanıcı adı</dt>
            <dd className="mt-1 text-stone-800">{user?.username ?? "—"}</dd>
          </div>
          <div>
            <dt className={labelCaps}>Soyad</dt>
            <dd className="mt-1 text-stone-800">{user?.surname ?? "—"}</dd>
          </div>
          <div>
            <dt className={labelCaps}>Doğum tarihi</dt>
            <dd className="mt-1 text-stone-800">{formatDate(user?.birthDate)}</dd>
          </div>
          <div>
            <dt className={labelCaps}>Profil görünürlüğü</dt>
            <dd className="mt-1 text-stone-800">{user?.profileVisibility ?? "—"}</dd>
          </div>
          <div>
            <dt className={labelCaps}>Yorum görünürlüğü</dt>
            <dd className="mt-1 text-stone-800">{user?.commentVisibility ?? "—"}</dd>
          </div>
          <div>
            <dt className={labelCaps}>Konum görünürlüğü</dt>
            <dd className="mt-1 text-stone-800">{user?.locationVisibility ?? "—"}</dd>
          </div>
          <div>
            <dt className={labelCaps}>Rol</dt>
            <dd className="mt-1 text-stone-800">{user?.role ?? "—"}</dd>
          </div>
        </dl>
      </section>

      <section className={card} aria-labelledby="edit-heading">
        <h2 id="edit-heading" className={headingSection}>
          Profili güncelle
        </h2>

        <form className="mt-8 space-y-5" onSubmit={handleUpdateProfile}>
          <div>
            <label htmlFor="profile-name" className={labelUi}>
              Ad
            </label>
            <input
              id="profile-name"
              name="name"
              type="text"
              required
              maxLength={100}
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className={inputUi}
            />
          </div>
          <div>
            <label htmlFor="profile-surname" className={labelUi}>
              Soyad
            </label>
            <input
              id="profile-surname"
              name="surname"
              type="text"
              required
              maxLength={100}
              value={formSurname}
              onChange={(e) => setFormSurname(e.target.value)}
              className={inputUi}
            />
          </div>
          <div>
            <label htmlFor="profile-phone" className={labelUi}>
              Telefon <span className="font-normal text-stone-500">(isteğe bağlı, 7–15 rakam)</span>
            </label>
            <input
              id="profile-phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              placeholder="+905551234567"
              value={formPhone}
              onChange={(e) => setFormPhone(e.target.value)}
              className={inputUi}
            />
          </div>
          <div>
            <label htmlFor="profile-visibility" className={labelUi}>
              Profilimi kimler görebilsin?
            </label>
            <select
              id="profile-visibility"
              value={formProfileVisibility}
              onChange={(e) => setFormProfileVisibility(e.target.value)}
              className={inputUi}
            >
              <option value="public">Herkes</option>
              <option value="friends_only">Sadece arkadaşlar</option>
              <option value="private">Hiç kimse</option>
            </select>
          </div>
          <div>
            <label htmlFor="comment-visibility" className={labelUi}>
              Yorumlarımı kimler görebilsin?
            </label>
            <select
              id="comment-visibility"
              value={formCommentVisibility}
              onChange={(e) => setFormCommentVisibility(e.target.value)}
              className={inputUi}
            >
              <option value="public">Herkes</option>
              <option value="friends_only">Sadece arkadaşlar</option>
              <option value="private">Hiç kimse</option>
            </select>
          </div>
          <div>
            <label htmlFor="location-visibility" className={labelUi}>
              Son kaydettiğim konumu kimler görebilsin?
            </label>
            <select
              id="location-visibility"
              value={formLocationVisibility}
              onChange={(e) => setFormLocationVisibility(e.target.value)}
              className={inputUi}
            >
              <option value="public">Herkes</option>
              <option value="friends_only">Sadece arkadaşlar</option>
              <option value="private">Hiç kimse</option>
            </select>
            <p className={`mt-2 ${textSmall}`}>
              Arkadaş profilinde konum yalnızca karşılıklı arkadaşlıkta gösterilir; gizli seçilirse arkadaşlar da görmez.
            </p>
          </div>
          <div>
            <label htmlFor="profile-photo-file" className={labelUi}>
              Profil fotoğrafı
            </label>
            <input
              id="profile-photo-file"
              type="file"
              accept="image/*"
              capture="user"
              onChange={handleProfilePhotoChange}
              className={inputUi}
            />
            {formProfilePhoto ? (
              <div className="mt-3 space-y-2">
                <img
                  src={formProfilePhoto}
                  alt="Profil fotoğrafı önizleme"
                  className="h-16 w-16 rounded-full border border-rose-100/80 object-cover"
                />
                <button
                  type="button"
                  onClick={() => setFormProfilePhoto("")}
                  className="text-sm font-medium text-rose-700 underline underline-offset-2"
                >
                  Fotoğrafı kaldır
                </button>
              </div>
            ) : null}
          </div>

          <div className={innerWell}>
            <p className="text-sm font-semibold text-stone-800">Şifre değiştir</p>
            <p className={`mt-1 ${textSmall}`}>Boş bırakırsanız mevcut şifre korunur.</p>
            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="profile-current-password" className={labelUi}>
                  Mevcut şifre
                </label>
                <input
                  id="profile-current-password"
                  name="currentPassword"
                  type="password"
                  autoComplete="current-password"
                  value={formCurrentPassword}
                  onChange={(e) => setFormCurrentPassword(e.target.value)}
                  className={inputUi}
                />
              </div>
              <div>
                <label htmlFor="profile-new-password" className={labelUi}>
                  Yeni şifre <span className="text-stone-500">(en az 8 karakter)</span>
                </label>
                <input
                  id="profile-new-password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  value={formNewPassword}
                  onChange={(e) => setFormNewPassword(e.target.value)}
                  className={inputUi}
                />
              </div>
            </div>
          </div>

          {saveError ? (
            <p className="rounded-2xl border border-rose-100 bg-rose-50/90 px-4 py-3 text-sm text-rose-800" role="alert">
              {saveError}
            </p>
          ) : null}
          {saveStatus === "saved" ? (
            <p className={alertSuccess} role="status">
              Profil kaydedildi.
            </p>
          ) : null}

          <button type="submit" disabled={saveStatus === "saving"} className={btnPrimary}>
            {saveStatus === "saving" ? "Kaydediliyor…" : "Değişiklikleri kaydet"}
          </button>
        </form>
      </section>

      <section className={card} aria-labelledby="share-location-heading">
        <h2 id="share-location-heading" className={headingSection}>
          Konum paylaşımı
        </h2>
        <p className={`mt-2 ${textMuted}`}>
          Son konumunuz, yukarıdaki “konum görünürlüğü” ayarına göre yalnızca arkadaşlarınıza gösterilir.
        </p>
        <p className={`mt-4 ${textSmall}`}>
          Son güncelleme:{" "}
          {user?.lastLocationAt
            ? new Date(user.lastLocationAt).toLocaleString("tr-TR", {
                dateStyle: "medium",
                timeStyle: "short",
              })
            : "—"}
        </p>
        <button type="button" disabled={locationBusy} onClick={handleUpdateMyLocation} className={`mt-4 ${btnPrimary}`}>
          {locationBusy ? "Konum alınıyor…" : "Konumumu güncelle"}
        </button>
        {locationMsg ? (
          <p
            className={`mt-3 text-sm ${locationMsg === "Konum güncellendi." ? alertSuccess : alertError}`}
            role={locationMsg === "Konum güncellendi." ? "status" : "alert"}
          >
            {locationMsg}
          </p>
        ) : null}
      </section>

      <section className={card} aria-labelledby="favorites-heading">
        <h2 id="favorites-heading" className={headingSection}>
          Favori mekanlar
        </h2>
        <p className={`mt-2 ${textMuted}`}>Kaydettiğiniz yerler. Kaldırmak için sil düğmesine basın.</p>

        {favorites.length === 0 ? (
          <p className={`mt-8 ${textMuted}`}>Henüz favori yok. Anasayfa veya mekan sayfasından ekleyin.</p>
        ) : (
          <ul className="mt-8 divide-y divide-rose-100/50">
            {favorites.map((f) => {
              const v = f.venue;
              const vid = venueRefId(v);
              if (!vid) return null;
              const name = v?.name ?? "Mekan";
              const category = toTurkishCategory(v?.category ?? "");
              const rating =
                typeof v?.rating === "number" && !Number.isNaN(v.rating) ? v.rating.toFixed(1) : null;

              return (
                <li key={f._id ?? vid} className="flex flex-wrap items-center justify-between gap-4 py-5 first:pt-0">
                  <div className="min-w-0">
                    <Link
                      to={appRoutes.venueDetail.replace(":id", vid)}
                      className="text-lg font-semibold text-violet-800 transition hover:text-rose-500"
                    >
                      {name}
                    </Link>
                    {category ? (
                      <p className="mt-1">
                        <span className={pillCategory}>{category}</span>
                      </p>
                    ) : null}
                    {rating != null ? (
                      <p className="mt-2 text-sm font-medium text-amber-600">★ {rating}</p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    disabled={removingId === vid}
                    onClick={() => removeFavorite(vid)}
                    className={btnDangerOutline}
                  >
                    {removingId === vid ? "Kaldırılıyor…" : "Kaldır"}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className={card} aria-labelledby="posts-heading">
        <h2 id="posts-heading" className={headingSection}>
          Paylaşımlarım
        </h2>
        <p className={`mt-2 ${textMuted}`}>Profilinde gözükecek paylaşım metni ve istersen fotoğraf ekle.</p>
        <form className="mt-6 space-y-4" onSubmit={createPost}>
          <div>
            <label htmlFor="post-text" className={labelUi}>
              Ne paylaşmak istiyorsun?
            </label>
            <textarea
              id="post-text"
              rows={4}
              maxLength={1000}
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
              className={inputUi}
              placeholder="Bugün yeni bir mekan denedim..."
            />
          </div>
          <div>
            <label htmlFor="post-photo-file" className={labelUi}>
              Fotoğraf (opsiyonel)
            </label>
            <input
              id="post-photo-file"
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePostPhotoChange}
              className={inputUi}
            />
            {postPhotoDataUrl ? (
              <div className="mt-3 space-y-2">
                <img
                  src={postPhotoDataUrl}
                  alt="Paylaşım fotoğrafı önizleme"
                  className="max-h-52 rounded-xl border border-rose-100/80 object-cover"
                />
                <button
                  type="button"
                  onClick={() => setPostPhotoDataUrl("")}
                  className="text-sm font-medium text-rose-700 underline underline-offset-2"
                >
                  Fotoğrafı kaldır
                </button>
              </div>
            ) : null}
          </div>
          <div className="flex items-start gap-3 rounded-2xl border border-rose-100/80 bg-stone-50/80 px-4 py-3">
            <input
              id="post-share-location"
              type="checkbox"
              checked={sharePostWithLocation}
              onChange={(e) => setSharePostWithLocation(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-rose-200 text-violet-600 focus:ring-violet-500"
            />
            <label htmlFor="post-share-location" className="cursor-pointer text-sm font-medium text-stone-800">
              Bu paylaşımda konumumu ekle
              <span className={`mt-1 block font-normal text-stone-500 ${textSmall}`}>
                Paylaş dediğinizde tarayıcı konum izni ister. Konum yalnızca arkadaşlarınıza gösterilir.
              </span>
            </label>
          </div>
          {postError ? (
            <p className="rounded-2xl border border-rose-100 bg-rose-50/90 px-4 py-3 text-sm text-rose-800" role="alert">
              {postError}
            </p>
          ) : null}
          <button type="submit" disabled={postBusy} className={btnPrimary}>
            {postBusy ? "Paylaşılıyor…" : "Paylaş"}
          </button>
        </form>

        {posts.length === 0 ? (
          <p className={`mt-8 ${textMuted}`}>Henüz paylaşım yok.</p>
        ) : (
          <ul className="mt-8 divide-y divide-rose-100/50">
            {posts.map((post) => {
              const pid = String(post?._id ?? "");
              return (
                <li key={pid} className="py-5 first:pt-0">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-stone-800">{post?.text ?? ""}</p>
                  {post?.photoUrl ? (
                    <img
                      src={post.photoUrl}
                      alt="Paylaşım görseli"
                      className="mt-3 max-h-96 max-w-md rounded-xl border border-rose-100/80 object-cover"
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
                        Paylaşım konumu (harita)
                      </a>
                    </p>
                  ) : null}
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <p className={`text-xs ${textSmall}`}>
                      {post?.createdAt
                        ? new Date(post.createdAt).toLocaleString("tr-TR", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })
                        : ""}
                    </p>
                    <button
                      type="button"
                      onClick={() => deletePost(pid)}
                      disabled={postDeleteBusyId === pid}
                      className={btnDangerOutline}
                    >
                      {postDeleteBusyId === pid ? "Siliniyor…" : "Sil"}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className={dangerZone} aria-labelledby="danger-heading">
        <h2 id="danger-heading" className="text-lg font-semibold text-rose-900">
          Hesabı sil
        </h2>
        <p className="mt-3 text-sm text-rose-800/90">
          Hesabinizi ve iliskili verileri kalici olarak silin. Islem icin e-posta dogrulamasi zorunludur.
        </p>
        <div className="mt-4">
          <label htmlFor="delete-email-confirm" className={labelUi}>
            E-posta dogrulamasi
          </label>
          <input
            id="delete-email-confirm"
            type="email"
            value={deleteEmailConfirm}
            onChange={(e) => setDeleteEmailConfirm(e.target.value)}
            className={inputUi}
            placeholder="Hesap e-postanizi yazin"
          />
        </div>
        <button
          type="button"
          disabled={deleteBusy}
          onClick={handleDeleteAccount}
          className={`${btnDangerOutline} mt-6 border-rose-300 bg-white/90 font-semibold text-rose-900 hover:bg-rose-100`}
        >
          {deleteBusy ? "Siliniyor…" : "Hesabımı sil"}
        </button>
      </section>

      {error ? (
        <p className={alertWarn} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
