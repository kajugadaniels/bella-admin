import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

/**
 * Polished Switch:
 * - Glassy track with gradient when checked
 * - Larger thumb with soft shadow & ring
 * - Smooth translate animation
 * - Accessible focus ring
 */
const Switch = React.forwardRef(({ className, thumbClassName, ...props }, ref) => (
  <SwitchPrimitives.Root
    ref={ref}
    className={cn(
      "peer relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full",
      "border border-black/5 bg-black/10 p-0.5 backdrop-blur supports-[backdrop-filter]:bg-white/40",
      "transition-all duration-300 ease-out",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 focus-visible:ring-offset-2",
      "dark:border-white/10 dark:bg-white/10",
      // checked state: gradient glow
      "data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-[var(--primary-color)] data-[state=checked]:to-emerald-600",
      "data-[state=checked]:shadow-[0_0_0_3px_rgba(16,185,129,0.18)]",
      "disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-6 w-6 rounded-full bg-white",
        "shadow-[0_1px_2px_rgba(0,0,0,.12),0_4px_12px_rgba(0,0,0,.10)] ring-1 ring-black/5",
        "transition-transform duration-300 ease-out",
        "data-[state=unchecked]:translate-x-0 data-[state=checked]:translate-x-5",
        "dark:bg-neutral-100 dark:ring-white/10",
        thumbClassName
      )}
    />
  </SwitchPrimitives.Root>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
