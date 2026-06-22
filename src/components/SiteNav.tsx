import { Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export function SiteNav({ inverted = false }: { inverted?: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setEmail(s?.user?.email ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    router.navigate({ to: "/" });
  }

  return (
    <nav className={`flex items-center justify-between px-6 md:px-10 py-5 ${inverted ? "text-white" : "text-foreground"}`}>
      <Link to="/" className="flex items-center gap-2 font-display text-xl tracking-tight">
        <span className="grid h-7 w-7 place-items-center rounded-md bg-accent text-accent-foreground">
          <Sparkles className="h-4 w-4" />
        </span>
        SquareYards <span className="opacity-60">AI</span>
      </Link>
      <div className="flex items-center gap-3 text-sm">
        {email ? (
          <>
            <Link to="/spaces" className="hidden sm:inline hover:opacity-70">My Spaces</Link>
            <Link to="/new">
              <Button size="sm" variant="default" className="rounded-full">New Project</Button>
            </Link>
            <button onClick={signOut} className="hidden sm:inline opacity-70 hover:opacity-100">Sign out</button>
          </>
        ) : (
          <>
            <Link to="/auth" className="opacity-80 hover:opacity-100">Sign in</Link>
            <Link to="/auth">
              <Button size="sm" className="rounded-full">Start a project</Button>
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
