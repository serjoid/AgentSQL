from fastapi import APIRouter, HTTPException

from ..models.requests import ConnectionCreate
from ..models.responses import ConnectionResponse, SchemaResponse
from ..db.connections import connection_manager

router = APIRouter(prefix="/connection", tags=["connection"])


@router.post("/connect", response_model=ConnectionResponse)
async def create_connection(conn: ConnectionCreate):
    try:
        result = await connection_manager.create_connection(conn)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Connection failed: {str(e)}")


@router.get("/list", response_model=list[ConnectionResponse])
async def list_connections():
    return connection_manager.list_connections()


@router.delete("/{conn_id}")
async def disconnect(conn_id: str):
    success = await connection_manager.remove_connection(conn_id)
    
    if not success:
        raise HTTPException(status_code=404, detail="Connection not found")
    
    return {"success": True, "message": "Connection removed"}


@router.get("/{conn_id}/schema", response_model=SchemaResponse)
async def get_schema(conn_id: str):
    schema = await connection_manager.get_schema(conn_id)
    
    if not schema:
        raise HTTPException(status_code=404, detail="Connection not found or not connected")
    
    return schema
