import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium outline-none transition-[color,background-color,box-shadow,transform] duration-200 ease-ledger focus-visible:ring-2 focus-visible:ring-copper/35 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-copper text-panel shadow-glow hover:-translate-y-px hover:bg-copper-hover",
        secondary:
          "border border-line bg-panel text-ink shadow-paper hover:-translate-y-px hover:bg-canvas hover:shadow-lift",
        ghost: "text-ink-muted hover:bg-canvas hover:text-ink",
        success: "bg-success text-panel shadow-[0_12px_28px_-10px_rgba(31,82,54,0.55)] hover:-translate-y-px hover:bg-success-hover",
        danger: "bg-danger text-panel shadow-[0_12px_28px_-10px_rgba(177,44,40,0.55)] hover:-translate-y-px hover:bg-danger-hover",
        "danger-ghost": "text-danger hover:bg-danger/12",
        "success-ghost": "text-success hover:bg-success/12",
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
