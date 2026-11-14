import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getCampaigns } from "@/lib/data";
import { FILTERS, type FilterKey } from "@/lib/campaigns/constants";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/app/page-header";
import { CampaignsList } from "@/components/campaigns/campaigns-list";

export const metadata: Metadata = { title: "Devis" };

export default async function DevisPage({ searchParams }: { searchParams: Promise<{ filtre?: string }> }) {
  const [{ filtre }, campaigns] = await Promise.all([searchParams, getCampaigns()]);
  const initial = FILTERS.some((f) => f.key === filtre) ? (filtre as FilterKey) : "all";

  return (
    <>
      <PageHeader
        title="Devis"
        description="Chaque devis envoyé est suivi et relancé automatiquement."
        actions={
          <Button asChild variant="brand" className="hidden md:inline-flex">
            <Link href="/devis/nouveau">
              <Plus /> Envoyer un devis
            </Link>
          </Button>
        }
      />
      <CampaignsList campaigns={campaigns} initialFilter={initial} />
    </>
  );
}
