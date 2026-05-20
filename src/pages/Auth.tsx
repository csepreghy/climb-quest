import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import logoImg from "@/assets/climbquest-logo.png";
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

  async function apple() {
    const r = await lovable.auth.signInWithOAuth("apple", { redirect_uri: window.location.origin });
    if (r.error) toast.error("Apple sign-in failed");
  }

  return (
    <div className="min-h-screen grid place-items-center p-6 relative">
      <Link to="/" className="absolute top-4 left-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to home
      </Link>
      <GameCard tone="accent" className="p-6 w-full max-w-sm space-y-6">
        <div className="text-center space-y-3">
          <Link to="/" aria-label="ClimbQuest home" className="inline-block">
            <img src={logoImg} alt="ClimbQuest" className="h-28 w-auto mx-auto drop-shadow-[0_2px_6px_hsl(0_0%_0%/0.55)]" />
          </Link>
        </div>
        <GameButton type="button" variant="primary" className="w-full mt-4" onClick={google}>Sign in with Google</GameButton>
        <GameButton type="button" variant="secondary" className="w-full" onClick={apple}>Sign in with Apple</GameButton>
        <div className="text-[10px] text-center text-muted-foreground uppercase tracking-wider my-4">or</div>
        <form onSubmit={submit} className="space-y-3">
          <div><Label>Email</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} required /></div>
          <div><Label>Password</Label><Input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} /></div>
          <GameButton type="submit" variant="primary" className="w-full" disabled={busy}>{mode === "signin" ? "Sign in" : "Sign up"}</GameButton>
        </form>
        <button type="button" className="text-xs text-muted-foreground hover:text-foreground w-full text-center mt-4" onClick={() => setMode(m => m === "signin" ? "signup" : "signin")}>
          {mode === "signin" ? "Need an account? Sign up" : "Have an account? Sign in"}
        </button>
      </GameCard>
    </div>
  );
}
