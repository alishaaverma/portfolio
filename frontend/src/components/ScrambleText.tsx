import { useRef } from 'react';
import { useScramble } from '../animations';

/** Text that scrambles when its link/button is hovered or focused. */
export function ScrambleText({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useScramble(ref, text);

  return (
    <span ref={ref} className={className}>
      {text}
    </span>
  );
}
