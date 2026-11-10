import { BrandIllustration } from "@/components/brand-illustration";
import { SubjectCard } from "@/components/subject-card";
import { SubjectSearch } from "@/components/subject-search";
import { ContributionDialog } from "@/components/contribution-dialog";
import { getSubjects } from "@/lib/catalog";
import { getSiteConfig } from "@/lib/site";
import { getPublicUploadConfig } from "@/lib/uploads/validation";
export default function Home() {
  const site = getSiteConfig(),
    subjects = getSubjects();
  return (
    <main id="contenuto" tabIndex={-1} className="flex-1">
      <section
        aria-labelledby="intro-title"
        className="home-hero mx-auto max-w-6xl px-5 sm:px-8"
      >
        <div className="hero-backdrop" aria-hidden="true">
          <BrandIllustration
            kind="desk"
            preload
            className="hero-background-art"
          />
          <svg className="hero-paper-lines" viewBox="0 0 250 290" fill="none">
            <path d="m20 40 150-15 20 210-150 15ZM35 55l120-12M40 85l120-12M45 115l85-9M200 80l25 150-80 15" />
            <path d="M64 180q40-55 80-10m-55-20 12 26 36-38" />
          </svg>
        </div>
        <div className="home-intro">
          <p className="eyebrow">Uno spazio degli studenti, per gli studenti</p>
          <h1 id="intro-title" className="home-title">
            Ci vediamo
            <br />
            in {site.name}
            <span className="text-terracotta">.</span>
          </h1>
          <p className="home-subtitle">
            Appunti condivisi e strumenti per studiare, fatti dagli studenti.
          </p>
          <SubjectSearch subjects={subjects} />
          <div className="home-contribute">
            <p>Hai qualcosa da aggiungere?</p>
            <ContributionDialog
              variant="inline"
              config={getPublicUploadConfig(
                process.env.NEXT_PUBLIC_SUPABASE_URL,
                process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
              )}
              subjects={subjects.map(({ slug, title }) => ({ slug, title }))}
            />
            <p className="contribute-note">
              Rivediamo ogni contributo prima di pubblicarlo.
            </p>
          </div>
        </div>
      </section>
      <section
        id="insegnamenti"
        aria-labelledby="subjects-title"
        className="mx-auto max-w-6xl px-5 pb-12 pt-5 sm:px-8 sm:pb-16"
      >
        <div className="section-heading">
          <div>
            <p className="eyebrow">Il tuo archivio</p>
            <h2 id="subjects-title" className="mt-2 text-3xl sm:text-4xl">
              I tuoi insegnamenti
            </h2>
          </div>
          <span className="margin-note" aria-hidden="true">
            ogni materia, un fascicolo
          </span>
        </div>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {subjects.map((subject) => (
            <SubjectCard key={subject.slug} subject={subject} />
          ))}
        </div>
        <p className="mt-5 text-xs leading-6 text-muted">
          {site.programme} · {site.institution}
        </p>
      </section>
      <section aria-labelledby="project-title" className="home-about">
        <div className="mx-auto max-w-6xl px-5 py-9 text-center sm:px-8">
          <h2 id="project-title" className="text-2xl sm:text-3xl">
            Una base comune.{" "}
            <span className="italic">Un contributo alla volta.</span>
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-muted">
            {site.description}
          </p>
        </div>
      </section>
    </main>
  );
}
