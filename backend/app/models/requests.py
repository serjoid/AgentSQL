from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum


class DatabaseType(str, Enum):
    POSTGRESQL = "postgresql"
    SQLITE = "sqlite"


class ConnectionCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    db_type: DatabaseType
    host: Optional[str] = Field(default=None, max_length=255)
    port: Optional[int] = Field(default=None, ge=1, le=65535)
    database: str = Field(..., min_length=1, max_length=255)
    username: Optional[str] = Field(default=None, max_length=100)
    password: Optional[str] = Field(default=None)
    path: Optional[str] = Field(default=None)


class QueryExecute(BaseModel):
    connection_id: str
    query: str = Field(..., min_length=1)
    skip_confirmation: bool = Field(default=False)


class QueryValidate(BaseModel):
    query: str = Field(..., min_length=1)


class AIConfig(BaseModel):
    provider: str = Field(..., min_length=1)
    api_key: str = Field(..., min_length=1)


class AIChat(BaseModel):
    provider: str = Field(..., min_length=1)
    model: str = Field(..., min_length=1)
    message: str = Field(..., min_length=1)
    connection_id: Optional[str] = None
    include_schema: bool = Field(default=True)


class AIQuerySuggestion(BaseModel):
    provider: str = Field(..., min_length=1)
    model: str = Field(..., min_length=1)
    prompt: str = Field(..., min_length=1)
    connection_id: str


class AIAnalyzeQuery(BaseModel):
    provider: str = Field(..., min_length=1)
    model: str = Field(..., min_length=1)
    query: str = Field(..., min_length=1)
    connection_id: str
