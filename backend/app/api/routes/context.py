"""
api/routes/context.py — Context management routes for the LLM.

Provides endpoints to push schema information into the in-memory context
manager so the AI assistant always knows which database it is working with.
"""

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncEngine

from ...db.connections import ConnectionInfo
from ...db.metadata import schema_extractor
from ...llm.context import context_manager
from ..dependencies import get_active_connection, get_engine

router = APIRouter(prefix="/context", tags=["context"])


@router.get("/schema/{connection_id}")
async def get_schema_context(connection_id: str):
    """Return the current schema context stored in the LLM context manager."""
    text = context_manager.get_schema_context()
    return {"connection_id": connection_id, "schema_context": text}


@router.post("/schema/{connection_id}")
async def refresh_schema_context(
    connection_id: str,
    conn: ConnectionInfo = Depends(get_active_connection),
    engine: AsyncEngine = Depends(get_engine),
):
    """
    Extract the schema from the live connection and push it to the
    LLM context manager so subsequent AI calls include the latest DDL.
    """
    try:
        schema_response = await schema_extractor.extract(engine, connection_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Schema extraction failed: {e}")

    # Build a compact text representation of the schema for the LLM
    lines: list[str] = [f"-- Database: {conn.database} ({conn.db_type})"]
    for table in schema_response.tables:
        col_defs = ", ".join(
            f"{c['name']} {c['type']}{'  PK' if c['primary_key'] else ''}"
            for c in table["columns"]
        )
        lines.append(f"TABLE {table['name']} ({col_defs})")

    for view in schema_response.views:
        lines.append(f"VIEW {view}")

    schema_text = "\n".join(lines)
    context_manager.set_schema_context(schema_text)

    return {
        "success": True,
        "connection_id": connection_id,
        "tables_count": len(schema_response.tables),
        "views_count": len(schema_response.views),
        "schema_preview": schema_text[:500] + ("..." if len(schema_text) > 500 else ""),
    }


@router.delete("/schema")
async def clear_schema_context():
    """Clear the stored schema context from the LLM context manager."""
    context_manager.set_schema_context("")
    return {"success": True, "message": "Schema context cleared"}


@router.delete("/history")
async def clear_chat_history():
    """Clear the stored chat history from the LLM context manager."""
    context_manager.clear_chat_history()
    return {"success": True, "message": "Chat history cleared"}
