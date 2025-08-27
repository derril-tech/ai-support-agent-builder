export type PaginationParams = { cursor?: string; limit?: number };
export type Paginated<T> = { items: T[]; nextCursor: string | null };

export function paginateArray<T>(all: T[], { cursor, limit = 20 }: PaginationParams): Paginated<T> {
  const start = cursor ? parseInt(cursor, 10) : 0;
  const slice = all.slice(start, start + limit);
  const nextCursor = start + limit < all.length ? String(start + limit) : null;
  return { items: slice, nextCursor };
}
