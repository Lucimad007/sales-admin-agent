import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "flex h-11 w-full rounded-lg border border-line bg-panel px-3 text-base text-ink shadow-inset outline-none transition-[border-color,box-shadow] duration-200 ease-ledger placeholder:text-ink-muted focus:border-copper focus:ring-2 focus:ring-copper/25 lg:h-9 lg:text-sm",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
