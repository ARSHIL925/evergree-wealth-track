import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/blog")({
  component: () => (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1"><Outlet /></main>
      <Footer />
    </div>
  ),
});