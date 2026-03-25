from fastapi import APIRouter, HTTPException
from datetime import datetime

from ..models.requests import QueryValidate, QueryExecute
from ..models.responses import QueryValidationResponse, QueryResultResponse, ErrorResponse
from ..core.query_filter import query_filter

router = APIRouter(prefix="/query", tags=["query"])


@router.post("/validate", response_model=QueryValidationResponse)
async def validate_query(request: QueryValidate):
    analysis = query_filter.analyze(request.query)
    
    return QueryValidationResponse(
        is_destructive=analysis.is_destructive,
        operation_type=analysis.operation_type,
        tables_affected=analysis.tables_affected,
        requires_confirmation=analysis.requires_confirmation,
        normalized_query=analysis.normalized_query
    )


@router.post("/execute", response_model=QueryResultResponse)
async def execute_query(request: QueryExecute):
    analysis = query_filter.analyze(request.query)
    
    if analysis.is_destructive and not request.skip_confirmation:
        raise HTTPException(
            status_code=403,
            detail={
                "error": "Destructive query requires confirmation",
                "operation_type": analysis.operation_type,
                "tables_affected": analysis.tables_affected,
                "requires_confirmation": True
            }
        )
    
    return QueryResultResponse(
        success=False,
        columns=[],
        rows=[],
        row_count=0,
        execution_time_ms=0,
        message="Database connection not implemented yet"
    )


@router.post("/preview", response_model=QueryResultResponse)
async def preview_query(request: QueryExecute):
    analysis = query_filter.analyze(request.query)
    
    normalized = analysis.normalized_query
    
    if normalized.rstrip().rstrip(';').upper().endswith(')'):
        preview_query = request.query
    else:
        normalized = analysis.normalized_query.rstrip().rstrip(';')
        select_match = normalized.upper().startswith('SELECT')
        
        if select_match:
            preview_query = f"{normalized} LIMIT 100"
        else:
            preview_query = f"SELECT * FROM ({normalized}) AS preview LIMIT 100"
    
    return QueryResultResponse(
        success=False,
        columns=[],
        rows=[],
        row_count=0,
        execution_time_ms=0,
        message="Database connection not implemented yet"
    )


@router.get("/is-safe/{query_hash}")
async def check_query_safety(query_hash: str):
    return {"safe": False, "message": "Not implemented"}
