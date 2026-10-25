import type { Profile } from '../api';

export function Footer({ profile }: { profile: Profile }) {
  return (
    <footer className="footer">
      <span>
        © {new Date().getFullYear()} {profile.firstName} {profile.lastName} · {profile.location}
      </span>
      <span className="footer-links">
        {profile.links.map((link) => (
          <a key={link.url} href={link.url} target="_blank" rel="noreferrer">
            {link.label}
          </a>
        ))}
      </span>
      <a href="#top">Back to top ↑</a>
    </footer>
  );
}
