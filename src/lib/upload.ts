import { v2 as cloudinary } from "cloudinary";

import { env } from "@/lib/env";

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});

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

export function validateUploadFile(file: File) {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File "${file.name}" exceeds the 10MB limit.`);
  }

  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new Error(`File type "${file.type}" is not allowed.`);
  }
}

function isImageMime(type: string) {
  return type.startsWith("image/");
}

export async function saveUploadFile(file: File, folder: string) {
  validateUploadFile(file);

  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = buffer.toString("base64");
  const dataUri = `data:${file.type};base64,${base64}`;

  const result = await cloudinary.uploader.upload(dataUri, {
    folder: `accounting/${folder}`,
    resource_type: isImageMime(file.type) ? "image" : "raw",
    use_filename: true,
    unique_filename: true,
  });

  return result.secure_url;
}

export async function saveUploadFiles(files: File[], folder: string) {
  return Promise.all(files.map((file) => saveUploadFile(file, folder)));
}

export { cloudinary };
