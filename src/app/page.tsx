import { getSiteConfig } from "@/lib/site";

export default function Home() {
  const site = getSiteConfig();

  return (
    <main id="contenuto" tabIndex={-1} className="flex-1">
      <section
        aria-labelledby="intro-title"
        className="mx-auto max-w-6xl px-5 pt-8 sm:px-8 sm:pt-12"
      >
        <div className="grid gap-12 rounded-3xl bg-ink p-7 text-white sm:p-12 lg:grid-cols-[1.5fr_1fr] lg:p-14">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-200">
              Uno spazio degli studenti, per gli studenti
            </p>

            <h1
              id="intro-title"
              className="mt-6 text-4xl font-semibold leading-tight tracking-tight sm:text-6xl"
            >
              Studiare è meglio.
              <br />
              <span className="text-emerald-200">Insieme.</span>
            </h1>

            <p className="mt-6 max-w-lg text-base leading-7 text-slate-200 sm:text-lg sm:leading-8">
              {site.description}
            </p>

            <a
              href="#insegnamenti"
              className="mt-8 inline-flex min-h-12 items-center gap-3 rounded-xl bg-emerald-200 px-5 py-3 text-sm font-semibold text-ink hover:bg-emerald-100"
            >
              Esplora gli insegnamenti
              <span aria-hidden="true">↓</span>
            </a>
          </div>

          <aside
            aria-labelledby="direction-title"
            className="border-t border-white/20 pt-7 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-10"
          >
            <p className="font-mono text-xs uppercase tracking-widest text-slate-300">
              Anteprima del progetto
            </p>
            <h2
              id="direction-title"
              className="mt-5 text-2xl font-medium tracking-tight"
            >
              Oltre una cartella condivisa.
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-200">
              La direzione di Aula: materiali organizzati, conoscenza
              condivisa e strumenti per comprendere.
            </p>
            <ol className="mt-7 space-y-4 text-sm">
              <li className="flex gap-4">
                <span aria-hidden="true" className="font-mono text-emerald-200">
                  01
                </span>
                Raccogliere i materiali
              </li>
              <li className="flex gap-4">
                <span aria-hidden="true" className="font-mono text-emerald-200">
                  02
                </span>
                Collegare le conoscenze
              </li>
              <li className="flex gap-4">
                <span aria-hidden="true" className="font-mono text-emerald-200">
                  03
                </span>
                Mettersi alla prova
              </li>
            </ol>
          </aside>
        </div>
      </section>

      <section
        id="insegnamenti"
        aria-labelledby="subjects-title"
        className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20"
      >
        <p className="text-xs font-semibold uppercase tracking-widest text-accent">
          {site.institution}
        </p>
        <h2
          id="subjects-title"
          className="mt-3 text-3xl font-semibold tracking-tight"
        >
          I tuoi insegnamenti
        </h2>
        <p className="mt-3 text-base leading-7 text-muted">
          {site.programme}. Gli spazi di studio da cui parte il progetto.
        </p>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {site.subjects.map((subject) => (
            <article
              key={subject.id}
              className="flex min-w-0 flex-col rounded-2xl border border-border bg-white p-6 sm:p-8"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span
                  aria-hidden="true"
                  className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 font-mono text-sm font-semibold text-accent"
                >
                  {subject.label}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-muted">
                  In preparazione
                </span>
              </div>

              <h3 className="mt-6 text-xl font-semibold leading-7 tracking-tight">
                {subject.title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-muted">
                {subject.description}
              </p>
              <p className="mt-auto pt-6 text-sm font-medium text-muted">
                Materiali non ancora disponibili
              </p>
            </article>
          ))}
        </div>
      </section>

      <section
        id="progetto"
        aria-labelledby="project-title"
        className="border-t border-border bg-white"
      >
        <div className="mx-auto grid max-w-6xl gap-6 px-5 py-12 sm:px-8 lg:grid-cols-2 lg:gap-12">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-accent">
              Il progetto
            </p>
            <h2
              id="project-title"
              className="mt-3 max-w-md text-3xl font-semibold leading-tight tracking-tight"
            >
              Una base comune.
              <br />
              Un contributo alla volta.
            </h2>
          </div>

          <div className="space-y-4 text-base leading-8 text-muted">
            <p>
              {site.name} nasce per dare continuità al lavoro degli studenti:
              raccogliere materiali utili e renderli più facili da trovare,
              consultare e migliorare.
            </p>
            <p>
              Il punto di partenza è la magistrale in {site.programme}.
              La prospettiva è costruire uno spazio che possa crescere
              insieme alla comunità e accogliere altri percorsi di studio.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}