'use client';

import * as React from 'react';
import NextLink from 'next/link';
import AddIcon from '@mui/icons-material/Add';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/layout/PageHeader';
import ContentCard from '@/components/layout/ContentCard';
import QueryState from '@/components/feedback/QueryState';
import EmptyState from '@/components/feedback/EmptyState';
import SearchField from '@/components/data/SearchField';
import PaginationBar from '@/components/data/PaginationBar';
import ViewModeToggle, { type ViewMode } from '@/components/data/ViewModeToggle';
import CourseGrid from '@/components/courses/CourseGrid';
import CourseTable from '@/components/courses/CourseTable';
import { useAdminCourses } from '@/hooks/useCourses';
import { useCategoryOptions } from '@/hooks/useCategories';
import { useListParams } from '@/hooks/useListParams';

/**
 * Admin course listing — search, filter, paginate, in a grid or a table.
 *
 * Reference example for every list page that follows. The parts worth copying:
 *
 *   - `useListParams` owns page/search/filter state and resets to page 1 when
 *     a filter changes, so nobody re-derives that rule per page.
 *   - `<QueryState>` renders loading/error/empty; the page only describes the
 *     loaded case.
 *   - The empty state distinguishes "nothing exists yet" (offer to create one)
 *     from "your filter matched nothing" (offer to clear it). Collapsing those
 *     into one message is the most common mistake on a page like this.
 */
export default function AdminCoursesPage() {
  const [viewMode, setViewMode] = React.useState<ViewMode>('list');

  // Filter values are strings because that's what a <select> yields; '' means
  // "no filter" and `useListParams` drops it from the request.
  const list = useListParams({ published: '', categoryId: '' }, { pageSize: 12 });

  const courses = useAdminCourses(list.queryParams);
  const categories = useCategoryOptions();

  return (
    <PageContainer>
      <PageHeader
        title="Kursevi"
        description="Svi kursevi, uključujući i one koji još nisu objavljeni."
        actions={
          <Button
            component={NextLink}
            href="/admin/courses/new"
            variant="contained"
            startIcon={<AddIcon />}
          >
            Novi kurs
          </Button>
        }
      />

      <ContentCard disablePadding>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          sx={{ p: 2.5, alignItems: { md: 'center' } }}
        >
          <Stack sx={{ flex: 1, minWidth: 0, maxWidth: { md: 360 } }}>
            <SearchField
              value={list.search}
              onChange={list.setSearch}
              placeholder="Pretraži po nazivu ili opisu…"
            />
          </Stack>

          <TextField
            select
            label="Kategorija"
            value={list.filters.categoryId}
            onChange={(event) => list.setFilter('categoryId', event.target.value)}
            disabled={categories.isPending}
            sx={{ maxWidth: { md: 220 } }}
          >
            <MenuItem value="">Sve kategorije</MenuItem>
            {categories.options.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Status"
            value={list.filters.published}
            onChange={(event) => list.setFilter('published', event.target.value)}
            sx={{ maxWidth: { md: 180 } }}
          >
            <MenuItem value="">Svi statusi</MenuItem>
            <MenuItem value="true">Objavljeni</MenuItem>
            <MenuItem value="false">Nacrti</MenuItem>
          </TextField>

          <Stack sx={{ ml: { md: 'auto' } }}>
            <ViewModeToggle value={viewMode} onChange={setViewMode} />
          </Stack>
        </Stack>

        <QueryState
          query={courses}
          errorTitle="Kurseve nije moguće učitati"
          isEmpty={(page) => page.data.length === 0}
          empty={
            list.hasActiveFilters ? (
              <EmptyState
                title="Nema rezultata"
                description="Nijedan kurs ne odgovara zadatoj pretrazi i filterima."
                action={
                  <Button variant="outlined" onClick={list.reset}>
                    Poništi filtere
                  </Button>
                }
              />
            ) : (
              <EmptyState
                title="Još nema kurseva"
                description="Kreirajte prvi kurs — kasnije mu dodajete module, kvizove i zadatke."
                action={
                  <Button
                    component={NextLink}
                    href="/admin/courses/new"
                    variant="contained"
                    startIcon={<AddIcon />}
                  >
                    Novi kurs
                  </Button>
                }
              />
            )
          }
        >
          {(page) => (
            <>
              {viewMode === 'list' ? (
                <CourseTable courses={page.data} categoryNames={categories.names} />
              ) : (
                <Stack sx={{ p: 2.5, pt: 0 }}>
                  <CourseGrid courses={page.data} categoryNames={categories.names} />
                </Stack>
              )}

              <PaginationBar meta={page.meta} onChange={list.setPage} />
            </>
          )}
        </QueryState>
      </ContentCard>
    </PageContainer>
  );
}
