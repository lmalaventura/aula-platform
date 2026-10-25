import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { getSiteConfig } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const site = getSiteConfig();

export const metadata: Metadata = {
  title: `${site.name} | Studiare, insieme`,
  description: site.description,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="it"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <a href="#contenuto" className="skip-link">
          Vai al contenuto
        </a>

        <SiteHeader name={site.name} />

        {children}

        <footer className="mt-auto border-t border-border bg-white">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-7 sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:px-8">
            <p className="font-semibold">{site.name}</p>
            <p className="max-w-xl text-sm leading-6 text-muted">
              {site.disclaimer}
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}