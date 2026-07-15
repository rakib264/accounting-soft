import { Loader2 } from "lucide-react";

import { Button, ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SubmitButtonProps = ButtonProps & {
  loading?: boolean;
  loadingText?: string;
};

export function SubmitButton({
  loading,
  loadingText = "Saving...",
  disabled,
  children,
  className,
  ...props
}: SubmitButtonProps) {
  return (
    <Button type="submit" disabled={disabled || loading} className={cn(className)} {...props}>
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {loading ? loadingText : children}
    </Button>
  );
}
