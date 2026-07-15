const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export type FileValidationResult = { valid: true } | { valid: false; message: string };

export function validateClientFiles(files: File[], options?: { acceptImagesOnly?: boolean }): FileValidationResult {
  if (files.length === 0) {
    return { valid: false, message: "Please select at least one file." };
  }

  for (const file of files) {
    if (file.size > MAX_FILE_SIZE) {
      return { valid: false, message: `"${file.name}" exceeds the 10MB limit.` };
    }

    if (options?.acceptImagesOnly && !file.type.startsWith("image/")) {
      return { valid: false, message: `"${file.name}" must be an image file.` };
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return { valid: false, message: `"${file.name}" has an unsupported file type.` };
    }
  }

  return { valid: true };
}

export function validateTradeFiles(files: File[]): FileValidationResult {
  if (files.length === 0) {
    return { valid: false, message: "Please select at least one file." };
  }

  const allowedExtensions = new Set(["pdf", "csv", "xlsx", "xls"]);

  for (const file of files) {
    if (file.size > MAX_FILE_SIZE) {
      return { valid: false, message: `"${file.name}" exceeds the 10MB limit.` };
    }

    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!allowedExtensions.has(extension)) {
      return { valid: false, message: `"${file.name}" must be PDF, CSV, or Excel.` };
    }
  }

  return { valid: true };
}

export function validateClientFile(file: File | null | undefined, options?: { acceptImagesOnly?: boolean }): FileValidationResult {
  if (!file) {
    return { valid: true };
  }
  return validateClientFiles([file], options);
}
