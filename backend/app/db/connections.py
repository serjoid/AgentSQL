from sqlalchemy import create_engine, MetaData, inspect, text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from typing import Optional, AsyncGenerator
import uuid
from dataclasses import dataclass, field
from datetime import datetime

from ..models.requests import ConnectionCreate, DatabaseType
from ..models.responses import ConnectionResponse, SchemaResponse
from ..core.security import get_security_manager
from .metadata import schema_extractor


@dataclass
class ConnectionInfo:
    id: str
    name: str
    db_type: str
    database: str
    connection_string: str
    async_connection_string: str
    created_at: datetime = field(default_factory=datetime.utcnow)
    connected_at: Optional[datetime] = None
    is_connected: bool = False


class ConnectionManager:
    def __init__(self):
        self._connections: dict[str, ConnectionInfo] = {}
        self._engines: dict[str, any] = {}
    
    def _build_connection_string(self, conn: ConnectionCreate) -> tuple[str, str]:
        if conn.db_type == DatabaseType.SQLITE:
            path = conn.path or conn.database
            return (
                f"sqlite:///{path}",
                f"sqlite+aiosqlite:///{path}"
            )
        elif conn.db_type == DatabaseType.POSTGRESQL:
            host = conn.host or "localhost"
            port = conn.port or 5432
            user = conn.username or "postgres"
            password = conn.password or ""
            
            base = f"postgresql://{user}:{password}@{host}:{port}/{conn.database}"
            async_base = f"postgresql+asyncpg://{user}:{password}@{host}:{port}/{conn.database}"
            return (base, async_base)
        else:
            raise ValueError(f"Unsupported database type: {conn.db_type}")
    
    async def create_connection(self, conn: ConnectionCreate) -> ConnectionResponse:
        conn_id = str(uuid.uuid4())
        conn_string, async_conn_string = self._build_connection_string(conn)
        
        security = get_security_manager()
        encrypted_conn_string = security.encrypt(conn_string)
        
        connection_info = ConnectionInfo(
            id=conn_id,
            name=conn.name,
            db_type=conn.db_type.value,
            database=conn.database,
            connection_string=encrypted_conn_string,
            async_connection_string=security.encrypt(async_conn_string)
        )
        
        try:
            engine = create_async_engine(async_conn_string, echo=False)
            
            async with engine.begin() as conn:
                await conn.execute(text("SELECT 1"))
            
            connection_info.is_connected = True
            connection_info.connected_at = datetime.utcnow()
            self._engines[conn_id] = engine
            
        except Exception as e:
            connection_info.is_connected = False
        
        self._connections[conn_id] = connection_info
        
        return ConnectionResponse(
            id=conn_id,
            name=conn.name,
            db_type=conn.db_type.value,
            database=conn.database,
            connected=connection_info.is_connected,
            connected_at=connection_info.connected_at
        )
    
    async def get_connection(self, conn_id: str) -> Optional[ConnectionInfo]:
        return self._connections.get(conn_id)
    
    async def disconnect(self, conn_id: str) -> bool:
        if conn_id not in self._connections:
            return False
        
        engine = self._engines.get(conn_id)
        if engine:
            await engine.dispose()
            del self._engines[conn_id]
        
        self._connections[conn_id].is_connected = False
        self._connections[conn_id].connected_at = None
        
        return True
    
    async def remove_connection(self, conn_id: str) -> bool:
        await self.disconnect(conn_id)
        
        if conn_id in self._connections:
            del self._connections[conn_id]
            return True
        return False
    
    def list_connections(self) -> list[ConnectionResponse]:
        return [
            ConnectionResponse(
                id=conn.id,
                name=conn.name,
                db_type=conn.db_type,
                database=conn.database,
                connected=conn.is_connected,
                connected_at=conn.connected_at
            )
            for conn in self._connections.values()
        ]
    
    async def get_schema(self, conn_id: str) -> Optional[SchemaResponse]:
        if conn_id not in self._engines:
            return None
        engine = self._engines[conn_id]
        return await schema_extractor.extract(engine, conn_id)


connection_manager = ConnectionManager()
