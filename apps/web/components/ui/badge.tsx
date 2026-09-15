import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center whitespace-nowrap rounded-md px-2 py-0.5 font-mono text-[11px] leading-none",
  {
    variants: {
      variant: {
        outline: "bg-canvas/80 text-ink-muted ring-1 ring-line",
        muted: "bg-canvas text-ink-muted ring-1 ring-line",
        copper: "bg-copper/12 text-copper ring-1 ring-copper/30",
        new: "bg-new/18 text-new ring-1 ring-new/35",
        in_progress: "bg-progress/18 text-progress ring-1 ring-progress/35",
        completed: "bg-done/18 text-done ring-1 ring-done/35",
        cancelled: "bg-cancelled/18 text-cancelled ring-1 ring-cancelled/35",
      },
    },
    defaultVariants: {
      variant: "outline",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { badgeVariants };
