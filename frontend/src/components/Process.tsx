import { useRef } from 'react';
import type { ProcessStep } from '../api';
import { useStackingCards } from '../animations';
import { SectionHead } from './SectionHead';

/** Sticky cards that pile up; each one shrinks and darkens as the next one arrives. */
export function Process({ steps, animate }: { steps: ProcessStep[]; animate: boolean }) {
  const root = useRef<HTMLElement>(null);

  useStackingCards(root, animate, steps.length);

  return (
    <section ref={root} id="process" className="section" aria-labelledby="process-title">
      <SectionHead id="process-title" title="How I work" tag={`${steps.length} steps`} animate={animate} />
      <ol className="process-list">
        {steps.map((step, i) => (
          <li key={step.title} className="process-card">
            <div>
              <span>
                Step {i + 1} of {steps.length}
              </span>
              <h3>{step.title}</h3>
            </div>
            <p>{step.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
