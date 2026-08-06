'use client';

import * as React from 'react';
import { useDebouncedValue } from './useDebouncedValue';

/**
 * State for any searchable, filterable, paginated list page.
 *
 * It exists to own one rule that is easy to forget and confusing when missed:
 * **changing a search term or a filter resets you to page 1.** Without it, an
 * admin on page 4 who types a search sees an empty page and concludes there are
 * no results.
 *
 * It also debounces the search term, so the query key only changes once typing
 * stops, while the input itself stays instant.
 *
 *   const list = useListParams({ published: '' as '' | 'true' | 'false' });
 *   const courses = useAdminCourses(list.queryParams);
 *
 *   <SearchField value={list.search} onChange={list.setSearch} />
 *   <PaginationBar meta={courses.data?.meta} onChange={list.setPage} />
 */
export function useListParams<TFilters extends Record<string, string>>(
  initialFilters: TFilters,
  { pageSize = 12, debounceMs = 300 }: { pageSize?: number; debounceMs?: number } = {},
) {
  const [page, setPage] = React.useState(1);
  const [search, setSearchState] = React.useState('');
  const [filters, setFilters] = React.useState<TFilters>(initialFilters);

  const debouncedSearch = useDebouncedValue(search, debounceMs);

  const setSearch = React.useCallback((next: string) => {
    setSearchState(next);
    setPage(1);
  }, []);

  const setFilter = React.useCallback(
    <TKey extends keyof TFilters>(key: TKey, value: TFilters[TKey]) => {
      setFilters((current) => ({ ...current, [key]: value }));
      setPage(1);
    },
    [],
  );

  const reset = React.useCallback(() => {
    setSearchState('');
    setFilters(initialFilters);
    setPage(1);
    // `initialFilters` is a literal at the call site, so a new object identity
    // arrives every render — depending on it would rebuild this every time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Params to hand straight to a list hook. Empty strings are dropped: the
   * fetch layer's `toSearchParams` would otherwise send `published=`, which
   * fails the endpoint's schema.
   */
  const queryParams = React.useMemo(() => {
    const activeFilters = Object.fromEntries(
      Object.entries(filters).filter(([, value]) => value !== ''),
    );

    return {
      page,
      pageSize,
      ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
      ...activeFilters,
    };
  }, [page, pageSize, debouncedSearch, filters]);

  /** True when anything is narrowing the list — drives "no results" copy. */
  const hasActiveFilters =
    debouncedSearch.trim() !== '' || Object.values(filters).some((value) => value !== '');

  return {
    page,
    setPage,
    search,
    setSearch,
    filters,
    setFilter,
    reset,
    queryParams,
    hasActiveFilters,
  };
}
