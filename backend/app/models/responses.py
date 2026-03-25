from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime


class QueryValidationResponse(BaseModel):
    is_destructive: bool
    operation_type: Optional[str] = None
    tables_affected: list[str] = []
    requires_confirmation: bool
    normalized_query: str


class QueryResultResponse(BaseModel):
    success: bool
    columns: list[str] = []
    rows: list[dict] = []
    row_count: int = 0
    execution_time_ms: float
    message: Optional[str] = None


class ConnectionResponse(BaseModel):
    id: str
    name: str
    db_type: str
    database: str
    connected: bool
    connected_at: Optional[datetime] = None


class SchemaResponse(BaseModel):
    connection_id: str
    tables: list[dict]
    views: list[str] = []
    functions: list[str] = []


class AIProviderResponse(BaseModel):
    provider: str
    models: list[str]
    is_configured: bool


class AIChatResponse(BaseModel):
    response: str
    provider: str
    model: str
    timestamp: str


class AIAnalysisResponse(BaseModel):
    explanation: str
    affected_tables: list[str]
    risk_level: str
    suggestions: list[str]


class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None
    code: Optional[str] = None


class HealthResponse(BaseModel):
    status: str
    version: str
    uptime_seconds: float
