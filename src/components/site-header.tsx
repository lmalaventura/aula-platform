import Link from "next/link";
import { ContributionDialog } from "./contribution-dialog";
import { SiteNavigation } from "./site-navigation";
import { getSubjects } from "@/lib/catalog";
import { getPublicUploadConfig } from "@/lib/uploads/validation";

export function SiteHeader({ name }: { name: string }) {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href="/" className="wordmark" aria-label={name + " · homepage"}>
          {name}
          <span aria-hidden="true">.</span>
        </Link>
        <nav aria-label="Navigazione principale" className="site-navigation">
          <SiteNavigation />
          <ContributionDialog
            config={getPublicUploadConfig(
              process.env.NEXT_PUBLIC_SUPABASE_URL,
              process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
            )}
            subjects={getSubjects().map(({ slug, title }) => ({ slug, title }))}
          />
        </nav>
      </div>
    </header>
  );
}
