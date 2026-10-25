"""The portfolio API.

All website content lives in JSON files inside data/. Each request reads them,
checks them against schemas.py and sends them to the frontend. Files are cached
until you save them again, so edits show up without restarting the server.
"""
import json
import os
import time
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import TypeAdapter, ValidationError

from .schemas import (
    Achievement,
    ContactIn,
    Education,
    Job,
    ProcessStep,
    Profile,
    Project,
    Repo,
    SkillGroup,
    Site,
    Testimonial,
    Website,
)

# ---------- settings (from environment variables or backend/.env) ----------

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

DATA_DIR = Path(os.getenv("DATA_DIR", BASE_DIR / "data"))  # content JSON files
MEDIA_DIR = BASE_DIR / "media"  # project images, served at /media/<file>
INBOX_FILE = Path(os.getenv("INBOX_FILE", BASE_DIR / "storage" / "messages.jsonl"))  # contact messages
CORS_ORIGINS = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",") if o.strip()]

# ---------- reading the content files ----------


class ContentError(Exception):
    """A content file is missing or has a mistake in it."""


_cache: dict[str, tuple[float, object]] = {}


def load(filename: str, shape):
    """Reads data/<filename>, validates it against `shape` and caches it until the file changes."""
    path = DATA_DIR / filename
    if not path.exists():
        raise ContentError(f"Missing content file: data/{filename}")

    modified = path.stat().st_mtime
    if filename in _cache and _cache[filename][0] == modified:
        return _cache[filename][1]

    try:
        value = TypeAdapter(shape).validate_python(json.loads(path.read_text(encoding="utf-8")))
    except json.JSONDecodeError as exc:
        raise ContentError(f"data/{filename} is not valid JSON (line {exc.lineno}, column {exc.colno}).") from exc
    except ValidationError as exc:
        first = exc.errors()[0]
        where = ".".join(str(p) for p in first["loc"])
        raise ContentError(f"data/{filename}: '{where}' {first['msg']}.") from exc

    _cache[filename] = (modified, value)
    return value


# ---------- the app ----------

app = FastAPI(title="Portfolio API")
app.add_middleware(CORSMiddleware, allow_origins=CORS_ORIGINS, allow_methods=["GET", "POST"], allow_headers=["*"])

MEDIA_DIR.mkdir(exist_ok=True)
app.mount("/media", StaticFiles(directory=MEDIA_DIR), name="media")


@app.exception_handler(ContentError)
async def content_error(_: Request, exc: ContentError) -> JSONResponse:
    # Tells you exactly which file and field to fix, instead of a generic error.
    return JSONResponse(status_code=500, content={"detail": str(exc)})


@app.get("/api/site", response_model=Site)
def get_site() -> Site:
    """Everything the homepage needs, in one request."""
    projects = load("projects.json", list[Project])
    return Site(
        profile=load("profile.json", Profile),
        projects=[p for p in projects if p.featured],
        skills=load("skills.json", list[SkillGroup]),
        process=load("process.json", list[ProcessStep]),
        experience=load("experience.json", list[Job]),
        education=load("education.json", list[Education]),
        achievements=load("achievements.json", list[Achievement]),
        testimonials=load("testimonials.json", list[Testimonial]),
        websites=load("websites.json", list[Website]),
    )


@app.get("/api/projects", response_model=list[Project])
def list_projects() -> list[Project]:
    return load("projects.json", list[Project])


@app.get("/api/projects/{slug}", response_model=Project)
def get_project(slug: str) -> Project:
    for project in load("projects.json", list[Project]):
        if project.slug == slug:
            return project
    raise HTTPException(404, f"No project called '{slug}'.")


_github_cache: dict[str, tuple[float, list[Repo]]] = {}


@app.get("/api/github", response_model=list[Repo])
def github_repos() -> list[Repo]:
    """Your six most recently updated public GitHub repos (not forks).

    Needs "github_username" in profile.json. Asked from GitHub at most once an hour;
    if GitHub can't be reached, the last answer (or an empty list) is returned.
    """
    username = load("profile.json", Profile).github_username
    if not username:
        return []

    cached = _github_cache.get(username)
    if cached and time.time() - cached[0] < 3600:
        return cached[1]

    request = urllib.request.Request(
        f"https://api.github.com/users/{username}/repos?sort=pushed&per_page=30&type=owner",
        headers={"Accept": "application/vnd.github+json", "User-Agent": "portfolio-site"},
    )
    try:
        with urllib.request.urlopen(request, timeout=5) as response:
            data = json.load(response)
    except (OSError, ValueError):
        return cached[1] if cached else []

    repos = [
        Repo(
            name=r["name"],
            description=r.get("description"),
            url=r["html_url"],
            language=r.get("language"),
            stars=r["stargazers_count"],
            forks=r["forks_count"],
            updated=r["pushed_at"][:10],
        )
        for r in data
        if not r.get("fork")
    ][:6]
    _github_cache[username] = (time.time(), repos)
    return repos


@app.post("/api/contact", status_code=201)
def send_message(payload: ContactIn) -> dict[str, bool]:
    """Saves the message as one line in storage/messages.jsonl."""
    INBOX_FILE.parent.mkdir(parents=True, exist_ok=True)
    record = {
        "received_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "name": payload.name.strip(),
        "email": payload.email.strip(),
        "message": payload.message.strip(),
    }
    with INBOX_FILE.open("a", encoding="utf-8") as f:
        f.write(json.dumps(record, ensure_ascii=False) + "\n")
    return {"ok": True}


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
