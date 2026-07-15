"use client";

import { Eye, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SimpleTooltip, TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type TableActionsProps = {
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  canView?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  viewLabel?: string;
  editLabel?: string;
  deleteLabel?: string;
  className?: string;
};

export function TableActions({
  onView,
  onEdit,
  onDelete,
  canView = true,
  canEdit = true,
  canDelete = true,
  viewLabel = "View",
  editLabel = "Edit",
  deleteLabel = "Delete",
  className,
}: TableActionsProps) {
  const hasActions =
    (canView && onView) || (canEdit && onEdit) || (canDelete && onDelete);

  if (!hasActions) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className={cn("flex items-center gap-1", className)}>
        {canView && onView && (
          <SimpleTooltip label={viewLabel}>
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={onView}>
              <Eye className="h-4 w-4" />
              <span className="sr-only">{viewLabel}</span>
            </Button>
          </SimpleTooltip>
        )}
        {canEdit && onEdit && (
          <SimpleTooltip label={editLabel}>
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={onEdit}>
              <Pencil className="h-4 w-4" />
              <span className="sr-only">{editLabel}</span>
            </Button>
          </SimpleTooltip>
        )}
        {canDelete && onDelete && (
          <SimpleTooltip label={deleteLabel}>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">{deleteLabel}</span>
            </Button>
          </SimpleTooltip>
        )}
      </div>
    </TooltipProvider>
  );
}
