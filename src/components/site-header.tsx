import Link from "next/link";

type SiteHeaderProps = {
  name: string;
};

export function SiteHeader({ name }: SiteHeaderProps) {
  return (
    <header className="border-b border-border bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-5 py-4 sm:px-8">
        <Link href="/" className="inline-flex min-h-12 items-center gap-3 font-semibold" aria-label={`${name} — homepage`}>
          <span aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink text-xl text-white">A</span>
          <span className="text-xl tracking-tight">{name}</span>
        </Link>
        <nav aria-label="Navigazione principale" className="flex max-w-full flex-wrap items-center gap-x-5">
          <Link href="/insegnamenti" className="inline-flex min-h-12 items-center text-sm font-medium text-muted hover:text-accent">Insegnamenti</Link>
          <Link href="/materiali" className="inline-flex min-h-12 items-center text-sm font-medium text-muted hover:text-accent">Materiali</Link>
          <Link href="/#progetto" className="inline-flex min-h-12 items-center text-sm font-medium text-muted hover:text-accent">Il progetto</Link>
        </nav>
      </div>
    </header>
  );
}
