import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import lightLogo from "@/assets/evergreen-mark-light.png";
import darkLogo from "@/assets/evergreen-mark-dark.png";

export function EvergreenLogo({ className }: { className?: string }) {
  const { resolvedTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = (mounted ? resolvedTheme : theme) === "dark";
  const src = isDark ? darkLogo : lightLogo;

  return (
    <img
      src={src}
      alt="Evergreen logo"
      width={96}
      height={96}
      loading="eager"
      decoding="async"
      className={`inline-block shrink-0 rounded-full object-cover ${className ?? ""}`}
    />
  );
}
