'use client';

import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import QueryState from '@/components/feedback/QueryState';
import CourseCard from '@/components/courses/CourseCard';
import { useCourses } from '@/hooks/useCourses';
import { useCategoryOptions } from '@/hooks/useCategories';

/**
 * "Sta trenutno mozes upisati" - featured courses grid on the landing page
 * 
 * Pulls the first 6 courses from GET /api/courses 
 * 
 * A Client component: it needs useCourses/useCategoryOptions, which are
 * client hooks. Unline Hero/StatsBar, which are static and server-only. 
 * No "featured" flag exists on courses yet - this just shows whatever the API returns
 * first. 
 * 
 * 
 */
export default function FeaturedCourses() {
    const courses = useCourses({ pageSize: 6 });
    const categories = useCategoryOptions();

    return (
        <QueryState
        query={courses}
        errorTitle="Kurseve nije moguće učitati"
        isEmpty={(page) => page.data.length === 0}
        empty={null}
        >
            {(page) => (
                <Container maxWidth="lg" sx={{ py: { xs: 6, md: 8 } }}>
                    <Divider sx={{ mb: { xs: 5, md: 6 } }} />

                    <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={1}
                    sx={{ justifyContent: 'space-between', alignItems: { sm: 'flex-end' }, mb: 4}}
                    >
                        <Stack spacing={1}>
                            <Typography variant="overline" color="primary" sx={{ letterSpacing: 1.2 }}>
                                Istaknuti kursevi 
                            </Typography>
                            <Typography variant="h3" sx={{ fontSize: { xs: 28, md: 36 } }}>
                                Šta trenutno možeš upisati
                            </Typography>
                        </Stack>

                        <Link 
                        href="/courses"
                        underline="hover"
                        color="primary"
                        variant="body2"
                        sx={{ fontWeight: 600 }}
                        >
                            Svi kursevi 
                        </Link>
                    </Stack>

                    <Grid container spacing={4}>
                        {page.data.map((course) => (
                            <Grid key={course.id} size={{ xs: 12, sm: 6, md: 4 }}>
                                <CourseCard
                                course={course}
                                href={`/courses/${course.slug}`}
                                categoryName={
                                    course.category_id ? categories.names.get(course.category_id) : undefined 
                                }
                                />
                                </Grid>
                        ))}
                    </Grid>
                </Container>
            )}
        </QueryState>
    );
}