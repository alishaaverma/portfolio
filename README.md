# Motion Portfolio

A portfolio site where **no content is hardcoded in the frontend**. Every word, project and skill lives in JSON files inside the Python backend's `data/` folder. The backend serves them as an API, and the React + TypeScript frontend fetches and renders them with scroll and cursor animations.

```
portfolio/
├── backend/                 Python (FastAPI)
│   ├── data/                ← YOUR CONTENT LIVES HERE
│   │   ├── profile.json     name, role, about text, email, spotlight sentences
│   │   ├── projects.json    your projects (order in the file = order on the site)
│   │   ├── skills.json      your skills, grouped by category (Skills section, marquee, "compile" card)
│   │   ├── experience.json  your jobs/internships (Work experience timeline)
│   │   ├── education.json   your degrees/courses (Education timeline)
│   │   ├── achievements.json  hackathons, awards, certificates
│   │   ├── testimonials.json  quotes from people you worked with
│   │   ├── websites.json      live websites you built or worked on (screenshots in media/sites)
│   │   └── process.json     the stacking "How I work" cards
│   ├── media/               project images, served at /media/<file>
│   ├── app/
│   │   ├── main.py          the whole API: settings, reading the JSON files, endpoints
│   │   └── schemas.py       the shape each JSON file must have
│   └── tests/test_api.py
└── frontend/                React + TypeScript + Tailwind CSS (Vite)
    └── src/
        ├── App.tsx          loads /api/site and puts the sections in order
        ├── api.ts           data types + the two API calls
        ├── animations.ts    ALL animation code: one hook per effect (useHero, useSpotlight…)
        ├── index.css        ALL styles: colours/fonts (@theme) + one class per element
        └── components/      one file per section (Hero.tsx, Compile.tsx, Projects.tsx…)
```

All styling is in `index.css` (Tailwind `@apply`). The look is a dark code-editor theme: colours and fonts are defined once at the top under `@theme` (`--color-accent` is the terminal green, `--font-display` is JetBrains Mono). Change them there and the whole site follows.

## How the data flows

```
backend/data/*.json  →  main.py (reads + validates)  →  GET /api/site
        →  App.tsx (getSite())  →  each component's props
```

1. You edit `backend/data/projects.json`.
2. The backend notices the file changed (it checks the modified time) and re-reads it. No restart needed.
3. It validates the file against `schemas.py`. If you made a mistake, the API returns a clear message such as `data/projects.json: '2.year' Input should be a valid integer.`
4. The frontend calls `GET /api/site` once and gets everything in one response.
5. JSON keys are snake_case in the files (`first_name`) and arrive as camelCase in TypeScript (`firstName`).

---

## Step 1. Install the tools

- **Python 3.11 or newer**: check with `python --version`
- **Node.js 20 or newer**: check with `node --version`

## Step 2. Run the backend

```bash
cd backend
python -m venv .venv
# Windows:  .venv\Scripts\activate
# Mac/Linux: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # on Windows: copy .env.example .env
uvicorn app.main:app --reload --port 8000
```

Check it works:
- http://localhost:8000/api/site shows your content as JSON
- http://localhost:8000/docs is an interactive page to try every endpoint

Run the tests any time with `pytest`.

## Step 3. Run the frontend

Open a **second terminal** (keep the backend running):

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. In development, Vite forwards `/api` and `/media` to the backend on port 8000 (see `vite.config.ts`), so you don't need to configure URLs.

## Step 4. Put in your own content

Edit the files in `backend/data/` and refresh the browser.

**profile.json**: wrap words in `*asterisks*` inside `about` to highlight them in the accent colour.

**projects.json**: each project looks like this:
```json
{
  "slug": "orbit",
  "title": "Orbit",
  "category": "Fintech app",
  "year": 2026,
  "summary": "One or two sentences shown when the row is opened.",
  "image_url": "/media/orbit.jpg",
  "colors": ["#f2b27a", "#c4b5fd", "#2d4a3e"],
  "tech": ["React", "TypeScript", "FastAPI"],
  "github_url": "https://github.com/you/orbit",
  "live_url": "https://orbit.example.com",
  "featured": true
}
```
- `tech`, `github_url`, `live_url` appear when the project row is opened. Use `null` for a link you don't have.
- `slug`: lowercase letters, numbers and dashes only. It must be unique.
- `image_url`: put the image file in `backend/media/` and write `/media/filename.jpg`. Use `null` to show a gradient made from `colors` instead. A full `https://` link also works.
- `featured: false` hides a project from the homepage but keeps it in `/api/projects`.

