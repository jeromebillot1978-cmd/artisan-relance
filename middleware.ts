import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

// Le middleware (qui interroge Supabase) ne tourne que là où une session compte :
// les pages marketing restent statiques et rapides.
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/devis/:path*",
    "/parametres/:path*",
    "/connexion",
    "/inscription",
    "/mot-de-passe-oublie",
    "/reinitialiser-mot-de-passe",
  ],
};
