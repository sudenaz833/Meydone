// Sayfa başlığı bileşeni - Başlık metni ve slogan gösterir
function Header({headerText, motto}) {
    return (
        <div className="page-header">
        <div className="row">
          <div className="col-lg-6">
            {/* Ana başlık ve alt başlık (slogan) */}
            <h1>
              {headerText} {/* Ana başlık metni (örn: "Meydone") */}
              <small>{motto}</small> {/* Slogan (küçük yazı ile gösterilir) */}
            </h1>
          </div>
        </div>
      </div>
    );
  }

// Bileşeni dışa aktar
export default Header;
  