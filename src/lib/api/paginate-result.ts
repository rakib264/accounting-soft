export type PaginateResult<T> = {
  docs: T[];
  page: number;
  limit: number;
  totalPages: number;
  totalDocs: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

export function asPaginateResult<T>(result: unknown): PaginateResult<T> {
  return result as PaginateResult<T>;
}
