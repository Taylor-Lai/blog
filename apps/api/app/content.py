from __future__ import annotations

import json
import os
import re
import subprocess
from dataclasses import dataclass
from datetime import date, datetime
from pathlib import Path
from typing import Any, Literal

import frontmatter
from markdown_it import MarkdownIt
from mdit_py_plugins.front_matter import front_matter_plugin
from sqlalchemy import delete
from sqlalchemy.orm import Session

from .config import Settings
from .db import ContentIndex, UploadRecord

ModuleName = Literal["diary", "essays"]

DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
SLUG_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")

md = MarkdownIt("commonmark", {"html": False}).use(front_matter_plugin)


@dataclass
class ParsedContent:
    module: ModuleName
    slug: str
    title: str | None
    date: date
    tags: list[str]
    summary: str | None
    body_text: str
    body_html: str
    path: Path


@dataclass
class ContentError:
    path: str
    message: str


def parse_date(value: Any) -> date:
    if isinstance(value, date):
        return value
    if isinstance(value, str) and DATE_RE.match(value):
        return datetime.strptime(value, "%Y-%m-%d").date()
    raise ValueError("date must use YYYY-MM-DD")


def normalize_tags(value: Any) -> list[str]:
    if value is None:
        return []
    if not isinstance(value, list) or not all(isinstance(item, str) for item in value):
        raise ValueError("tags must be a list of strings")
    return value


def expected_parent(content_dir: Path, module: ModuleName, item_date: date) -> Path:
    return content_dir / module / f"{item_date:%Y}" / f"{item_date:%m}"


def parse_markdown_file(path: Path, content_dir: Path, module: ModuleName) -> ParsedContent:
    post = frontmatter.load(path)
    item_date = parse_date(post.metadata.get("date"))
    tags = normalize_tags(post.metadata.get("tags"))
    rel_path = path.relative_to(content_dir)
    expected_dir = Path(module) / f"{item_date:%Y}" / f"{item_date:%m}"
    if rel_path.parent != expected_dir:
        raise ValueError("path year/month must match front matter date")

    body_text = post.content.strip()
    body_html = md.render(body_text)

    if module == "diary":
        expected_name = f"{item_date:%Y-%m-%d}.md"
        if path.name != expected_name:
            raise ValueError("diary filename must be YYYY-MM-DD.md")
        return ParsedContent(
            module=module,
            slug=f"{item_date:%Y-%m-%d}",
            title=None,
            date=item_date,
            tags=tags,
            summary=None,
            body_text=body_text,
            body_html=body_html,
            path=path,
        )

    title = post.metadata.get("title")
    slug = post.metadata.get("slug")
    summary = post.metadata.get("summary")
    if not isinstance(title, str) or not title.strip():
        raise ValueError("essay title is required")
    if not isinstance(slug, str) or not SLUG_RE.match(slug):
        raise ValueError("essay slug must use lowercase letters, numbers, and dashes")
    if summary is not None and not isinstance(summary, str):
        raise ValueError("summary must be a string")
    expected_prefix = f"{item_date:%Y-%m-%d}-"
    if not path.name.startswith(expected_prefix) or path.suffix != ".md":
        raise ValueError("essay filename must be YYYY-MM-DD-slug.md")

    return ParsedContent(
        module=module,
        slug=slug,
        title=title.strip(),
        date=item_date,
        tags=tags,
        summary=summary,
        body_text=body_text,
        body_html=body_html,
        path=path,
    )


def scan_content(settings: Settings) -> tuple[list[ParsedContent], list[ContentError]]:
    content_dir = settings.content_dir
    items: list[ParsedContent] = []
    errors: list[ContentError] = []
    for module in ("diary", "essays"):
        module_dir = content_dir / module
        if not module_dir.exists():
            continue
        for path in module_dir.rglob("*.md"):
            try:
                items.append(parse_markdown_file(path, content_dir, module))
            except Exception as exc:
                errors.append(ContentError(str(path), str(exc)))
    return items, errors


def rebuild_index(db: Session, settings: Settings) -> list[ContentError]:
    items, errors = scan_content(settings)
    db.execute(delete(ContentIndex))
    for item in items:
        db.add(
            ContentIndex(
                module=item.module,
                slug=item.slug,
                title=item.title,
                date=item.date,
                tags=json.dumps(item.tags, ensure_ascii=False),
                summary=item.summary,
                path=str(item.path),
                body_text=item.body_text,
            )
        )
    db.commit()
    return errors


