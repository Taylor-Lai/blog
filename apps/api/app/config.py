from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    site_title: str = "Private Journal"
    blog_secret_key: str = "dev-secret"
    admin_username: str = "admin"
    admin_password: str = "admin123"
    database_url: str = "postgresql+psycopg://blog:blog@localhost:5432/blog"
    content_dir: Path = Path("content")
    cors_origins: str = "http://localhost:3000"
    git_auto_push: bool = False
    git_remote: str = "origin"
    git_branch: str = "main"
    git_author_name: str = "Blog Bot"
    git_author_email: str = "blog@example.com"
    session_cookie_name: str = "blog_session"
    session_max_age_seconds: int = Field(default=60 * 60 * 24 * 14)

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
