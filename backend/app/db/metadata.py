"""
db/metadata.py — Schema extraction logic for AgentSQL.

Separates schema introspection from connection management so that
ConnectionManager stays focused on lifecycle (connect / disconnect)
and SchemaExtractor handles all DDL-level inspection.
"""

from sqlalchemy import inspect, text
from typing import Optional

from ..models.responses import SchemaResponse


class SchemaExtractor:
    """Inspects a live async SQLAlchemy engine and returns a SchemaResponse."""

    async def extract(self, engine, conn_id: str) -> SchemaResponse:
        """Run synchronous SQLAlchemy inspection inside an async connection."""
        async with engine.connect() as conn:
            return await conn.run_sync(self._inspect_sync, conn_id)

    # ------------------------------------------------------------------
    # Sync helper — runs inside run_sync so we can use the synchronous
    # inspector API against the underlying sync connection.
    # ------------------------------------------------------------------

    def _inspect_sync(self, sync_conn, conn_id: str) -> SchemaResponse:
        inspector = inspect(sync_conn)

        # Determine schemas to introspect (default schema only for SQLite)
        try:
            schemas = inspector.get_schema_names()
            # Filter out internal schemas
            schemas = [s for s in schemas if s not in ("information_schema", "pg_catalog")]
        except Exception:
            schemas = [None]  # SQLite has no named schemas

        tables = []
        for schema in schemas:
            try:
                table_names = inspector.get_table_names(schema=schema)
            except Exception:
                table_names = []

            for table_name in table_names:
                try:
                    raw_columns = inspector.get_columns(table_name, schema=schema)
                    pk_info = inspector.get_pk_constraint(table_name, schema=schema)
                    pk_cols: set[str] = set(pk_info.get("constrained_columns", []))

                    columns = []
                    for col in raw_columns:
                        columns.append({
                            "name": col["name"],
                            "type": str(col["type"]),
                            "nullable": col.get("nullable", True),
                            "default": str(col["default"]) if col.get("default") is not None else None,
                            "primary_key": col["name"] in pk_cols,
                        })

                    qualified = f"{schema}.{table_name}" if schema else table_name
                    tables.append({
                        "name": qualified,
                        "schema": schema,
                        "columns": columns,
                    })
                except Exception:
                    continue

        # Views
        views: list[str] = []
        for schema in schemas:
            try:
                view_names = inspector.get_view_names(schema=schema)
                for v in view_names:
                    views.append(f"{schema}.{v}" if schema else v)
            except Exception:
                pass

        # Functions (PostgreSQL only)
        functions: list[str] = []
        try:
            result = sync_conn.execute(
                text(
                    "SELECT routine_name FROM information_schema.routines "
                    "WHERE routine_type = 'FUNCTION' AND routine_schema NOT IN "
                    "('pg_catalog', 'information_schema')"
                )
            )
            functions = [row[0] for row in result]
        except Exception:
            pass  # SQLite — ignore

        return SchemaResponse(
            connection_id=conn_id,
            tables=tables,
            views=views,
            functions=functions,
        )


schema_extractor = SchemaExtractor()
