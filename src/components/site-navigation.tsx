"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
export function SiteNavigation() {
  const pathname = usePathname();
  return (
    <Link
      href="/insegnamenti"
      aria-current={
        pathname.startsWith("/insegnamenti") || pathname.startsWith("/risorse/")
          ? "page"
          : undefined
      }
      className="site-nav-link"
    >
      Insegnamenti
    </Link>
  );
}
