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

  const hideBackButton = ['/', '/login', '/register'].includes(location.pathname);

  // 1. Bildirimleri ve Arkadaşlık İsteklerini Çekme Fonksiyonu
  const fetchAllNotifications = useCallback(async () => {
    if (!loggedIn) return;
    try {
      // Arkadaşlık isteklerini ve genel bildirimleri eşzamanlı çağırıyoruz
      const responses = await Promise.allSettled([
        api.get("/friends/pending"),
        api.get("/notifications").catch(() => ({ data: [] })) // Hata verirse patlamasın diye önlem
      ]);

      let combinedNotifications = [];

      // A. Arkadaşlık İsteklerini Doğru Alanlarla Yakalama
      if (responses[0].status === "fulfilled") {
        const resData = responses[0].value.data;
        const friendItems = resData?.items || resData?.data?.items || resData?.data || (Array.isArray(resData) ? resData : []);
        
        const formattedFriends = friendItems.map(item => {
          const senderUsername = item.sender?.username || item.sender?.name || item.username || item.name || "Bir kullanıcı";
          
          return {
            id: item._id,
            type: "friend_request",
            senderName: senderUsername,
            text: "sana arkadaşlık isteği gönderdi.",
            createdAt: item.createdAt || new Date()
          };
        });
        combinedNotifications = [...combinedNotifications, ...formattedFriends];
      }

      // B. Beğeniler ve Yorumları Yakalama
      if (responses[1].status === "fulfilled" && responses[1].value?.data) {
        const resDataGen = responses[1].value.data;
        const generalItems = resDataGen?.items || resDataGen?.data?.items || resDataGen?.data || (Array.isArray(resDataGen) ? resDataGen : []);
        
        const formattedGenerals = generalItems.map(item => ({
          id: item._id,
          type: item.type || "like",
          senderName: item.sender?.username || item.username || "Bir kullanıcı",
          text: item.type === "comment" ? "yorumunuza yanıt verdi." : "yorumunuzu beğendi.",
          createdAt: item.createdAt || new Date()
        }));
        combinedNotifications = [...combinedNotifications, ...formattedGenerals];
      }

      // Tarihe göre yeniden eskiye sırala
      combinedNotifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setNotifications(combinedNotifications);
    } catch (err) {
      console.error("Bildirim listesi güncellenirken hata:", err);
    }
  }, [loggedIn]);

  // 2. Sayfa Açıldığında ve Her 10 Saniyede Bir Arkada Yenileme (Polling)
  useEffect(() => {
    if (loggedIn) {
      fetchAllNotifications();
      const interval = setInterval(() => {
        fetchAllNotifications();
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [loggedIn, fetchAllNotifications]);

  // 3. Dışarı Tıklayınca Açılır Menüyü Kapatma
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifWrapRef.current && !notifWrapRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 4. Çan İçinden İsteği Kabul Et / Reddet
  const handleFriendRequest = async (id, action) => {
    try {
      if (action === "accept") {
        await api.post(`/friends/accept/${id}`);
      } else {
        await api.post(`/friends/reject/${id}`);
      }
      // İşlem başarılı olunca arayüzden anlık uçur
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error("İstek işlenirken hata oluştu:", err);
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
      {/* Üst Bar */}
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
              {/* Çan Butonu: Düzenlenmiş flex yerleşimi */}
              <button 
                onClick={() => setShowNotifications(!showNotifications)} 
                className="relative flex items-center justify-center p-2 text-slate-600 rounded-full hover:bg-slate-50 active:scale-95 transition-all outline-none"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <IoNotificationsOutline size={26} />
                
                {/* DİNAMİK KIRMIZI DAİRE SAYACI (Tam çanın omzuna hizalandı) */}
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white ring-2 ring-white shadow-sm animate-pulse">
                    {notifications.length}
                  </span>
                )}
              </button>

              {/* --- BİLDİRİM PANELİ DROPDOWN --- */}
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
                          
                          {/* Arkadaşlık İsteği Butonları */}
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