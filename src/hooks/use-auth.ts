import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null));
    return () => data.subscription.unsubscribe();
  }, []);
  return { user, loading };
}

export function useProfile() {
  const { user } = useUser();
  return useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();
      return data;
    },
  });
}

export function useIsAdmin() {
  const { user } = useUser();
  return useQuery({
    queryKey: ["is-admin", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [{ data: isAdmin, error: adminError }, { data: isSuperAdmin, error: superAdminError }] =
        await Promise.all([
          supabase.rpc("has_role", { _user_id: user!.id, _role: "admin" }),
          supabase.rpc("is_super_admin", { _user_id: user!.id }),
        ]);
      if (adminError && superAdminError) throw adminError;
      return !!isAdmin || !!isSuperAdmin;
    },
  });
}
