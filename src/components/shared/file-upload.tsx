"use client";

import { FileSpreadsheet, FileText, ImageIcon, Upload, X } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import type { FileValidationResult } from "@/lib/file-validation-client";

const EMPTY_FILES: File[] = [];
const EMPTY_URLS: string[] = [];

export { EMPTY_FILES, EMPTY_URLS };

function getFilesKey(files: File[]) {
  return files.map((file) => `${file.name}:${file.lastModified}:${file.size}`).join("|");
}

type FileUploadProps = {
  id?: string;
  className?: string;
  multiple?: boolean;
  accept?: string;
  disabled?: boolean;
  files?: File[];
  onFilesChange?: (files: File[]) => void;
  existingUrls?: string[];
  onExistingUrlsChange?: (urls: string[]) => void;
  onSelect?: (files: File[]) => void;
  validateFiles?: (files: File[]) => FileValidationResult;
  onValidationError?: (message: string | undefined) => void;
  error?: string;
  variant?: "default" | "image";
  dropzoneLabel?: string;
  dropzoneHint?: string;
};

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileExtension(name: string) {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

function isImageFile(file: File) {
  return file.type.startsWith("image/");
}

function isImageUrl(url: string) {
  const extension = getFileExtension(url.split("?")[0] ?? url);
  return ["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(extension);
}

function getFileIcon(name: string) {
  const extension = getFileExtension(name);

  if (["pdf"].includes(extension)) {
    return FileText;
  }

  if (["csv", "xlsx", "xls"].includes(extension)) {
    return FileSpreadsheet;
  }

  if (["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(extension)) {
    return ImageIcon;
  }

  return FileText;
}

function useObjectUrls(files: File[]) {
  const filesKey = getFilesKey(files);
  const [urls, setUrls] = useState<string[]>([]);

  useEffect(() => {
    const nextUrls = files.map((file) => (isImageFile(file) ? URL.createObjectURL(file) : ""));

    setUrls((current) => {
      const unchanged =
        current.length === nextUrls.length && current.every((url, index) => url === nextUrls[index]);
      return unchanged ? current : nextUrls;
    });

    return () => {
      nextUrls.forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [filesKey]);

  return urls;
}

type PreviewItemProps = {
  name: string;
  sizeLabel?: string;
  previewUrl?: string;
  onRemove: () => void;
  disabled?: boolean;
  compact?: boolean;
};

function PreviewItem({ name, sizeLabel, previewUrl, onRemove, disabled, compact }: PreviewItemProps) {
  const Icon = getFileIcon(name);

  return (
    <li
      className={cn(
        "group relative flex items-center gap-3 rounded-lg border border-border bg-card p-2.5 shadow-sm transition-colors hover:border-primary/30",
        compact && "p-2",
      )}
    >
      <div
        className={cn(
          "relative flex shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted",
          compact ? "h-10 w-10" : "h-12 w-12",
        )}
      >
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt={name} className="h-full w-full object-cover" />
        ) : (
          <Icon className="h-5 w-5 text-muted-foreground" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{name}</p>
        {sizeLabel && <p className="text-xs text-muted-foreground">{sizeLabel}</p>}
      </div>

      <button
        type="button"
        onClick={onRemove}
        disabled={disabled}
        aria-label={`Remove ${name}`}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
      >
        <X className="h-4 w-4" />
      </button>
    </li>
  );
}

export function FileUpload({
  id,
  className,
  multiple = true,
  accept,
  disabled,
  files = EMPTY_FILES,
  onFilesChange,
  existingUrls = EMPTY_URLS,
  onExistingUrlsChange,
  onSelect,
  validateFiles,
  onValidationError,
  error,
  variant = "default",
  dropzoneLabel,
  dropzoneHint,
}: FileUploadProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [localError, setLocalError] = useState<string>();
  const previewUrls = useObjectUrls(files);
  const isImageVariant = variant === "image";
  const displayError = error ?? localError;

  const addFiles = useCallback(
    (incoming: File[]) => {
      if (incoming.length === 0 || disabled) return;

      const nextFiles = multiple
        ? [...files, ...incoming]
        : [incoming[0]];

      if (validateFiles) {
        const validation = validateFiles(nextFiles);
        if (!validation.valid) {
          setLocalError(validation.message);
          onValidationError?.(validation.message);
          return;
        }
      }

      setLocalError(undefined);
      onValidationError?.(undefined);

      if (onSelect) {
        onSelect(incoming);
        return;
      }

      onFilesChange?.(nextFiles);
    },
    [disabled, files, multiple, onFilesChange, onSelect, onValidationError, validateFiles],
  );

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    addFiles(selected);
    event.target.value = "";
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);

    if (disabled) return;

    addFiles(Array.from(event.dataTransfer.files));
  }

  function removeFile(index: number) {
    onFilesChange?.(files.filter((_, fileIndex) => fileIndex !== index));
    setLocalError(undefined);
    onValidationError?.(undefined);
  }

  function removeExisting(url: string) {
    onExistingUrlsChange?.(existingUrls.filter((existing) => existing !== url));
  }

  const hasPreviews = files.length > 0 || existingUrls.length > 0;
  const primaryImagePreview = isImageVariant
    ? previewUrls[0] ?? (existingUrls[0] && isImageUrl(existingUrls[0]) ? existingUrls[0] : undefined)
    : undefined;

  return (
    <div className={cn("space-y-3", className)}>
      {isImageVariant && primaryImagePreview ? (
        <div className="relative overflow-hidden rounded-xl border border-border bg-muted/30">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={primaryImagePreview} alt="Selected image preview" className="max-h-52 w-full object-cover" />
          {(files.length > 0 || existingUrls.length > 0) && (
            <button
              type="button"
              disabled={disabled}
              onClick={() => {
                onFilesChange?.([]);
                if (existingUrls[0]) {
                  onExistingUrlsChange?.(existingUrls.filter((url) => url !== existingUrls[0]));
                }
              }}
              aria-label="Remove image"
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-background/90 text-muted-foreground shadow-sm transition-colors hover:bg-destructive hover:text-destructive-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      ) : null}

      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(event) => {
          if ((event.key === "Enter" || event.key === " ") && !disabled) {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          if (!event.currentTarget.contains(event.relatedTarget as Node)) {
            setIsDragging(false);
          }
        }}
        onDrop={handleDrop}
        className={cn(
          "relative cursor-pointer rounded-xl border-2 border-dashed bg-gradient-to-b from-card to-muted/20 px-5 py-6 text-center transition-all",
          isImageVariant ? "py-5" : "py-7",
          isDragging && "border-primary bg-primary/5 shadow-[0_0_0_4px_var(--primary-glow)]",
          !isDragging && "border-border hover:border-primary/40 hover:bg-accent/30",
          disabled && "cursor-not-allowed opacity-60",
          localError && "border-destructive/60",
          error && "border-destructive/60",
        )}
      >
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          className="sr-only"
          multiple={multiple}
          accept={accept}
          disabled={disabled}
          onChange={handleInputChange}
        />

        <div className="mx-auto flex max-w-sm flex-col items-center gap-2">
          <div className="rounded-full bg-primary/10 p-3 ring-1 ring-primary/15">
            <Upload className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              {dropzoneLabel ?? (isImageVariant ? "Drag & drop an image here" : "Drag & drop files here")}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {dropzoneHint ?? (isImageVariant ? "or click to browse — JPEG, PNG, or WebP up to 10MB" : "or click to browse — up to 10MB each")}
            </p>
          </div>
        </div>
      </div>

      {displayError && !error && (
        <p className="text-sm text-destructive" role="alert">
          {displayError}
        </p>
      )}

      {hasPreviews && !isImageVariant && (
        <ul className="grid gap-2 sm:grid-cols-2">
          {existingUrls.map((url) => {
            const name = decodeURIComponent(url.split("/").pop()?.split("?")[0] ?? `Attachment`);
            return (
              <PreviewItem
                key={url}
                name={name}
                previewUrl={isImageUrl(url) ? url : undefined}
                onRemove={() => removeExisting(url)}
                disabled={disabled}
              />
            );
          })}
          {files.map((file, index) => (
            <PreviewItem
              key={`${file.name}-${file.lastModified}-${index}`}
              name={file.name}
              sizeLabel={formatFileSize(file.size)}
              previewUrl={previewUrls[index] || undefined}
              onRemove={() => removeFile(index)}
              disabled={disabled}
            />
          ))}
        </ul>
      )}

      {isImageVariant && files.length === 0 && existingUrls.length === 0 && (
        <p className="text-center text-xs text-muted-foreground">No image selected yet.</p>
      )}
    </div>
  );
}
