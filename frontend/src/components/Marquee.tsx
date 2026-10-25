import { useRef } from 'react';
import { useMarquee } from '../animations';

/** Endless skills strip. It reverses with scroll direction and speeds up when you scroll fast. */
export function Marquee({ items, animate }: { items: string[]; animate: boolean }) {
  const root = useRef<HTMLDivElement>(null);

  useMarquee(root, animate, items);

  // The list is repeated twice so the loop is seamless at -50%.
  return (
    <div ref={root} className="marquee" role="img" aria-label={`Skills: ${items.join(', ')}`}>
      <div className="marquee-track">
        {[...items, ...items].map((skill, i) => (
          <span key={i} className="marquee-item">
            {skill}
            <i>✦</i>
          </span>
        ))}
      </div>
    </div>
  );
}