**profile.json** also has `github_username` (e.g. `"bhanushukla"`): your six latest public repos then appear in the "Open source" section, fetched live from GitHub by the backend (`GET /api/github`, cached for an hour). Leave it `null` to hide the section.

**profile.json** also has `links` (a list of `{ "label": "GitHub", "url": "…" }`, shown in the contact section and footer) and `resume_url`: put your PDF in `backend/media/` and write `"/media/resume.pdf"` to show "Download résumé" in the nav and contact section. Leave it `null` to hide it.

**experience.json**: one entry per job, newest first:
```json
{ "role": "Software Developer", "company": "Acme", "period": "2024 — Present", "points": ["One line per achievement."], "current": true, "url": "https://acme.com" }
```
Mark your present job with `"current": true`: it then shows in the hero ("Currently Software Developer at Acme"), on the compile card and with a "Current" badge on the timeline. `url` (optional) makes the company name a link.

**education.json**: same idea as experience:
```json
{ "degree": "B.Tech in Computer Science", "school": "Your University", "period": "2019 — 2023", "points": ["CGPA: 8.5 / 10"] }
```

**achievements.json**: awards, hackathons and certificates. `url` (link to the certificate) and `description` are optional:
```json
{ "title": "AWS Certified Cloud Practitioner", "issuer": "Amazon Web Services", "year": 2023, "description": null, "url": "https://…" }
```

**testimonials.json**: `{ "quote": "…", "name": "Asha Rao", "role": "Engineering Manager, Acme" }`

**websites.json**: live sites you built or worked on, shown in a browser-window card: `{ "name": "kalkiGen", "url": "https://kalkigen.com", "description": "…", "role": "What you did", "image_url": "/media/sites/kalkigen.jpg" }`. Put screenshots in `backend/media/sites/`; with `"image_url": null` the card shows the domain instead.

**Optional sections hide themselves.** If `experience.json`, `education.json`, `achievements.json`, `testimonials.json` or `websites.json` is just `[]`, that section and its nav link disappear. Handy if, for example, you don't have work experience yet.

**skills.json**: one group per category. Add as many groups or skills as you like:
```json
[{ "category": "Frontend", "items": ["React", "TypeScript"] }, { "category": "Backend", "items": ["Python"] }]
```

**Contact messages** are saved to `backend/storage/messages.jsonl`, one per line.

**Link previews.** The page title, description and Open Graph tags (what LinkedIn, WhatsApp and X show when your link is shared) are filled from `profile.json` when the frontend is built, by a small plugin in `frontend/vite.config.ts`. Rebuild after changing your name, role or tagline.

## Step 5. Add a new field (example: a GitHub link)

This is the pattern for any new content:

1. **JSON**: add `"github": "https://github.com/you"` to `backend/data/profile.json`.
2. **Python schema**: in `backend/app/schemas.py`, add `github: str | None = None` to `class Profile`.
3. **TypeScript type**: in `frontend/src/api.ts`, add `github: string | null;` to `interface Profile`.
4. **Use it**: e.g. in `Footer.tsx`, `{profile.github && <a href={profile.github}>GitHub</a>}`.

TypeScript will show an error anywhere you use the field wrongly, and the backend will reject the JSON file if the value has the wrong type.

## Step 6. Add a whole new section (example: talks)

1. Create `backend/data/talks.json` (a list of `{ "title": "...", "event": "...", "url": "..." }`).
2. In `schemas.py`, add a `Talk` model and a `talks: list[Talk]` field to `Site`.
3. In `main.py` → `get_site()`, add `talks=load("talks.json", list[Talk])`.
4. In `api.ts`, add the `Talk` interface and `talks: Talk[]` to `SiteData`.
5. Create `frontend/src/components/Talks.tsx` with only HTML and class names, and render it in `App.tsx`.
6. Add its styles to `index.css` (a new `/* ===== Talks.tsx ===== */` block) and, if it animates, a hook to `animations.ts` (or reuse `useCardsReveal` by adding the `reveal-grid` / `reveal-card` classes).

---

## The effects and where they live

All animation code is in `frontend/src/animations.ts`, one hook per effect (e.g. `useSpotlight`, `useCompileTyping`), grouped by component. All styles are in `frontend/src/index.css`. Components only render HTML and call those hooks.

