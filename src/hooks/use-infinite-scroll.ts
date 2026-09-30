"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";

/**
 * Scroll-to-load for paginated lists.
 *
 * Returns a ref for a sentinel element placed after the last row; when it comes
 * within `rootMargin` of the visible area, `onLoadMore` fires. Pass `rootRef`
 * when the list lives in its own scrolling box (a modal, a dropdown) — the
 * margin only pre-fetches relative to the root, so with the default viewport
 * root a list inside a clipped box would load only once its end is on screen.
 *
 * The observer is rebuilt after every fetch on purpose: a fresh observer
 * reports the current state immediately, so a page too short to fill the box
 * keeps loading until it does, instead of stalling with the sentinel already in
 * view and no scroll event left to trigger the next page.
 */
export function useInfiniteScroll<T extends Element = HTMLDivElement>({
  hasMore,
  isLoading,
  onLoadMore,
  rootRef,
  rootMargin = "200px",
}: {
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  rootRef?: RefObject<Element | null>;
  rootMargin?: string;
}) {
  // A state-backed ref so the effect re-runs when the sentinel mounts later
  // (e.g. only once the first page has arrived).
  const [sentinel, setSentinel] = useState<T | null>(null);
  const onLoadMoreRef = useRef(onLoadMore);

  useEffect(() => {
    onLoadMoreRef.current = onLoadMore;
  }, [onLoadMore]);

  useEffect(() => {
    if (!sentinel || !hasMore || isLoading) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          onLoadMoreRef.current();
        }
      },
      { root: rootRef?.current ?? null, rootMargin },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [sentinel, hasMore, isLoading, rootRef, rootMargin]);

  return setSentinel;
}

type PagedInfiniteQuery<T> = {
  data?: { pages: { count: number; results: T[] }[] };
  hasNextPage: boolean;
  isFetching: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => { unwrap: () => Promise<unknown> };
};

/**
 * Glue between an RTK `infiniteQuery` over a DRF paginated endpoint and a
 * scroll-to-load list: the loaded rows as one list, the server's total, the
 * sentinel ref, and a failure flag.
 *
 * Rows are de-duplicated by id because page-number pages shift under a live
 * list — a row inserted at the top (or a row changing status under a filter)
 * pushes the previous page's last row onto the next page.
 *
 * A failed page stops the auto-loading; otherwise the observer, rebuilt after
 * every fetch, would retry it in a tight loop. `loadMore` doubles as the retry.
 */
export function useScrollPagination<T extends { id: number }>(
  query: PagedInfiniteQuery<T>,
  {
    rootRef,
    rootMargin,
    enabled = true,
  }: { rootRef?: RefObject<Element | null>; rootMargin?: string; enabled?: boolean } = {},
) {
  const { data, hasNextPage, isFetching, isFetchingNextPage, fetchNextPage } = query;
  // The failure is pinned to the data it happened on: a failed page leaves
  // `data` untouched, while a new filter/search or a successful refresh replaces
  // it — which clears the flag and resumes auto-loading without an effect.
  const [failedOn, setFailedOn] = useState<PagedInfiniteQuery<T>["data"] | null>(null);
  const loadMoreFailed = failedOn !== null && failedOn === data;

  const items = useMemo(() => {
    const byId = new Map<number, T>();
    for (const page of data?.pages ?? []) {
      for (const item of page.results) {
        if (!byId.has(item.id)) byId.set(item.id, item);
      }
    }
    return [...byId.values()];
  }, [data]);
  const totalCount = data?.pages.at(-1)?.count ?? 0;

  const loadMore = useCallback(() => {
    if (!data || !hasNextPage || isFetchingNextPage) return;
    const dataAtRequest = data;
    setFailedOn(null);
    fetchNextPage()
      .unwrap()
      .catch(() => setFailedOn(dataAtRequest));
  }, [data, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const sentinelRef = useInfiniteScroll({
    hasMore: enabled && hasNextPage && !loadMoreFailed,
    isLoading: isFetching,
    onLoadMore: loadMore,
    rootRef,
    rootMargin,
  });

  return {
    items,
    totalCount,
    pageCount: data?.pages.length ?? 0,
    sentinelRef,
    loadMore,
    loadMoreFailed,
  };
}
