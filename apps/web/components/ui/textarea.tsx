import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "min-h-[88px] w-full rounded-lg border border-line bg-panel px-3 py-2 text-sm text-ink shadow-inset outline-none transition-[border-color,box-shadow] duration-200 ease-ledger placeholder:text-ink-muted focus:border-copper focus:ring-2 focus:ring-copper/25",
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";
