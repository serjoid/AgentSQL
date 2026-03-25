"""Tests for ConnectionManager using an in-memory SQLite database."""

import pytest
import pytest_asyncio
from app.db.connections import ConnectionManager
from app.models.requests import ConnectionCreate, DatabaseType


@pytest_asyncio.fixture
async def manager():
    return ConnectionManager()


@pytest_asyncio.fixture
async def sqlite_conn(manager):
    """Create a fresh in-memory SQLite connection for each test."""
    req = ConnectionCreate(
        name="test-db",
        db_type=DatabaseType.SQLITE,
        database=":memory:",
    )
    resp = await manager.create_connection(req)
    return manager, resp


class TestCreateConnection:
    @pytest.mark.asyncio
    async def test_connects_to_sqlite(self, sqlite_conn):
        _, resp = sqlite_conn
        assert resp.connected is True
        assert resp.name == "test-db"

    @pytest.mark.asyncio
    async def test_returns_connection_id(self, sqlite_conn):
        _, resp = sqlite_conn
        assert resp.id and len(resp.id) == 36  # UUID format

    @pytest.mark.asyncio
    async def test_invalid_db_type_raises(self, manager):
        with pytest.raises(Exception):
            req = ConnectionCreate(
                name="bad",
                db_type=DatabaseType.POSTGRESQL,
                database="nonexistent",
                host="127.0.0.1",
                port=5433,
            )
            await manager.create_connection(req)


class TestListConnections:
    @pytest.mark.asyncio
    async def test_lists_active_connection(self, sqlite_conn):
        manager, resp = sqlite_conn
        connections = manager.list_connections()
        assert any(c.id == resp.id for c in connections)


class TestGetSchema:
    @pytest.mark.asyncio
    async def test_schema_for_empty_db(self, sqlite_conn):
        manager, resp = sqlite_conn
        schema = await manager.get_schema(resp.id)
        assert schema is not None
        assert schema.connection_id == resp.id
        assert isinstance(schema.tables, list)

    @pytest.mark.asyncio
    async def test_schema_returns_none_for_missing_id(self, manager):
        schema = await manager.get_schema("nonexistent-id")
        assert schema is None


class TestRemoveConnection:
    @pytest.mark.asyncio
    async def test_removes_connection(self, sqlite_conn):
        manager, resp = sqlite_conn
        removed = await manager.remove_connection(resp.id)
        assert removed is True
        assert await manager.get_connection(resp.id) is None

    @pytest.mark.asyncio
    async def test_remove_nonexistent_returns_false(self, manager):
        result = await manager.remove_connection("does-not-exist")
        assert result is False
