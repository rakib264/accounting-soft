import { NextRequest } from "next/server";

export type PaginationParams = {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: "asc" | "desc";
  search?: string;
};

export function parsePaginationParams(request: NextRequest, defaults?: Partial<PaginationParams>): PaginationParams {
  const searchParams = request.nextUrl.searchParams;

  return {
    page: Math.max(1, Number(searchParams.get("page") ?? defaults?.page ?? 1)),
    limit: Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? defaults?.limit ?? 10))),
    sortBy: searchParams.get("sortBy") ?? defaults?.sortBy ?? "createdAt",
    sortOrder: searchParams.get("sortOrder") === "asc" ? "asc" : "desc",
    search: searchParams.get("search") ?? defaults?.search,
  };
}

export function buildSortObject(sortBy: string, sortOrder: "asc" | "desc") {
  return { [sortBy]: sortOrder === "asc" ? 1 : -1 };
}
