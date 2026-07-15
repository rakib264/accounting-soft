"use client";

import { ExternalLink, FileText, ImageIcon } from "lucide-react";

import { cn } from "@/lib/utils";

function getFileName(url: string) {
  return decodeURIComponent(url.split("/").pop()?.split("?")[0] ?? "Attachment");
}

function isImageUrl(url: string) {
  const extension = url.split("?")[0]?.split(".").pop()?.toLowerCase() ?? "";
  return ["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(extension);
}

type AttachmentGalleryProps = {
  urls: string[];
  className?: string;
  emptyLabel?: string;
};

export function AttachmentGallery({ urls, className, emptyLabel = "No attachments" }: AttachmentGalleryProps) {
  if (urls.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  return (
    <div className={cn("grid gap-3 sm:grid-cols-2", className)}>
      {urls.map((url) => {
        const name = getFileName(url);
        const isImage = isImageUrl(url);

        return (
          <a
            key={url}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-sm transition-colors hover:border-primary/30 hover:bg-accent/20"
          >
            <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
              {isImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={url} alt={name} className="h-full w-full object-cover" />
              ) : (
                <FileText className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{name}</p>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                {isImage ? <ImageIcon className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
                Open file
                <ExternalLink className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
              </p>
            </div>
          </a>
        );
      })}
    </div>
  );
}
