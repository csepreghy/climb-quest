import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GameCard } from "@/components/ui/game-card";
import { GameButton } from "@/components/ui/game-button";
import { toast } from "sonner";

export default function Auth() {
  const nav = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (!loading && user) nav("/home", { replace: true }); }, [user, loading, nav]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Account created");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (e: any) {
      toast.error(e.message ?? "Auth failed");
    } finally { setBusy(false); }
  }

  async function google() {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) toast.error("Google sign-in failed");
  }

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <GameCard tone="accent" className="p-6 w-full max-w-sm space-y-4">
        <div className="text-center">
          <div className="text-2xl">🧗</div>
          <div className="font-display font-bold text-lg">ClimbQuest</div>
          <div className="text-xs text-muted-foreground">{mode === "signin" ? "Sign in to continue" : "Create your account"}</div>
        </div>
        <GameButton type="button" variant="primary" className="w-full" onClick={google}>Continue with Google</GameButton>
        <div className="text-[10px] text-center text-muted-foreground uppercase tracking-wider">or</div>
        <form onSubmit={submit} className="space-y-3">
          <div><Label>Email</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} required /></div>
          <div><Label>Password</Label><Input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} /></div>
          <GameButton type="submit" variant="primary" className="w-full" disabled={busy}>{mode === "signin" ? "Sign in" : "Sign up"}</GameButton>
        </form>
        <button type="button" className="text-xs text-muted-foreground hover:text-foreground w-full text-center" onClick={() => setMode(m => m === "signin" ? "signup" : "signin")}>
          {mode === "signin" ? "Need an account? Sign up" : "Have an account? Sign in"}
        </button>
      </GameCard>
    </div>
  );
}
