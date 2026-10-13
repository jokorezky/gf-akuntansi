import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md text-[12px] font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gf-accent/40 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "border border-gf-border bg-gradient-to-b from-white to-[#f4f6f9] text-gf-text shadow-[0_1px_2px_rgba(15,23,42,0.07)] hover:border-[#c3cddb] hover:shadow-[0_2px_8px_rgba(15,23,42,0.10)] active:translate-y-[1px] active:shadow-inner",
        primary:
          "border border-transparent bg-gf-accent text-white shadow-[0_1px_3px_rgba(122,27,32,0.35)] hover:bg-gf-accent-soft active:translate-y-[1px]",
        ghost: "text-gf-text hover:bg-slate-100 active:bg-slate-200",
        danger:
          "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 active:translate-y-[1px]",
      },
      size: {
        sm: "h-[24px] px-2",
        md: "h-[28px] px-3",
        lg: "h-[34px] px-4 text-[13px]",
        icon: "h-[28px] w-[28px] p-0",
        iconSm: "h-[24px] w-[24px] p-0",
      },
    },
    defaultVariants: { variant: "default", size: "md" },
  },
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };

export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export { buttonVariants };
