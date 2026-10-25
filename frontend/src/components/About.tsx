import { useRef } from 'react';
import { useWordsLightUp } from '../animations';
import { SectionHead } from './SectionHead';

/** Splits one paragraph into words. Words inside *stars* or **double stars** are highlighted. */
function toWords(paragraph: string) {
  // "I love **motion** design" → [{ word: 'I' }, { word: 'love' }, { word: 'motion', highlight: true }, …]
  return paragraph
    .split(/(\*\*?[^*]+\*\*?)/g)
    .flatMap((chunk) => {
      const highlight = chunk.startsWith('*') && chunk.endsWith('*');
      return chunk.replaceAll('*', '').split(/\s+/).filter(Boolean).map((word) => ({ word, highlight }));
    });
}

/**
 * Each word lights up as the text scrolls through the screen.
 * A blank line in profile.json ("\n\n") starts a new paragraph. Long text gets a smaller font.
 */
export function About({ text, animate }: { text: string; animate: boolean }) {
  const root = useRef<HTMLElement>(null);
  const paragraphs = text.split(/\n\s*\n/).map(toWords).filter((words) => words.length > 0);
  const wordCount = paragraphs.flat().length;

  useWordsLightUp(root, animate, text);

  return (
    <section ref={root} id="about" className="section" aria-labelledby="about-title">
      <SectionHead id="about-title" title="About" tag="Words light up as you scroll" animate={animate} />
      <div className="about-text" data-long={wordCount > 60 || undefined}>
        {paragraphs.map((words, p) => (
          <p key={p}>
            {words.map((w, i) => (
              <span key={i} className={w.highlight ? 'highlight' : undefined}>
                {w.word}
              </span>
            ))}
          </p>
        ))}
      </div>
    </section>
  );
}
