"use client";

import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

export const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer h-[18px] w-[18px] shrink-0 rounded-[5px] border border-input bg-card shadow-sm transition-all duration-200",
      "hover:border-primary/40 hover:bg-accent/40",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=checked]:shadow-sm data-[state=checked]:shadow-primary/25",
      className,
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
      <Check className="h-3.5 w-3.5" strokeWidth={3} />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

type CheckboxFieldProps = React.ComponentPropsWithoutRef<typeof Checkbox> & {
  label: string;
  description?: string;
  containerClassName?: string;
};

export function CheckboxField({ label, description, containerClassName, disabled, ...props }: CheckboxFieldProps) {
  return (
    <label
      className={cn(
        "group flex cursor-pointer items-start gap-2.5 rounded-lg px-1 py-0.5 transition-colors hover:bg-muted/40",
        disabled && "cursor-not-allowed opacity-60",
        containerClassName,
      )}
    >
      <Checkbox disabled={disabled} className="mt-0.5" {...props} />
      <span className="select-none leading-none">
        <span className="text-sm font-medium capitalize text-foreground group-hover:text-foreground">{label}</span>
        {description && <span className="mt-1 block text-xs text-muted-foreground">{description}</span>}
      </span>
    </label>
  );
}
