import { useRef } from 'react';
import { useWordsLightUp } from '../animations';
import { SectionHead } from './SectionHead';

/** Each word lights up as the paragraph scrolls through the screen. Words in *stars* are highlighted. */
export function About({ text, animate }: { text: string; animate: boolean }) {
  const root = useRef<HTMLElement>(null);

  // "I love *motion* design" → [{ text: 'I' }, { text: 'love' }, { text: 'motion', highlight: true }, …]
  const words = text
    .split(/(\*[^*]+\*)/g)
    .flatMap((chunk) => {
      const highlight = chunk.startsWith('*');
      return chunk.replaceAll('*', '').split(/\s+/).filter(Boolean).map((word) => ({ word, highlight }));
    });

  useWordsLightUp(root, animate, text);

  return (
    <section ref={root} id="about" className="section" aria-labelledby="about-title">
      <SectionHead id="about-title" title="About" tag="Words light up as you scroll" animate={animate} />
      <p className="about-text">
        {words.map((w, i) => (
          <span key={i} className={w.highlight ? 'highlight' : undefined}>
            {w.word}
          </span>
        ))}
      </p>
    </section>
  );
}
