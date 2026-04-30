import { NavLink } from 'react-router-dom';
import { IoHomeOutline, IoLocationOutline, IoPeopleOutline, IoPersonOutline } from 'react-icons/io5';

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-slate-200 pb-[env(safe-area-inset-bottom)] z-50">
      <div className="flex justify-around items-center h-16">
        <NavLink to="/" className={({ isActive }) => `flex flex-col items-center gap-1 ${isActive ? 'text-rose-500' : 'text-slate-500'}`}>
          <IoHomeOutline size={22} />
          <span className="text-[10px] font-medium">Ana Sayfa</span>
        </NavLink>
        
        <NavLink to="/mekanlar" className={({ isActive }) => `flex flex-col items-center gap-1 ${isActive ? 'text-rose-500' : 'text-slate-500'}`}>
          <IoLocationOutline size={22} />
          <span className="text-[10px] font-medium">Mekanlar</span>
        </NavLink>

        <NavLink to="/friends" className={({ isActive }) => `flex flex-col items-center gap-1 ${isActive ? 'text-rose-500' : 'text-slate-500'}`}>
          <IoPeopleOutline size={22} />
          <span className="text-[10px] font-medium">Arkadaşlar</span>
        </NavLink>

        <NavLink to="/profile" className={({ isActive }) => `flex flex-col items-center gap-1 ${isActive ? 'text-rose-500' : 'text-slate-500'}`}>
          <IoPersonOutline size={22} />
          <span className="text-[10px] font-medium">Profil</span>
        </NavLink>
      </div>
    </nav>
  );
}