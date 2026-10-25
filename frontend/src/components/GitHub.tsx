import { useEffect, useRef, useState } from 'react';
import { getGithubRepos, type Repo } from '../api';
import { useCardsReveal, useRefreshScrollOnChange } from '../animations';
import { SectionHead } from './SectionHead';

/**
 * Your latest public GitHub repos, loaded live through the backend.
 * Hidden until they arrive, and hidden for good if there is no github_username in profile.json.
 */
export function GitHub({ username, animate }: { username: string | null; animate: boolean }) {
  const root = useRef<HTMLElement>(null);
  const [repos, setRepos] = useState<Repo[]>([]);

  useEffect(() => {
    if (!username) return;
    let cancelled = false;
    getGithubRepos()
      .then((data) => !cancelled && setRepos(data))
      .catch(() => {}); // GitHub unreachable: just don't show the section
    return () => {
      cancelled = true;
    };
  }, [username]);

  useCardsReveal(root, animate, repos.length);
  useRefreshScrollOnChange(repos.length); // the page got taller, so recalculate scroll animations
  if (!username || repos.length === 0) return null;

  return (
    <section ref={root} id="github" className="section" aria-labelledby="github-title">
      <SectionHead id="github-title" title="Open source" tag="Live from my GitHub" animate={animate} />
      <div className="repo-grid reveal-grid">
        {repos.map((repo) => (
          <a key={repo.url} href={repo.url} target="_blank" rel="noreferrer" className="repo-card reveal-card tilt" data-cursor="Repo">
            <span className="repo-name">
              <i aria-hidden="true">▣</i> {username}/<b>{repo.name}</b>
            </span>
            <p>{repo.description ?? 'No description yet.'}</p>
            <span className="repo-meta">
              {repo.language && (
                <span className="repo-language" data-language={repo.language}>
                  {repo.language}
                </span>
              )}
              <span>★ {repo.stars}</span>
              <span>⑂ {repo.forks}</span>
              <span>updated {repo.updated}</span>
            </span>
          </a>
        ))}
      </div>
      <a href={`https://github.com/${username}`} target="_blank" rel="noreferrer" className="repo-all">
        View all on GitHub ↗
      </a>
    </section>
  );
}
