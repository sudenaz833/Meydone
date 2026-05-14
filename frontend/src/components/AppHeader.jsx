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

  const loggedIn = typeof window !== "undefined" && !!localStorage.getItem(AUTH_TOKEN_KEY);
  const [user, setUser] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchDraft, setSearchDraft] = useState(searchParams.get("q") ?? "");
  
  // Sadece yorum beğenileri ve yanıtları için bildirim state'i
  const [notifications, setNotifications] = useState([]);

  const hideBackButton = ['/', '/login', '/register'].includes(location.pathname);

  // 1. Sadece Yorum Beğeni ve Yanıt Bildirimlerini Çekme Fonksiyonu
  const fetchGeneralNotifications = useCallback(async () => {
    if (!loggedIn) return;
    try {
      const response = await api.get("/notifications");
      const resDataGen = response.data;
      
      // Backend'den dönen array yapısını güvenli bir şekilde yakalıyoruz
      const generalItems = resDataGen?.items || resDataGen?.data?.items || resDataGen?.data || (Array.isArray(resDataGen) ? resDataGen : []);
      
      const formattedGenerals = generalItems.map(item => ({
        id: item._id || item.id,
        type: item.type || "like", // "comment" veya "like"
        senderName: item.sender?.username || item.username || "Bir kullanıcı",
        text: item.type === "comment" ? "yorumunuza yanıt verdi." : "yorumunuzu beğendi.",
        createdAt: item.createdAt || new Date()
      }));

      // Tarihe göre yeniden eskiye (en yeni en üstte) sırala
      formattedGenerals.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setNotifications(formattedGenerals);
    } catch (err) {
      console.error("Yorum bildirimleri çekilirken hata oluştu:", err);
    }
  }, [loggedIn]);

  // 2. Sayfa Açıldığında ve Her 10 Saniyede Bir Arkada Yenileme (Polling)
  useEffect(() => {
    if (loggedIn) {
      fetchGeneralNotifications();
      const interval = setInterval(() => {
        fetchGeneralNotifications();
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [loggedIn, fetchGeneralNotifications]);

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

  const onSearchSubmit = (e) => {
    e.preventDefault();
    if (!loggedIn) { navigate(appRoutes.login); return; }
    const trimmed = searchDraft.trim();
    navigate({ pathname: appRoutes.venues, search: trimmed ? `?q=${trimmed}` : "" });
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
              {/* Çan Butonu */}
              <button 
                onClick={() => setShowNotifications(!showNotifications)} 
                className="relative flex items-center justify-center p-2 text-slate-600 rounded-full hover:bg-slate-50 active:scale-95 transition-all outline-none"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <IoNotificationsOutline size={26} />
                
                {/* DİNAMİK SAYAÇ (Sadece yorum beğenisi ve yanıtı sayısını gösterir) */}
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white ring-2 ring-white shadow-sm animate-pulse">
                    {notifications.length}
                  </span>
                )}
              </button>

              {/* --- YORUM BİLDİRİM PANELİ DROPDOWN --- */}
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
                        <li key={notif.id} className="px-4 py-3 hover:bg-slate-50 transition flex flex-col gap-1">
                          <div className="text-xs text-slate-700 leading-relaxed">
                            <span className="font-bold text-slate-900">@{notif.senderName}</span> {notif.text}
                          </div>
                          {/* İsteğe bağlı: Bildirim zamanını göstermek isterseniz */}
                          <span className="text-[10px] text-slate-400">
                            {new Date(notif.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
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