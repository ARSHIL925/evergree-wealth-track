import mark from "@/assets/evergreen-logo.png.asset.json";

export function EvergreenLogo({ className }: { className?: string }) {
  return (
    <img
      src={mark.url}
      alt="Evergreen logo"
      width={96}
      height={96}
      loading="eager"
      decoding="async"
      className={`inline-block shrink-0 rounded-full object-cover ${className ?? ""}`}
    />
  );
}
