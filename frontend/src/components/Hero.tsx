import { useRef } from 'react';
import type { Job, Profile } from '../api';
import { useHero, useHeroCube } from '../animations';

interface Props {
  profile: Profile;
  /** The job marked current in experience.json, if any. */
  currentJob: Job | null;
  /** Six words for the faces of the 3D cube (your top skills). */
  cubeFaces: string[];
  /** True after the preloader has finished. */
  start: boolean;
  animate: boolean;
  finePointer: boolean;
}

export function Hero({ profile, currentJob, cubeFaces, start, animate, finePointer }: Props) {
  const hero = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  // Particle name, fade-up text and mouse-following glows (data-depth = how far each glow moves).
  useHero(hero, canvas, title, { start, animate, finePointer });
  const cube = useRef<HTMLDivElement>(null);
  useHeroCube(cube, animate, finePointer);

  return (
    <header ref={hero} id="top" className="hero" data-particles={animate || undefined}>
      <div data-depth="40" className="hero-glow green" />
      <div data-depth="-30" className="hero-glow purple" />
      <canvas ref={canvas} className="hero-canvas" />

      <div className="hero-cube-scene" aria-hidden="true">
        <div ref={cube} className="hero-cube">
          {cubeFaces.map((face, i) => (
            <div key={i} className="hero-cube-face">
              {face}
            </div>
          ))}
        </div>
        <div className="hero-cube-shadow" />
      </div>

      <div className="hero-content">
        <p className="hero-hint">
          <b>$</b> whoami
          {animate && <span>move the mouse through the name · click to explode</span>}
        </p>
        <h1 ref={title} className="hero-title">
          <span data-line>{profile.firstName}</span>
          <span data-line>{profile.lastName}</span>
        </h1>
        {currentJob && (
          <a href={currentJob.url ?? '#experience'} className="hero-current" target={currentJob.url ? '_blank' : undefined} rel="noreferrer">
            <i />
            Currently {currentJob.role} at <strong>{currentJob.company}</strong>
            {currentJob.url && ' ↗'}
          </a>
        )}
        <div className="hero-foot">
          <p>
            <strong>{profile.role}</strong> {profile.tagline} Based in {profile.location}.
          </p>
          <a href="#about">Scroll to explore ↓</a>
        </div>
      </div>
    </header>
  );
}
