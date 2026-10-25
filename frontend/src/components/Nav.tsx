import { useEffect, useRef, useState } from 'react';
import { mediaUrl, type Profile } from '../api';
import { useMobileMenu, useScrollProgress } from '../animations';
import { ScrambleText } from './ScrambleText';

const ALL_LINKS = [
  { href: '#skills', label: 'Skills' },
  { href: '#work', label: 'Projects' },
  { href: '#github', label: 'GitHub' },
  { href: '#experience', label: 'Experience' },
  { href: '#education', label: 'Education' },
  { href: '#achievements', label: 'Achievements' },
  { href: '#writing', label: 'Writing' },
  { href: '#contact', label: 'Contact' },
];

interface Props {
  profile: Profile;
  animate: boolean;
  /** Section ids that are empty (so hidden on the page), e.g. ['#writing']. Their links are left out. */
  hiddenSections: string[];
}

/** Fixed top bar, a thin scroll-progress line, and a full-screen menu on phones. */
export function Nav({ profile, animate, hiddenSections }: Props) {
  const LINKS = ALL_LINKS.filter((l) => !hiddenSections.includes(l.href));
  const bar = useRef<HTMLDivElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  useScrollProgress(bar);
  useMobileMenu(menu, menuOpen, animate);

  // Close the phone menu with the Escape key.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const resume = profile.resumeUrl && (
    <a href={mediaUrl(profile.resumeUrl)} target="_blank" rel="noreferrer">
      Résumé
    </a>
  );

  return (
    <>
      <div ref={bar} className="progress-bar" />
      <nav className="nav" aria-label="Main">
        <a href="#top" className="nav-logo">
          <ScrambleText text={`<${profile.firstName[0]}${profile.lastName[0]} />`} />
        </a>
        <div className="nav-links">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href}>
              {l.label}
            </a>
          ))}
          {resume}
        </div>
        {profile.available && (
          <span className="nav-status">
            <i />
            Open to work
          </span>
        )}
        <button
          type="button"
          className="menu-button"
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? 'Close' : 'Menu'}
        </button>
      </nav>

      {/* Phone menu. Clicking any link closes it (the smooth scroll still happens). */}
      <div ref={menu} id="mobile-menu" className="mobile-menu" onClick={() => setMenuOpen(false)}>
        {LINKS.map((l, i) => (
          <a key={l.href} href={l.href}>
            <span>{String(i + 1).padStart(2, '0')}</span>
            {l.label}
          </a>
        ))}
        {resume}
      </div>
    </>
  );
}
