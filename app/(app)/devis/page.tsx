import type { Metadata } from "next";
import { getQuotes } from "@/lib/data";
import { PageHeader } from "@/components/app/page-header";
import { QuotesTable } from "@/components/app/quotes-table";
import type { QuoteStatus } from "@/types/database";

export const metadata: Metadata = { title: "Devis" };

const VALID: (QuoteStatus | "all")[] = ["all", "pending", "signed", "lost"];

export default async function QuotesPage({ searchParams }: { searchParams: Promise<{ statut?: string }> }) {
  const [{ statut }, quotes] = await Promise.all([searchParams, getQuotes()]);
  const initialFilter = VALID.includes(statut as QuoteStatus) ? (statut as QuoteStatus | "all") : "all";

  return (
    <>
      <PageHeader title="Devis" description="Ajoutez vos devis, les relances s'occupent du reste." />
      <QuotesTable quotes={quotes} initialFilter={initialFilter} />
    </>
  );
}
