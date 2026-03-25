from dataclasses import dataclass, field
from typing import Optional
from collections import deque

from ..core.config import settings


@dataclass
class SchemaInfo:
    tables: list[dict] = field(default_factory=list)
    views: list[str] = field(default_factory=list)
    functions: list[str] = field(default_factory=list)
    
    def to_context_string(self) -> str:
        lines = []
        lines.append("Database Schema:")
        lines.append("")
        
        for table in self.tables:
            name = table.get('name', 'unknown')
            columns = table.get('columns', [])
            lines.append(f"Table: {name}")
            for col in columns:
                col_name = col.get('name', 'unknown')
                col_type = col.get('type', 'unknown')
                nullable = "NULL" if col.get('nullable', True) else "NOT NULL"
                lines.append(f"  - {col_name} {col_type} {nullable}")
            lines.append("")
        
        if self.views:
            lines.append("Views: " + ", ".join(self.views))
            lines.append("")
        
        return "\n".join(lines)


@dataclass
class QueryHistoryItem:
    query: str
    timestamp: str
    success: bool
    rows_affected: Optional[int] = None
    error: Optional[str] = None


@dataclass
class ChatMessage:
    role: str
    content: str
    timestamp: str


class ContextManager:
    def __init__(self):
        self._query_history: deque[QueryHistoryItem] = deque(
            maxlen=settings.MAX_QUERY_HISTORY
        )
        self._chat_history: deque[ChatMessage] = deque(
            maxlen=settings.MAX_CHAT_HISTORY
        )
        self._current_schema: Optional[SchemaInfo] = None
        self._raw_schema_text: Optional[str] = None

    def set_schema(self, schema: SchemaInfo) -> None:
        self._current_schema = schema
        self._raw_schema_text = None  # clear raw text when structured schema is set

    def get_schema(self) -> Optional[SchemaInfo]:
        return self._current_schema

    def set_schema_context(self, text: str) -> None:
        """Set a raw text schema context (used by the context route)."""
        self._raw_schema_text = text

    def get_schema_context(self) -> str:
        if self._raw_schema_text is not None:
            return self._raw_schema_text or "No schema information available."
        if self._current_schema is not None:
            return self._current_schema.to_context_string()
        return "No schema information available."

    
    def add_query_to_history(self, item: QueryHistoryItem) -> None:
        self._query_history.append(item)
    
    def get_query_history(self, limit: Optional[int] = None) -> list[QueryHistoryItem]:
        history = list(self._query_history)
        if limit:
            return history[-limit:]
        return history
    
    def add_chat_message(self, message: dict) -> None:
        self._chat_history.append(ChatMessage(
            role=message["role"],
            content=message["content"],
            timestamp=message["timestamp"]
        ))
    
    def get_chat_history(self, limit: Optional[int] = None) -> list[ChatMessage]:
        history = list(self._chat_history)
        if limit:
            return history[-limit:]
        return history
    
    def get_chat_messages_for_llm(self) -> list[dict]:
        return [
            {"role": msg.role, "content": msg.content}
            for msg in self._chat_history
        ]
    
    def clear_chat_history(self) -> None:
        self._chat_history.clear()
    
    def build_full_context(self) -> str:
        parts = []
        
        parts.append("=== DATABASE SCHEMA ===")
        parts.append(self.get_schema_context())
        parts.append("")
        
        parts.append("=== RECENT QUERIES ===")
        recent = self.get_query_history(limit=5)
        for item in recent:
            status = "SUCCESS" if item.success else "FAILED"
            parts.append(f"[{status}] {item.query}")
        parts.append("")
        
        return "\n".join(parts)


context_manager = ContextManager()
