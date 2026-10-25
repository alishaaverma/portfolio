import { useRef } from 'react';
import type { Testimonial } from '../api';
import { useCardsReveal } from '../animations';
import { SectionHead } from './SectionHead';

/** Quotes from people you've worked with, from backend/data/testimonials.json. Hidden when the file is empty. */
export function Testimonials({ items, animate }: { items: Testimonial[]; animate: boolean }) {
  const root = useRef<HTMLElement>(null);
  useCardsReveal(root, animate, items.length);
  if (items.length === 0) return null;

  return (
    <section ref={root} id="testimonials" className="section" aria-labelledby="testimonials-title">
      <SectionHead id="testimonials-title" title="Kind words" tag="From people I've worked with" animate={animate} />
      <div className="testimonials-grid reveal-grid">
        {items.map((item) => (
          <figure key={item.name + item.quote} className="testimonial-card reveal-card tilt">
            <blockquote>{item.quote}</blockquote>
            <figcaption>
              <span className="testimonial-avatar">{item.name[0]}</span>
              <span>
                <strong>{item.name}</strong>
                <small>{item.role}</small>
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
