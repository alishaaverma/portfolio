import { useEffect, useRef, useState } from 'react';
import { usePreloader } from '../animations';

interface Props {
  /** True once the backend has answered (success or error). */
  ready: boolean;
  ok: boolean;
  /** Folder name shown in the prompt, e.g. "bhanu". */
  user: string;
  /** e.g. "5 projects · 7 skills" */
  stats: string | null;
  onDone: () => void;
}

/**
 * A terminal that "boots" the site. The request line waits for the real
 * /api/site call and prints how long it took. The animation is in usePreloader().
 */
export function Preloader({ ready, ok, user, stats, onDone }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const { waiting, spinner } = usePreloader(root, ready, onDone);

  // How long the API took to answer.
  const startTime = useRef(performance.now());
  const [ms, setMs] = useState(0);
  useEffect(() => {
    if (ready) setMs(Math.round(performance.now() - startTime.current));
  }, [ready]);

  return (
    <div ref={root} className="preloader" role="status" aria-label="Loading">
      <div id="screen" className="preloader-screen">
        <pre className="terminal">
          <span>
            <b className="prompt">~</b> $ <span id="cmd-1" />
          </span>
          <span id="out-1" className="output">
            Connected. Welcome, visitor.
          </span>
          <span>
            <b className="prompt">~/{user}</b> $ <span id="cmd-2" />
          </span>
          <span id="out-2" className="output">
            {waiting && `${spinner} GET /api/site`}
            {!waiting && ok && (
              <>
                <span className="ok">›</span> GET /api/site <span className="ok">200 OK</span> · {ms}ms
              </>
            )}
            {!waiting && !ok && <span className="fail">✗ GET /api/site failed</span>}
          </span>
          <span id="out-3" className="output">
            {ok ? `  › ${stats} loaded` : '  › showing the error page'}
          </span>
          <span id="out-4" className="output">
            <span className={ok ? 'ok' : 'fail'}>{ok ? '✓' : '!'}</span>{' '}
            {ok ? 'ready. starting renderer' : 'starting in safe mode'}
            <span className="caret" />
          </span>
        </pre>
      </div>
    </div>
  );
}
