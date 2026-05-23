from fastapi import Depends, HTTPException, Request, Response, status
from itsdangerous import BadSignature, URLSafeTimedSerializer
from passlib.context import CryptContext

from .config import Settings, get_settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_serializer(settings: Settings) -> URLSafeTimedSerializer:
    return URLSafeTimedSerializer(settings.blog_secret_key, salt="blog-session")


def verify_password(plain_password: str, expected_password: str) -> bool:
    if expected_password.startswith("$2"):
        return pwd_context.verify(plain_password, expected_password)
    return plain_password == expected_password


def create_session(response: Response, username: str, settings: Settings) -> None:
    token = get_serializer(settings).dumps({"sub": username})
    response.set_cookie(
        settings.session_cookie_name,
        token,
        max_age=settings.session_max_age_seconds,
        httponly=True,
        samesite="lax",
        secure=False,
        path="/",
    )


def clear_session(response: Response, settings: Settings) -> None:
    response.delete_cookie(settings.session_cookie_name, path="/")


def require_user(
    request: Request,
    settings: Settings = Depends(get_settings),
) -> str:
    token = request.cookies.get(settings.session_cookie_name)
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    try:
        data = get_serializer(settings).loads(token, max_age=settings.session_max_age_seconds)
    except BadSignature as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session") from exc
    username = data.get("sub")
    if username != settings.admin_username:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid user")
    return username
