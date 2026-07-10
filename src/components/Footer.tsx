import { Link } from "@tanstack/react-router";
export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-muted/30">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row">
        <p>© {new Date().getFullYear()} Evergreen Wealth Track.</p>
        <div className="flex items-center gap-4">
          <Link to="/blog" className="hover:text-foreground">Blog</Link>
          <Link to="/security" className="hover:text-foreground">Security</Link>
          <Link to="/auth" className="hover:text-foreground">Sign in</Link>
        </div>
      </div>
    </footer>
  );
}