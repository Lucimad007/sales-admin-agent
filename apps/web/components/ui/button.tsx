import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors duration-200 ease-ledger disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-copper text-panel hover:bg-copper-hover",
        secondary: "border border-line bg-panel text-ink hover:bg-canvas",
        ghost: "text-ink-muted hover:bg-canvas hover:text-ink",
        success: "bg-success text-panel hover:bg-success-hover",
        danger: "bg-danger text-panel hover:bg-danger-hover",
        "danger-ghost": "text-danger hover:bg-danger/10",
        "success-ghost": "text-success hover:bg-success/10",
      },
      size: {
        default: "h-9 px-3.5",
        sm: "h-8 px-3 text-[13px]",
        lg: "h-10 px-4",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";
