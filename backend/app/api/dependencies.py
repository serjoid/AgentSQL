"""
api/dependencies.py — FastAPI dependency injection helpers.

Import these with `Depends()` in route handlers to avoid
repetitive connection-lookup boilerplate and get automatic
404 / 503 responses when a connection is missing or idle.
"""

from fastapi import Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncEngine

from ..db.connections import connection_manager, ConnectionInfo


# ---------------------------------------------------------------------------
# Connection lookup
# ---------------------------------------------------------------------------


async def get_connection_info(
    connection_id: str = Query(..., description="Active connection UUID"),
) -> ConnectionInfo:
    """Resolve a connection_id to a live ConnectionInfo or raise 404."""
    conn = await connection_manager.get_connection(connection_id)
    if conn is None:
        raise HTTPException(
            status_code=404,
            detail=f"Connection '{connection_id}' not found",
        )
    return conn


async def get_active_connection(
    conn: ConnectionInfo = Depends(get_connection_info),
) -> ConnectionInfo:
    """Like get_connection_info but also asserts the connection is active."""
    if not conn.is_connected:
        raise HTTPException(
            status_code=503,
            detail=f"Connection '{conn.id}' exists but is not currently active",
        )
    return conn


async def get_engine(
    conn: ConnectionInfo = Depends(get_active_connection),
) -> AsyncEngine:
    """Return the async SQLAlchemy engine for an active connection."""
    engine = connection_manager._engines.get(conn.id)
    if engine is None:
        raise HTTPException(
            status_code=503,
            detail=f"Engine for connection '{conn.id}' is not available",
        )
    return engine
