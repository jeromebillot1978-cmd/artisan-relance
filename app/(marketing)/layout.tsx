import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { MobileCtaBar } from "@/components/marketing/mobile-cta-bar";
import { SiteJsonLd } from "@/components/seo/json-ld";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteJsonLd />
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <MobileCtaBar />
    </div>
  );
}
