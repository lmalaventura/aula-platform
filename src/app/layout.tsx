import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { PageSurface } from "@/components/page-surface";
import { getSiteConfig } from "@/lib/site";
import "./globals.css";
import "./mascot.css";
import "./reader.css";
import "./interface-details.css";

const site = getSiteConfig();
export const metadata: Metadata = {
  title: site.name + " | Studiare, insieme",
  description: site.description,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="it"
      data-scroll-behavior="smooth"
      className="h-full antialiased"
    >
      <body className="flex min-h-full flex-col font-sans">
        <a href="#contenuto" className="skip-link">
          Vai al contenuto
        </a>
        <SiteHeader name={site.name} />
        <PageSurface>{children}</PageSurface>
        <footer className="site-footer">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-7 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <div>
              <Link href="/" className="footer-wordmark">
                {site.name}
                <span aria-hidden="true">.</span>
              </Link>
              <p className="mt-1 max-w-xl text-xs leading-6 text-muted">
                {site.disclaimer}
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
