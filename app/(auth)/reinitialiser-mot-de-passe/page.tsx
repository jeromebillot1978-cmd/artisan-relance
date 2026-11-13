import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { getUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Nouveau mot de passe" };

export default async function ResetPasswordPage() {
  const { user } = await getUser();
  if (!user) redirect("/mot-de-passe-oublie");

  return (
    <AuthCard title="Nouveau mot de passe" description="Choisissez un mot de passe d'au moins 8 caractères.">
      <ResetPasswordForm />
    </AuthCard>
  );
}
