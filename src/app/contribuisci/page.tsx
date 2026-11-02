import type { Metadata } from "next";
import { ContributorPanel } from "@/components/contributor-panel";
import { getSubjects } from "@/lib/catalog";
import { getPublicUploadConfig } from "@/lib/uploads/validation";
import { isWebStudyConfigured } from "@/lib/study/web-server";

export const metadata: Metadata = { title: "Contribuisci | Aula", robots: { index: false, follow: false } };

export default function ContributePage() {
  const config = getPublicUploadConfig(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
  return (
    <main id="contenuto" tabIndex={-1} className="mx-auto w-full max-w-6xl flex-1 px-5 py-10 sm:px-8 sm:py-14">
      <p className="text-xs font-semibold uppercase tracking-widest text-accent">Area collaboratori</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Uno spazio per i tuoi contributi.</h1>
      <p className="mt-4 max-w-2xl leading-7 text-muted">Carica i tuoi appunti e studia con quiz e flashcard generati dalle fonti. I contributi e le attività rimangono nel tuo archivio riservato.</p>
      {config ? <ContributorPanel config={config} studyEnabled={isWebStudyConfigured()} subjects={getSubjects().map(({ slug, title }) => ({ slug, title }))} /> : (
        <p role="status" className="mt-8 rounded-2xl border border-border bg-white p-6">L’area collaboratori non è ancora attiva. Puoi continuare a consultare i materiali pubblici dal menu.</p>
      )}
      <noscript><p className="mt-6">Per accedere e caricare file in quest’area è necessario JavaScript. I materiali pubblici restano consultabili dal menu.</p></noscript>
    </main>
  );
}