| Effect | Component | Main technique |
|---|---|---|
| Terminal boot that waits on the real API call, then switches off like an old TV | `Preloader.tsx` | GSAP timeline + real request timing |
| Particle name that flees the mouse, explodes on click, blows away on scroll | `Hero.tsx` | Canvas 2D, pixel sampling, spring physics |
| Mouse-parallax glows | `Hero.tsx` | `gsap.quickTo` |
| Spotlight reveal of a hidden sentence | `Spotlight.tsx` | `clip-path: circle()` driven by CSS variables |
| Code types itself as you scroll while the profile card renders line by line | `Compile.tsx` | ScrollTrigger pin + scrub (no pin on phones) |
| Section lines draw in and headings wipe up | `SectionHead.tsx` | ScrollTrigger timeline + `clip-path` |
| Words light up while scrolling | `About.tsx` | Staggered scrubbed opacity |
| Marquee reverses with scroll direction | `Marquee.tsx` | `timeScale` from scroll velocity |
| Pinned horizontal projects, velocity skew, inner parallax | `Projects.tsx` | `containerAnimation`, `getVelocity()` |
| Floating picture that follows the cursor, rows that expand | `Projects.tsx` | `quickTo`, `grid-rows-[0fr] → [1fr]` |
| GitHub repo cards (live from the GitHub API) | `GitHub.tsx` | `useCardsReveal` + `useRefreshScrollOnChange` (the page grows when they load) |
| Cards and rows rise in one after another | `Skills.tsx`, `Achievements.tsx`, `Testimonials.tsx`, `Websites.tsx` | `useCardsReveal`: ScrollTrigger timeline with stagger |
| 3D tilt + moving light on cards, content floats above the card (add class `tilt` to any element) | `App.tsx` | `useTilt`: rotateX/rotateY toward the mouse, children lifted with `translate: 0 0 40px` |
| 3D glass cube in the hero with your top six skills: spins, follows the mouse, speeds up on scroll | `Hero.tsx` | `useHeroCube`: CSS 3D (`preserve-3d`, six `translateZ` faces) |
| 3D "cover flow" project slider: cards turn as they cross the screen | `Projects.tsx` | `rotateY` per card with `containerAnimation` |
| Process cards tip backwards as they stack | `Process.tsx` | `rotateX` with `transformPerspective` |
| Phone menu that grows as a circle from the Menu button | `Nav.tsx` | `useMobileMenu`: animated `clip-path` |
| Experience and Education timelines: line fills on scroll, dots light up | `Timeline.tsx` | Scrubbed `scaleY` + per-item ScrollTriggers |
| Stacking sticky cards | `Process.tsx` | `sticky` + scrubbed scale |
| Magnetic send button, letter-by-letter headline | `Contact.tsx` | Pointer offset → transform, elastic return |
| Text scramble on hover | `ScrambleText.tsx` | Interval-based character swap |
| Custom cursor with labels | `Cursor.tsx` | Event delegation on `[data-cursor]` |
| Scroll progress bar | `Nav.tsx` | Scrubbed `scaleX` |
| Smooth scrolling | `App.tsx` | Lenis synced to the GSAP ticker |

### Accessibility and performance built in
- Every effect turns off when the visitor's OS has "reduce motion" on, and the content still reads well.
- Cursor effects only run with a mouse or trackpad; phones get touch-friendly versions.
- The real `<h1>` stays in the page behind the particle canvas, for screen readers and search engines.
- The particle loop pauses when the hero is scrolled out of view.

---

## Deploying

**Backend** (Render, Railway, Fly.io or any VPS):
- Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Set `CORS_ORIGINS=https://your-frontend-domain.com`
- Because content lives in files, redeploy (or `git push`) after you edit `data/`.
- Contact messages are written to `storage/`. On hosts with temporary disks, add a persistent disk or swap the `/api/contact` handler for an email service such as Resend or SendGrid.

**Frontend** (Vercel, Netlify, Cloudflare Pages):
- Build command: `npm run build`, output folder: `dist`
- Set the environment variable `VITE_API_URL=https://your-backend-domain.com`

## Useful commands

| Where | Command | What it does |
|---|---|---|
| backend | `uvicorn app.main:app --reload` | Run the API with auto-reload |
| backend | `pytest` | Run the API tests |
| frontend | `npm run dev` | Run the site locally |
| frontend | `npm run typecheck` | Check TypeScript without building |
| frontend | `npm run build` | Production build into `dist/` |
