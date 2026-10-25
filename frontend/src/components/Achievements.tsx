import { useRef } from 'react';
import type { Achievement } from '../api';
import { useCardsReveal } from '../animations';
import { SectionHead } from './SectionHead';

/** Awards, hackathons and certificates, from backend/data/achievements.json. Hidden when the file is empty. */
export function Achievements({ items, animate }: { items: Achievement[]; animate: boolean }) {
  const root = useRef<HTMLElement>(null);
  useCardsReveal(root, animate, items.length);
  if (items.length === 0) return null;

  return (
    <section ref={root} id="achievements" className="section" aria-labelledby="achievements-title">
      <SectionHead id="achievements-title" title="Achievements & certifications" tag="Proof of work" animate={animate} />
      <div className="achievements-grid reveal-grid">
        {items.map((item) => (
          <article key={`${item.title}-${item.year}`} className="achievement-card reveal-card tilt">
            <div className="achievement-top">
              <span className="achievement-year">{item.year}</span>
              <span className="achievement-issuer">{item.issuer}</span>
            </div>
            <h3>{item.title}</h3>
            {item.description && <p>{item.description}</p>}
            {item.url && (
              <a href={item.url} target="_blank" rel="noreferrer" data-cursor="View">
                View certificate ↗
              </a>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
