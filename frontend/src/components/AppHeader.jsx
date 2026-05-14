import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";
import { normalizeCategoryKey, SEARCH_CATEGORY_OPTIONS, toTurkishCategory } from "../utils/category";
import { notifyAuthChanged } from "../utils/auth";
import { AUTH_TOKEN_KEY } from "../utils/constants";
import { formatTryPrice, menuItemName, menuItemPrice } from "../utils/venueMenu";
import { appRoutes } from "../utils/routes";
import { IoChevronBack, IoNotificationsOutline, IoSearchOutline, IoCheckmarkCircle, IoCloseCircle } from 'react-icons/io5';

export default function AppHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchWrapRef = useRef(null);
  const notifWrapRef = useRef(null);

  const loggedIn = typeof window !== "undefined" && !!localStorage.getItem(AUTH_TOKEN_KEY);
  const [user, setUser] = useState(null);
  const [allVenues, setAllVenues] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchDraft, setSearchDraft] = useState(searchParams.get("q") ?? "");

  // --- BİLDİRİM STATE'LERİ ---
  const [notifications, setNotifications] = useState([]);
  const [liveToast, setLiveToast] = useState(null); // Canlı ekranda beliren bildirim

  const hideBackButton = ['/', '/login', '/register'].includes(location.pathname);

  // 1. Bildirimleri Sunucudan Çekme Fonksiyonu
  const fetchNotifications = useCallback(async () => {
    if (!loggedIn) return;
    try {
      // Backend bildirim endpoint'in hangisiyse ona göre güncelleyebilirsin (örn: /notifications veya /friends/pending)
      const { data } = await api.get("/friends/pending"); 
      const items = data?.data?.items || data?.data || [];
      
      // Gelen verileri bildirim formatına map'liyoruz
      const formattedNotifs = items.map(item => ({
        id: item._id,
        type: "friend_request",
        senderName: item.sender?.username || item.name || "Biri",
        text: "sana arkadaşlık isteği gönderdi.",
        raw: item
      }));
      setNotifications(formattedNotifs);
    } catch (err) {
      console.error("Bildirimler yüklenemedi:", err);
    }
  }, [loggedIn]);

  // 2. Sayfa Açıldığında Verileri Yükle ve Canlı Simülasyon/WebSocket Kur
  useEffect(() => {
    if (loggedIn) {
      fetchNotifications();
      
      // NOT: Eğer backend'de Socket.io kuruluysa buraya socket.on("notification") bağlayabilirsin.
      // Şimdilik test edebilmen için buraya 10. saniyede canlı bildirim düşüren bir simülasyon ekliyorum:
      const timer = setTimeout(() => {
        const fakeLiveNotif = {
          id: "fake-123",
          type: "friend_request",
          senderName: "ayse33",
          text: "sana arkadaşlık isteği gönderdi."
        };
        
        // Canlı bildirimi çanın altında göster
        setLiveToast(fakeLiveNotif);
        // Listeye de ekle
        setNotifications(prev => [fakeLiveNotif, ...prev]);

        // 5 saniye sonra canlı kutucuk ekrandan kaybolsun
        setTimeout(() => setLiveToast(null), 5000);
      }, 10000); // Site açıldıktan 10 saniye sonra tetiklenir

      return () => clearTimeout(timer);
    }
  }, [loggedIn, fetchNotifications]);

  // 3. Dışarı Tıklayınca Bildirim Menüsünü Kapatma
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifWrapRef.current && !notifWrapRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 4. Arkadaşlık İsteği Aksiyonları (Kabul/Red)
  const handleFriendRequest = async (id, action) => {
    try {
      if (action === "accept") {
        await api.post(`/friends/accept/${id}`);
      } else {
        await api.post(`/friends/reject/${id}`);
      }
      // Listeden kaldır
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error("İşlem başarısız:", err);
      // Backend tam bağlanana kadar arayüzde donmasın diye yerelde de silebilirsin:
      setNotifications(prev => prev.filter(n => n.id !== id));
    }
  };

  const onSearchSubmit = (e) => {
    e.preventDefault();
    if (!loggedIn) { navigate(appRoutes.login); return; }
    const trimmed = searchDraft.trim();
    navigate({ pathname: appRoutes.venues, search: trimmed ? `?q=${trimmed}` : "" });
    setShowSuggestions(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-100 pt-[env(safe-area-inset-top)]">
      {/* Üst Bar: Logo, Geri Tuşu ve Bildirimler */}
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

        <div className="flex items-center gap-3">
          {loggedIn && (
            <div className="relative" ref={notifWrapRef}>
              <button 
                onClick={() => setShowNotifications(!showNotifications)} 
                className="p-2 text-slate-600 relative active:scale-95 transition-transform"
              >
                <IoNotificationsOutline size={24} />
                {/* Bildirim Noktası: Eğer bildirim varsa kırmızı nokta görünür */}
                {notifications.length > 0 && (
                  <span className="absolute top-2 right-2 w-2,5 h-2,5 bg-rose-500 rounded-full border-2 border-white animate-pulse"></span>
                )}
              </button>

              {/* --- CANLI ANLIK BİLDİRİM (TOAST) --- */}
              {liveToast && (
                <div className="absolute top-12 right-0 w-72 bg-slate-950 text-white text-xs p-3 rounded-xl shadow-2xl z-50 flex flex-col gap-1 border border-slate-800 animate-bounce">
                  <div className="font-bold text-rose-400">🚨 Yeni Bildirim!</div>
                  <div><span className="font-bold">@{liveToast.senderName}</span> {liveToast.text}</div>
                </div>
              )}

              {/* --- BİLDİRİM PANELİ (DROPDOWN MENU) --- */}
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
                        <li key={notif.id} className="px-4 py-3 hover:bg-slate-50 transition flex flex-col gap-2">
                          <div className="text-xs text-slate-700 leading-relaxed">
                            <span className="font-bold text-slate-900">@{notif.senderName}</span> {notif.text}
                          </div>
                          
                          {/* Eğer bildirim arkadaşlık isteğiyse Kabul/Red butonlarını göster */}
                          {notif.type === "friend_request" && (
                            <div className="flex gap-2 justify-end">
                              <button 
                                onClick={() => handleFriendRequest(notif.id, "accept")}
                                className="flex items-center gap-1 bg-violet-600 hover:bg-violet-700 text-white text-[11px] font-medium py-1 px-2.5 rounded-lg transition"
                              >
                                <IoCheckmarkCircle size={14} /> Kabul Et
                              </button>
                              <button 
                                onClick={() => handleFriendRequest(notif.id, "reject")}
                                className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-medium py-1 px-2.5 rounded-lg transition"
                              >
                                <IoCloseCircle size={14} /> Reddet
                              </button>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}
          <Link to={appRoutes.profile} className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-700 font-bold text-sm overflow-hidden">
             {user?.profilePhoto ? <img src={user.profilePhoto} alt="" /> : 'S'}
          </Link>
        </div>
      </div>

      {/* Arama Barı */}
      <div className="px-4 pb-3">
        <form onSubmit={onSearchSubmit} className="relative flex items-center gap-2">
          <div className="relative flex-grow">
            <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="search"
              placeholder="Mekan veya menü ara..."
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
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