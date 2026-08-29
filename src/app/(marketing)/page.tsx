import Hero from '@/components/landing/Hero';
import StatsBar from '@/components/landing/StatsBar';
import FeaturedCourses from '@/components/landing/FeaturedCourses';
import HowItWorks from '@/components/landing/HowItWorks';

export const metadata = {
  title: 'Kursevi — online kursevi sa certifikatom',
  description:
    'Online kursevi sa video lekcijama, materijalima, zadacima i certifikatom po završetku.',
};

/**
 * The landing page — `/`.
 *
 * ## It used to redirect to /login, and that was the biggest hole in the app
 *
 * A visitor who typed the domain got a login form: no way to find out what the
 * platform was, and no route to the catalogue that had been public all along.
 * This replaces it with a real entry point.
 *
 * ## Structure now, copy later
 *
 * The sections below are the skeleton — a hero, what a course involves, and a
 * closing call to action. The wording is placeholder marketing text and is
 * expected to be rewritten; the *shape* is what was missing. Unlike the legal
 * pages it is not left empty, because a blank home page is worse than a
 * provisional one, and nothing here can mislead anybody the way invented terms
 * of service could.
 *
 * A Server Component: it is static, so the first page a stranger sees costs no
 * JavaScript and is fully crawlable.
 *
 * Open question left for the owner: what a **signed-in** visitor should see
 * here — this page, or a redirect to `landingPathForRole`. Right now they get
 * this page, and the header already offers the way into their own area.
 */
export default function LandingPage() {
  return (
    <>
      <Hero />
      <StatsBar />
       <FeaturedCourses />
           <HowItWorks />
    </>
  );
}
