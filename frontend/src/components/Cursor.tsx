import { useRef } from 'react';
import { useCustomCursor } from '../animations';

/** Custom cursor: a dot plus a trailing ring that shows labels from data-cursor="…". */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  useCustomCursor(dot, ring, label);

  return (
    <>
      <div ref={dot} className="cursor-dot" />
      <div ref={ring} className="cursor-ring">
        <span ref={label} />
      </div>
    </>
  );
}
