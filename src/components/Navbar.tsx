import { Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, X, User as UserIcon, LogOut, UserCircle2, Settings, Languages, ShieldCheck } from "lucide-react";
import { EvergreenLogo } from "./EvergreenLogo";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";

type NavItem = { to: string; label: string; auth?: boolean };

type LangCode = "en" | "hi" | "es" | "fr" | "ar" | "bn" | "ta" | "zh";
const LANGS: Record<LangCode, { native: string; label: string }> = {
  en: { native: "English", label: "English" },
  hi: { native: "हिन्दी", label: "Hindi" },
  es: { native: "Español", label: "Spanish" },
  fr: { native: "Français", label: "French" },
  ar: { native: "العربية", label: "Arabic" },
  bn: { native: "বাংলা", label: "Bengali" },
  ta: { native: "தமிழ்", label: "Tamil" },
  zh: { native: "中文", label: "Chinese" },
};
const navItems: NavItem[] = [
  { to: "/", label: "Home" },
  { to: "/dashboard", label: "Dashboard", auth: true },
  { to: "/expenses", label: "Expenses", auth: true },
  { to: "/budget", label: "Budget", auth: true },
  { to: "/calculator", label: "Calculator", auth: true },
  { to: "/subscriptions", label: "Plans", auth: true },
  { to: "/how-it-works", label: "How it works" },
  { to: "/blog", label: "Blog" },
];

export function Navbar() {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setAuthed(!!data.session);
      setEmail(data.session?.user.email ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setAuthed(!!s);
      setEmail(s?.user.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const items = navItems.filter((i) => !i.auth || authed);
  const initial = (email?.[0] ?? "U").toUpperCase();
  const [lang, setLang] = useState<LangCode>(() => {
    if (typeof window === "undefined") return "en";
    const v = localStorage.getItem("evergreen_lang") as LangCode | null;
    return v && v in LANGS ? v : "en";
  });
  const pickLang = (next: LangCode) => {
    setLang(next);
    if (typeof window === "undefined") return;
    localStorage.setItem("evergreen_lang", next);
    // Notify same-tab listeners (storage event only fires cross-tab).
    window.dispatchEvent(new CustomEvent("evergreen:lang", { detail: next }));
  };
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "evergreen_lang" && e.newValue && e.newValue in LANGS) setLang(e.newValue as LangCode);
    };
    const onCustom = (e: Event) => {
      const detail = (e as CustomEvent).detail as LangCode | undefined;
      if (detail && detail in LANGS) setLang(detail);
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("evergreen:lang", onCustom as EventListener);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("evergreen:lang", onCustom as EventListener);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2.5">
          <EvergreenLogo className="h-10 w-10 shrink-0" />
          <span className="font-display text-2xl font-semibold tracking-tight text-emerald-900 dark:text-emerald-50 sm:text-[1.6rem]">
            Evergreen
          </span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {items.map((i) => (
            <Link
              key={i.to}
              to={i.to as never}
              className="rounded-full px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              activeProps={{ className: "rounded-full px-3 py-2 text-sm bg-muted text-foreground font-medium" }}
            >
              {i.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {authed ? (
            <>
            <div className="hidden sm:block"><ThemeToggle /></div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  aria-label="Account menu"
                  className="grid h-9 w-9 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground shadow-soft ring-1 ring-primary/40 transition-transform hover:scale-105 active:scale-95"
                >
                  {initial}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate text-xs font-normal text-muted-foreground">
                  {email ?? "Signed in"}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="flex w-full items-center gap-2">
                    <UserCircle2 className="h-4 w-4" /> Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="flex w-full items-center gap-2">
                    <Settings className="h-4 w-4" /> Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Languages className="mr-2 h-4 w-4" /> Language
                    <span className="ml-auto text-xs text-muted-foreground">{LANGS[lang].native}</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-48">
                    {(Object.keys(LANGS) as LangCode[]).map((code) => (
                      <DropdownMenuItem key={code} onSelect={(e) => { e.preventDefault(); pickLang(code); }}
                        className={code === lang ? "bg-muted" : ""}>
                        <span className="flex-1">{LANGS[code].native}</span>
                        <span className="ml-2 text-[11px] text-muted-foreground">{LANGS[code].label}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuItem asChild>
                  <Link to="/security" className="flex w-full items-center gap-2">
                    <ShieldCheck className="h-4 w-4" /> Security
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={async () => {
                    await supabase.auth.signOut();
                    router.navigate({ to: "/" });
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            </>
          ) : (
            <Link to="/auth" className="hidden md:inline-flex"><Button size="sm">Sign in</Button></Link>
          )}
          <Button variant="ghost" size="icon" className="md:hidden" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen((v) => !v)}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>
      {open && (
        <div className="border-t border-border/60 md:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3">
            {items.map((i) => (
              <Link
                key={i.to}
                to={i.to as never}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm hover:bg-muted"
              >
                {i.label}
              </Link>
            ))}
            {authed && (
              <>
                <Link to="/profile" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm hover:bg-muted flex items-center gap-2">
                  <UserIcon className="h-4 w-4" /> Profile
                </Link>
                <Link to="/security" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm hover:bg-muted flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" /> Security
                </Link>
                <div className="px-3 py-2">
                  <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <Languages className="h-4 w-4" /> Language
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(Object.keys(LANGS) as LangCode[]).map((code) => (
                      <button key={code} onClick={() => pickLang(code)}
                        className={`rounded-full border px-2.5 py-1 text-xs ${code === lang ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground"}`}>
                        {LANGS[code].native}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="px-3 py-2"><ThemeToggle /></div>
                <button
                  onClick={async () => { setOpen(false); await supabase.auth.signOut(); router.navigate({ to: "/" }); }}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-destructive hover:bg-muted"
                >
                  <LogOut className="h-4 w-4" /> Sign out
                </button>
              </>
            )}
            {!authed && (
              <Link to="/auth" onClick={() => setOpen(false)} className="mt-3 border-t border-border/60 pt-3">
                <Button className="w-full">Sign in</Button>
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}