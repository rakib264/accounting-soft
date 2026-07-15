import { toast } from "sonner";

/** Backend success responses only */
export function showSuccess(message: string) {
  toast.success(message);
}

/** Backend error responses only (also used by RTK interceptor) */
export function showError(message: string) {
  toast.error(message);
}

/** Backend warnings only */
export function showWarning(message: string) {
  toast.warning(message);
}

export function getApiErrorMessage(error: unknown, fallback = "Something went wrong. Please try again.") {
  if (error && typeof error === "object" && "data" in error) {
    const data = (error as { data?: { message?: string } }).data;
    if (data?.message) return data.message;
  }
  return fallback;
}
