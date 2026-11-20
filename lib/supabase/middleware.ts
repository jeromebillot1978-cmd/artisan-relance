import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PROTECTED_PREFIXES = ["/dashboard", "/devis", "/parametres", "/avis-google", "/statistiques", "/prospection"];
const AUTH_PAGES = ["/connexion", "/inscription", "/mot-de-passe-oublie"];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  // IMPORTANT : ne rien exécuter entre createServerClient et getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const isAuthPage = AUTH_PAGES.includes(pathname);

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/connexion";
    url.search = "";
    url.searchParams.set("next", `${pathname}${search}`);
    const redirect = redirectWithCookies(url, response);
    // Une page privée redirigée ne doit jamais être indexée, même trouvée par un lien externe
    redirect.headers.set("X-Robots-Tag", "noindex, nofollow");
    return redirect;
  }

  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return redirectWithCookies(url, response);
  }

  if (isProtected) response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

function redirectWithCookies(url: URL, from: NextResponse) {
  const redirect = NextResponse.redirect(url);
  from.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}
