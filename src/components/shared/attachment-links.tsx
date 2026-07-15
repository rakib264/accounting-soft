import { ExternalLink, Paperclip } from "lucide-react";

import { Badge } from "@/components/ui/table";

type AttachmentLinksProps = {
  urls: string[];
};

export function AttachmentLinks({ urls }: AttachmentLinksProps) {
  if (urls.length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {urls.map((url, index) => (
        <a
          key={url}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1"
        >
          <Badge className="cursor-pointer transition-colors hover:bg-muted">
            <Paperclip className="h-3 w-3" />
            {index + 1}
            <ExternalLink className="h-3 w-3" />
          </Badge>
        </a>
      ))}
    </div>
  );
}
