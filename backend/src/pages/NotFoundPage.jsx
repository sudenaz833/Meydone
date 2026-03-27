import { Link } from "react-router-dom";
import { appRoutes } from "../utils/routes";
import { btnPrimary, card, headingPage, textMuted } from "../utils/ui";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[calc(100vh-14rem)] flex-col items-center justify-center px-4 py-16">
      <section className={`${card} w-full max-w-md text-center`}>
        <p className="text-sm font-semibold uppercase tracking-widest text-sky-600">404</p>
        <h1 className={`${headingPage} mt-2`}>Sayfa bulunamadı</h1>
        <p className={`mt-3 ${textMuted}`}>
          Aradığınız sayfa yok veya taşınmış olabilir.
        </p>
        <Link to={appRoutes.home} className={`${btnPrimary} mt-8`}>
          Anasayfaya dön
        </Link>
      </section>
    </div>
  );
}
