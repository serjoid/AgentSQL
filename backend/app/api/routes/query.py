"""
api/routes/query.py — SQL query routes for AgentSQL.

Provides:
  POST /api/query/validate  — inspect a query for destructive operations (HITL)
  POST /api/query/execute   — execute a query against the active connection
  POST /api/query/preview   — run a SELECT query with an automatic LIMIT 100
"""

import time
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncEngine
from sqlalchemy import text as sql_text
from datetime import datetime

from ..models.requests import QueryValidate, QueryExecute
from ..models.responses import QueryValidationResponse, QueryResultResponse
from ..core.query_filter import query_filter
from ..db.connections import connection_manager
from ..dependencies import get_engine

router = APIRouter(prefix="/query", tags=["query"])


# ---------------------------------------------------------------------------
# /validate — no DB access needed, pure query analysis
# ---------------------------------------------------------------------------


@router.post("/validate", response_model=QueryValidationResponse)
async def validate_query(request: QueryValidate):
    analysis = query_filter.analyze(request.query)
    return QueryValidationResponse(
        is_destructive=analysis.is_destructive,
        operation_type=analysis.operation_type,
        tables_affected=analysis.tables_affected,
        requires_confirmation=analysis.requires_confirmation,
        normalized_query=analysis.normalized_query,
    )


# ---------------------------------------------------------------------------
# Internal helper
# ---------------------------------------------------------------------------


async def _run_query(engine: AsyncEngine, sql: str) -> QueryResultResponse:
    """Execute *sql* against *engine* and return a QueryResultResponse."""
    start = time.perf_counter()
    try:
        async with engine.connect() as conn:
            result = await conn.execute(sql_text(sql))
            elapsed_ms = (time.perf_counter() - start) * 1000

            if result.returns_rows:
                columns = list(result.keys())
                rows = [dict(zip(columns, row)) for row in result.fetchall()]
                return QueryResultResponse(
                    success=True,
                    columns=columns,
                    rows=rows,
                    row_count=len(rows),
                    execution_time_ms=round(elapsed_ms, 3),
                )
            else:
                # DML: rowcount may be -1 for some drivers
                rc = result.rowcount if result.rowcount >= 0 else 0
                return QueryResultResponse(
                    success=True,
                    columns=[],
                    rows=[],
                    row_count=rc,
                    execution_time_ms=round(elapsed_ms, 3),
                    message=f"{rc} row(s) affected",
                )
    except Exception as exc:
        elapsed_ms = (time.perf_counter() - start) * 1000
        raise HTTPException(
            status_code=400,
            detail={
                "error": "Query execution failed",
                "message": str(exc),
                "execution_time_ms": round(elapsed_ms, 3),
            },
        )


# ---------------------------------------------------------------------------
# /execute
# ---------------------------------------------------------------------------


@router.post("/execute", response_model=QueryResultResponse)
async def execute_query(request: QueryExecute):
    analysis = query_filter.analyze(request.query)

    # HITL gate — block destructive queries without explicit confirmation
    if analysis.is_destructive and not request.skip_confirmation:
        raise HTTPException(
            status_code=403,
            detail={
                "error": "Destructive query requires confirmation",
                "operation_type": analysis.operation_type,
                "tables_affected": analysis.tables_affected,
                "requires_confirmation": True,
            },
        )

    engine = connection_manager._engines.get(request.connection_id)
    if engine is None:
        raise HTTPException(
            status_code=404,
            detail=f"Connection '{request.connection_id}' not found or not active",
        )

    return await _run_query(engine, request.query)


# ---------------------------------------------------------------------------
# /preview
# ---------------------------------------------------------------------------


@router.post("/preview", response_model=QueryResultResponse)
async def preview_query(request: QueryExecute):
    analysis = query_filter.analyze(request.query)
    normalized = analysis.normalized_query.rstrip().rstrip(";")

    # Wrap in a SELECT with LIMIT so we never return massive result sets
    if normalized.upper().startswith("SELECT"):
        preview_sql = f"{normalized} LIMIT 100"
    else:
        preview_sql = f"SELECT * FROM ({normalized}) AS _preview LIMIT 100"

    engine = connection_manager._engines.get(request.connection_id)
    if engine is None:
        raise HTTPException(
            status_code=404,
            detail=f"Connection '{request.connection_id}' not found or not active",
        )

    return await _run_query(engine, preview_sql)


# ---------------------------------------------------------------------------
# /is-safe (utility)
# ---------------------------------------------------------------------------


@router.get("/is-safe")
async def check_query_safety(query: str):
    analysis = query_filter.analyze(query)
    return {
        "safe": not analysis.is_destructive,
        "operation_type": analysis.operation_type,
        "tables_affected": analysis.tables_affected,
    }
