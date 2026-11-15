import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SITE } from "@/lib/site";

/** Barre d'action fixe sur mobile : le bouton d'essai reste toujours à portée de pouce. Sans JavaScript. */
export function MobileCtaBar() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 p-3 backdrop-blur md:hidden">
      <Button asChild variant="brand" className="w-full">
        <Link href={SITE.ctaHref}>{SITE.cta}</Link>
      </Button>
    </div>
  );
}
