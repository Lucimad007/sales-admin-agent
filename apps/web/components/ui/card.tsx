import * as React from "react";
import { cn } from "@/lib/utils";

export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-[12px] border border-line bg-panel p-4 shadow-lift transition-[box-shadow,transform] duration-200 ease-ledger",
        className,
      )}
      {...props}
    />
  ),
);
Card.displayName = "Card";
