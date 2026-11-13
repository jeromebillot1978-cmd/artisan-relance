"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { QuoteFormDialog } from "@/components/app/quote-form-dialog";

export function NewQuoteButton({ children = "Nouveau devis", ...props }: ButtonProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="brand" onClick={() => setOpen(true)} {...props}>
        <Plus /> {children}
      </Button>
      <QuoteFormDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