def index_to_dict(item: ContentIndex) -> dict[str, Any]:
    return {
        "module": item.module,
        "slug": item.slug,
        "title": item.title,
        "date": item.date.isoformat(),
        "tags": json.loads(item.tags),
        "summary": item.summary,
        "path": item.path,
    }


def detail_for(module: ModuleName, slug: str, settings: Settings) -> ParsedContent | None:
    items, _ = scan_content(settings)
    for item in items:
        if item.module == module and item.slug == slug:
            return item
    return None


def safe_upload_path(filename: str) -> str:
    name = Path(filename).name
    if not name.endswith(".md"):
        raise ValueError("only .md files are accepted")
    if name != filename:
        raise ValueError("nested paths are not accepted")
    return name


def target_for_upload(module: ModuleName, raw_markdown: str, filename: str, settings: Settings) -> Path:
    safe_name = safe_upload_path(filename)
    post = frontmatter.loads(raw_markdown)
    item_date = parse_date(post.metadata.get("date"))
    target_dir = expected_parent(settings.content_dir, module, item_date)
    if module == "diary":
        expected = f"{item_date:%Y-%m-%d}.md"
        if safe_name != expected:
            raise ValueError("diary upload filename must be YYYY-MM-DD.md")
    else:
        slug = post.metadata.get("slug")
        if not isinstance(slug, str) or not SLUG_RE.match(slug):
            raise ValueError("essay slug must use lowercase letters, numbers, and dashes")
        expected_prefix = f"{item_date:%Y-%m-%d}-"
        if not safe_name.startswith(expected_prefix):
            raise ValueError("essay upload filename must start with YYYY-MM-DD-")
    return target_dir / safe_name


def ensure_no_upload_conflict(module: ModuleName, target: Path, raw_markdown: str, settings: Settings) -> None:
    if target.exists():
        raise ValueError("a file with the same name already exists")

    post = frontmatter.loads(raw_markdown)
    item_date = parse_date(post.metadata.get("date"))
    items, _ = scan_content(settings)
    if module == "diary":
        if any(item.module == "diary" and item.date == item_date for item in items):
            raise ValueError("a diary entry for this date already exists")
        return

    slug = post.metadata.get("slug")
    if any(item.module == "essays" and item.slug == slug for item in items):
        raise ValueError("an essay with this slug already exists")


def run_git(args: list[str], settings: Settings) -> str:
    env = {
        **os.environ,
        "GIT_AUTHOR_NAME": settings.git_author_name,
        "GIT_AUTHOR_EMAIL": settings.git_author_email,
        "GIT_COMMITTER_NAME": settings.git_author_name,
        "GIT_COMMITTER_EMAIL": settings.git_author_email,
    }
    result = subprocess.run(
        ["git", *args],
        check=True,
        capture_output=True,
        text=True,
        env=env,
    )
    return (result.stdout or result.stderr).strip()


def commit_uploaded_file(path: Path, settings: Settings) -> str | None:
    if not settings.git_auto_push:
        return None
    run_git(["add", str(path)], settings)
    run_git(["commit", "-m", f"Add content {path.name}"], settings)
    run_git(["push", settings.git_remote, settings.git_branch], settings)
    return run_git(["rev-parse", "HEAD"], settings)


def upload_markdown(
    db: Session,
    module: ModuleName,
    filename: str,
    raw_markdown: str,
    settings: Settings,
) -> dict[str, Any]:
    target = target_for_upload(module, raw_markdown, filename, settings)
    ensure_no_upload_conflict(module, target, raw_markdown, settings)

    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(raw_markdown, encoding="utf-8")
    try:
        parse_markdown_file(target, settings.content_dir, module)
        commit_hash = commit_uploaded_file(target, settings)
        errors = rebuild_index(db, settings)
        db.add(
            UploadRecord(
                module=module,
                path=str(target),
                commit_hash=commit_hash,
                success=True,
                message="uploaded",
            )
        )
        db.commit()
        return {"path": str(target), "commit": commit_hash, "errors": [error.__dict__ for error in errors]}
    except Exception as exc:
        db.add(UploadRecord(module=module, path=str(target), success=False, message=str(exc)))
        db.commit()
        target.unlink(missing_ok=True)
        raise
