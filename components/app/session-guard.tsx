"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Plusieurs comptes dans le même navigateur : la session est commune à tous les onglets.
 * Si un autre onglet a changé de compte (ou s'est déconnecté), cet onglet se recharge
 * dès qu'il redevient visible, pour ne jamais afficher ni modifier les devis d'un autre compte.
 */
export function SessionGuard({ userId }: { userId: string }) {
  useEffect(() => {
    const supabase = createClient();
    let reloading = false;
    const reload = () => {
      // garde-fou anti-boucle : au plus un rechargement toutes les 10 secondes
      try {
        const last = Number(sessionStorage.getItem("ar-session-reload") ?? 0);
        if (Date.now() - last < 10_000) return;
        sessionStorage.setItem("ar-session-reload", String(Date.now()));
      } catch {
        /* stockage indisponible : on recharge quand même */
      }
      reloading = true;
      window.location.reload();
    };
    const check = async () => {
      if (reloading || document.visibilityState !== "visible") return;
      const { data } = await supabase.auth.getSession();
      if ((data.session?.user.id ?? null) !== userId) reload();
    };
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (reloading) return;
      if (event === "SIGNED_OUT" || (session && session.user.id !== userId)) reload();
    });
    document.addEventListener("visibilitychange", check);
    window.addEventListener("focus", check);
    return () => {
      sub.subscription.unsubscribe();
      document.removeEventListener("visibilitychange", check);
      window.removeEventListener("focus", check);
    };
  }, [userId]);
  return null;
}
