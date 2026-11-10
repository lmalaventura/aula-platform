"use client";
import { usePathname } from "next/navigation";
export function PageSurface({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="page-surface">
      {children}
    </div>
  );
}
