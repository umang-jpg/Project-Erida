from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "ComplianceAutopilot"

    cors_origins: str = "http://localhost:5173,http://localhost:5174,http://localhost:5175"

    app_data_dir: str = Field(
        default_factory=lambda: str(Path(__file__).resolve().parent.parent / "data")
    )

    chunk_size_chars: int = Field(default=500, ge=100, le=4096)
    chunk_overlap_chars: int = Field(default=100, ge=0, le=2048)

    # Groq API credentials
    groq_api_key: str | None = None
    groq_base_url: str = "https://api.groq.com/openai/v1"
    groq_model: str = "llama3-70b-8192"

    model_config = SettingsConfigDict(
        env_file=str(Path(__file__).resolve().parent.parent / ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def cors_origin_list(self) -> list[str]:
        return [item.strip() for item in self.cors_origins.split(",") if item.strip()]

    @property
    def data_root(self) -> Path:
        return Path(self.app_data_dir).resolve()

    @property
    def uploads_dir(self) -> Path:
        return self.data_root / "uploads"

    @property
    def frameworks_dir(self) -> Path:
        return Path(__file__).resolve().parent / "data" / "frameworks"


@lru_cache
def get_settings() -> Settings:
    return Settings()
