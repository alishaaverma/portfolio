// Talks to the Python backend. The types match backend/app/schemas.py
// (the API sends camelCase keys, e.g. first_name in the JSON arrives as firstName).

export interface Profile {
  firstName: string;
  lastName: string;
  role: string;
  location: string;
  tagline: string;
  /** Words wrapped in *asterisks* are highlighted. */
  about: string;
  email: string;
  available: boolean;
  spotlightBase: string;
  spotlightHidden: string;
  /** GitHub, LinkedIn… */
  links: Link[];
  resumeUrl: string | null;
  /** Shows your latest public repos in the Open source section. */
  githubUsername: string | null;
}

/** A public GitHub repository (from GET /api/github). */
export interface Repo {
  name: string;
  description: string | null;
  url: string;
  language: string | null;
  stars: number;
  forks: number;
  /** "2025-03-14" */
  updated: string;
}

export interface Link {
  label: string;
  url: string;
}

export interface Project {
  slug: string;
  title: string;
  category: string;
  year: number;
  summary: string;
  imageUrl: string | null;
  /** Three hex colours for the gradient cover. */
  colors: string[];
  /** Technologies used, shown as tags. */
  tech: string[];
  githubUrl: string | null;
  liveUrl: string | null;
  featured: boolean;
}

export interface Job {
  role: string;
  company: string;
  /** e.g. "2024 — Present" */
  period: string;
  points: string[];
  /** The job you have now. */
  current: boolean;
  /** Company website. */
  url: string | null;
}

export interface Education {
  degree: string;
  school: string;
  /** e.g. "2019 — 2023" */
  period: string;
  points: string[];
}

export interface Achievement {
  title: string;
  issuer: string;
  year: number;
  description: string | null;
  /** Link to the certificate, if any. */
  url: string | null;
}

export interface Testimonial {
  quote: string;
  name: string;
  /** e.g. "Engineering Manager, Acme" */
  role: string;
}

export interface Article {
  title: string;
  url: string;
  /** e.g. "Medium", "dev.to" */
  platform: string;
  /** e.g. "Mar 2025" */
  date: string;
}

export interface SkillGroup {
  /** e.g. "Frontend" */
  category: string;
  items: string[];
}

export interface ProcessStep {
  title: string;
  body: string;
}

export interface SiteData {
  profile: Profile;
  projects: Project[];
  skills: SkillGroup[];
  process: ProcessStep[];
  experience: Job[];
  education: Education[];
  achievements: Achievement[];
  testimonials: Testimonial[];
  articles: Article[];
}

/** Empty in development (Vite forwards /api). Set VITE_API_URL in production. */
const BASE_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(BASE_URL + path, { ...init, headers: { 'Content-Type': 'application/json' } });
  } catch {
    throw new Error('Could not reach the backend. Is it running on port 8000?');
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(typeof body.detail === 'string' ? body.detail : 'Please check the form fields.');
  }
  return res.json();
}

export const getSite = () => request<SiteData>('/api/site');

export const getGithubRepos = () => request<Repo[]>('/api/github');

export const sendMessage = (data: { name: string; email: string; message: string }) =>
  request('/api/contact', { method: 'POST', body: JSON.stringify(data) });

/** Turns "/media/x.jpg" from the backend into a full URL. */
export const mediaUrl = (path: string) => (path.startsWith('/') ? BASE_URL + path : path);
