import { useEffect, useRef, useState, useCallback } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";
import { SEARCH_CATEGORY_OPTIONS } from "../utils/category";
import { AUTH_TOKEN_KEY } from "../utils/constants";
import { appRoutes } from "../utils/routes";
import { IoChevronBack, IoNotificationsOutline, IoSearchOutline } from 'react-icons/io5';

export default function AppHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const notifWrapRef = useRef(null);

  // Kullanıcının giriş yapıp yapmadığını kontrol ediyoruz
  const loggedIn = typeof window !== "undefined" && !!localStorage.getItem(AUTH_TOKEN_KEY);
  
  // Ekranda gösterilecek bildirimlerin state'i
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchDraft, setSearchDraft] = useState(searchParams.get("q") ?? "");

  // Ana sayfa, giriş ve kayıt sayfalarında geri butonunu gizle
  const hideBackButton = ['/', '/login', '/register'].includes(location.pathname);

  // 1. Backend'den Sadece Yorum Beğeni Bildirimlerini Çeken Fonksiyon
  const fetchLikeNotifications = useCallback(async () => {
    if (!loggedIn) return;
    try {
      // Backend bildirim endpoint'ine istek atıyoruz
      const response = await api.get("/notifications");
      const resData = response.data;
      
      // Gelen verinin array (liste) olduğundan emin oluyoruz
      const items = resData?.items || resData?.data?.items || resData?.data || (Array.isArray(resData) ? resData : []);
      
      // Gelen bildirimleri arayüze uygun formatlıyoruz
      const formattedNotifications = items.map(item => ({
        id: item._id || item.id,
        senderName: item.sender?.username || item.username || "Bir kullanıcı",
        text: "yorumunu beğendi.", // Doğrudan senin istediğin metin
        createdAt: item.createdAt || new Date()
      }));

      // En yeni bildirimi en üstte göstermek için tarihe göre sıralıyoruz
      formattedNotifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      setNotifications(formattedNotifications);
    } catch (err) {
      console.error("Bildirimler yüklenirken hata oluştu:", err);
    }
  }, [loggedIn]);

  // 2. Sayfa Yüklendiğinde Çalışır ve Her 10 Saniyede Bir Yeni Beğeni Var mı diye Arkada Kontrol Eder (Polling)
  useEffect(() => {
    if (loggedIn) {
      fetchLikeNotifications();
      const interval = setInterval(() => {
        fetchLikeNotifications();
      }, 10000); // 10 saniye
      return () => clearInterval(interval);
    }
  }, [loggedIn, fetchLikeNotifications]);

  // 3. Çan Menüsü Açıkken Ekranda Başka Bir Yere Tıklanırsa Menüyü Kapatır
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifWrapRef.current && !notifWrapRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const onSearchSubmit = (e) => {
    e.preventDefault();
    if (!loggedIn) { navigate(appRoutes.login); return; }
    const trimmed = searchDraft.trim();
    navigate({ pathname: appRoutes.venues, search: trimmed ? `?q=${trimmed}` : "" });
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-100 pt-[env(safe-area-inset-top)]">
      {/* Üst Logo ve Çan Alanı */}
      <div className="flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2">
          {!hideBackButton && (
            <button 
              onClick={() => navigate(-1)} 
              className="p-2 -ml-2 rounded-full active:bg-rose-50 text-rose-500"
            >
              <IoChevronBack size={24} />
            </button>
          )}
          <Link to={appRoutes.home} className="text-xl font-bold bg-gradient-to-r from-violet-600 to-rose-500 bg-clip-text text-transparent">
            Meydone
          </Link>
        </div>

        {/* Sağ Taraf: Çan ve Profil Simge Alanı */}
        <div className="flex items-center gap-3">
          {loggedIn && (
            <div className="relative" ref={notifWrapRef}>
              {/* ÇAN BUTONU */}
              <button 
                onClick={() => setShowNotifications(!showNotifications)} 
                className="relative flex items-center justify-center p-2 text-slate-600 rounded-full hover:bg-slate-50 active:scale-95 transition-all outline-none"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <IoNotificationsOutline size={26} />
                
                {/* KIRMIZI BALON / SAYAÇ: Yeni bildirim varsa burada kırmızı renkte sayısı yazar */}
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white ring-2 ring-white shadow-sm animate-pulse">
                    {notifications.length}
                  </span>
                )}
              </button>

              {/* ÇANA TIKLAYINCA AÇILAN PANEL (DROPDOWN) */}
              {showNotifications && (
                <div className="absolute top-12 right-0 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 max-h-96 overflow-y-auto">
                  <div className="px-4 py-2 border-b border-slate-50 font-bold text-sm text-slate-800 flex justify-between items-center">
                    <span>Bildirimler</span>
                    <span className="text-xs bg-rose-50 text-rose-500 px-2 py-0.5 rounded-full">{notifications.length} Yeni</span>
                  </div>
                  
                  {notifications.length === 0 ? (
                    <div className="px-4 py-6 text-center text-xs text-slate-400">
                      Henüz yeni bir bildiriminiz yok.
                    </div>
                  ) : (
                    <ul className="divide-y divide-slate-50">
                      {notifications.map((notif) => (
                        <li key={notif.id} className="px-4 py-3 hover:bg-slate-50 transition flex flex-col gap-0.5">
                          <div className="text-xs text-slate-700 leading-relaxed">
                            {/* İstediğin çıktı formatı: @kullaniciadi yorumunu beğendi. */}
                            <span className="font-bold text-slate-900">@{notif.senderName}</span> {notif.text}
                          </div>
                          <span className="text-[9px] text-slate-400">
                            {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Profil İkonu */}
          <Link to={appRoutes.profile} className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-700 font-bold text-sm overflow-hidden">
             S
          </Link>
        </div>
      </div>

      {/* Alt Kısım: Arama Barı */}
      <div className="px-4 pb-3">
        <form onSubmit={onSearchSubmit} className="relative flex items-center gap-2">
          <div className="relative flex-grow">
            <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="search"
              placeholder="Mekan veya menü ara..."
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              className="w-full bg-slate-100 border-none rounded-xl py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-rose-200 outline-none"
            />
          </div>
          
          <select 
            onChange={(e) => navigate(`${appRoutes.venues}?cat=${e.target.value}`)}
            className="bg-slate-100 border-none rounded-xl py-2 px-2 text-xs font-medium text-slate-600 outline-none"
          >
            <option value="">Filtre</option>
            {SEARCH_CATEGORY_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </form>
      </div>
    </header>
  );
}