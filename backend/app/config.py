import os
from functools import lru_cache
from typing import List
from dotenv import load_dotenv


# Load .env from backend root directory
BACKEND_ROOT = os.path.dirname(os.path.dirname(__file__))
ENV_PATH = os.path.join(BACKEND_ROOT, ".env")
load_dotenv(ENV_PATH)


class Settings:
    def __init__(self) -> None:
        self.DATABASE_URL: str = os.getenv("DATABASE_URL", "")
        self.SECRET_KEY: str = os.getenv("SECRET_KEY", "")
        self.ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
        self.ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
        self.REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))
        self.ENCRYPTION_KEY: str = os.getenv("ENCRYPTION_KEY", "")
        self.REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379")
        self.CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "http://localhost:3000")

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]


@lru_cache()
def get_settings() -> Settings:
    return Settings()
