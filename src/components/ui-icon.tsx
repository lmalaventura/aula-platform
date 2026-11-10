import type { SVGProps, ReactNode } from "react";

type IconName =
  | "arrow"
  | "search"
  | "book"
  | "file"
  | "layers"
  | "headphones"
  | "spark"
  | "download";
type ExtraIcon = "eye" | "eye-off";
const paths: Record<IconName | ExtraIcon, ReactNode> = {
  eye: (
    <>
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  "eye-off": (
    <>
      <path d="m3 3 18 18M9 5.5c1-.3 2-.5 3-.5 6 0 10 7 10 7a21 21 0 0 1-3 3.8M6 7a23 23 0 0 0-4 5s4 7 10 7c1.7 0 3.2-.5 4.5-1.2M10 10a3 3 0 0 0 4 4" />
    </>
  ),
  arrow: (
    <>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </>
  ),
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m16 16 4 4" />
    </>
  ),
  book: (
    <>
      <path d="M12 5c-3-2-6-2-10-1v15c4-1 7-1 10 1 3-2 6-2 10-1V4c-4-1-7-1-10 1Zm0 0v15" />
    </>
  ),
  file: (
    <>
      <path d="M14 3H5v18h14V8l-5-5Zm0 0v5h5M8 12h8M8 16h6" />
    </>
  ),
  layers: (
    <>
      <path d="m12 3 10 6-10 6L2 9l10-6ZM3 14l9 5 9-5M3 18l9 5 9-5" />
    </>
  ),
  headphones: (
    <>
      <path d="M4 14v-3a8 8 0 0 1 16 0v3M4 13H2v7h5v-7H4Zm16 0h-3v7h5v-7h-2Z" />
    </>
  ),
  spark: (
    <>
      <path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z" />
    </>
  ),
  download: (
    <>
      <path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4" />
    </>
  ),
};
export function UiIcon({
  name,
  ...props
}: SVGProps<SVGSVGElement> & { name: IconName | ExtraIcon }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {paths[name]}
    </svg>
  );
}
