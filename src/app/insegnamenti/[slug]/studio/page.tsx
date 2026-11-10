import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { BrandIllustration } from "@/components/brand-illustration";
import { StudyModes } from "@/components/study-modes";
import { getPublishedTools } from "@/lib/learning-tools/published";
import { getSubjectBySlug, getSubjects } from "@/lib/catalog";
import { getPublishedBank } from "@/lib/study/published";
import { getSiteConfig } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };
export const dynamicParams = false;
export function generateStaticParams() {
  return getSubjects().map(({ slug }) => ({ slug }));
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const subject = getSubjectBySlug((await params).slug);
  return {
    title:
      "Studia: " +
      (subject?.title ?? "Materia non trovata") +
      " | " +
      getSiteConfig().name,
  };
}
export default async function StudyPage({ params }: Props) {
  if (process.env.NODE_ENV === "development") await connection();
  const { slug } = await params,
    subject = getSubjectBySlug(slug);
  if (!subject) notFound();
  const { bank, outdated } = getPublishedBank(slug);
  const { tools, outdated: outdatedTools } = getPublishedTools(slug);
  return (
    <main
      id="contenuto"
      tabIndex={-1}
      className="page-container study-workspace !max-w-4xl"
    >
      <Link href={"/insegnamenti/" + slug} className="breadcrumb-link">
        ← {subject.title}
      </Link>
      <header className="editorial-header">
        <div>
          <p className="eyebrow">{subject.title}</p>
          <h1 className="page-title">
            Trova il tuo ritmo<span className="text-terracotta">.</span>
          </h1>
          <p className="page-description">
            Scegli un’attività e gli argomenti su cui concentrarti.
          </p>
        </div>
      </header>
      {bank || tools.length ? (
        <>
          {bank && bank.coveredUnits < bank.availableUnits && (
            <p className="coverage-note">
              Raccolta parziale: le attività coprono una parte degli appunti
              disponibili, non l’intero programma d’esame.
            </p>
          )}
          <StudyModes bank={bank} tools={tools} />
          {(outdated || outdatedTools > 0) && (
            <p className="mt-6 text-sm leading-7 text-muted">
              Alcuni strumenti sono in aggiornamento dopo la modifica degli
              appunti.
            </p>
          )}
        </>
      ) : (
        <section className="empty-study">
          <BrandIllustration />
          <div>
            <h2 className="text-2xl">Qui stiamo preparando il ripasso.</h2>
            <p className="mt-3 text-sm leading-7 text-muted">
              {outdated || outdatedTools > 0
                ? "Gli appunti sono cambiati: le attività devono essere aggiornate e revisionate."
                : "Gli strumenti appariranno dopo la preparazione e la revisione dei contenuti."}
            </p>
            <Link
              href={"/insegnamenti/" + slug}
              className="button-primary mt-5"
            >
              Intanto, apri i materiali
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}
