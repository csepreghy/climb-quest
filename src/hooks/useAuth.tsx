import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useActiveSlot } from "@/game/adminAccounts";

interface AuthCtx {
  user: User | null;
  session: Session | null;
  /** True only when the user has the admin role AND is on the "test" slot. */
  isAdmin: boolean;
  /** True whenever the user has the admin role, regardless of active slot. */
  hasAdminRole: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({ user: null, session: null, isAdmin: false, hasAdminRole: false, loading: true, signOut: async () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [hasAdminRole, setHasAdminRole] = useState(false);
  const [loading, setLoading] = useState(true);
  const slot = useActiveSlot(session?.user?.id ?? null);

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

  const isAdmin = hasAdminRole && slot !== "personal";

  return (
    <Ctx.Provider value={{ user: session?.user ?? null, session, isAdmin, hasAdminRole, loading, signOut: async () => { await supabase.auth.signOut(); } }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
