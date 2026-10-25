import { useEffect, useState } from 'react';
import { getSite, type SiteData } from './api';
import { useMedia, useRefreshScrollWhenReady, useSmoothScroll, useTilt } from './animations';
import { Preloader } from './components/Preloader';
import { Cursor } from './components/Cursor';
import { Nav } from './components/Nav';
import { Hero } from './components/Hero';
import { Spotlight } from './components/Spotlight';
import { Compile } from './components/Compile';
import { About } from './components/About';
import { Marquee } from './components/Marquee';
import { Projects } from './components/Projects';
import { Skills } from './components/Skills';
import { Achievements } from './components/Achievements';
import { Testimonials } from './components/Testimonials';
import { Articles } from './components/Articles';
import { GitHub } from './components/GitHub';
import { Education, Experience } from './components/Timeline';
import { Process } from './components/Process';
import { Contact } from './components/Contact';
import { Footer } from './components/Footer';

export default function App() {
  const [site, setSite] = useState<SiteData | null>(null);
  const [error, setError] = useState('');
  const [introDone, setIntroDone] = useState(false);

  // Every effect switches off if the visitor's OS asks for reduced motion.
  const animate = !useMedia('(prefers-reduced-motion: reduce)');
  // Cursor effects only run with a mouse or trackpad.
  const finePointer = useMedia('(pointer: fine)');

  // Load the content. `attempt` goes up when "Try again" is clicked.
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false; // ignore the answer if this effect was cleaned up (React runs it twice in dev)
    setError('');
    getSite()
      .then((data) => !cancelled && setSite(data))
      .catch((e: Error) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  useSmoothScroll(animate && site !== null);
  useRefreshScrollWhenReady(site !== null);
  useTilt(animate && finePointer); // 3D lean on cards with class "tilt"

  useEffect(() => {
    if (!site) return;
    const { firstName, lastName, role, tagline } = site.profile;
    document.title = `${firstName} ${lastName} · ${role}`;
    // The description Google shows under the page title in search results.
    document.querySelector('meta[name="description"]')?.setAttribute('content', `${firstName} ${lastName}, ${role}. ${tagline}`);
  }, [site]);

  // The job marked "current": true in experience.json (shown in the hero and the compile card).
  const currentJob = site?.experience.find((job) => job.current) ?? null;
  // The hero cube has six faces: your first six skills (repeated if you have fewer).
  const allSkills = site?.skills.flatMap((g) => g.items) ?? [];
  const cubeFaces = Array.from({ length: 6 }, (_, i) => allSkills[i % Math.max(allSkills.length, 1)] ?? '</>');

  return (
    <>
      {animate && !introDone && (
        <Preloader
          ready={site !== null || error !== ''}
          ok={site !== null}
          user={site?.profile.firstName.toLowerCase() ?? 'dev'}
          stats={site && `${site.projects.length} projects · ${site.skills.flatMap((g) => g.items).length} skills`}
          onDone={() => setIntroDone(true)}
        />
      )}

      {error && (
        <main className="error-page">
          <span className="tag">Content didn't load</span>
          <h1>The portfolio content couldn't be loaded.</h1>
          <p className="error-detail">{error}</p>
          <p>
            Start the backend with <code>uvicorn app.main:app --reload</code>, then try again.
          </p>
          <button onClick={() => setAttempt((n) => n + 1)}>
            Try again
          </button>
        </main>
      )}

      {site && (
        <>
          {animate && finePointer && <Cursor />}
          <Nav
            profile={site.profile}
            animate={animate}
            hiddenSections={[
              !site.profile.githubUsername && '#github',
              site.experience.length === 0 && '#experience',
              site.education.length === 0 && '#education',
              site.achievements.length === 0 && '#achievements',
              site.articles.length === 0 && '#writing',
            ].filter((id): id is string => Boolean(id))}
          />
          <main>
            <Hero profile={site.profile} currentJob={currentJob} cubeFaces={cubeFaces} start={introDone || !animate} animate={animate} finePointer={finePointer} />
            <Spotlight base={site.profile.spotlightBase} hidden={site.profile.spotlightHidden} animate={animate} />
            {/* The code file must fit one screen, so it gets the first two skills of each group. */}
            <Compile profile={site.profile} currentJob={currentJob} skills={site.skills.flatMap((g) => g.items.slice(0, 2))} projectCount={site.projects.length} animate={animate} />
            <About text={site.profile.about} animate={animate} />
            <Marquee items={site.skills.flatMap((g) => g.items)} animate={animate} />
            <Skills groups={site.skills} animate={animate} />
            <Projects projects={site.projects} animate={animate} finePointer={finePointer} />
            <GitHub username={site.profile.githubUsername} animate={animate} />
            <Experience jobs={site.experience} animate={animate} />
            <Education items={site.education} animate={animate} />
            <Achievements items={site.achievements} animate={animate} />
            <Testimonials items={site.testimonials} animate={animate} />
            <Articles items={site.articles} animate={animate} />
            <Process steps={site.process} animate={animate} />
            <Contact profile={site.profile} animate={animate} finePointer={finePointer} />
          </main>
          <Footer profile={site.profile} />
        </>
      )}
    </>
  );
}
