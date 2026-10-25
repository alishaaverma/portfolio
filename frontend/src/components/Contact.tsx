import { useRef, useState, type FormEvent } from 'react';
import { mediaUrl, sendMessage, type Profile } from '../api';
import { useLetterReveal, useMagnetic } from '../animations';
import { ScrambleText } from './ScrambleText';

interface Props {
  profile: Profile;
  animate: boolean;
  finePointer: boolean;
}

const HEADLINE = ["Let's build", 'something.'];

export function Contact({ profile, animate, finePointer }: Props) {
  const root = useRef<HTMLElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState('');

  useLetterReveal(root, animate);
  useMagnetic(button, animate && finePointer);

  const copyEmail = async () => {
    await navigator.clipboard.writeText(profile.email);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    setStatus('sending');
    setError('');
    try {
      await sendMessage({
        name: String(data.get('name')),
        email: String(data.get('email')),
        message: String(data.get('message')),
      });
      setStatus('sent');
      form.reset();
    } catch (err) {
      setStatus('idle');
      setError((err as Error).message);
    }
  };

  return (
    <section ref={root} id="contact" className="contact">
      <h2 className="contact-title" aria-label={HEADLINE.join(' ')}>
        {HEADLINE.map((line) => (
          <span key={line} aria-hidden="true">
            {[...line].map((ch, i) => (
              <span key={i}>{ch === ' ' ? ' ' : ch}</span>
            ))}
          </span>
        ))}
      </h2>

      <div className="contact-grid">
        <div className="contact-direct">
          <span className="tag">Write to me directly</span>
          <a href={`mailto:${profile.email}`} className="contact-email">
            <ScrambleText text={profile.email} />
          </a>
          <div className="contact-buttons">
            <button onClick={copyEmail} className="copy-button" data-cursor="Copy">
              {copied ? 'Copied' : 'Copy email'}
            </button>
            {profile.resumeUrl && (
              <a href={mediaUrl(profile.resumeUrl)} className="resume-button" target="_blank" rel="noreferrer" data-cursor="Open">
                Download résumé ↓
              </a>
            )}
          </div>
          {profile.links.length > 0 && (
            <div className="social-links">
              {profile.links.map((link) => (
                <a key={link.url} href={link.url} target="_blank" rel="noreferrer" data-cursor="Visit">
                  <ScrambleText text={`${link.label} ↗`} />
                </a>
              ))}
            </div>
          )}
        </div>

        <form onSubmit={onSubmit} className="contact-form">
          <label>
            Your name
            <input name="name" required maxLength={120} autoComplete="name" />
          </label>
          <label>
            Your email
            <input name="email" type="email" required maxLength={200} autoComplete="email" />
          </label>
          <label className="wide">
            What are you building?
            <textarea name="message" required minLength={10} maxLength={4000} rows={4} />
          </label>
          <div className="contact-actions">
            <button ref={button} type="submit" className="send-button" disabled={status === 'sending'} data-cursor="Send">
              {status === 'sending' ? 'Sending…' : 'Send message'}
            </button>
            <p role="status" className="contact-status">
              {status === 'sent' && 'Message sent. I usually reply within two days.'}
              {error && <span className="error">{error}</span>}
            </p>
          </div>
        </form>
      </div>
    </section>
  );
}
