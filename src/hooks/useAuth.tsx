import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

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
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (s?.user) {
        setTimeout(() => {
          supabase.rpc("has_role", { _user_id: s.user.id, _role: "admin" })
            .then(({ data }) => setHasAdminRole(!!data));
        }, 0);
      } else setHasAdminRole(false);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) {
        supabase.rpc("has_role", { _user_id: data.session.user.id, _role: "admin" })
          .then(({ data }) => setHasAdminRole(!!data));
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
