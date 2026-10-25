import { useRef } from 'react';
import type { Job, Profile } from '../api';
import { useCompileTyping, type CodeLine } from '../animations';

// Kinds of code token. Each one has a colour class in index.css: .tok-keyword, .tok-string…
type Kind = 'keyword' | 'type' | 'key' | 'string' | 'value' | 'plain' | 'fn' | 'comment';

interface Line extends CodeLine {
  parts: [Kind, string][];
}

interface Props {
  profile: Profile;
  currentJob: Job | null;
  skills: string[];
  projectCount: number;
  animate: boolean;
}

/**
 * Pinned section: scrolling types out a TypeScript file about me, and the card
 * beside it "renders" each field the moment its line is written.
 */
export function Compile({ profile, currentJob, skills, projectCount, animate }: Props) {
  const root = useRef<HTMLElement>(null);

  // The code file, built from your profile data.
  const lines: Line[] = [
    { parts: [['comment', '// about.ts']] },
    { parts: [['keyword', 'import '], ['plain', '{ '], ['type', 'Developer'], ['plain', ' } '], ['keyword', 'from '], ['string', "'./universe'"], ['plain', ';']] },
    { parts: [] },
    { parts: [['keyword', 'export const '], ['plain', 'me: '], ['type', 'Developer'], ['plain', ' = {']] },
    { parts: [['key', '  name'], ['plain', ': '], ['string', `'${profile.firstName} ${profile.lastName}'`], ['plain', ',']], reveals: 'name' },
    { parts: [['key', '  role'], ['plain', ': '], ['string', `'${profile.role}'`], ['plain', ',']], reveals: 'role' },
    ...(currentJob
      ? [{ parts: [['key', '  worksAt'], ['plain', ': '], ['string', `'${currentJob.company}'`], ['plain', ',']], reveals: 'company' } as Line]
      : []),
    { parts: [['key', '  based'], ['plain', ': '], ['string', `'${profile.location}'`], ['plain', ',']], reveals: 'based' },
    { parts: [['key', '  stack'], ['plain', ': [']] },
    ...skills.map((s, i): Line => ({ parts: [['string', `    '${s}'`], ['plain', ',']], reveals: `skill-${i}` })),
    { parts: [['plain', '  ],']] },
    { parts: [['key', '  shipped'], ['plain', ': '], ['value', String(projectCount)], ['plain', ',']], reveals: 'shipped' },
    { parts: [['key', '  available'], ['plain', ': '], ['value', String(profile.available)], ['plain', ',']], reveals: 'available' },
    { parts: [['plain', '};']] },
    { parts: [] },
    { parts: [['fn', 'render'], ['plain', '(me); '], ['comment', '// → see it run']], reveals: 'done' },
  ];

  useCompileTyping(root, lines, animate);

  return (
    <section ref={root} className="compile">
      <div className="compile-grid">
        <div className="compile-head">
          <span className="tag">
            <b>01</b> Scroll to compile
          </span>
          <h2>I turn ideas into code that ships.</h2>
        </div>

        {/* Code editor */}
        <div className="editor">
          <div className="editor-bar">
            <i />
            <i />
            <i />
            <span>about.ts</span>
          </div>
          <pre className="editor-code" aria-hidden="true">
            {lines.map((line, i) => (
              <div key={i} className="editor-line">
                <span className="editor-line-number">{i + 1}</span>
                <code>
                  {line.parts.map(([kind, text], j) => (
                    <span key={j} className={`tok-${kind}`}>
                      {text}
                    </span>
                  ))}
                </code>
              </div>
            ))}
          </pre>
          <p className="editor-status" data-done>
            ✓ Compiled successfully · 0 errors
          </p>
        </div>

        {/* Rendered card: each piece has data-reveal="<name>" matching a line's `reveals`. */}
        <div className="render-card tilt">
          <span className="render-url">localhost:5173 · render(me)</span>
          <span className="render-running" data-reveal="done" data-shown>
            Running
          </span>
          <div className="render-who">
            <span className="render-avatar" data-reveal="name" data-shown>
              {profile.firstName[0]}
              {profile.lastName[0]}
            </span>
            <div>
              <p className="render-name" data-reveal="name" data-shown>
                {profile.firstName} {profile.lastName}
              </p>
              <p className="render-role" data-reveal="role" data-shown>
                {profile.role}
                {currentJob && (
                  <span className="render-company" data-reveal="company" data-shown>
                    {' '}@ {currentJob.company}
                  </span>
                )}
              </p>
            </div>
          </div>
          <p className="render-location" data-reveal="based" data-shown>
            ⌖ {profile.location}
          </p>
          <ul className="render-skills">
            {skills.map((s, i) => (
              <li key={s} data-reveal={`skill-${i}`} data-shown>
                {s}
              </li>
            ))}
          </ul>
          <div className="render-stats">
            <p data-reveal="shipped" data-shown>
              <strong>{projectCount}</strong> projects shipped
            </p>
            {profile.available && (
              <p data-reveal="available" data-shown>
                <i /> Available for work
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
