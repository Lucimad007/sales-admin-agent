import * as React from "react";
import { cn } from "@/lib/utils";

export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("rounded-[10px] border border-line bg-panel p-4 shadow-paper", className)}
      {...props}
    />
  ),
);
Card.displayName = "Card";
