import lightLogo from "@/assets/evergreen-mark-light.png";

export function EvergreenLogo({ className }: { className?: string }) {
  return (
    <img
      src={lightLogo}
      alt="Evergreen logo"
      width={96}
      height={96}
      loading="eager"
      decoding="async"
      className={`inline-block shrink-0 rounded-full object-cover ${className ?? ""}`}
    />
  );
}
