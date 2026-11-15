import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        outline: "text-foreground",
        pending: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
        signed: "border-green-600/30 bg-green-600/10 text-green-700 dark:text-green-400",
        lost: "border-red-600/30 bg-red-600/10 text-red-700 dark:text-red-400",
        info: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-400",
        neutral: "border-zinc-400/30 bg-zinc-500/10 text-zinc-700 dark:text-zinc-300",
        violet: "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-400",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
