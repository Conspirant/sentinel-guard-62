import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "./supabase";
import { canAction, canRoute, type Action, type RouteKey } from "./permissions";

export type Role =
  | "super_admin"
  | "institution_admin"
  | "lab_supervisor"
  | "faculty"
  | "technician"
  | "student";

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: "Super Admin",
  institution_admin: "Institution Admin",
  lab_supervisor: "Laboratory Supervisor",
  faculty: "Faculty",
  technician: "Technician",
  student: "Student (Read-only)",
};

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  initials: string;
}

interface AuthCtx {
  user: User | null;
  loading: boolean;
  login: (email: string, role: Role, password?: string) => Promise<void>;
  logout: () => Promise<void>;
  can: (action: Action) => boolean;
  canVisit: (route: RouteKey) => boolean;
}

const Ctx = createContext<AuthCtx | null>(null);
const KEY = "sentinelg.auth";

function readStored(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => readStored());
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // 1. Initial Supabase session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const u = formatSupabaseUser(session.user);
        setUser(u);
        localStorage.setItem(KEY, JSON.stringify(u));
      } else {
        const stored = readStored();
        if (stored) setUser(stored);
      }
      setLoading(false);
    });

    // 2. Subscribe to Supabase Auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const u = formatSupabaseUser(session.user);
        setUser(u);
        localStorage.setItem(KEY, JSON.stringify(u));
      } else {
        const stored = readStored();
        if (!stored) setUser(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  function formatSupabaseUser(sbUser: { id: string; email?: string; user_metadata?: Record<string, unknown> }): User {
    const email = sbUser.email || "operator@sentinel-g.io";
    const metaRole = (sbUser.user_metadata?.role as Role) || "lab_supervisor";
    const name =
      (sbUser.user_metadata?.name as string) ||
      email.split("@")[0].replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) ||
      "Operator";

    return {
      id: sbUser.id,
      email,
      role: metaRole,
      name,
      initials: name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase(),
    };
  }

  const login: AuthCtx["login"] = async (email, role, password = "demoPassword123!") => {
    const name = email.split("@")[0].replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || "Operator";
    const initials = name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();

    try {
      // Attempt Supabase Auth login
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // If login fails (e.g. user not created yet in Supabase Auth), attempt sign up
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name, role },
          },
        });

        if (!signUpError && signUpData.user) {
          const u: User = { id: signUpData.user.id, email, role, name, initials };
          setUser(u);
          localStorage.setItem(KEY, JSON.stringify(u));
          await syncProfileToSupabase(u);
          return;
        }
      } else if (data.user) {
        const u = formatSupabaseUser(data.user);
        u.role = role; // update role if explicitly selected
        setUser(u);
        localStorage.setItem(KEY, JSON.stringify(u));
        await syncProfileToSupabase(u);
        return;
      }
    } catch (err) {
      console.warn("Supabase Auth sync fallback:", err);
    }

    // Local fallback user if offline / unconfirmed email
    const u: User = {
      id: crypto.randomUUID(),
      email,
      role,
      name,
      initials,
    };
    localStorage.setItem(KEY, JSON.stringify(u));
    setUser(u);
  };

  const syncProfileToSupabase = async (u: User) => {
    try {
      await supabase.from("profiles").upsert(
        {
          id: u.id,
          email: u.email,
          name: u.name,
          role: u.role,
          initials: u.initials,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );
    } catch {
      // ignore offline fallback
    }
  };

  const logout: AuthCtx["logout"] = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn("Supabase signOut error:", err);
    }
    localStorage.removeItem(KEY);
    setUser(null);
  };

  const can: AuthCtx["can"] = (action) => {
    if (!user) return false;
    return canAction(user.role, action);
  };

  const canVisit: AuthCtx["canVisit"] = (route) => {
    if (!user) return false;
    return canRoute(user.role, route);
  };

  return <Ctx.Provider value={{ user, loading, login, logout, can, canVisit }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used inside AuthProvider");
  return c;
}
