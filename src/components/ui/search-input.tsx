import * as React from "react";
import { Search } from "lucide-react";

import { cn } from "@/lib/utils";

export const SearchInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <div className={cn("field-control", className)}>
    <Search className="h-4 w-4 shrink-0 text-muted-foreground/80" aria-hidden />
    <input ref={ref} type="search" className="field-control-input" {...props} />
  </div>
));
SearchInput.displayName = "SearchInput";
