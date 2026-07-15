import { ok } from "@/lib/api/response";

export async function GET() {
  return ok({
    status: "ok",
    service: "accounting-api",
    timestamp: new Date().toISOString(),
  });
}
