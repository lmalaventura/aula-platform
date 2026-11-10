import Image from "next/image";
const art = {
  desk: { src: "/brand/study-desk.png", width: 1536, height: 1024 },
  companion: { src: "/brand/paper-companion.png", width: 1254, height: 1254 },
  hanging: { src: "/brand/mascot-hanging.png", width: 1254, height: 1254 },
  listening: { src: "/brand/mascot-listening.png", width: 1254, height: 1254 },
  map: { src: "/brand/mascot-map.png", width: 1254, height: 1254 },
};
export type BrandPose = keyof typeof art;
export function BrandIllustration({
  kind = "companion",
  className = "",
  preload = false,
}: {
  kind?: BrandPose;
  className?: string;
  preload?: boolean;
}) {
  return (
    <Image
      {...art[kind]}
      alt=""
      sizes={
        kind === "desk"
          ? "(max-width: 640px) 260px, 440px"
          : "(max-width: 640px) 100px, 160px"
      }
      preload={preload}
      className={className}
    />
  );
}
