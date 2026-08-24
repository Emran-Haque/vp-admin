export type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

/** One admin-authored "what you get" bullet; `text` is limited rich text. */
export type IncludeItem = { id: number; text: string; icon: string; ordering: number };

/** The write shape for `includes` — no ids, ordering comes from the row order. */
export type IncludePayloadItem = { text: string; icon: string; ordering: number };
