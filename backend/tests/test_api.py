import json
import os
import shutil
import tempfile
from pathlib import Path

# Point the app at a temporary copy of data/ so tests never touch your real content.
_tmp = Path(tempfile.mkdtemp())
shutil.copytree(Path(__file__).resolve().parent.parent / "data", _tmp / "data")
os.environ["DATA_DIR"] = str(_tmp / "data")
os.environ["INBOX_FILE"] = str(_tmp / "messages.jsonl")

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402

client = TestClient(app)


def teardown_module():
    shutil.rmtree(_tmp, ignore_errors=True)


def test_site_returns_content_in_camel_case():
    res = client.get("/api/site")
    assert res.status_code == 200
    body = res.json()
    assert body["profile"]["firstName"]
    assert "imageUrl" in body["projects"][0]
    assert body["skills"][0]["category"] and body["skills"][0]["items"]
    assert body["education"][0]["degree"]
    assert body["achievements"][0]["title"]
    assert body["testimonials"][0]["quote"]
    assert body["websites"][0]["url"]
    assert body["experience"][0]["company"]
    assert "current" in body["experience"][0]
    assert "githubUrl" in body["projects"][0]


def test_project_by_slug():
    assert client.get("/api/projects/orbit").json()["title"] == "Orbit"
    assert client.get("/api/projects/nope").status_code == 404


def test_editing_a_file_updates_the_api():
    path = _tmp / "data" / "skills.json"
    path.write_text(json.dumps([{"category": "Systems", "items": ["Rust"]}]))
    os.utime(path, (1, 2))  # force a new modified time
    assert client.get("/api/site").json()["skills"][0]["items"] == ["Rust"]


def test_broken_file_gives_clear_error():
    path = _tmp / "data" / "process.json"
    original = path.read_text()
    path.write_text('[{"title": "Oops"}]')
    os.utime(path, (3, 4))
    res = client.get("/api/site")
    assert res.status_code == 500
    assert "process.json" in res.json()["detail"]
    path.write_text(original)
    os.utime(path, (5, 6))


def test_contact_saves_message():
    assert client.post("/api/contact", json={"name": "A", "email": "bad", "message": "hello there"}).status_code == 422
    ok = client.post("/api/contact", json={"name": "Asha", "email": "asha@example.com", "message": "Loved your work!"})
    assert ok.status_code == 201
    line = (_tmp / "messages.jsonl").read_text().strip().splitlines()[-1]
    assert json.loads(line)["email"] == "asha@example.com"


def test_github_is_empty_without_a_username():
    # With no github_username in profile.json, no request is made to GitHub.
    path = _tmp / "data" / "profile.json"
    original = path.read_text()
    path.write_text(json.dumps({**json.loads(original), "github_username": None}))
    os.utime(path, (7, 8))
    assert client.get("/api/github").json() == []
    path.write_text(original)
    os.utime(path, (9, 10))
