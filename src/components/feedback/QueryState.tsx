'use client';

import * as React from 'react';
import EmptyState from './EmptyState';
import ErrorState from './ErrorState';
import LoadingState from './LoadingState';

/**
 * Renders the four states of a React Query read — loading, error, empty,
 * loaded — so no page has to write the same `if (isLoading) … if (error) …`
 * ladder again.
 *
 * `children` is a function, not JSX, and that's the point: it only runs once
 * `data` is known, so inside it `data` is fully typed and never undefined.
 *
 *   <QueryState
 *     query={coursesQuery}
 *     isEmpty={(page) => page.data.length === 0}
 *     empty={<EmptyState title="Nema kurseva" />}
 *   >
 *     {(page) => <CourseGrid courses={page.data} />}
 *   </QueryState>
 *
 * Structurally typed rather than tied to `UseQueryResult`, so it accepts any
 * `useQuery` result *and* a hand-composed object. That second case matters when
 * a page picks between two queries of different shapes and normalises their
 * data first — see the course page, which feeds it one query's status
 * alongside a merged module list.
 */
export type MinimalQueryResult<TData> = {
  data: TData | undefined;
  /** True while there is no data yet. */
  isPending: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => unknown;
};

export type QueryStateProps<TData> = {
  query: MinimalQueryResult<TData>;
  children: (data: TData) => React.ReactNode;
  /**
   * How to tell that a successful response contains nothing. Lists usually pass
   * `(page) => page.data.length === 0`; detail queries normally omit it.
   */
  isEmpty?: (data: TData) => boolean;
  empty?: React.ReactNode;
  /** Override the default spinner — e.g. with a skeleton matching the content. */
  loading?: React.ReactNode;
  errorTitle?: string;
};

export default function QueryState<TData>({
  query,
  children,
  isEmpty,
  empty,
  loading,
  errorTitle,
}: QueryStateProps<TData>) {
  // `isPending` means "no data yet", which is what we want. `isLoading` would
  // be false during a background refetch that still has no data to show, and a
  // disabled query (`enabled: false`) stays pending — deliberately, since it
  // has nothing to render either.
  if (query.isPending) return <>{loading ?? <LoadingState />}</>;

  if (query.isError) {
    return (
      <ErrorState error={query.error} title={errorTitle} onRetry={() => void query.refetch()} />
    );
  }

  const data = query.data as TData;

  if (isEmpty?.(data)) {
    return <>{empty ?? <EmptyState title="Nema podataka" />}</>;
  }

  return <>{children(data)}</>;
}
