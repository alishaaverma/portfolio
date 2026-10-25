import { useRef } from 'react';
import { useSpotlight } from '../animations';
import { SectionHead } from './SectionHead';

interface Props {
  base: string;
  hidden: string;
  animate: boolean;
}

/** A hidden sentence revealed through a circle that follows the pointer. */
export function Spotlight({ base, hidden, animate }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const top = useRef<HTMLParagraphElement>(null);

  useSpotlight(box, top, animate);

  return (
    <section className="section" aria-labelledby="spot-title">
      <SectionHead id="spot-title" title="Look closer" tag="Move your cursor over the text" animate={animate} />
      <div ref={box} className="spotlight-box" data-static={!animate || undefined}>
        <p className="spotlight-base">{base}</p>
        <p ref={top} className="spotlight-hidden">
          {hidden}
        </p>
      </div>
    </section>
  );
}
