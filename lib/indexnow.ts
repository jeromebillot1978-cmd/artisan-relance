import "server-only";
import sitemap from "@/app/sitemap";
import { siteUrl } from "@/lib/utils";

/**
 * IndexNow : prévient Bing (et Yandex, Seznam, Naver…) qu'une page a été créée ou modifiée,
 * sans attendre leur passage. Bing alimente Copilot et sert de source à ChatGPT.
 * La clé est publique par nature : elle est aussi servie à la racine du site
 * (public/<clé>.txt) pour prouver que le site nous appartient.
 */
export const INDEXNOW_KEY = "eefa3b788e4647d5bec121df4075c02e";

/** Adresses du sitemap modifiées depuis `days` jours (toutes si days = null). */
export function changedUrls(days: number | null): string[] {
  const since = days === null ? 0 : Date.now() - days * 86_400_000;
  return sitemap()
    .filter((p) => !p.lastModified || new Date(p.lastModified).getTime() >= since)
    .map((p) => p.url);
}

export async function submitToIndexNow(urls: string[]) {
  if (!urls.length) return { status: 0, submitted: 0 };
  const host = new URL(siteUrl()).host;
  const res = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host,
      key: INDEXNOW_KEY,
      keyLocation: `${siteUrl()}/${INDEXNOW_KEY}.txt`,
      urlList: urls.slice(0, 10_000),
    }),
  });
  // 200 = reçu, 202 = reçu (clé en cours de vérification) ; 4xx = clé ou adresses refusées
  return { status: res.status, submitted: urls.length };
}
