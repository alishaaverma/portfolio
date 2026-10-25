"""Shapes of the content files and of the JSON the API sends.

In the data/*.json files you write snake_case keys (first_name, image_url).
The API automatically turns them into camelCase (firstName, imageUrl) for the
TypeScript frontend.
"""
from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel

HEX = r"^#[0-9a-fA-F]{6}$"
EMAIL = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"


class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, extra="forbid")


class Link(CamelModel):
    label: str  # e.g. "GitHub"
    url: str


class Profile(CamelModel):
    first_name: str
    last_name: str
    role: str
    location: str
    tagline: str
    # Wrap words in *asterisks* to highlight them in the accent colour.
    about: str
    email: str = Field(pattern=EMAIL)
    available: bool = True
    spotlight_base: str
    spotlight_hidden: str
    # GitHub, LinkedIn… shown in the contact section and footer.
    links: list[Link] = []
    # "/media/resume.pdf" (put the file in backend/media) or a full URL. Leave out to hide the button.
    resume_url: str | None = None
    # Your GitHub username: your latest public repos are shown in the "Open source" section.
    github_username: str | None = Field(default=None, pattern=r"^[A-Za-z0-9-]+$")


class Project(CamelModel):
    slug: str = Field(pattern=r"^[a-z0-9-]+$")
    title: str
    category: str
    year: int = Field(ge=1990, le=2100)
    summary: str
    # Either a full URL or "/media/<file>" for an image in backend/media.
    image_url: str | None = None
    # Three hex colours for the gradient cover shown when there is no image.
    colors: list[str] = Field(min_length=3, max_length=3)
    # Technologies used, shown as tags when the project is opened.
    tech: list[str] = []
    github_url: str | None = None
    live_url: str | None = None
    featured: bool = True


class ProcessStep(CamelModel):
    title: str
    body: str


class Job(CamelModel):
    role: str
    company: str
    period: str  # e.g. "2024 — Present"
    # One line per achievement.
    points: list[str] = []
    # true for the job you have now: it is shown in the hero as "Currently … at …".
    current: bool = False
    # The company's website (optional). Makes the company name a link.
    url: str | None = None


class Education(CamelModel):
    degree: str
    school: str
    period: str  # e.g. "2019 — 2023"
    # Grade, coursework, awards… one line each.
    points: list[str] = []


class Achievement(CamelModel):
    title: str  # e.g. "Winner, Smart India Hackathon"
    issuer: str  # who gave it: organiser, platform, company
    year: int = Field(ge=1990, le=2100)
    description: str | None = None
    # Link to the certificate or announcement. Leave out if there is none.
    url: str | None = None


class Testimonial(CamelModel):
    quote: str
    name: str
    role: str  # e.g. "Engineering Manager, Acme"


class Article(CamelModel):
    title: str
    url: str
    platform: str  # e.g. "Medium", "dev.to", "My blog"
    date: str  # e.g. "Mar 2025"


class SkillGroup(CamelModel):
    category: str  # e.g. "Frontend"
    items: list[str]


class Site(CamelModel):
    """Everything the homepage needs, in one response."""

    profile: Profile
    projects: list[Project]
    skills: list[SkillGroup]
    process: list[ProcessStep]
    experience: list[Job]
    education: list[Education]
    achievements: list[Achievement]
    testimonials: list[Testimonial]
    articles: list[Article]


class Repo(CamelModel):
    """One public GitHub repository, as shown in the Open source section."""

    name: str
    description: str | None
    url: str
    language: str | None
    stars: int
    forks: int
    updated: str  # "2025-03-14"


class ContactIn(CamelModel):
    name: str = Field(min_length=1, max_length=120)
    email: str = Field(pattern=EMAIL, max_length=200)
    message: str = Field(min_length=10, max_length=4000)
