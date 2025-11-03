import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        glass: "backdrop-blur-xl bg-[hsl(220,15%,16%)]/80 border border-white/10 text-white hover:bg-[hsl(220,15%,20%)]/80 hover:border-white/20 shadow-[0_4px_16px_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(255,255,255,0.1)]",
        glassBlue: "backdrop-blur-xl bg-gradient-to-br from-[hsl(210,100%,60%)]/90 to-[hsl(210,100%,50%)]/90 border border-[hsl(210,100%,70%)]/30 text-white hover:from-[hsl(210,100%,65%)]/95 hover:to-[hsl(210,100%,55%)]/95 hover:border-[hsl(210,100%,70%)]/50 shadow-[0_4px_20px_rgba(33,150,243,0.4),inset_0_1px_3px_rgba(255,255,255,0.3)] hover:shadow-[0_6px_28px_rgba(33,150,243,0.6),inset_0_1px_4px_rgba(255,255,255,0.4)]",
        glassDark: "backdrop-blur-xl bg-[hsl(220,15%,12%)]/90 border border-white/5 text-white/60 hover:text-white hover:bg-[hsl(220,15%,16%)]/90 hover:border-white/10 shadow-[0_2px_12px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.05)]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
        pill: "h-10 px-6 rounded-full",
        pillSm: "h-9 px-5 rounded-full text-sm",
        circle: "h-12 w-12 rounded-full p-0",
        circleSm: "h-10 w-10 rounded-full p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
