import Link from "next/link";

export default function NotFound() {
  return (
    <main
      id="contenuto"
      tabIndex={-1}
      className="mx-auto w-full max-w-6xl flex-1 px-5 py-20 sm:px-8"
    >
      <p className="font-mono text-sm font-semibold text-accent">404</p>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">
        Pagina non trovata
      </h1>
      <p className="mt-4 max-w-xl leading-8 text-muted">
        L’indirizzo potrebbe essere errato oppure il contenuto non è più
        disponibile.
      </p>
      <Link
        href="/insegnamenti"
        className="mt-7 inline-flex min-h-12 items-center rounded-xl bg-ink px-5 py-3 text-sm font-semibold text-white hover:bg-accent"
      >
        Vai agli insegnamenti
      </Link>
    </main>
  );
}