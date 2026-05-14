import { useEffect, useRef, useState, useCallback } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";
import { SEARCH_CATEGORY_OPTIONS, toTurkishCategory } from "../utils/category";
import { AUTH_TOKEN_KEY } from "../utils/constants";
import { appRoutes } from "../utils/routes";
import { IoChevronBack, IoNotificationsOutline, IoSearchOutline } from 'react-icons/io5';

export default function AppHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const notifWrapRef = useRef(null);
  const searchWrapRef = useRef(null);

  const loggedIn = typeof window !== "undefined" && !!localStorage.getItem(AUTH_TOKEN_KEY);
  
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchDraft, setSearchDraft] = useState(searchParams.get("q") ?? "");
  const [hasUnread, setHasUnread] = useState(false);

  const [suggestedVenues, setSuggestedVenues] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const hideBackButton = ['/', '/login', '/register'].includes(location.pathname);

  // 1. Canlı Arama İstek Yönetimi
  useEffect(() => {
    const query = searchDraft.trim();
    if (!query) {
      setSuggestedVenues([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        // Arama yaparken limiti yüksek tutuyoruz ki menü eşleşmelerini kaçırmayalım
        const response = await api.get(`/venues?limit=100`);
        const items = response.data?.data?.items || response.data?.items || [];
        setSuggestedVenues(Array.isArray(items) ? items : []);
      } catch (err) {
        console.error("Canlı arama yapılırken hata oluştu:", err);
        setSuggestedVenues([]);
      }
    }, 200); // Daha hızlı yanıt için süreyi 200ms'ye çektim

    return () => clearTimeout(delayDebounceFn);
  }, [searchDraft]);

  // 2. Bildirim Çekme Fonksiyonu
  const fetchLikeNotifications = useCallback(async () => {
    if (!loggedIn) return;
    try {
      const response = await api.get("/notifications/comment-likes");
      const rawItems = response.data?.data?.items || [];
      
      const formattedNotifications = rawItems.map(item => {
        const firstLiker = item.likers && item.likers[0];
        const username = firstLiker?.username || firstLiker?.name || "Bir kullanıcı";
        const commentText = item.commentPreview || "senin";

        return {
          id: item.commentId || Math.random().toString(),
          senderName: username,
          text: `"${commentText}" yorumunu beğendi.`, 
          createdAt: item.updatedAt || new Date()
        };
      });

      formattedNotifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      if (formattedNotifications.length > notifications.length && !showNotifications) {
        setHasUnread(true);
      }
      
      setNotifications(formattedNotifications);
    } catch (err) {
      console.error("Yorum beğenileri çekilirken hata:", err);
    }
  }, [loggedIn, notifications.length, showNotifications]);

  useEffect(() => {
    if (loggedIn) {
      fetchLikeNotifications();
      const interval = setInterval(() => {
        fetchLikeNotifications();
      }, 5000); 
      return () => clearInterval(interval);
    }
  }, [loggedIn, fetchLikeNotifications]);

  const handleNotifClick = () => {
    const nextShowState = !showNotifications;
    setShowNotifications(nextShowState);
    if (nextShowState) {
      setHasUnread(false);
    }
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (notifWrapRef.current && !notifWrapRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (searchWrapRef.current && !searchWrapRef.current.contains(event.target)) {
        setShowSuggestions(false);
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
    setShowSuggestions(false);
  };

  // --- CEREN'İN İSTEDİĞİ AKILLI FİLTRELEME VE ETİKETLEME MANTIĞI ---
  const processedSuggestions = useMemo(() => {
    const query = searchDraft.trim().toLocaleLowerCase("tr-TR");
    if (!query) return [];

    const results = [];

    suggestedVenues.forEach(venue => {
      if (!venue) return;

      const venueName = String(venue.name || "").toLocaleLowerCase("tr-TR");
      const venueCategory = String(venue.category || "").toLocaleLowerCase("tr-TR");
      const turkishCatLabel = toTurkishCategory(venue.category) || "Mekan";

      let isMatched = false;
      let tagText = turkishCatLabel; // Varsayılan etiket mekanın kategorisidir (Örn: Restoran, Kafe)

      // Senaryo 1: Kullanıcının yazdığı harf MEKAN ADINDA geçiyor mu?
      if (venueName.includes(query)) {
        isMatched = true;
        tagText = turkishCatLabel; // Etiket: Restoran / Kafe vs.
      } 
      // Senaryo 2: Kullanıcının yazdığı harf KATEGORİDE geçiyor mu?
      else if (venueCategory.includes(query) || turkishCatLabel.toLocaleLowerCase("tr-TR").includes(query)) {
        isMatched = true;
        tagText = turkishCatLabel;
      }
      // Senaryo 3: Kullanıcının yazdığı harf MENÜDEKİ YEMEKLERDE geçiyor mu? (Örn: "köfte")
      else if (Array.isArray(venue.menu)) {
        // Menüdeki yemeklerin ismini kontrol et
        const matchedMenuItem = venue.menu.find(item => {
          const itemName = String(item?.name || item || "").toLocaleLowerCase("tr-TR");
          return itemName.includes(query);
        });

        if (matchedMenuItem) {
          isMatched = true;
          const matchedName = String(matchedMenuItem?.name || matchedMenuItem);
          tagText = `Menü: ${matchedName}`; // İstediğin format: En sağda "Menü: Köfte" yazacak
        }
      }

      // Eğer herhangi bir şekilde eşleşme yakaladıysak listeye ekle
      if (isMatched) {
        results.push({
          id: venue._id || venue.id || Math.random().toString(),
          name: venue.name || "İsimsiz Mekan",
          rawVenueName: venue.name, // Yönlendirme için orijinal isim
          tag: tagText
        });
      }
    });

    return results;
  }, [searchDraft, suggestedVenues]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-100 pt-[env(safe-area-inset-top)]">
      <div className="flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2">
          {!hideBackButton && (
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full active:bg-rose-50 text-rose-500">
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
              <button onClick={handleNotifClick} className="relative flex items-center justify-center p-2 text-slate-600 rounded-full hover:bg-slate-50 active:scale-95 transition-all outline-none">
                <IoNotificationsOutline size={26} />
                {hasUnread && notifications.length > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white ring-2 ring-white shadow-sm animate-pulse">
                    {notifications.length}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute top-12 right-0 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 max-h-96 overflow-y-auto">
                  <div className="px-4 py-2 border-b border-slate-50 font-bold text-sm text-slate-800 flex justify-between items-center">
                    <span>Bildirimler</span>
                    <span className="text-xs bg-rose-50 text-rose-500 px-2 py-0.5 rounded-full">{notifications.length} Adet</span>
                  </div>
                  {notifications.length === 0 ? (
                    <div className="px-4 py-6 text-center text-xs text-slate-400">Henüz yeni bir bildiriminiz yok.</div>
                  ) : (
                    <ul className="divide-y divide-slate-50">
                      {notifications.map((notif) => (
                        <li key={notif.id} className="px-4 py-3 hover:bg-slate-50 transition flex flex-col gap-0.5">
                          <div className="text-xs text-slate-700 leading-relaxed">
                            <span className="font-bold text-slate-900">@{notif.senderName}</span> {notif.text}
                          </div>
                          <span className="text-[9px] text-slate-400">{new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}
          <Link to={appRoutes.profile} className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-700 font-bold text-sm overflow-hidden">S</Link>
        </div>
      </div>

      {/* Arama Barı */}
      <div className="px-4 pb-3 relative" ref={searchWrapRef}>
        <form onSubmit={onSearchSubmit} className="relative flex items-center gap-2">
          <div className="relative flex-grow">
            <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="search"
              placeholder="Mekan veya menü ara..."
              value={searchDraft}
              onChange={(e) => {
                setSearchDraft(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              className="w-full bg-slate-100 text-slate-900 border-none rounded-xl py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-rose-200 outline-none"
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

        {/* --- AKILLI ÖNERİ LİSTESİ DROPDOWN PANELİ --- */}
        {showSuggestions && searchDraft.trim().length > 0 && (
          <div className="absolute left-4 right-4 top-12 bg-white rounded-2xl shadow-xl border border-slate-100 mt-1 p-2 z-50 max-h-72 overflow-y-auto">
            <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-50 mb-1">
              Arama Sonuçları
            </div>
            
            {processedSuggestions.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-slate-400">
                "{searchDraft}" ile eşleşen bir mekan veya menü bulunamadı.
              </div>
            ) : (
              <div className="flex flex-col gap-0.5">
                {processedSuggestions.map(item => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setSearchDraft("");
                      setShowSuggestions(false);
                      navigate(`${appRoutes.venues}?q=${encodeURIComponent(item.rawVenueName || '')}`);
                    }}
                    className="w-full text-left px-3 py-2.5 text-xs text-slate-700 hover:bg-slate-50 rounded-xl transition flex items-center justify-between gap-4"
                  >
                    {/* Sol taraf: Mekan İsmi */}
                    <span className="font-semibold text-slate-900 flex items-center gap-1.5 truncate">
                      📍 {item.name}
                    </span>
                    
                    {/* Sağ taraf: İstediğin Dinamik Etiket (Örn: Restoran veya Menü: Köfte) */}
                    <span className="text-[10px] font-medium bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full whitespace-nowrap shadow-sm border border-slate-200/40">
                      {item.tag}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}