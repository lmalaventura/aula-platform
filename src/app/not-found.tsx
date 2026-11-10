import Link from "next/link";
import { BrandIllustration } from "@/components/brand-illustration";
export default function NotFound() {
  return (
    <main id="contenuto" tabIndex={-1} className="page-container">
      <section className="empty-study !mt-12 !border-0">
        <BrandIllustration />
        <div>
          <p className="eyebrow">404 · Ci siamo persi una pagina</p>
          <h1 className="page-title">Pagina non trovata.</h1>
          <p className="page-description">
            L’indirizzo potrebbe essere errato oppure il contenuto non è più
            disponibile.
          </p>
          <Link href="/insegnamenti" className="button-primary mt-6">
            Torniamo agli insegnamenti
          </Link>
        </div>
      </section>
    </main>
  );
}
