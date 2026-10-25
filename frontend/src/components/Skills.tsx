import { useRef } from 'react';
import type { SkillGroup } from '../api';
import { useCardsReveal } from '../animations';
import { SectionHead } from './SectionHead';

/** Skills grouped by category, from backend/data/skills.json. */
export function Skills({ groups, animate }: { groups: SkillGroup[]; animate: boolean }) {
  const root = useRef<HTMLElement>(null);
  useCardsReveal(root, animate, groups.length);

  return (
    <section ref={root} id="skills" className="section" aria-labelledby="skills-title">
      <SectionHead id="skills-title" title="Skills" tag="What I work with" animate={animate} />
      <div className="skills-grid reveal-grid">
        {groups.map((group, i) => (
          <div key={group.category} className="skill-card reveal-card tilt">
            <span className="skill-card-number">{String(i + 1).padStart(2, '0')}</span>
            <h3>{group.category}</h3>
            <ul>
              {group.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
