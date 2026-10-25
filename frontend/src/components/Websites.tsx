import { useRef } from 'react';
import { mediaUrl, type Website } from '../api';
import { useCardsReveal } from '../animations';
import { SectionHead } from './SectionHead';

/** Live websites you built or worked on, from backend/data/websites.json. Hidden when the file is empty. */
export function Websites({ items, animate }: { items: Website[]; animate: boolean }) {
  const root = useRef<HTMLElement>(null);
  useCardsReveal(root, animate, items.length);
  if (items.length === 0) return null;

  return (
    <section ref={root} id="websites" className="section" aria-labelledby="websites-title">
      <SectionHead id="websites-title" title="Live websites" tag="Sites I've built and worked on" animate={animate} />
      <div className="websites-grid reveal-grid">
        {items.map((site) => {
          const domain = site.url.replace(/^https?:\/\//, '').replace(/\/$/, '');
          return (
            <a key={site.url} href={site.url} target="_blank" rel="noreferrer" className="site-card reveal-card tilt" data-cursor="Visit">
              <div className="site-bar">
                <i />
                <i />
                <i />
                <span className="site-address">{domain}</span>
                <span className="site-live">Live</span>
              </div>
              <div className="site-screen">
                {site.imageUrl ? (
                  <img src={mediaUrl(site.imageUrl)} alt={`Screenshot of ${site.name}`} loading="lazy" />
                ) : (
                  <span className="site-placeholder">{domain}</span>
                )}
              </div>
              <div className="site-body">
                <h3>{site.name}</h3>
                {site.description && <p>{site.description}</p>}
                {site.role && <span className="site-role">{site.role}</span>}
                <span className="site-visit">Visit site ↗</span>
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );
}
