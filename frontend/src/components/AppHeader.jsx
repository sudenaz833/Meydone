import { useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";
import { normalizeCategoryKey, SEARCH_CATEGORY_OPTIONS, toTurkishCategory } from "../utils/category";
import { notifyAuthChanged } from "../utils/auth";
import { AUTH_TOKEN_KEY } from "../utils/constants";
import { formatTryPrice, menuItemName, menuItemPrice } from "../utils/venueMenu";
import { appRoutes } from "../utils/routes";
import { IoChevronBack, IoNotificationsOutline, IoSearchOutline } from 'react-icons/io5'; // Yeni ikonlar

// Mevcut yardımcı fonksiyonların (initialFromUser, vs.) burada olduğunu varsayıyorum...

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

  // Geri tuşu kontrolü: Ana sayfalarda gösterme
  const hideBackButton = ['/', '/login', '/register'].includes(location.pathname);

  // Mevcut useEffect ve mantık kodlarını buraya (yukarıdaki orjinal kodundan) aynen al...
  // (Bildirim yükleme, arama debouncing, vs. kısımları değişmedi)

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
              <button onClick={() => setShowNotifications(!showNotifications)} className="p-2 text-slate-600 relative">
                <IoNotificationsOutline size={24} />
                {/* Bildirim Sayısı */}
                <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
              </button>
              {/* Bildirim Paneli buraya gelecek (Mevcut kodundaki mantıkla) */}
            </div>
          )}
          <Link to={appRoutes.profile} className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-700 font-bold text-sm overflow-hidden">
             {user?.profilePhoto ? <img src={user.profilePhoto} alt="" /> : 'S'}
          </Link>
        </div>
      </div>

      {/* Arama Barı: Mobilde daha kompakt */}
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
          
          {/* Kategori Seçimi: Mobilde çok yer kaplamasın diye minimalist select */}
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