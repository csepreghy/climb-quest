import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AuthCtx {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  /** Backwards-compat alias — same as isAdmin now that there is no slot concept. */
  hasAdminRole: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({ user: null, session: null, isAdmin: false, hasAdminRole: false, loading: true, signOut: async () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [hasAdminRole, setHasAdminRole] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkArchived = async (userId: string): Promise<boolean> => {
      const { data } = await supabase
        .from("profiles")
        .select("archived_at")
        .eq("id", userId)
        .maybeSingle();
      if (data?.archived_at) {
        await supabase.auth.signOut();
        setSession(null);
        setHasAdminRole(false);
        toast.error("Your account is unavailable", {
          description: "Please contact an administrator if you believe this is a mistake.",
        });
        return true;
      }
      return false;
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (s?.user) {
        setTimeout(async () => {
          const archived = await checkArchived(s.user.id);
          if (archived) return;
          supabase.rpc("has_role", { _user_id: s.user.id, _role: "admin" })
            .then(({ data }) => setHasAdminRole(!!data));
        }, 0);
      } else setHasAdminRole(false);
    });
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      if (data.session?.user) {
        const archived = await checkArchived(data.session.user.id);
        if (!archived) {
          supabase.rpc("has_role", { _user_id: data.session.user.id, _role: "admin" })
            .then(({ data }) => setHasAdminRole(!!data));
        }
      }
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <Ctx.Provider value={{ user: session?.user ?? null, session, isAdmin: hasAdminRole, hasAdminRole, loading, signOut: async () => { await supabase.auth.signOut(); } }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
