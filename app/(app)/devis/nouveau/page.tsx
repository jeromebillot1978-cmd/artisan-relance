import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/data";
import { PageHeader } from "@/components/app/page-header";
import { CampaignForm } from "@/components/campaigns/campaign-form";

export const metadata: Metadata = { title: "Envoyer un devis" };

export default async function NewDevisPage() {
  const { user, profile } = await requireUser();
  return (
    <>
      <Link href="/devis" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Devis
      </Link>
      <PageHeader title="Envoyer un devis" description="Le devis part tout de suite, les relances suivent toutes seules." />
      {!profile.company_name && (
        <p className="mb-4 rounded-lg border border-brand/40 bg-brand/5 p-3 text-sm">
          Renseignez d'abord le nom de votre entreprise dans{" "}
          <Link href="/parametres" className="font-medium underline">
            Paramètres
          </Link>{" "}
          : il apparaît comme expéditeur.
        </p>
      )}
      <CampaignForm userId={user.id} companyName={profile.company_name} />
    </>
  );
}
