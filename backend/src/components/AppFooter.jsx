import { footerBar } from "../utils/ui";

export default function AppFooter() {
  return (
    <footer className={footerBar}>
      <div className="mx-auto max-w-6xl px-4">
        <p className="text-stone-500">Meydone — seveceğiniz yerleri keşfedin.</p>
      </div>
    </footer>
  );
}
