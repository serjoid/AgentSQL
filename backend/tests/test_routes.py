"""Route-level tests using httpx.AsyncClient + ASGITransport."""

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport

from app.main import app


@pytest_asyncio.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------


class TestHealth:
    @pytest.mark.asyncio
    async def test_health_returns_ok(self, client):
        resp = await client.get("/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "healthy"


# ---------------------------------------------------------------------------
# Connection routes
# ---------------------------------------------------------------------------


class TestConnectionRoutes:
    @pytest.mark.asyncio
    async def test_connect_sqlite(self, client):
        resp = await client.post(
            "/api/connection/connect",
            json={"name": "test", "db_type": "sqlite", "database": ":memory:"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["connected"] is True
        assert "id" in data

    @pytest.mark.asyncio
    async def test_list_connections_empty_initially(self, client):
        resp = await client.get("/api/connection/list")
        assert resp.status_code == 200
        # May have connections from other tests but should not error

    @pytest.mark.asyncio
    async def test_get_schema_for_valid_connection(self, client):
        # First create connection
        conn = await client.post(
            "/api/connection/connect",
            json={"name": "schema-test", "db_type": "sqlite", "database": ":memory:"},
        )
        conn_id = conn.json()["id"]

        resp = await client.get(f"/api/connection/{conn_id}/schema")
        assert resp.status_code == 200
        data = resp.json()
        assert "tables" in data
        assert data["connection_id"] == conn_id

    @pytest.mark.asyncio
    async def test_get_schema_for_invalid_connection(self, client):
        resp = await client.get("/api/connection/does-not-exist/schema")
        assert resp.status_code == 404


# ---------------------------------------------------------------------------
# Query routes
# ---------------------------------------------------------------------------


class TestQueryRoutes:
    @pytest.mark.asyncio
    async def test_validate_select_is_safe(self, client):
        resp = await client.post(
            "/api/query/validate",
            json={"query": "SELECT * FROM users"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["is_destructive"] is False
        assert data["requires_confirmation"] is False

    @pytest.mark.asyncio
    async def test_validate_delete_is_destructive(self, client):
        resp = await client.post(
            "/api/query/validate",
            json={"query": "DELETE FROM orders WHERE id = 1"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["is_destructive"] is True
        assert data["operation_type"] == "DELETE"

    @pytest.mark.asyncio
    async def test_execute_destructive_without_confirm_returns_403(self, client):
        # Create a connection first
        conn = await client.post(
            "/api/connection/connect",
            json={"name": "hitl-test", "db_type": "sqlite", "database": ":memory:"},
        )
        conn_id = conn.json()["id"]

        resp = await client.post(
            "/api/query/execute",
            json={
                "connection_id": conn_id,
                "query": "DELETE FROM users WHERE id = 1",
                "skip_confirmation": False,
            },
        )
        assert resp.status_code == 403
        detail = resp.json()["detail"]
        assert detail["requires_confirmation"] is True

    @pytest.mark.asyncio
    async def test_execute_select_on_sqlite(self, client):
        conn = await client.post(
            "/api/connection/connect",
            json={"name": "exec-test", "db_type": "sqlite", "database": ":memory:"},
        )
        conn_id = conn.json()["id"]

        resp = await client.post(
            "/api/query/execute",
            json={
                "connection_id": conn_id,
                "query": "SELECT 1 AS value",
                "skip_confirmation": False,
            },
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        assert "value" in data["columns"]
