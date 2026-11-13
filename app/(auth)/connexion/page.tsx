import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { SignInForm } from "@/components/auth/sign-in-form";

export const metadata: Metadata = { title: "Connexion" };

const NOTICES: Record<string, string> = {
  confirme: "Adresse confirmée ! Vous pouvez vous connecter.",
  deconnecte: "Vous êtes déconnecté.",
};

const ERRORS: Record<string, string> = {
  lien: "Ce lien est invalide ou a expiré. Réessayez.",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; info?: string; erreur?: string }>;
}) {
  const { next, info, erreur } = await searchParams;

  return (
    <AuthCard
      title="Bon retour 👋"
      description="Connectez-vous pour suivre vos devis."
      footer={
        <>
          Pas encore de compte ?{" "}
          <Link href="/inscription" className="font-medium text-foreground underline-offset-4 hover:underline">
            Créer un compte
          </Link>
        </>
      }
    >
      {erreur && ERRORS[erreur] && (
        <p className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {ERRORS[erreur]}
        </p>
      )}
      <SignInForm next={next} notice={info ? NOTICES[info] : undefined} />
    </AuthCard>
  );
}
