import { useRef } from 'react';
import { useHeadingReveal } from '../animations';

interface Props {
  id: string;
  title: string;
  tag: string;
  animate: boolean;
}

/** Section title row with a line on top. */
export function SectionHead({ id, title, tag, animate }: Props) {
  const root = useRef<HTMLDivElement>(null);
  useHeadingReveal(root, animate);

  return (
    <div ref={root} className="section-head">
      <div className="section-head-rule" />
      <h2 id={id}>{title}</h2>
      <span className="tag">{tag}</span>
    </div>
  );
}
