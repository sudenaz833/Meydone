// React Router'dan NavLink bileşenini içe aktar (sayfa yönlendirme için)
import { NavLink} from "react-router-dom";

// Navigasyon çubuğu (navbar) bileşeni - Sayfa üstünde sabit menü gösterir
function NavBar() {
  return (
    <div className="navbar-default navbar navbar-fixed-top">
      <div className="container">
        {/* Navbar başlık bölümü */}
        <div className="navbar-header">
          {/* Ana sayfa linki - Logo/başlık olarak gösterilir */}
          <NavLink className="navbar-brand" to="/">Meydone</NavLink>
          
          {/* Mobil cihazlar için hamburger menü butonu */}
          <button
            className="navbar-toggle"
            type="button"
            data-toggle="collapse"
            data-target="#navbar-main"
          >
            {/* Hamburger menü ikonu (3 çizgi) */}
            <span className="icon-bar"></span>
            <span className="icon-bar"></span>
            <span className="icon-bar"></span>
          </button>
        </div>
        
        {/* Menü öğeleri - Mobilde collapse (açılır/kapanır) olabilir */}
        <div id="navbar-main" className="navbar-collapse collapse">
          <ul className="nav navbar-nav">
            {/* Hakkında sayfası linki */}
            <li>
              <NavLink to={"about"}>Hakkında</NavLink> 
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// Bileşeni dışa aktar
export default NavBar;
