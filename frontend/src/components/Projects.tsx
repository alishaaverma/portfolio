import { useRef, useState, type CSSProperties } from 'react';
import { mediaUrl, type Project } from '../api';
import { useFollowPreview, useHorizontalSlider } from '../animations';
import { ScrambleText } from './ScrambleText';
import { SectionHead } from './SectionHead';

interface Props {
  projects: Project[];
  animate: boolean;
  finePointer: boolean;
}

/**
 * Project picture: the uploaded image, or a gradient made from the project's three colours.
 * The colours come from projects.json, so they are passed to index.css as CSS variables.
 */
function Cover({ project, active, tilt }: { project: Project; active?: boolean; tilt?: boolean }) {
  const [c0 = '#c4b5fd', c1 = '#f2b27a', c2 = '#1b2a24'] = project.colors;
  const colors = { '--c0': c0, '--c1': c1, '--c2': c2 } as CSSProperties;
  return (
    <div className={tilt ? "cover tilt" : "cover"} style={colors} data-active={active || undefined}>
      <div className="cover-inner">{project.imageUrl && <img src={mediaUrl(project.imageUrl)} alt="" loading="lazy" />}</div>
    </div>
  );
}

export function Projects({ projects, animate, finePointer }: Props) {
  return (
    <>
      <ProjectSlider projects={projects} animate={animate} />
      <ProjectList projects={projects} animate={animate} finePointer={finePointer} />
    </>
  );
}

/**
 * The section pins and the cards slide sideways as you scroll down.
 * Cards lean with scroll speed, pictures drift inside their frames.
 * Without animation it is a normal swipeable row.
 */
function ProjectSlider({ projects, animate }: { projects: Project[]; animate: boolean }) {
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useHorizontalSlider(root, track, animate, projects.length);

  return (
    <section ref={root} id="work" className="slider" data-animated={animate || undefined}>
      <div ref={track} className="slider-track">
        <div className="slider-intro">
          <span className="tag">Scroll down, move sideways</span>
          <h2>Selected projects</h2>
          <p>{projects.length} recent pieces of work.</p>
        </div>
        {projects.map((p) => (
          <a key={p.slug} href={`#project-${p.slug}`} className="slider-card" data-cursor="View">
            <Cover project={p} tilt />
            <div className="slider-card-meta">
              <h3>{p.title}</h3>
              <span>
                {p.category} · {p.year}
              </span>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

/** List of projects. Hovering a row shows a floating picture that follows the cursor; clicking opens the summary. */
function ProjectList({ projects, animate, finePointer }: Props) {
  const preview = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const showPreview = animate && finePointer;

  useFollowPreview(preview, showPreview, hovered);

  return (
    <section className="section" aria-labelledby="index-title">
      <SectionHead id="index-title" title="Project index" tag="Hover a row, click for details" animate={animate} />
      <ul className="project-list" onPointerLeave={() => setHovered(null)}>
        {projects.map((p, i) => {
          const isOpen = open === p.slug;
          return (
            <li key={p.slug} id={`project-${p.slug}`} className="project-row" data-open={isOpen || undefined}>
              <button
                type="button"
                className="project-row-head"
                aria-expanded={isOpen}
                data-cursor={isOpen ? 'Close' : 'Open'}
                onPointerEnter={() => setHovered(p.slug)}
                onClick={() => setOpen(isOpen ? null : p.slug)}
              >
                <span className="project-number">{String(i + 1).padStart(2, '0')}</span>
                <Cover project={p} />
                <ScrambleText text={p.title} className="project-title" />
                <span className="project-meta">
                  {p.category} · {p.year}
                </span>
              </button>
              <div className="project-summary">
                <div>
                  <div className="project-details">
                    <p>{p.summary}</p>
                    {p.tech.length > 0 && (
                      <ul className="tech-tags" aria-label="Built with">
                        {p.tech.map((t) => (
                          <li key={t}>{t}</li>
                        ))}
                      </ul>
                    )}
                    {(p.githubUrl || p.liveUrl) && (
                      <div className="project-links">
                        {p.liveUrl && (
                          <a href={p.liveUrl} target="_blank" rel="noreferrer" data-cursor="Visit">
                            Live site ↗
                          </a>
                        )}
                        {p.githubUrl && (
                          <a href={p.githubUrl} target="_blank" rel="noreferrer" data-cursor="Code">
                            Source code ↗
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {showPreview && (
        <div ref={preview} className="project-preview">
          {projects.map((p) => (
            <Cover key={p.slug} project={p} active={hovered === p.slug} />
          ))}
        </div>
      )}
    </section>
  );
}
