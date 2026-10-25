import { useRef } from 'react';
import type { Education as EducationEntry, Job } from '../api';
import { useTimeline } from '../animations';
import { SectionHead } from './SectionHead';

interface Entry {
  title: string;
  subtitle: string;
  period: string;
  points: string[];
  current?: boolean;
  /** Makes the subtitle (company) a link. */
  url?: string | null;
}

interface Props {
  id: string;
  title: string;
  tag: string;
  entries: Entry[];
  animate: boolean;
}

/** A vertical timeline section. Used by Experience and Education below. Hidden when there are no entries. */
function Timeline({ id, title, tag, entries, animate }: Props) {
  const root = useRef<HTMLElement>(null);
  useTimeline(root, animate, entries.length);
  if (entries.length === 0) return null;

  return (
    <section ref={root} id={id} className="section" aria-labelledby={`${id}-title`}>
      <SectionHead id={`${id}-title`} title={title} tag={tag} animate={animate} />
      <div className="timeline" data-static={!animate || undefined}>
        <div className="timeline-progress" />
        <ol>
          {entries.map((entry) => (
            <li key={`${entry.subtitle}-${entry.period}`} className="timeline-item" data-current={entry.current || undefined}>
              <span className="timeline-period">
                {entry.period}
                {entry.current && <b className="timeline-current">Current</b>}
              </span>
              <div>
                <h3>{entry.title}</h3>
                <p className="timeline-subtitle">
                  {entry.url ? (
                    <a href={entry.url} target="_blank" rel="noreferrer">
                      {entry.subtitle} ↗
                    </a>
                  ) : (
                    entry.subtitle
                  )}
                </p>
                <ul>
                  {entry.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/** Work history, from backend/data/experience.json. */
export function Experience({ jobs, animate }: { jobs: Job[]; animate: boolean }) {
  const entries = jobs.map((j) => ({ title: j.role, subtitle: j.company, period: j.period, points: j.points, current: j.current, url: j.url }));
  return <Timeline id="experience" title="Work experience" tag="Where I've worked" entries={entries} animate={animate} />;
}

/** Degrees and courses, from backend/data/education.json. */
export function Education({ items, animate }: { items: EducationEntry[]; animate: boolean }) {
  const entries = items.map((e) => ({ title: e.degree, subtitle: e.school, period: e.period, points: e.points }));
  return <Timeline id="education" title="Education" tag="Where I studied" entries={entries} animate={animate} />;
}
