import Link from "next/link";
import { Fragment } from "react";

/**
 * Texte avec liens internes contextuels. Syntaxe dans les contenus : [texte de l'ancre](/chemin).
 * Seuls les chemins internes (commençant par « / ») deviennent des liens : un lien externe
 * reste du texte brut. Rendu serveur, sans JavaScript.
 */
const LINK = /\[([^\]]+)\]\((\/[^)\s]*)\)/g;

export function RichText({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(LINK)) {
    const i = m.index ?? 0;
    if (i > last) parts.push(text.slice(last, i));
    parts.push(
      <Link key={i} href={m[2]} className="font-medium text-foreground underline decoration-brand/50 underline-offset-4 hover:decoration-brand">
        {m[1]}
      </Link>,
    );
    last = i + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <Fragment>{parts}</Fragment>;
}
