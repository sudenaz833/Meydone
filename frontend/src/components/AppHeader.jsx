import { useEffect, useRef, useState, useCallback, useMemo } from "react";
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

  // 1. Canlı Arama İstek Yönetimi ve Arka Plan Sayfayı Canlı Güncelleme
  useEffect(() => {
    if (!loggedIn) return;

    const query = searchDraft.trim();
    
    if (location.pathname === appRoutes.venues) {
      if (query) {
        navigate({ pathname: appRoutes.venues, search: `?q=${encodeURIComponent(query)}` }, { replace: true });
      } else {
        navigate({ pathname: appRoutes.venues, search: "" }, { replace: true });
      }
    }

    if (!query) {
      setSuggestedVenues([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        const response = await api.get(`/venues?limit=100`);
        const items = response.data?.data?.items || response.data?.items || [];
        setSuggestedVenues(Array.isArray(items) ? items : []);
      } catch (err) {
        console.error("Canlı arama hatası:", err);
        setSuggestedVenues([]);
      }
    }, 250);

    return () => clearTimeout(delayDebounceFn);
  }, [searchDraft, location.pathname, navigate, loggedIn]);

  useEffect(() => {
    if (!loggedIn) return;
    const qParam = searchParams.get("q") ?? "";
    if (qParam && searchDraft !== qParam) {
      setSearchDraft(qParam);
    }
  }, [searchParams, loggedIn, searchDraft]);

  // --- CEREN'İN NOKTA ATIŞI DOĞRULANMIŞ BİLDİRİM ÇEKME MANTIĞI ---
  const fetchAllNotifications = useCallback(async () => {
    if (!loggedIn) return;
    try {
      // FriendsPage'deki birebir aynı endpoint'leri çağırıyoruz artık!
      const [likesResponse, friendsPendingResponse] = await Promise.all([
        api.get("/notifications/comment-likes").catch(() => null),
        api.get("/friends/pending").catch(() => null) 
      ]);

      const allCombined = [];

      // 1. Yorum Beğeni Bildirimlerini İşle
      const rawLikes = likesResponse?.data?.data?.items || likesResponse?.data?.items || [];
      if (Array.isArray(rawLikes)) {
        rawLikes.forEach(item => {
          if (!item) return;
          const firstLiker = item.likers && item.likers[0];
          const username = firstLiker?.username || firstLiker?.name || "Bir kullanıcı";
          const commentText = item.commentPreview || "senin";

          allCombined.push({
            id: `like-${item.commentId || Math.random()}`,
            senderName: username,
            text: `"${commentText}" yorumunu beğendi.`,
            icon: "❤️",
            createdAt: item.updatedAt || new Date()
          });
        });
      }

      // 2. Gelen Arkadaşlık İsteklerini İşle (Tam Doğru Yapı)
      // FriendsPage'deki gibi data.data.incoming dizisini okuyoruz
      const incomingRequests = friendsPendingResponse?.data?.data?.incoming || [];
      if (Array.isArray(incomingRequests)) {
        incomingRequests.forEach(item => {
          if (!item) return;
          
          // FriendsPage'deki gibi gönderen kişi 'from' objesi içinde yer alıyor
          const fromUser = item.from;
          const username = fromUser?.name || fromUser?.username || "Bir kullanıcı";

          allCombined.push({
            id: `friend-${item._id || Math.random()}`,
            senderName: username,
            text: `sana arkadaşlık isteği gönderdi.`,
            icon: "👥",
            // Eğer objede özel bir tarih yoksa güvenli bir yedek tarih veriyoruz
            createdAt: item.createdAt || item.updatedAt || new Date()
          });
        });
      }

      // Tüm bildirimleri zamana göre en yeni en üstte olacak şekilde sırala
      allCombined.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      // Yeni bildirim kontrolü ve unread balonu
      if (allCombined.length > notifications.length && !showNotifications) {
        setHasUnread(true);
      }
      
      setNotifications(allCombined);
    } catch (err) {
      console.error("Bildirimler birleştirilirken hata:", err);
    }
  }, [loggedIn, notifications.length, showNotifications]);

  // Her 5 saniyede bir bildirimleri otomatik tazeler
  useEffect(() => {
    if (loggedIn) {
      fetchAllNotifications();
      const interval = setInterval(() => {
        fetchAllNotifications();
      }, 5000); 
      return () => clearInterval(interval);
    }
  }, [loggedIn, fetchAllNotifications]);

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

  const checkStrictStartsWith = (sourceText, queryText) => {
    const source = String(sourceText || "").trim().toLowerCase();
    const query = String(queryText || "").trim().toLowerCase();
    if (!source || !query) return false;
    return source.startsWith(query);
  };

  const checkWordStartsWith = (sourceText, queryText) => {
    const source = String(sourceText || "").trim().toLowerCase();
    const query = String(queryText || "").trim().toLowerCase();
    if (!source || !query) return false;

    const words = source.split(/\s+/);
    return words.some(word => word.startsWith(query));
  };

  const processedSuggestions = useMemo(() => {
    if (!loggedIn) return [];
    const query = (searchDraft || "").trim().toLowerCase();
    if (!query) return [];

    const results = [];

    (suggestedVenues || []).forEach(venue => {
      if (!venue) return;

      const venueName = String(venue.name || "");
      const venueCategory = String(venue.category || "");
      
      const catLabel = toTurkishCategory(venue.category);
      const turkishCatLabel = typeof catLabel === "string" ? catLabel : "Mekan";

      let isMatched = false;
      let tagText = turkishCatLabel;

      if (checkStrictStartsWith(venueName, query)) {
        isMatched = true;
        tagText = turkishCatLabel;
      } 
      else if (checkStrictStartsWith(venueCategory, query) || checkStrictStartsWith(turkishCatLabel, query)) {
        isMatched = true;
        tagText = turkishCatLabel;
      }
      else if (venue.menu && Array.isArray(venue.menu)) {
        for (let i = 0; i < venue.menu.length; i++) {
          const item = venue.menu[i];
          if (!item) continue;
          
          const itemNameRaw = typeof item === "object" ? (item.name || item.text) : item;
          const itemName = String(itemNameRaw || "");

          if (checkWordStartsWith(itemName, query)) {
            isMatched = true;
            tagText = `Menü: ${String(itemNameRaw || "Ürün")}`;
            break; 
          }
        }
      }

      if (isMatched && typeof tagText === "string") {
        results.push({
          id: venue._id || venue.id || `safe-id-${Math.random()}`,
          name: typeof venue.name === "string" ? venue.name : "İsimsiz Mekan",
          rawVenueName: venue.name,
          tag: tagText
        });
      }
    });

    return results;
  }, [searchDraft, suggestedVenues, loggedIn]);

  const matchedCategories = useMemo(() => {
    if (!loggedIn) return [];
    return (searchDraft || "").trim()
      ? (SEARCH_CATEGORY_OPTIONS || []).filter(opt =>
          checkStrictStartsWith(String(opt?.label || ""), searchDraft)
        )
      : [];
  }, [searchDraft, loggedIn]);

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
                            <span className="mr-1.5">{notif.icon}</span>
                            <span className="font-bold text-slate-900">@{notif.senderName}</span> {notif.text}
                          </div>
                          <span className="text-[9px] text-slate-400 pl-6">{new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}
          
          {loggedIn ? (
            <Link to={appRoutes.profile} className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-700 font-bold text-sm overflow-hidden">S</Link>
          ) : (
            <Link to={appRoutes.login} className="text-sm font-semibold text-rose-500 hover:text-rose-600 px-3 py-1.5 rounded-xl bg-rose-50 transition">Giriş Yap</Link>
          )}
        </div>
      </div>

      {/* Arama Barı */}
      {loggedIn && (
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

          {/* Öneri Listesi Dropdown */}
          {showSuggestions && (searchDraft || "").trim().length > 0 && (
            <div className="absolute left-4 right-4 top-12 bg-white rounded-2xl shadow-xl border border-slate-100 mt-1 p-2 z-50 max-h-72 overflow-y-auto">
              <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-50 mb-1">
                Arama Sonuçları
              </div>
              
              {matchedCategories.length > 0 && (
                <div className="mb-2">
                  {matchedCategories.map(cat => (
                    <button
                      key={cat.value}
                      onClick={() => {
                        setSearchDraft("");
                        setShowSuggestions(false);
                        navigate(`${appRoutes.venues}?cat=${cat.value}`);
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-xl transition flex items-center gap-2"
                    >
                      🍴 <span className="font-medium text-slate-900">{cat.label}</span> filtresini uygula
                    </button>
                  ))}
                </div>
              )}

              {processedSuggestions.length === 0 && matchedCategories.length === 0 ? (
                <div className="px-3 py-4 text-center text-xs text-slate-400">
                  "{searchDraft}" ile başlayan bir mekan veya menü bulunamadı.
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
                      <span className="font-semibold text-slate-900 flex items-center gap-1.5 truncate">
                        📍 {item.name}
                      </span>
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
      )}
    </header>
  );
}