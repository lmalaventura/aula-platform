import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StudySession } from "@/components/study-session";
import { getSubjectBySlug, getSubjects } from "@/lib/catalog";
import { getSiteConfig } from "@/lib/site";
import { getStudyCollections } from "@/lib/study/catalog";

type Props = { params: Promise<{ slug: string }> };
export const dynamicParams = false;
export function generateStaticParams() {
  return getSubjects().map((subject) => ({ slug: subject.slug }));
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const subject = getSubjectBySlug((await params).slug);
  return { title: `Studia e ripassa: ${subject?.title ?? "Materia non trovata"} | ${getSiteConfig().name}` };
}

export default async function StudyPage({ params }: Props) {
  const { slug } = await params;
  const subject = getSubjectBySlug(slug);
  if (!subject) notFound();
  const { collections, outdated } = getStudyCollections(slug);
  return (
    <main id="contenuto" tabIndex={-1} className="mx-auto w-full max-w-4xl flex-1 px-5 py-10 sm:px-8 sm:py-14">
      <Link href={`/insegnamenti/${slug}`} className="inline-flex min-h-12 items-center text-sm font-medium text-accent hover:underline">← Torna a {subject.title}</Link>
      <header className="mt-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent">{subject.title}</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">Studia e ripassa</h1>
        <p className="mt-4 text-base leading-8 text-muted">Attività preparate dagli appunti. Parti da ciò che sai, prova a rispondere e confronta le spiegazioni con le fonti.</p>
      </header>
      {outdated > 0 && <p className="mt-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm leading-7">Alcune attività richiedono un aggiornamento e sono temporaneamente escluse. I documenti originali restano disponibili nella pagina della materia.</p>}
      {collections.length === 0 ? (
        <section aria-labelledby="empty-title" className="mt-8 rounded-2xl border border-dashed border-border bg-white p-6">
          <h2 id="empty-title" className="text-xl font-semibold">Nessuna attività disponibile per ora</h2>
          <p className="mt-3 leading-8 text-muted">Le attività compariranno qui dopo la preparazione dei materiali. Nel frattempo puoi consultare gli appunti originali.</p>
          <Link href={`/insegnamenti/${slug}`} className="mt-4 inline-flex min-h-12 items-center font-medium text-accent underline">Apri i materiali della materia</Link>
        </section>
      ) : collections.map(({ kit, resource }) => (
        <section key={kit.resourceId} aria-labelledby={`kit-${kit.resourceId}`} className="mt-10 border-t border-border pt-8">
          <h2 id={`kit-${kit.resourceId}`} className="text-2xl font-semibold leading-9">{kit.title}</h2>
          <p className="mt-3 leading-8 text-muted">{kit.summary}</p>
          <p className="mt-4 text-sm leading-7 text-muted">Fonte: {resource.title}. Pagine fisiche del PDF: {kit.sourcePages.map((source) => source.page).join(", ")}. Questa raccolta copre soltanto questi passaggi, non l’intero corso.</p>
          <p className="mt-2 text-xs leading-6 text-muted">Built with Llama · Generato con Llama 3.3 su Cloudflare il {new Intl.DateTimeFormat("it-IT", { dateStyle: "medium", timeZone: "Europe/Rome" }).format(new Date(kit.generatedAt))}. Revisione disciplinare non attestata.</p>
          <Link href={`/risorse/${resource.id}`} className="mt-3 inline-flex min-h-12 items-center text-sm font-medium text-accent underline">Leggi il documento originale</Link>
          <StudySession flashcards={kit.flashcards} quiz={kit.quiz} fileUrl={resource.fileUrl} />
        </section>
      ))}
    </main>
  );
}
