"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, FileText, LayoutDashboard, Send, Settings, Star } from "lucide-react";
import { cn } from "@/lib/utils";

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Tableau de bord", short: "Accueil", icon: LayoutDashboard },
  { href: "/devis", label: "Devis", short: "Devis", icon: FileText },
  { href: "/avis-google", label: "Avis Google", short: "Avis", icon: Star },
  { href: "/parametres", label: "Paramètres", short: "Réglages", icon: Settings },
];

/** Entrées réservées à l'administrateur de la plateforme. */
const ADMIN_ITEMS = [
  { href: "/statistiques", label: "Statistiques", short: "Stats", icon: BarChart3 },
  { href: "/prospection", label: "Prospection", short: "Prospects", icon: Send },
];

const itemsFor = (isAdmin?: boolean) => (isAdmin ? [...NAV_ITEMS, ...ADMIN_ITEMS] : NAV_ITEMS);

function Dot({ count, className }: { count?: number; className?: string }) {
  if (!count) return null;
  return (
    <span
      className={cn("rounded-full bg-sky-600 px-1.5 text-[10px] font-semibold leading-4 text-white tabular-nums", className)}
      aria-label={`${count} message${count > 1 ? "s" : ""} non lu${count > 1 ? "s" : ""}`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

export function SidebarNav({ isAdmin, unread }: { isAdmin?: boolean; unread?: number }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-0.5">
      {itemsFor(isAdmin).map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
              active
                ? "bg-accent font-medium text-foreground"
                : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
            )}
          >
            <item.icon className="h-4 w-4" />
            <span className="flex-1">{item.label}</span>
            {item.href === "/devis" && <Dot count={unread} />}
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileTabBar({ isAdmin, unread }: { isAdmin?: boolean; unread?: number }) {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg md:hidden">
      <div className={cn("grid", isAdmin ? "grid-cols-6" : "grid-cols-4")}>
        {itemsFor(isAdmin).map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center gap-1 py-2.5 text-[11px] transition-colors",
                active ? "text-foreground" : "text-muted-foreground",
              )}
            >
              <item.icon className={cn("h-5 w-5", active && "text-brand")} />
              {item.href === "/devis" && <Dot count={unread} className="absolute left-1/2 top-1 ml-2" />}
              {item.short}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
