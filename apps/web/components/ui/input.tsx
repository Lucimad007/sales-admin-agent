import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "flex h-9 w-full rounded-lg border border-line bg-panel px-3 text-sm text-ink outline-none transition-colors placeholder:text-ink-muted focus:border-copper",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
