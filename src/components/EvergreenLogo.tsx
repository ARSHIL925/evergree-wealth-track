export function EvergreenLogo({ className }: { className?: string }) {
  return (
    <img
      src="/evergreen-mark.png"
      alt="Evergreen logo"
      width={96}
      height={96}
      loading="eager"
      decoding="async"
      className={`inline-block shrink-0 object-contain dark:brightness-125 ${className ?? ""}`}
    />
  );
}
