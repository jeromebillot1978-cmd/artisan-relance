"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export function EmailPreview({
  emails,
}: {
  emails: { key: string; label: string; subject: string; html: string }[];
}) {
  const [active, setActive] = useState(emails[0]?.key);
  const current = emails.find((e) => e.key === active) ?? emails[0];
  if (!current) return null;

  return (
    <div className="space-y-3">
      <div className="flex gap-1">
        {emails.map((e) => (
          <button
            key={e.key}
            type="button"
            onClick={() => setActive(e.key)}
            className={cn(
              "rounded-full border px-3 py-1 text-sm transition-colors",
              active === e.key
                ? "border-foreground/20 bg-accent font-medium"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {e.label}
          </button>
        ))}
      </div>
      <div className="overflow-hidden rounded-lg border">
        <div className="border-b bg-muted/40 px-3 py-2 text-xs">
          <span className="text-muted-foreground">Objet : </span>
          <span className="font-medium">{current.subject}</span>
        </div>
        <iframe
          title={`Aperçu ${current.label}`}
          srcDoc={current.html}
          sandbox=""
          className="h-[460px] w-full bg-white"
        />
      </div>
    </div>
  );
}
