import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LearnerStudy } from "@/components/learner-study";
import { getSubjectBySlug, getSubjects } from "@/lib/catalog";
import { getPublishedBank } from "@/lib/study/published";
import { getSiteConfig } from "@/lib/site";
import { connection } from "next/server";
type Props = { params: Promise<{ slug: string }> };
export const dynamicParams = false;
export function generateStaticParams() {
  return getSubjects().map(({ slug }) => ({ slug }));
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const subject = getSubjectBySlug((await params).slug);
  return {
    title: `Studia: ${subject?.title ?? "Materia non trovata"} | ${getSiteConfig().name}`,
  };
}
export default async function StudyPage({ params }: Props) {
  if (process.env.NODE_ENV === "development") await connection();
  const { slug } = await params,
    subject = getSubjectBySlug(slug);
  if (!subject) notFound();
  const { bank, outdated } = getPublishedBank(slug);
  return (
    <main
      id="contenuto"
      tabIndex={-1}
      className="mx-auto w-full max-w-3xl flex-1 px-5 py-10 sm:px-8 sm:py-14"
    >
      <Link
        href={`/insegnamenti/${slug}`}
        className="inline-flex min-h-12 items-center text-sm font-medium text-accent hover:underline"
      >
        ← Materiali di {subject.title}
      </Link>
      <header className="mt-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent">
          {subject.title}
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">
          Studia e ripassa
        </h1>
        <p className="mt-4 leading-8 text-muted">
          Scegli un argomento o ripassa tutto il materiale disponibile. Le
          attività sono già preparate e condivise.
        </p>
      </header>
      {bank ? (
        <>
          <LearnerStudy bank={bank} />
          <details className="mt-10 border-t border-border pt-5 text-sm leading-7 text-muted">
            <summary className="cursor-pointer">Fonti e aggiornamento</summary>
            <p className="mt-3">
              Fonte: {bank.sourceTitle}. Revisione redazionale del{" "}
              {new Intl.DateTimeFormat("it-IT", {
                dateStyle: "medium",
                timeZone: "Europe/Rome",
              }).format(new Date(bank.reviewedAt))}
              . Le attività sono state preparate con AI e controllate dalla
              redazione; possono comunque contenere errori.
            </p>
            {bank.coveredUnits < bank.availableUnits && (
              <p className="mt-3">
                La raccolta è in aggiornamento e copre una parte degli appunti
                attuali. Non rappresenta ancora l’intero programma d’esame.
              </p>
            )}
            <p className="mt-3">Built with Llama.</p>
            <Link
              className="inline-flex min-h-12 items-center underline"
              href={`/risorse/${bank.sourceId}`}
            >
              Leggi gli appunti condivisi
            </Link>
          </details>
        </>
      ) : (
        <section className="mt-8 rounded-2xl border border-border bg-white p-6">
          <h2 className="text-xl font-semibold">Attività in preparazione</h2>
          <p className="mt-3 leading-8 text-muted">
            {outdated
              ? "Gli appunti sono stati aggiornati. La redazione sta riallineando le attività alla nuova versione."
              : "Le attività appariranno qui dopo la revisione e la pubblicazione della redazione."}
          </p>
          <Link
            href={`/insegnamenti/${slug}`}
            className="mt-4 inline-flex min-h-12 items-center font-medium text-accent underline"
          >
            Apri i materiali della materia
          </Link>
        </section>
      )}
    </main>
  );
}
