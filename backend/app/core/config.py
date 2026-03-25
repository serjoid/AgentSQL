from pydantic_settings import BaseSettings
from typing import Optional
import secrets
import os


class Settings(BaseSettings):
    BACKEND_HOST: str = "localhost"
    BACKEND_PORT: int = 8000
    DEBUG: bool = False
    
    ENCRYPTION_KEY: Optional[str] = None
    SESSION_SECRET: Optional[str] = None
    
    MAX_QUERY_HISTORY: int = 50
    MAX_CHAT_HISTORY: int = 20
    QUERY_TIMEOUT: int = 30
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.ENCRYPTION_KEY:
            self.ENCRYPTION_KEY = secrets.token_urlsafe(32)
        if not self.SESSION_SECRET:
            self.SESSION_SECRET = secrets.token_urlsafe(32)


settings = Settings()
