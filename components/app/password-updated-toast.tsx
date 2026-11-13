"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

/** Affiche un toast après la réinitialisation du mot de passe puis nettoie l'URL. */
export function PasswordUpdatedToast() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (params.get("motdepasse") === "ok") {
      toast.success("Mot de passe mis à jour.");
      router.replace(pathname);
    }
  }, [params, router, pathname]);

  return null;
}
