from __future__ import annotations

from typing import Annotated

from fastapi import Depends, FastAPI, File, Form, HTTPException, Response, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from .auth import clear_session, create_session, require_user, verify_password
from .config import Settings, get_settings
from .content import detail_for, index_to_dict, rebuild_index, scan_content, upload_markdown
from .db import ContentIndex, SessionLocal, get_db, init_db

app = FastAPI(title="Private Blog API")


class LoginPayload(BaseModel):
    username: str
    password: str


@app.on_event("startup")
def startup() -> None:
    init_db()
    settings = get_settings()
    with SessionLocal() as db:
        rebuild_index(db, settings)


settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/healthz")
def healthz() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/auth/login")
def login(payload: LoginPayload, response: Response, settings: Settings = Depends(get_settings)) -> dict[str, str]:
    if payload.username != settings.admin_username or not verify_password(payload.password, settings.admin_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username or password")
    create_session(response, payload.username, settings)
    return {"username": payload.username}


@app.post("/api/auth/logout")
def logout(response: Response, settings: Settings = Depends(get_settings)) -> dict[str, str]:
    clear_session(response, settings)
    return {"status": "ok"}


@app.get("/api/me")
def me(username: Annotated[str, Depends(require_user)]) -> dict[str, str]:
    return {"username": username}


@app.get("/api/modules")
def modules(username: Annotated[str, Depends(require_user)]) -> list[dict[str, str]]:
    return [
        {"key": "diary", "name": "日记", "description": "按日期记录的私人日记"},
        {"key": "essays", "name": "随笔", "description": "带标题的长一点的想法"},
    ]


@app.get("/api/diary")
def diary_list(
    username: Annotated[str, Depends(require_user)],
    db: Session = Depends(get_db),
) -> list[dict]:
    items = db.scalars(select(ContentIndex).where(ContentIndex.module == "diary").order_by(ContentIndex.date.desc())).all()
    return [index_to_dict(item) for item in items]


@app.get("/api/diary/{entry_date}")
def diary_detail(
    entry_date: str,
    username: Annotated[str, Depends(require_user)],
    settings: Settings = Depends(get_settings),
) -> dict:
    item = detail_for("diary", entry_date, settings)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Diary entry not found")
    return {**item.__dict__, "date": item.date.isoformat(), "path": str(item.path)}


@app.get("/api/essays")
def essay_list(
    username: Annotated[str, Depends(require_user)],
    db: Session = Depends(get_db),
) -> list[dict]:
    items = db.scalars(select(ContentIndex).where(ContentIndex.module == "essays").order_by(ContentIndex.date.desc())).all()
    return [index_to_dict(item) for item in items]


@app.get("/api/essays/{slug}")
def essay_detail(
    slug: str,
    username: Annotated[str, Depends(require_user)],
    settings: Settings = Depends(get_settings),
) -> dict:
    item = detail_for("essays", slug, settings)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Essay not found")
    return {**item.__dict__, "date": item.date.isoformat(), "path": str(item.path)}


@app.get("/api/search")
def search(
    q: str,
    username: Annotated[str, Depends(require_user)],
    db: Session = Depends(get_db),
) -> list[dict]:
    needle = f"%{q.strip()}%"
    if len(q.strip()) < 2:
        return []
    items = db.scalars(
        select(ContentIndex)
        .where(or_(ContentIndex.title.ilike(needle), ContentIndex.summary.ilike(needle), ContentIndex.body_text.ilike(needle)))
        .order_by(ContentIndex.date.desc())
    ).all()
    return [index_to_dict(item) for item in items]


@app.post("/api/admin/upload")
async def upload(
    module: Annotated[str, Form()],
    file: Annotated[UploadFile, File()],
    username: Annotated[str, Depends(require_user)],
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> dict:
    if module not in {"diary", "essays"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unknown module")
    raw = (await file.read()).decode("utf-8")
    try:
        return upload_markdown(db, module, file.filename or "", raw, settings)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@app.post("/api/admin/reindex")
def reindex(
    username: Annotated[str, Depends(require_user)],
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> dict:
    errors = rebuild_index(db, settings)
    return {"errors": [error.__dict__ for error in errors]}


@app.get("/api/admin/content-errors")
def content_errors(
    username: Annotated[str, Depends(require_user)],
    settings: Settings = Depends(get_settings),
) -> list[dict[str, str]]:
    _, errors = scan_content(settings)
    return [error.__dict__ for error in errors]
