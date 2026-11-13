import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { MobileTabBar, SidebarNav } from "@/components/app/app-nav";
import { UserMenu } from "@/components/app/user-menu";
import { requireUser } from "@/lib/data";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { profile, user } = await requireUser();
  const email = profile.email || user.email || "";

  return (
    <div className="min-h-dvh md:grid md:grid-cols-[240px_1fr]">
      {/* Sidebar desktop */}
      <aside className="sticky top-0 hidden h-dvh flex-col border-r bg-muted/20 p-3 md:flex">
        <div className="flex h-11 items-center px-1.5">
          <Logo href="/dashboard" className="text-sm" />
        </div>
        <div className="mt-4 flex-1">
          <SidebarNav />
        </div>
        <div className="flex items-center gap-1 border-t pt-3">
          <div className="min-w-0 flex-1">
            <UserMenu email={email} companyName={profile.company_name} />
          </div>
          <ThemeToggle />
        </div>
      </aside>

      {/* Barre du haut mobile */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/85 px-4 backdrop-blur-lg md:hidden">
        <Logo href="/dashboard" className="text-sm" />
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <div className="w-10">
            <UserMenu email={email} companyName={profile.company_name} />
          </div>
        </div>
      </header>

      <main className="min-w-0 px-4 pb-28 pt-6 md:px-8 md:pb-12 md:pt-8">
        <div className="mx-auto w-full max-w-6xl">{children}</div>
      </main>

      <MobileTabBar />
    </div>
  );
}
