import { useRef } from 'react';
import type { Article } from '../api';
import { useCardsReveal } from '../animations';
import { SectionHead } from './SectionHead';
import { ScrambleText } from './ScrambleText';

/** Links to blog posts you've written, from backend/data/articles.json. Hidden when the file is empty. */
export function Articles({ items, animate }: { items: Article[]; animate: boolean }) {
  const root = useRef<HTMLElement>(null);
  useCardsReveal(root, animate, items.length);
  if (items.length === 0) return null;

  return (
    <section ref={root} id="writing" className="section" aria-labelledby="writing-title">
      <SectionHead id="writing-title" title="Writing" tag="Things I've written" animate={animate} />
      <ul className="article-list reveal-grid">
        {items.map((item) => (
          <li key={item.url} className="reveal-card">
            <a href={item.url} target="_blank" rel="noreferrer" className="article-row" data-cursor="Read">
              <span className="article-date">{item.date}</span>
              <ScrambleText text={item.title} className="article-title" />
              <span className="article-platform">{item.platform} ↗</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
