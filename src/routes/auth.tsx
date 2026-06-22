import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { SiteNav } from "@/components/SiteNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Toaster } from "sonner";
import hero from "@/assets/hero-living.jpg";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [{ title: "Sign in — SquareYards AI" }],
  }),
  component: AuthPage,
});

function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) router.navigate({ to: "/spaces" });
    });
  }, [router]);

  async function emailAuth(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "up") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: name },
          },
        });
        if (error) throw error;
        toast.success("Welcome — check your email if confirmation is enabled.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      router.navigate({ to: "/spaces" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function google() {
    try {
      const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
      if (r.error) { toast.error("Google sign-in failed"); return; }
      if (r.redirected) return;
      router.navigate({ to: "/spaces" });
    } catch (e) {
      toast.error("Google sign-in failed");
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Toaster richColors position="top-center" />
      <SiteNav />
      <div className="grid min-h-[calc(100vh-80px)] lg:grid-cols-2">
        <div className="hidden lg:block relative overflow-hidden">
          <img src={hero} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-walnut/70 via-walnut/10 to-transparent" />
          <div className="absolute bottom-10 left-10 right-10 text-background">
            <p className="text-xs uppercase tracking-[0.2em] opacity-80">SquareYards AI</p>
            <h2 className="font-display text-4xl mt-2 max-w-md">A calm, sunlit home is one conversation away.</h2>
          </div>
        </div>
        <div className="flex items-center justify-center p-8">
          <form onSubmit={emailAuth} className="w-full max-w-sm">
            <h1 className="font-display text-3xl">{mode === "in" ? "Welcome back" : "Create your account"}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{mode === "in" ? "Sign in to access your design spaces." : "Save projects, renders, and BOQs."}</p>

            <Button type="button" onClick={google} variant="outline" className="mt-6 w-full rounded-full">
              Continue with Google
            </Button>
            <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-wider text-muted-foreground">
              <span className="flex-1 h-px bg-border" />or<span className="flex-1 h-px bg-border" />
            </div>
            {mode === "up" && (
              <div className="mb-3">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
              </div>
            )}
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 mb-3" />
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1" />
            <Button disabled={loading} type="submit" className="mt-5 w-full rounded-full">
              {loading ? "…" : mode === "in" ? "Sign in" : "Create account"}
            </Button>
            <button
              type="button"
              onClick={() => setMode(mode === "in" ? "up" : "in")}
              className="mt-4 w-full text-sm text-muted-foreground hover:text-foreground"
            >
              {mode === "in" ? "No account? Sign up" : "Already have an account? Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
