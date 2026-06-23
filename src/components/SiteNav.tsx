import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export function SiteNav({ inverted = false }: { inverted?: boolean }) {
  return (
    <nav className={`flex items-center justify-between px-6 md:px-10 py-5 ${inverted ? "text-white" : "text-foreground"}`}>
      <Link to="/" className="flex items-center gap-2 font-display text-xl tracking-tight">
        <span className="grid h-7 w-7 place-items-center rounded-md bg-accent text-accent-foreground">
          <Sparkles className="h-4 w-4" />
        </span>
        SquareYards <span className="opacity-60">AI</span>
      </Link>
      <div className="flex items-center gap-4 text-sm">
        <Link to="/" className="hover:opacity-70" activeOptions={{ exact: true }}>Home</Link>
        <Link to="/spaces" className="hidden sm:inline hover:opacity-70">My Spaces</Link>
        <Link to="/new">
          <Button size="sm" variant="default" className="rounded-full">New Project</Button>
        </Link>
      </div>
    </nav>
  );
}
